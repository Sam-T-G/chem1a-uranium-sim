import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C, ASSAY } from "../../theme";
import { Lighting, dummy, isU235, mulberry32 } from "../../three/shared";

/**
 * A crowd of uranium atoms at natural abundance, drifting.
 *
 * 1,000 atoms, so seven of them are U-235. The camera sits inside the crowd and
 * the scarcity is the whole image: you have to look for the green ones, which
 * is exactly the problem.
 */

const N = 1000;
const COL_U235 = new THREE.Color(C.u235);
const COL_U238 = new THREE.Color(C.u238);

export default function ProblemScene({ reduced }: { reduced: boolean }) {
	const mesh = useRef<THREE.InstancedMesh>(null);
	const group = useRef<THREE.Group>(null);

	const atoms = useMemo(() => {
		const rnd = mulberry32(1789);
		return Array.from({ length: N }, (_, i) => ({
			base: new THREE.Vector3(
				(rnd() - 0.5) * 32,
				(rnd() - 0.5) * 19,
				(rnd() - 0.5) * 26,
			),
			amp: 0.1 + rnd() * 0.22,
			speed: 0.3 + rnd() * 0.6,
			phase: rnd() * Math.PI * 2,
			light: isU235(i, N, ASSAY.natural),
		}));
	}, []);

	// Halo positions for the rare fissile atoms, so they can be found at a glance.
	const lightAtoms = useMemo(() => atoms.filter((a) => a.light), [atoms]);

	useFrame((state, dt) => {
		if (!mesh.current) return;
		const t = state.clock.elapsedTime;

		for (let i = 0; i < N; i++) {
			const a = atoms[i];
			const drift = reduced ? 0 : Math.sin(t * a.speed + a.phase) * a.amp;
			dummy.position.set(
				a.base.x + drift,
				a.base.y + drift * 0.6,
				a.base.z - drift * 0.4,
			);
			dummy.scale.setScalar(a.light ? 0.26 : 0.125);
			dummy.updateMatrix();
			mesh.current.setMatrixAt(i, dummy.matrix);
			mesh.current.setColorAt(i, a.light ? COL_U235 : COL_U238);
		}
		mesh.current.instanceMatrix.needsUpdate = true;
		if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;

		if (group.current && !reduced) group.current.rotation.y += dt * 0.022;
	});

	return (
		<>
			<Lighting />
			<group ref={group}>
				<instancedMesh
					ref={mesh}
					args={[undefined, undefined, N]}
					frustumCulled={false}
				>
					<icosahedronGeometry args={[1, 1]} />
					<meshStandardMaterial
						roughness={0.45}
						metalness={0.15}
						toneMapped={false}
					/>
				</instancedMesh>

				{lightAtoms.map((a, i) => (
					<mesh key={i} position={a.base}>
						<sphereGeometry args={[0.72, 16, 16]} />
						<meshBasicMaterial
							color={C.u235}
							transparent
							opacity={0.12}
							depthWrite={false}
							toneMapped={false}
						/>
					</mesh>
				))}
			</group>
		</>
	);
}
