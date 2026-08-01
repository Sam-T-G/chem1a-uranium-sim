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

// Bond midpoints and orientations never change, so compute them once.
const UP = new THREE.Vector3(0, 1, 0);
const BONDS = FLUORINE_POSITIONS.map((p) => {
	const v = new THREE.Vector3(...p);
	return {
		mid: v.clone().multiplyScalar(0.5),
		quat: new THREE.Quaternion().setFromUnitVectors(UP, v.clone().normalize()),
	};
});

// A fixed three-quarter pose so the octahedron reads as an octahedron even
// when nothing is moving (reduced motion shows exactly this).
const BASE_ROT: [number, number, number] = [0.45, 0.62, 0];

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
	const fluorines = useRef<(THREE.Mesh | null)[]>([]);

	useFrame((state) => {
		if (!g.current || reduced) return;
		const t = state.clock.elapsedTime;
		g.current.rotation.y = BASE_ROT[1] + t * 0.42;
		g.current.rotation.x = BASE_ROT[0] + t * 0.17;
		// Both molecules bob at the same rate: the geometry is the same, only the
		// mass differs, and mass is not something you can see.
		g.current.position.y = position[1] + Math.sin(t * 0.9 + phase) * 0.12;
		// U–F stretch. Real UF6 vibrates around 200 fs a cycle with picometre
		// amplitude; this is slowed and enlarged past any honest scale, kept only
		// so the molecule reads as matter rather than a ball-and-stick diagram.
		for (let i = 0; i < 6; i++) {
			const m = fluorines.current[i];
			if (m) m.scale.setScalar(1 + Math.sin(t * 2.1 + i * 1.9 + phase) * 0.05);
		}
	});

	return (
		<group ref={g} position={position} rotation={BASE_ROT}>
			{/* Uranium centre. The colour and the glow are the only differences the
			    two molecules are allowed: everything a centrifuge can grab is the
			    same on both sides. */}
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

			{/* Electron-cloud hint. Not an orbital, not to scale: a faint shell of
			    the centre's colour so the molecule occupies volume, not just points. */}
			<mesh>
				<sphereGeometry args={[1.85, 32, 32]} />
				<meshBasicMaterial
					color={coreColor}
					transparent
					opacity={0.045}
					side={THREE.BackSide}
					depthWrite={false}
				/>
			</mesh>

			{FLUORINE_POSITIONS.map((p, i) => (
				<group key={i}>
					{/* bond */}
					<mesh position={BONDS[i].mid} quaternion={BONDS[i].quat}>
						<cylinderGeometry args={[0.055, 0.055, 1.35, 10]} />
						<meshStandardMaterial
							color="#6E7A90"
							emissive="#6E7A90"
							emissiveIntensity={0.15}
							metalness={0.6}
							roughness={0.4}
						/>
					</mesh>
					{/* fluorine */}
					<mesh
						position={p}
						ref={(m: THREE.Mesh | null) => {
							fluorines.current[i] = m;
						}}
					>
						<sphereGeometry args={[0.3, 28, 28]} />
						<meshStandardMaterial
							color="#9FE8C8"
							emissive="#3FBF8F"
							emissiveIntensity={0.25}
							roughness={0.35}
						/>
					</mesh>
				</group>
			))}
		</group>
	);
}

export default function Conversion({ reduced }: { reduced: boolean }) {
	return (
		<>
			<Lighting />
			<UF6
				coreColor={C.u235}
				coreEmissive={2.0}
				position={[-2.9, 0, 0]}
				phase={0}
				reduced={reduced}
			/>
			<UF6
				coreColor={C.u238}
				coreEmissive={0.25}
				position={[2.9, 0, 0]}
				phase={2.4}
				reduced={reduced}
			/>
		</>
	);
}
