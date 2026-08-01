import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../../theme";
import { Lighting, col, dummy, mulberry32 } from "../../three/shared";

/**
 * The naming. A lump of pitchblende in the foreground, the planet it was named
 * after hanging behind it. Klaproth called the element after Uranus because
 * Herschel had found the planet eight years earlier and it was still the
 * exciting new thing.
 */

/** Fixed points near the surface of the r=1.25 lump, tucked against faces. */
const GLINTS: [number, number, number][] = [
	[0.68, 0.52, 0.72],
	[-0.9, 0.35, 0.55],
	[0.3, -0.75, -0.8],
];

function Pitchblende({ reduced }: { reduced: boolean }) {
	const g = useRef<THREE.Group>(null);

	useFrame((state, dt) => {
		if (!g.current || reduced) return;
		g.current.rotation.y += dt * 0.14;
		g.current.position.y = -1.7 + Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
	});

	// Sits low-centre-right so the chapter card never covers it.
	return (
		<group ref={g} position={[1.7, -1.7, 2.2]}>
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
			{/*
				Three glints of uranyl green on the main lump. Real pitchblende is
				matte black; the flecks are the story getting ahead of itself — the
				ore already carries what the rest of the journey is about.
			*/}
			{GLINTS.map((p, i) => (
				<mesh key={i} position={p}>
					<sphereGeometry args={[0.045, 12, 12]} />
					<meshStandardMaterial
						color={C.u235}
						emissive={C.u235}
						emissiveIntensity={2.2}
						toneMapped={false}
					/>
				</mesh>
			))}
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
			{/* Thin haze shell, back faces only, so the limb picks up a rim of air. */}
			<mesh>
				<sphereGeometry args={[2.65, 48, 48]} />
				<meshBasicMaterial
					color="#7FC9CE"
					transparent
					opacity={0.1}
					side={THREE.BackSide}
					blending={THREE.AdditiveBlending}
					depthWrite={false}
				/>
			</mesh>
			{/* Uranus is the one with a near-vertical ring system. */}
			<mesh ref={ring} rotation={[Math.PI / 2, 0, 0.12]}>
				<ringGeometry args={[3.1, 3.5, 96]} />
				<meshBasicMaterial
					color="#9FDDE2"
					transparent
					opacity={0.3}
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

const STAR_N = 260;

function Starfield({ reduced }: { reduced: boolean }) {
	const ref = useRef<THREE.InstancedMesh>(null);

	// Positions and twinkle parameters are seeded once so the sky is the same
	// sky on every load. Every 13th star is a bright one: double base size and
	// nearly white, the way a real field has a few first-magnitude outliers.
	const stars = useMemo(() => {
		const rnd = mulberry32(8123);
		const pos = new Float32Array(STAR_N * 3);
		const base = new Float32Array(STAR_N);
		const phase = new Float32Array(STAR_N);
		const speed = new Float32Array(STAR_N);
		for (let i = 0; i < STAR_N; i++) {
			pos[i * 3] = (rnd() - 0.5) * 46;
			pos[i * 3 + 1] = (rnd() - 0.5) * 26;
			pos[i * 3 + 2] = -14 - rnd() * 20;
			base[i] = (0.018 + rnd() * 0.045) * (i % 13 === 0 ? 2 : 1);
			phase[i] = rnd() * Math.PI * 2;
			speed[i] = 0.5 + rnd() * 1.7;
		}
		return { pos, base, phase, speed };
	}, []);

	useLayoutEffect(() => {
		if (!ref.current) return;
		for (let i = 0; i < STAR_N; i++) {
			dummy.position.set(
				stars.pos[i * 3],
				stars.pos[i * 3 + 1],
				stars.pos[i * 3 + 2],
			);
			dummy.rotation.set(0, 0, 0);
			dummy.scale.setScalar(stars.base[i]);
			dummy.updateMatrix();
			ref.current.setMatrixAt(i, dummy.matrix);
			ref.current.setColorAt(i, col.set(i % 13 === 0 ? "#F2F7FF" : "#D8E4F5"));
		}
		ref.current.instanceMatrix.needsUpdate = true;
		if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
	}, [stars]);

	useFrame((state) => {
		if (!ref.current || reduced) return;
		const t = state.clock.elapsedTime;
		for (let i = 0; i < STAR_N; i++) {
			dummy.position.set(
				stars.pos[i * 3],
				stars.pos[i * 3 + 1],
				stars.pos[i * 3 + 2],
			);
			dummy.scale.setScalar(
				stars.base[i] * (0.75 + 0.25 * Math.sin(t * stars.speed[i] + stars.phase[i])),
			);
			dummy.updateMatrix();
			ref.current.setMatrixAt(i, dummy.matrix);
		}
		ref.current.instanceMatrix.needsUpdate = true;
	});

	return (
		<instancedMesh ref={ref} args={[undefined, undefined, STAR_N]} frustumCulled={false}>
			<sphereGeometry args={[1, 6, 6]} />
			{/* Instance colours carry the tint; below 1.0 so the sky never blooms. */}
			<meshBasicMaterial color="#FFFFFF" toneMapped={false} />
		</instancedMesh>
	);
}

export default function NameScene({ reduced }: { reduced: boolean }) {
	return (
		<>
			<Lighting />
			<Starfield reduced={reduced} />
			<Planet reduced={reduced} />
			<Pitchblende reduced={reduced} />
		</>
	);
}
