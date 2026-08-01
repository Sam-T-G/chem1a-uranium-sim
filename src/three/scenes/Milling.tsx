import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../../theme";
import { Floor, Lighting, dummy, mulberry32 } from "../shared";

/**
 * Crush, leach, precipitate. Ore chunks enter on the left, uranium is taken into
 * solution, and yellowcake accumulates in the drum on the right. The isotope
 * ratio is untouched here, so nothing in this scene is colour-coded by isotope:
 * everything downstream of the mill is uranium at natural abundance.
 */

function Conveyor({ reduced }: { reduced: boolean }) {
	const ref = useRef<THREE.InstancedMesh>(null);
	const N = 26;
	const seeds = useMemo(() => {
		const rnd = mulberry32(220);
		return Array.from({ length: N }, () => ({
			t: rnd(),
			s: 0.13 + rnd() * 0.13,
			rx: rnd() * 3,
			ry: rnd() * 3,
			z: (rnd() - 0.5) * 0.5,
		}));
	}, []);

	useFrame((state, dt) => {
		if (!ref.current) return;
		const speed = reduced ? 0 : 0.16;
		seeds.forEach((sd, i) => {
			sd.t = (sd.t + speed * dt) % 1;
			const x = -7.5 + sd.t * 4.2;
			dummy.position.set(x, 0.75, sd.z);
			dummy.rotation.set(sd.rx + state.clock.elapsedTime * 0.6, sd.ry, 0);
			dummy.scale.setScalar(sd.s * (1 - sd.t * 0.35));
			dummy.updateMatrix();
			ref.current!.setMatrixAt(i, dummy.matrix);
		});
		ref.current.instanceMatrix.needsUpdate = true;
	});

	return (
		<group>
			<mesh position={[-5.4, 0.55, 0]} receiveShadow>
				<boxGeometry args={[4.6, 0.16, 1.1]} />
				<meshStandardMaterial color="#525E74" roughness={0.7} metalness={0.5} />
			</mesh>
			<instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
				<dodecahedronGeometry args={[1, 0]} />
				<meshStandardMaterial color="#3A3D46" roughness={0.95} flatShading />
			</instancedMesh>
		</group>
	);
}

function LeachTank({ reduced }: { reduced: boolean }) {
	const liquid = useRef<THREE.Mesh>(null);
	const stirrer = useRef<THREE.Group>(null);

	useFrame((state, dt) => {
		if (stirrer.current && !reduced) stirrer.current.rotation.y += dt * 2.4;
		if (liquid.current && !reduced) {
			const t = state.clock.elapsedTime;
			liquid.current.position.y = 0.72 + Math.sin(t * 1.7) * 0.015;
		}
	});

	return (
		<group position={[-1.6, 0, 0]}>
			{/* Tank wall, open top */}
			<mesh position={[0, 0.15, 0]}>
				<cylinderGeometry args={[1.5, 1.35, 1.9, 40, 1, true]} />
				<meshStandardMaterial
					color="#6B7791"
					roughness={0.5}
					metalness={0.6}
					side={THREE.DoubleSide}
				/>
			</mesh>
			<mesh position={[0, -0.79, 0]}>
				<cylinderGeometry args={[1.35, 1.35, 0.08, 40]} />
				<meshStandardMaterial color="#4A5568" roughness={0.6} metalness={0.6} />
			</mesh>

			{/* Pregnant leach liquor: uranyl in sulfuric acid */}
			<mesh ref={liquid} position={[0, 0.72, 0]}>
				<cylinderGeometry args={[1.44, 1.44, 0.06, 40]} />
				<meshStandardMaterial
					color={C.cake}
					emissive={C.cake}
					emissiveIntensity={0.32}
					roughness={0.25}
					metalness={0.1}
				/>
			</mesh>

			<group ref={stirrer} position={[0, 0.9, 0]}>
				<mesh position={[0, 0.2, 0]}>
					<cylinderGeometry args={[0.06, 0.06, 1.6, 12]} />
					<meshStandardMaterial color="#AAB6CC" metalness={0.9} roughness={0.3} />
				</mesh>
				<mesh position={[0, -0.5, 0]} rotation-y={0}>
					<boxGeometry args={[1.5, 0.05, 0.22]} />
					<meshStandardMaterial color="#AAB6CC" metalness={0.9} roughness={0.3} />
				</mesh>
				<mesh position={[0, -0.5, 0]} rotation-y={Math.PI / 2}>
					<boxGeometry args={[1.5, 0.05, 0.22]} />
					<meshStandardMaterial color="#AAB6CC" metalness={0.9} roughness={0.3} />
				</mesh>
			</group>
		</group>
	);
}

/** Powder falling from the dryer into the drum. */
function Pour({ reduced }: { reduced: boolean }) {
	const ref = useRef<THREE.InstancedMesh>(null);
	const N = 160;
	const seeds = useMemo(() => {
		const rnd = mulberry32(77);
		return Array.from({ length: N }, () => ({
			t: rnd(),
			a: rnd() * Math.PI * 2,
			r: rnd() * 0.22,
			v: 0.7 + rnd() * 0.5,
		}));
	}, []);

	useFrame((_, dt) => {
		if (!ref.current) return;
		seeds.forEach((s, i) => {
			if (!reduced) s.t += s.v * dt;
			if (s.t > 1) s.t -= 1;
			const y = 2.2 - s.t * 2.35;
			const spread = 1 + s.t * 0.7;
			dummy.position.set(
				3.5 + Math.cos(s.a) * s.r * spread,
				y,
				Math.sin(s.a) * s.r * spread,
			);
			dummy.scale.setScalar(0.045);
			dummy.updateMatrix();
			ref.current!.setMatrixAt(i, dummy.matrix);
		});
		ref.current.instanceMatrix.needsUpdate = true;
	});

	return (
		<instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
			<sphereGeometry args={[1, 5, 5]} />
			<meshStandardMaterial
				color={C.cake}
				emissive={C.cake}
				emissiveIntensity={0.45}
				roughness={0.6}
				toneMapped={false}
			/>
		</instancedMesh>
	);
}

function Drum() {
	return (
		<group position={[3.5, 0, 0]}>
			<mesh position={[0, -0.55, 0]}>
				<cylinderGeometry args={[0.95, 0.95, 1.7, 32, 1, true]} />
				<meshStandardMaterial
					color="#707D96"
					roughness={0.45}
					metalness={0.7}
					side={THREE.DoubleSide}
				/>
			</mesh>
			{/* Yellowcake fill */}
			<mesh position={[0, -0.25, 0]}>
				<cylinderGeometry args={[0.9, 0.9, 0.9, 32]} />
				<meshStandardMaterial
					color={C.cake}
					emissive={C.cake}
					emissiveIntensity={0.4}
					roughness={0.85}
				/>
			</mesh>
			{/* Ribs */}
			{[-1.0, -0.55, -0.1].map((y) => (
				<mesh key={y} position={[0, y, 0]}>
					<torusGeometry args={[0.96, 0.045, 8, 32]} />
					<meshStandardMaterial color="#8E9BB4" metalness={0.8} roughness={0.35} />
				</mesh>
			))}
			<mesh position={[0, -1.42, 0]}>
				<cylinderGeometry args={[0.95, 0.95, 0.08, 32]} />
				<meshStandardMaterial color="#5C6880" metalness={0.7} roughness={0.4} />
			</mesh>
		</group>
	);
}

function Duct() {
	return (
		<group>
			<mesh position={[0.9, 1.35, 0]} rotation-z={-0.35}>
				<cylinderGeometry args={[0.16, 0.16, 2.4, 16]} />
				<meshStandardMaterial color="#78849C" metalness={0.75} roughness={0.4} />
			</mesh>
			<mesh position={[2.35, 2.25, 0]}>
				<boxGeometry args={[1.5, 0.7, 0.9]} />
				<meshStandardMaterial color="#5C6880" metalness={0.6} roughness={0.5} />
			</mesh>
		</group>
	);
}

export default function Milling({ reduced }: { reduced: boolean }) {
	return (
		<>
			<Lighting />
			<Floor y={-2.4} />
			{/* Line runs -7.5 to +4.5, so shift right to sit centred in frame. */}
			<group position={[0.4, -0.4, 0]}>
				<Conveyor reduced={reduced} />
				<LeachTank reduced={reduced} />
				<Duct />
				<Pour reduced={reduced} />
				<Drum />
			</group>
		</>
	);
}
