import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../../theme";
import { Lighting, dummy, mulberry32 } from "../../three/shared";

/**
 * The scale answer to a 1.0043 separation factor: a hall that runs out past the
 * fog. Rows of process columns receding to a vanishing point, with a
 * human-height figure at the near end so the size means something.
 */

const COLS = 9;
const ROWS = 26;
const N = COLS * ROWS;
const SPACING_X = 3.6;
const SPACING_Z = 4.4;

export default function OakRidgeScene({ reduced }: { reduced: boolean }) {
	const units = useRef<THREE.InstancedMesh>(null);
	const pipes = useRef<THREE.InstancedMesh>(null);
	const glow = useRef<THREE.InstancedMesh>(null);
	const rig = useRef<THREE.Group>(null);

	useLayoutEffect(() => {
		const rnd = mulberry32(1943);
		const place = (mesh: THREE.InstancedMesh | null, kind: "unit" | "pipe" | "glow") => {
			if (!mesh) return;
			for (let i = 0; i < N; i++) {
				const c = i % COLS;
				const r = Math.floor(i / COLS);
				const x = (c - (COLS - 1) / 2) * SPACING_X;
				const z = -r * SPACING_Z;
				const h = 4.2 + rnd() * 0.5;

				if (kind === "unit") {
					dummy.position.set(x, h / 2 - 1.8, z);
					dummy.scale.set(1, h / 4.2, 1);
					dummy.rotation.set(0, 0, 0);
				} else if (kind === "pipe") {
					dummy.position.set(x, 2.2, z);
					dummy.scale.set(1, 1, 1);
					dummy.rotation.set(0, 0, Math.PI / 2);
				} else {
					dummy.position.set(x, h - 1.75, z);
					dummy.scale.setScalar(1);
					dummy.rotation.set(0, 0, 0);
				}
				dummy.updateMatrix();
				mesh.setMatrixAt(i, dummy.matrix);
			}
			mesh.instanceMatrix.needsUpdate = true;
		};
		place(units.current, "unit");
		place(pipes.current, "pipe");
		place(glow.current, "glow");
	}, []);

	// Slow push down the hall, so the depth registers.
	useFrame((state) => {
		if (!rig.current || reduced) return;
		const t = state.clock.elapsedTime;
		rig.current.position.z = ((t * 0.55) % SPACING_Z) - SPACING_Z;
		rig.current.position.x = Math.sin(t * 0.12) * 0.5;
	});

	return (
		<>
			<Lighting />

			<group ref={rig}>
				{/* Process columns */}
				<instancedMesh
					ref={units}
					args={[undefined, undefined, N]}
					frustumCulled={false}
				>
					<cylinderGeometry args={[0.4, 0.4, 4.2, 14]} />
					<meshStandardMaterial color="#67738C" metalness={0.7} roughness={0.42} />
				</instancedMesh>

				{/* Cross-headers linking each stage to the next */}
				<instancedMesh
					ref={pipes}
					args={[undefined, undefined, N]}
					frustumCulled={false}
				>
					<cylinderGeometry args={[0.13, 0.13, SPACING_X, 8]} />
					<meshStandardMaterial color="#8996AE" metalness={0.8} roughness={0.35} />
				</instancedMesh>

				{/* Indicator lamps, the only warm colour in the hall */}
				<instancedMesh
					ref={glow}
					args={[undefined, undefined, N]}
					frustumCulled={false}
				>
					<sphereGeometry args={[0.13, 8, 8]} />
					<meshStandardMaterial
						color={C.cake}
						emissive={C.cake}
						emissiveIntensity={2}
						toneMapped={false}
					/>
				</instancedMesh>

				{/* Floor */}
				<mesh rotation-x={-Math.PI / 2} position={[0, -1.82, -55]}>
					<planeGeometry args={[60, 130]} />
					<meshStandardMaterial color="#1C212C" roughness={0.95} />
				</mesh>
			</group>

			{/* Scale reference: roughly a person, at the near end. */}
			<group position={[-4.6, -1.15, 7.2]}>
				<mesh position={[0, 0.28, 0]}>
					<capsuleGeometry args={[0.16, 0.62, 4, 10]} />
					<meshStandardMaterial color="#C6CEDC" roughness={0.8} />
				</mesh>
				<mesh position={[0, 0.92, 0]}>
					<sphereGeometry args={[0.15, 14, 14]} />
					<meshStandardMaterial color="#C6CEDC" roughness={0.8} />
				</mesh>
			</group>
		</>
	);
}
