import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C, ASSAY } from "../../theme";
import { Lighting, dummy, isU235, mulberry32 } from "../shared";
import { separationCost } from "../../lib/separation";

const ROTOR_R = 1.15;
const ROTOR_H = 5.4;

// Hoisted so the per-frame loops never allocate. Instanced meshes share one
// material, so per-instance glow has to ride in the instance color itself:
// values pushed past 1.0 on an untone-mapped basic material cross the bloom
// threshold, values under 1.0 never do. U-235 and lit machines glow; U-238
// and idle machines stay dark.
const COL_U235_HDR = new THREE.Color(C.u235).multiplyScalar(2.4);
const COL_U238_LDR = new THREE.Color(C.u238).multiplyScalar(0.9);
const COL_CAKE_HDR = new THREE.Color(C.cake).multiplyScalar(2.2);
const COL_HOT_HDR = new THREE.Color(C.hot).multiplyScalar(2.4);
const COL_OFF = new THREE.Color("#39435A");

/**
 * Cutaway gas centrifuge.
 *
 * The radial behavior is real in direction: at 50,000-70,000 rpm the heavier
 * U-238 bearing molecules are driven toward the rotor wall and the lighter
 * U-235 bearing molecules sit relatively closer to the axis, and an imposed
 * counter-current carries wall gas down and axial gas up so the two ends of the
 * rotor differ in assay.
 *
 * The magnitude is exaggerated. A real single machine shifts the assay by a
 * fraction of a percent, which would be invisible. The honest numbers live in
 * the readout and in the cascade behind the rotor, which grows with the actual
 * separative work required.
 */

interface P {
	r: number;
	th: number;
	y: number;
	light: boolean;
	vr: number;
}

function RotorGas({ reduced, spinning }: { reduced: boolean; spinning: boolean }) {
	const lightRef = useRef<THREE.InstancedMesh>(null);
	const heavyRef = useRef<THREE.InstancedMesh>(null);

	const N = 900;
	// A legible 30 % light fraction inside the rotor. This is a mechanism
	// diagram, not a measurement; the assay readout carries the real value.
	const parts = useMemo<P[]>(() => {
		const rnd = mulberry32(31337);
		return Array.from({ length: N }, (_, i) => ({
			r: 0.12 + rnd() * (ROTOR_R - 0.16),
			th: rnd() * Math.PI * 2,
			y: (rnd() - 0.5) * ROTOR_H,
			light: isU235(i, N, 0.3),
			vr: 0,
		}));
	}, []);

	const lightParts = useMemo(() => parts.filter((p) => p.light), [parts]);
	const heavyParts = useMemo(() => parts.filter((p) => !p.light), [parts]);

	useFrame((_, rawDt) => {
		const dt = Math.min(rawDt, 0.05);
		if (!lightRef.current || !heavyRef.current) return;
		const active = spinning && !reduced;

		const write = (mesh: THREE.InstancedMesh, list: P[]) => {
			for (let i = 0; i < list.length; i++) {
				const p = list[i];
				if (active) {
					// Angular velocity rises toward the wall, as in solid-body rotation.
					p.th += (5.5 + p.r * 2.2) * dt;

					// Mass-dependent radial drift. Heavy outward, light inward.
					const target = p.light ? 0.22 : ROTOR_R - 0.1;
					p.r += (target - p.r) * (p.light ? 0.55 : 0.85) * dt;
					p.r += (Math.random() - 0.5) * 0.06 * dt * 60 * 0.02;
					p.r = Math.min(Math.max(p.r, 0.06), ROTOR_R - 0.05);

					// Counter-current: gas near the wall sinks, gas near the axis rises.
					const nearAxis = 1 - p.r / ROTOR_R;
					p.y += (nearAxis * 2 - 1) * 1.15 * dt;
					if (p.y > ROTOR_H / 2) p.y = -ROTOR_H / 2;
					if (p.y < -ROTOR_H / 2) p.y = ROTOR_H / 2;
				}

				dummy.position.set(
					Math.cos(p.th) * p.r,
					p.y,
					Math.sin(p.th) * p.r,
				);
				dummy.scale.setScalar(p.light ? 0.058 : 0.05);
				dummy.updateMatrix();
				mesh.setMatrixAt(i, dummy.matrix);
			}
			mesh.instanceMatrix.needsUpdate = true;
		};

		write(lightRef.current, lightParts);
		write(heavyRef.current, heavyParts);
	});

	return (
		<>
			<instancedMesh
				ref={lightRef}
				args={[undefined, undefined, lightParts.length]}
				frustumCulled={false}
			>
				<sphereGeometry args={[1, 6, 6]} />
				<meshStandardMaterial
					color={C.u235}
					emissive={C.u235}
					emissiveIntensity={2.4}
					toneMapped={false}
				/>
			</instancedMesh>
			<instancedMesh
				ref={heavyRef}
				args={[undefined, undefined, heavyParts.length]}
				frustumCulled={false}
			>
				<sphereGeometry args={[1, 6, 6]} />
				<meshStandardMaterial
					color={C.u238}
					emissive={C.u238}
					emissiveIntensity={0.3}
				/>
			</instancedMesh>
		</>
	);
}

function RotorShell({ reduced, spinning }: { reduced: boolean; spinning: boolean }) {
	const ref = useRef<THREE.Mesh>(null);
	useFrame((_, dt) => {
		if (ref.current && spinning && !reduced) ref.current.rotation.y += dt * 3.2;
	});
	return (
		<group>
			{/* Rotor wall, cut away so the interior reads */}
			<mesh ref={ref}>
				<cylinderGeometry args={[ROTOR_R + 0.06, ROTOR_R + 0.06, ROTOR_H, 48, 1, true, 0.6, Math.PI * 1.6]} />
				<meshStandardMaterial
					color="#93A3BE"
					metalness={0.8}
					roughness={0.25}
					side={THREE.DoubleSide}
					transparent
					opacity={0.24}
					depthWrite={false}
				/>
			</mesh>
			{/* Casing rings */}
			{[-ROTOR_H / 2, 0, ROTOR_H / 2].map((y) => (
				<mesh key={y} position={[0, y, 0]}>
					<torusGeometry args={[ROTOR_R + 0.09, 0.055, 10, 48]} />
					<meshStandardMaterial color="#7C89A0" metalness={0.9} roughness={0.25} />
				</mesh>
			))}
			{/* Axis */}
			<mesh>
				<cylinderGeometry args={[0.035, 0.035, ROTOR_H + 1.4, 12]} />
				<meshStandardMaterial color="#9AA6BC" metalness={0.95} roughness={0.15} />
			</mesh>
		</group>
	);
}

/** Product take-off at the top, tails at the bottom, at true proportions. */
function Streams({ assay, reduced }: { assay: number; reduced: boolean }) {
	const productRef = useRef<THREE.InstancedMesh>(null);
	const tailsRef = useRef<THREE.InstancedMesh>(null);
	const N = 90;

	const seeds = useMemo(() => {
		const rnd = mulberry32(505);
		return Array.from({ length: N }, () => ({ t: rnd(), a: rnd() * 6.28, r: rnd() * 0.16 }));
	}, []);

	useFrame((_, dt) => {
		const step = reduced ? 0 : dt * 0.45;

		if (productRef.current) {
			for (let i = 0; i < N; i++) {
				const s = seeds[i];
				s.t = (s.t + step) % 1;
				dummy.position.set(
					Math.cos(s.a) * s.r,
					ROTOR_H / 2 + 0.3 + s.t * 2.0,
					Math.sin(s.a) * s.r,
				);
				dummy.scale.setScalar(isU235(i, N, assay) ? 0.075 : 0.055);
				dummy.updateMatrix();
				productRef.current.setMatrixAt(i, dummy.matrix);
				productRef.current.setColorAt(i, isU235(i, N, assay) ? COL_U235_HDR : COL_U238_LDR);
			}
			productRef.current.instanceMatrix.needsUpdate = true;
			if (productRef.current.instanceColor)
				productRef.current.instanceColor.needsUpdate = true;
		}

		if (tailsRef.current) {
			for (let i = 0; i < N; i++) {
				const s = seeds[i];
				dummy.position.set(
					Math.cos(s.a + 1.7) * s.r,
					-ROTOR_H / 2 - 0.3 - s.t * 2.0,
					Math.sin(s.a + 1.7) * s.r,
				);
				dummy.scale.setScalar(isU235(i, N, ASSAY.tails) ? 0.075 : 0.055);
				dummy.updateMatrix();
				tailsRef.current.setMatrixAt(i, dummy.matrix);
				tailsRef.current.setColorAt(i, isU235(i, N, ASSAY.tails) ? COL_U235_HDR : COL_U238_LDR);
			}
			tailsRef.current.instanceMatrix.needsUpdate = true;
			if (tailsRef.current.instanceColor)
				tailsRef.current.instanceColor.needsUpdate = true;
		}
	});

	return (
		<>
			{/* Basic material: the instance color is the emitted light, HDR or not. */}
			<instancedMesh ref={productRef} args={[undefined, undefined, N]} frustumCulled={false}>
				<sphereGeometry args={[1, 7, 7]} />
				<meshBasicMaterial toneMapped={false} />
			</instancedMesh>
			<instancedMesh ref={tailsRef} args={[undefined, undefined, N]} frustumCulled={false}>
				<sphereGeometry args={[1, 7, 7]} />
				<meshBasicMaterial toneMapped={false} />
			</instancedMesh>
		</>
	);
}

/**
 * The cascade behind the rotor. The number of machines lit tracks the actual
 * separative work required for the selected assay, so the front-loading of
 * enrichment effort is visible: most of the machines light up long before the
 * assay looks impressive.
 */
function Cascade({ assay }: { assay: number }) {
	const ref = useRef<THREE.InstancedMesh>(null);
	const COLS = 18;
	const ROWS = 7;
	const N = COLS * ROWS;

	useLayoutEffect(() => {
		if (!ref.current) return;
		for (let i = 0; i < N; i++) {
			const c = i % COLS;
			const r = Math.floor(i / COLS);
			dummy.position.set((c - (COLS - 1) / 2) * 1.5, (r - (ROWS - 1) / 2) * 1.9, -19);
			dummy.scale.set(1, 1, 1);
			dummy.updateMatrix();
			ref.current.setMatrixAt(i, dummy.matrix);
		}
		ref.current.instanceMatrix.needsUpdate = true;
	}, [N]);

	useFrame(() => {
		if (!ref.current) return;
		const swu = separationCost(assay).swuPerProduct;
		// Log scale: 0 SWU lights nothing, ~210 SWU/kg (weapons assay) lights all.
		const frac = Math.min(Math.log10(1 + swu) / Math.log10(1 + 210), 1);
		const lit = Math.round(frac * N);
		const hot = assay >= ASSAY.haleu;
		for (let i = 0; i < N; i++) {
			// Fill column-major from the bottom so growth reads as a rising level.
			const c = i % COLS;
			const r = Math.floor(i / COLS);
			const order = c * ROWS + r;
			const on = order < lit;
			ref.current.setColorAt(i, on ? (hot ? COL_HOT_HDR : COL_CAKE_HDR) : COL_OFF);
		}
		if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
	});

	return (
		<instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
			<capsuleGeometry args={[0.16, 1.15, 4, 10]} />
			{/*
				Basic, untone-mapped: lit machines carry HDR instance colors and
				bloom through the fog; idle machines sit at a flat dark blue-gray.
			*/}
			<meshBasicMaterial toneMapped={false} />
		</instancedMesh>
	);
}

export default function Enrichment({
	assay,
	spinning,
	reduced,
}: {
	assay: number;
	spinning: boolean;
	reduced: boolean;
}) {
	return (
		<>
			<Lighting />
			<Cascade assay={assay} />
			<group position={[0, 0, 0]}>
				<RotorShell reduced={reduced} spinning={spinning} />
				<RotorGas reduced={reduced} spinning={spinning} />
				<Streams assay={assay} reduced={reduced} />
			</group>
		</>
	);
}
