import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../../theme";
import { Lighting, dummy, mulberry32 } from "../../three/shared";

/**
 * The opening image. A mass of ore turning slowly in the dark while a rim light
 * crosses it, so it resolves out of near-black rather than being presented. The
 * report starts with a film, so the first frame is lit like one.
 */

export default function IntroScene({ reduced }: { reduced: boolean }) {
	const grp = useRef<THREE.Group>(null);
	const rim = useRef<THREE.PointLight>(null);
	const specks = useRef<THREE.InstancedMesh>(null);
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

	useLayoutEffect(() => {
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
			const rnd = mulberry32(77);
			for (let i = 0; i < N_DUST; i++) {
				dummy.position.set(
					(rnd() - 0.5) * 18,
					(rnd() - 0.5) * 11,
					(rnd() - 0.5) * 10 - 2,
				);
				dummy.scale.setScalar(0.012 + rnd() * 0.03);
				dummy.updateMatrix();
				dust.current.setMatrixAt(i, dummy.matrix);
			}
			dust.current.instanceMatrix.needsUpdate = true;
		}
	}, [speckPts]);

	useFrame((state, dt) => {
		const t = state.clock.elapsedTime;
		if (grp.current && !reduced) grp.current.rotation.y += dt * 0.075;
		if (rim.current && !reduced) {
			rim.current.position.set(Math.cos(t * 0.34) * 7, 2.4, Math.sin(t * 0.34) * 7);
		}
		if (dust.current && !reduced) dust.current.rotation.y = t * 0.014;
	});

	return (
		<>
			<Lighting />
			<pointLight
				ref={rim}
				position={[6, 2.4, 3]}
				intensity={140}
				distance={26}
				decay={2}
				color="#FFE6C4"
			/>

			<group ref={grp}>
				<mesh>
					<icosahedronGeometry args={[2, 1]} />
					<meshStandardMaterial
						color="#6E6555"
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
						color={C.u235}
						emissive={C.u235}
						emissiveIntensity={1.4}
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
					opacity={0.4}
					depthWrite={false}
				/>
			</instancedMesh>
		</>
	);
}
