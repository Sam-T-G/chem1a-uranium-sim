import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../../theme";
import { Lighting, dummy, mulberry32 } from "../shared";

/**
 * UO2 pellets, a fuel rod, and an assembly. Enriched UF6 goes back to oxide,
 * gets pressed and sintered into ceramic, and is sealed into zirconium alloy.
 */

const PELLET_R = 0.42;
const PELLET_H = 0.5;

/**
 * Pellets are a pale sintered ceramic. The fissile fraction is shown by tinting
 * that ceramic toward the U-235 color, so the same encoding used everywhere
 * else still applies without pretending real pellets glow green. The scale
 * factor pushes high-assay tints past 1.0 so the bloom pass picks them up:
 * near-natural stacks stay matte, high-assay stacks carry a faint halo. That
 * halo is the encoding, not physics — real pellets look the same at any assay.
 */
const CERAMIC = new THREE.Color("#A79E90");
function pelletColor(assay: number): THREE.Color {
	return CERAMIC.clone()
		.lerp(new THREE.Color(C.u235), Math.min(assay * 1.1, 0.85))
		.multiplyScalar(1 + assay * 1.6);
}

/**
 * Per-pellet brightness variance. Basic materials ignore lighting, so without
 * this every pellet in a stack is the identical flat color and the stack reads
 * as one extrusion. Sintered ceramic genuinely varies batch to batch.
 */
function pelletTints(assay: number, n: number, seed: number): THREE.Color[] {
	const rnd = mulberry32(seed);
	const base = pelletColor(assay);
	return Array.from({ length: n }, () =>
		base.clone().multiplyScalar(0.92 + rnd() * 0.13),
	);
}

/** Pellets traveling down the line and stacking into the rod. */
function Line({ assay, reduced }: { assay: number; reduced: boolean }) {
	const ref = useRef<THREE.InstancedMesh>(null);
	// Five across 4.4 units, so pellets read as discrete objects rather than a
	// continuous ridge.
	const N = 5;
	const seeds = useMemo(
		() => Array.from({ length: N }, (_, i) => ({ t: i / N })),
		[],
	);
	const tints = useMemo(() => pelletTints(assay, N, 4242), [assay]);

	// Colors and the initial (reduced-mode) placement are set once here;
	// useFrame only rewrites matrices, so nothing allocates per frame.
	useLayoutEffect(() => {
		if (!ref.current) return;
		for (let i = 0; i < N; i++) {
			dummy.position.set(-5.2 + seeds[i].t * 4.4, 1.6, 0);
			dummy.rotation.set(Math.PI / 2, 0, 0);
			dummy.scale.setScalar(1);
			dummy.updateMatrix();
			ref.current.setMatrixAt(i, dummy.matrix);
			ref.current.setColorAt(i, tints[i]);
		}
		ref.current.instanceMatrix.needsUpdate = true;
		if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
	}, [tints, seeds]);

	useFrame((_, dt) => {
		if (!ref.current || reduced) return;
		for (let i = 0; i < N; i++) {
			const s = seeds[i];
			s.t = (s.t + dt * 0.12) % 1;
			dummy.position.set(-5.2 + s.t * 4.4, 1.6, 0);
			dummy.rotation.set(Math.PI / 2, 0, 0);
			dummy.scale.setScalar(1);
			dummy.updateMatrix();
			ref.current.setMatrixAt(i, dummy.matrix);
		}
		ref.current.instanceMatrix.needsUpdate = true;
	});

	return (
		<group>
			<mesh position={[-3, 1.28, 0]}>
				<boxGeometry args={[4.8, 0.12, 1.0]} />
				<meshStandardMaterial color="#2E3441" metalness={0.5} roughness={0.7} />
			</mesh>
			{/* Basic material: instance colors pass through unlit, so HDR tints
			    survive to the bloom pass instead of being flattened by shading. */}
			<instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
				<cylinderGeometry args={[PELLET_R, PELLET_R, PELLET_H, 24]} />
				<meshBasicMaterial toneMapped={false} />
			</instancedMesh>
		</group>
	);
}

/** The cutaway rod: a stack of pellets inside a zircaloy tube. */
function Rod({ assay }: { assay: number }) {
	const ref = useRef<THREE.InstancedMesh>(null);
	const N = 14;

	useLayoutEffect(() => {
		if (!ref.current) return;
		const tints = pelletTints(assay, N, 9173);
		for (let i = 0; i < N; i++) {
			dummy.position.set(0.6, -3.1 + i * (PELLET_H + 0.03), 0);
			dummy.rotation.set(0, 0, 0);
			dummy.scale.setScalar(1);
			dummy.updateMatrix();
			ref.current.setMatrixAt(i, dummy.matrix);
			ref.current.setColorAt(i, tints[i]);
		}
		ref.current.instanceMatrix.needsUpdate = true;
		if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
	}, [assay]);

	return (
		<group>
			<instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
				<cylinderGeometry args={[PELLET_R, PELLET_R, PELLET_H, 24]} />
				<meshBasicMaterial toneMapped={false} />
			</instancedMesh>

			{/* Zircaloy cladding. The open quarter faces the camera so the pellet
			    stack inside stays visible. */}
			<mesh position={[0.6, -0.3, 0]}>
				<cylinderGeometry
					args={[0.5, 0.5, 8.0, 36, 1, true, Math.PI * 0.75, Math.PI * 1.5]}
				/>
				<meshStandardMaterial
					color="#8E9AAE"
					metalness={0.85}
					roughness={0.22}
					side={THREE.DoubleSide}
					transparent
					opacity={0.5}
				/>
			</mesh>
			{/* End plugs */}
			{[-4.35, 3.75].map((y) => (
				<mesh key={y} position={[0.6, y, 0]}>
					<cylinderGeometry args={[0.5, 0.5, 0.3, 36]} />
					<meshStandardMaterial color="#6F7C92" metalness={0.9} roughness={0.3} />
				</mesh>
			))}
		</group>
	);
}

/** Background: the rest of the assembly, receding. */
function Assembly({ reduced }: { reduced: boolean }) {
	const g = useRef<THREE.Group>(null);
	const ref = useRef<THREE.InstancedMesh>(null);
	const GRID = 7;
	const N = GRID * GRID;

	useLayoutEffect(() => {
		if (!ref.current) return;
		const rnd = mulberry32(6161);
		for (let i = 0; i < N; i++) {
			const c = i % GRID;
			const r = Math.floor(i / GRID);
			dummy.position.set(
				(c - (GRID - 1) / 2) * 1.15,
				0,
				(r - (GRID - 1) / 2) * 1.15 - 1,
			);
			dummy.rotation.set(0, 0, 0);
			dummy.scale.set(1, 0.9 + rnd() * 0.2, 1);
			dummy.updateMatrix();
			ref.current.setMatrixAt(i, dummy.matrix);
		}
		ref.current.instanceMatrix.needsUpdate = true;
	}, [N]);

	useFrame((_, dt) => {
		if (g.current && !reduced) g.current.rotation.y += dt * 0.06;
	});

	return (
		<group ref={g} position={[-4.4, -0.4, -6]} scale={0.62}>
			<instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
				<cylinderGeometry args={[0.32, 0.32, 8, 12]} />
				<meshStandardMaterial color="#4E5A70" metalness={0.85} roughness={0.35} />
			</instancedMesh>
			{[-3.6, 0, 3.6].map((y) => (
				<mesh key={y} position={[0, y, -1]}>
					<boxGeometry args={[8.4, 0.16, 8.4]} />
					<meshStandardMaterial color="#39414F" metalness={0.7} roughness={0.45} />
				</mesh>
			))}
		</group>
	);
}

/** Press that stamps powder into pellets. */
function Press({ reduced }: { reduced: boolean }) {
	const ram = useRef<THREE.Mesh>(null);
	useFrame((state) => {
		if (!ram.current) return;
		const t = reduced ? 0 : state.clock.elapsedTime;
		const cycle = (Math.sin(t * 2.2) + 1) / 2;
		ram.current.position.y = 3.1 + cycle * 0.55;
	});
	return (
		<group position={[-5.4, 0, 0]}>
			<mesh position={[0, 4.1, 0]}>
				<boxGeometry args={[1.5, 0.9, 1.5]} />
				<meshStandardMaterial color="#39414F" metalness={0.6} roughness={0.5} />
			</mesh>
			<mesh ref={ram} position={[0, 3.1, 0]}>
				<boxGeometry args={[0.7, 1.2, 0.7]} />
				<meshStandardMaterial color="#8E9AAE" metalness={0.9} roughness={0.25} />
			</mesh>
			<mesh position={[0, 2.05, 0]}>
				<boxGeometry args={[1.3, 0.5, 1.3]} />
				<meshStandardMaterial color="#2E3441" metalness={0.5} roughness={0.7} />
			</mesh>

			{/* Sinter furnace behind the press. Green pellets are fired around
			    1700 °C; the amber mouth is the one honest light on the shop floor,
			    and the point light lets it spill onto the press metalwork. */}
			<mesh position={[0.35, 1.55, -1.2]}>
				<boxGeometry args={[0.9, 0.5, 0.7]} />
				<meshStandardMaterial
					color="#2A2118"
					emissive="#E8A33D"
					emissiveIntensity={2.2}
					toneMapped={false}
				/>
			</mesh>
			<pointLight
				position={[0.35, 1.7, -0.7]}
				color={C.cake}
				intensity={6}
				distance={5}
			/>
		</group>
	);
}

export default function Fabrication({
	assay,
	reduced,
}: {
	assay: number;
	reduced: boolean;
}) {
	return (
		<>
			<Lighting />
			<Assembly reduced={reduced} />
			<group position={[1.2, -0.2, 0]}>
				<Press reduced={reduced} />
				<Line assay={assay} reduced={reduced} />
				<Rod assay={assay} />
			</group>
		</>
	);
}
