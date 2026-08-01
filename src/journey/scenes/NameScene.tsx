import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Lighting, dummy, mulberry32 } from "../../three/shared";

/**
 * The naming. A lump of pitchblende in the foreground, the planet it was named
 * after hanging behind it. Klaproth called the element after Uranus because
 * Herschel had found the planet eight years earlier and it was still the
 * exciting new thing.
 */

function Pitchblende({ reduced }: { reduced: boolean }) {
	const g = useRef<THREE.Group>(null);

	useFrame((state, dt) => {
		if (!g.current || reduced) return;
		g.current.rotation.y += dt * 0.14;
		g.current.position.y = -0.3 + Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
	});

	return (
		<group ref={g} position={[-2.4, -0.3, 1.2]}>
			<mesh>
				<dodecahedronGeometry args={[1.25, 0]} />
				<meshStandardMaterial
					color="#3A3630"
					roughness={0.94}
					metalness={0.3}
					flatShading
				/>
			</mesh>
			{/* Secondary lumps so it reads as ore rather than a die */}
			<mesh position={[0.85, -0.45, 0.35]} rotation={[0.6, 0.9, 0.2]}>
				<dodecahedronGeometry args={[0.55, 0]} />
				<meshStandardMaterial
					color="#332F2A"
					roughness={0.95}
					metalness={0.28}
					flatShading
				/>
			</mesh>
			<mesh position={[-0.75, -0.6, -0.3]} rotation={[1.1, 0.3, 0.7]}>
				<dodecahedronGeometry args={[0.42, 0]} />
				<meshStandardMaterial
					color="#413B33"
					roughness={0.95}
					metalness={0.28}
					flatShading
				/>
			</mesh>
		</group>
	);
}

function Planet({ reduced }: { reduced: boolean }) {
	const ref = useRef<THREE.Mesh>(null);
	const ring = useRef<THREE.Mesh>(null);

	useFrame((_, dt) => {
		if (reduced) return;
		if (ref.current) ref.current.rotation.y += dt * 0.05;
		if (ring.current) ring.current.rotation.z += dt * 0.02;
	});

	return (
		<group position={[3.4, 1.1, -7]}>
			<mesh ref={ref}>
				<sphereGeometry args={[2.5, 64, 64]} />
				<meshStandardMaterial
					color="#7FC9CE"
					roughness={0.62}
					metalness={0.05}
					emissive="#1E4F5C"
					emissiveIntensity={0.35}
				/>
			</mesh>
			{/* Uranus is the one with a near-vertical ring system. */}
			<mesh ref={ring} rotation={[Math.PI / 2, 0, 0.12]}>
				<ringGeometry args={[3.1, 3.5, 96]} />
				<meshBasicMaterial
					color="#9FDDE2"
					transparent
					opacity={0.22}
					side={THREE.DoubleSide}
					depthWrite={false}
				/>
			</mesh>
			<mesh rotation={[Math.PI / 2, 0, 0.12]}>
				<ringGeometry args={[3.66, 3.76, 96]} />
				<meshBasicMaterial
					color="#9FDDE2"
					transparent
					opacity={0.13}
					side={THREE.DoubleSide}
					depthWrite={false}
				/>
			</mesh>
		</group>
	);
}

function Starfield() {
	const ref = useRef<THREE.InstancedMesh>(null);
	const N = 260;

	useLayoutEffect(() => {
		if (!ref.current) return;
		const rnd = mulberry32(8123);
		for (let i = 0; i < N; i++) {
			dummy.position.set(
				(rnd() - 0.5) * 46,
				(rnd() - 0.5) * 26,
				-14 - rnd() * 20,
			);
			dummy.scale.setScalar(0.018 + rnd() * 0.045);
			dummy.updateMatrix();
			ref.current.setMatrixAt(i, dummy.matrix);
		}
		ref.current.instanceMatrix.needsUpdate = true;
	}, []);

	return (
		<instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
			<sphereGeometry args={[1, 6, 6]} />
			<meshBasicMaterial color="#D8E4F5" toneMapped={false} />
		</instancedMesh>
	);
}

export default function NameScene({ reduced }: { reduced: boolean }) {
	return (
		<>
			<Lighting />
			<Starfield />
			<Planet reduced={reduced} />
			<Pitchblende reduced={reduced} />
		</>
	);
}
