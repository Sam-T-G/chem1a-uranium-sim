import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../../theme";
import { Lighting, dummy, mulberry32 } from "../../three/shared";

/**
 * The opening image. A mass of ore turning slowly in the dark while a warm rim
 * light crosses it and a cool fill trails on the far side, so it resolves out
 * of near-black rather than being presented. The report starts with a film, so
 * the first frame is lit like one.
 */

// Dust rises far slower than any real convection would move it; it is set
// dressing, not physics. Wrap height matches the spawn range below.
const DUST_RISE = 0.06;
const DUST_HALF_H = 5.5;

export default function IntroScene({ reduced }: { reduced: boolean }) {
	const grp = useRef<THREE.Group>(null);
	const rim = useRef<THREE.PointLight>(null);
	const fill = useRef<THREE.PointLight>(null);
	const specks = useRef<THREE.InstancedMesh>(null);
	const speckMat = useRef<THREE.MeshStandardMaterial>(null);
	const dust = useRef<THREE.InstancedMesh>(null);

	const N_SPECKS = 14;
	const N_DUST = 220;

	const speckPts = useMemo(() => {
		const rnd = mulberry32(1945);
		return Array.from({ length: N_SPECKS }, () => {
			const u = rnd() * 2 - 1;
			const phi = rnd() * Math.PI * 2;
			const s = Math.sqrt(1 - u * u);
			return new THREE.Vector3(s * Math.cos(phi), u, s * Math.sin(phi)).multiplyScalar(
				2.02 + rnd() * 0.06,
			);
		});
	}, []);

	const dustPts = useMemo(() => {
		const rnd = mulberry32(77);
		return Array.from({ length: N_DUST }, () => ({
			p: new THREE.Vector3(
				(rnd() - 0.5) * 18,
				(rnd() - 0.5) * DUST_HALF_H * 2,
				(rnd() - 0.5) * 10 - 2,
			),
			s: 0.012 + rnd() * 0.03,
		}));
	}, []);

	useLayoutEffect(() => {
		dummy.rotation.set(0, 0, 0);
		if (specks.current) {
			speckPts.forEach((p, i) => {
				dummy.position.copy(p);
				dummy.scale.setScalar(0.06);
				dummy.updateMatrix();
				specks.current!.setMatrixAt(i, dummy.matrix);
			});
			specks.current.instanceMatrix.needsUpdate = true;
		}
		if (dust.current) {
			for (let i = 0; i < N_DUST; i++) {
				dummy.position.copy(dustPts[i].p);
				dummy.scale.setScalar(dustPts[i].s);
				dummy.updateMatrix();
				dust.current.setMatrixAt(i, dummy.matrix);
			}
			dust.current.instanceMatrix.needsUpdate = true;
		}
	}, [speckPts, dustPts]);

	useFrame((state, dt) => {
		if (reduced) return;
		const t = state.clock.elapsedTime;
		if (grp.current) grp.current.rotation.y += dt * 0.075;

		// Warm rim and cool fill share one orbit, half a turn apart, so the
		// shadowed side always has a faint blue edge instead of going dead.
		const a = t * 0.34;
		if (rim.current) {
			rim.current.position.set(Math.cos(a) * 7, 2.4, Math.sin(a) * 7);
		}
		if (fill.current) {
			fill.current.position.set(
				Math.cos(a + Math.PI) * 7,
				-1.6,
				Math.sin(a + Math.PI) * 7,
			);
		}

		// One breath for all specks. Base 2.2 keeps them above the bloom
		// threshold through the whole cycle; only the halo strength varies.
		if (speckMat.current) {
			speckMat.current.emissiveIntensity = 2.2 + Math.sin(t * 0.7) * 0.5;
		}

		if (dust.current) {
			dust.current.rotation.y = t * 0.014;
			dummy.rotation.set(0, 0, 0);
			for (let i = 0; i < N_DUST; i++) {
				const d = dustPts[i];
				dummy.position.set(
					d.p.x,
					((d.p.y + DUST_HALF_H + t * DUST_RISE) % (DUST_HALF_H * 2)) - DUST_HALF_H,
					d.p.z,
				);
				dummy.scale.setScalar(d.s);
				dummy.updateMatrix();
				dust.current.setMatrixAt(i, dummy.matrix);
			}
			dust.current.instanceMatrix.needsUpdate = true;
		}
	});

	return (
		<>
			<Lighting />
			{/* Parked positions below are the reduced-motion frame; the orbit in
			    useFrame overwrites them when motion is allowed. */}
			<pointLight
				ref={rim}
				position={[6.1, 2.4, 3.4]}
				intensity={180}
				distance={30}
				decay={2}
				color="#FFD9A0"
			/>
			<pointLight
				ref={fill}
				position={[-6.1, -1.6, -3.4]}
				intensity={30}
				distance={40}
				decay={2}
				color="#6f8cff"
			/>

			{/* A dim shell behind everything so the ore's silhouette reads against
			    something slightly lighter than the void. */}
			<mesh renderOrder={-1}>
				<sphereGeometry args={[3.6, 32, 32]} />
				<meshBasicMaterial
					color={C.panelHi}
					transparent
					opacity={0.5}
					side={THREE.BackSide}
					depthWrite={false}
				/>
			</mesh>

			<group ref={grp}>
				<mesh>
					<icosahedronGeometry args={[2, 1]} />
					<meshStandardMaterial
						color="#57503F"
						roughness={0.9}
						metalness={0.28}
						flatShading
					/>
				</mesh>

				<instancedMesh
					ref={specks}
					args={[undefined, undefined, N_SPECKS]}
					frustumCulled={false}
				>
					<sphereGeometry args={[1, 10, 10]} />
					<meshStandardMaterial
						ref={speckMat}
						color={C.u235}
						emissive={C.u235}
						emissiveIntensity={2.2}
						toneMapped={false}
					/>
				</instancedMesh>
			</group>

			<instancedMesh
				ref={dust}
				args={[undefined, undefined, N_DUST]}
				frustumCulled={false}
			>
				<sphereGeometry args={[1, 5, 5]} />
				<meshBasicMaterial
					color="#8A93A6"
					transparent
					opacity={0.35}
					depthWrite={false}
				/>
			</instancedMesh>
		</>
	);
}
