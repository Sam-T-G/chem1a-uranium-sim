import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../../theme";
import { Lighting } from "../shared";

/**
 * Two UF6 molecules, side by side. Identical octahedral geometry, identical
 * bonding, identical chemistry. The only difference is three neutrons in the
 * centre, worth 1.3 % of the molecular mass. That difference is the sole reason
 * enrichment is possible and the sole reason it is difficult.
 */

const FLUORINE_POSITIONS: [number, number, number][] = [
	[1.35, 0, 0],
	[-1.35, 0, 0],
	[0, 1.35, 0],
	[0, -1.35, 0],
	[0, 0, 1.35],
	[0, 0, -1.35],
];

function UF6({
	coreColor,
	coreEmissive,
	position,
	phase,
	reduced,
}: {
	coreColor: string;
	coreEmissive: number;
	position: [number, number, number];
	phase: number;
	reduced: boolean;
}) {
	const g = useRef<THREE.Group>(null);

	useFrame((state, dt) => {
		if (!g.current || reduced) return;
		g.current.rotation.y += dt * 0.42;
		g.current.rotation.x += dt * 0.17;
		// Both molecules bob at the same rate: the geometry is the same, only the
		// mass differs, and mass is not something you can see.
		g.current.position.y =
			position[1] + Math.sin(state.clock.elapsedTime * 0.9 + phase) * 0.12;
	});

	return (
		<group ref={g} position={position}>
			{/* Uranium centre */}
			<mesh>
				<sphereGeometry args={[0.72, 40, 40]} />
				<meshStandardMaterial
					color={coreColor}
					emissive={coreColor}
					emissiveIntensity={coreEmissive}
					roughness={0.3}
					metalness={0.35}
					toneMapped={false}
				/>
			</mesh>

			{FLUORINE_POSITIONS.map((p, i) => {
				const v = new THREE.Vector3(...p);
				const mid = v.clone().multiplyScalar(0.5);
				const quat = new THREE.Quaternion().setFromUnitVectors(
					new THREE.Vector3(0, 1, 0),
					v.clone().normalize(),
				);
				return (
					<group key={i}>
						{/* bond */}
						<mesh position={mid} quaternion={quat}>
							<cylinderGeometry args={[0.055, 0.055, 1.35, 10]} />
							<meshStandardMaterial
								color="#6E7A90"
								metalness={0.6}
								roughness={0.4}
							/>
						</mesh>
						{/* fluorine */}
						<mesh position={p}>
							<sphereGeometry args={[0.3, 28, 28]} />
							<meshStandardMaterial
								color="#9FE8C8"
								emissive="#3FBF8F"
								emissiveIntensity={0.25}
								roughness={0.35}
							/>
						</mesh>
					</group>
				);
			})}
		</group>
	);
}

export default function Conversion({ reduced }: { reduced: boolean }) {
	return (
		<>
			<Lighting />
			<UF6
				coreColor={C.u235}
				coreEmissive={1.0}
				position={[-2.9, 0, 0]}
				phase={0}
				reduced={reduced}
			/>
			<UF6
				coreColor={C.u238}
				coreEmissive={0.22}
				position={[2.9, 0, 0]}
				phase={0}
				reduced={reduced}
			/>
		</>
	);
}
