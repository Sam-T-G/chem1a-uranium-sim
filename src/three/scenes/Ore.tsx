import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C, ASSAY } from "../../theme";
import { Floor, Lighting, Spin, col, dummy, isU235, mulberry32 } from "../shared";

/**
 * A block of uraninite ore. The specks are uranium atoms at natural abundance:
 * one chartreuse U-235 for every 139 dull U-238. The ratio is the whole point,
 * so it is rendered literally rather than suggested.
 */
function OreBody({ reduced }: { reduced: boolean }) {
	const heavy = useRef<THREE.InstancedMesh>(null);
	const light = useRef<THREE.InstancedMesh>(null);
	const halos = useRef<(THREE.Mesh | null)[]>([]);

	const N = 1400;
	const points = useMemo(() => {
		const rnd = mulberry32(9182);
		const pts: { p: THREE.Vector3; light: boolean }[] = [];
		for (let i = 0; i < N; i++) {
			// Sample a shell just outside the rock surface so every speck is
			// visible. Burying them inside an opaque body would hide exactly the
			// ratio this scene exists to show.
			const u = rnd() * 2 - 1;
			const phi = rnd() * Math.PI * 2;
			const s = Math.sqrt(1 - u * u);
			const dir = new THREE.Vector3(s * Math.cos(phi), u, s * Math.sin(phi));
			const lump =
				1 + 0.1 * Math.sin(dir.x * 4.2) + 0.09 * Math.cos(dir.z * 3.6 + dir.y * 2);
			const r = 1.96 * lump + rnd() * 0.1;
			pts.push({ p: dir.multiplyScalar(r), light: isU235(i, N, ASSAY.natural) });
		}
		return pts;
	}, []);

	const heavyPts = useMemo(() => points.filter((p) => !p.light), [points]);
	const lightPts = useMemo(() => points.filter((p) => p.light), [points]);

	useLayoutEffect(() => {
		[
			[heavy.current, heavyPts] as const,
			[light.current, lightPts] as const,
		].forEach(([mesh, pts]) => {
			if (!mesh) return;
			pts.forEach((pt, i) => {
				dummy.position.copy(pt.p);
				dummy.scale.setScalar(pt.light ? 1.05 : 1);
				dummy.updateMatrix();
				mesh.setMatrixAt(i, dummy.matrix);
			});
			mesh.instanceMatrix.needsUpdate = true;
		});
	}, [heavyPts, lightPts]);

	// Gentle pulse on the fissile specks so the eye finds them. The whole range
	// sits above the bloom threshold, so the specks always glow — the pulse only
	// varies how hard. Halos breathe in phase so glow and reach read as one event.
	useFrame((state) => {
		if (!light.current) return;
		const m = light.current.material as THREE.MeshStandardMaterial;
		if (reduced) {
			m.emissiveIntensity = 2.4;
			for (let i = 0; i < halos.current.length; i++) {
				halos.current[i]?.scale.setScalar(1);
			}
			return;
		}
		const s = Math.sin(state.clock.elapsedTime * 1.6);
		m.emissiveIntensity = 2.6 + s * 0.6;
		const haloScale = 1 + s * 0.15;
		for (let i = 0; i < halos.current.length; i++) {
			halos.current[i]?.scale.setScalar(haloScale);
		}
	});

	return (
		<group>
			<mesh castShadow>
				<icosahedronGeometry args={[1.98, 1]} />
				<meshStandardMaterial
					color="#5A5347"
					roughness={0.88}
					metalness={0.22}
					flatShading
				/>
			</mesh>

			<instancedMesh
				ref={heavy}
				args={[undefined, undefined, heavyPts.length]}
				frustumCulled={false}
			>
				<sphereGeometry args={[0.035, 6, 6]} />
				<meshStandardMaterial
					color={C.u238}
					emissive={C.u238}
					emissiveIntensity={0.15}
					roughness={0.8}
				/>
			</instancedMesh>

			<instancedMesh
				ref={light}
				args={[undefined, undefined, lightPts.length]}
				frustumCulled={false}
			>
				<sphereGeometry args={[0.085, 12, 12]} />
				<meshStandardMaterial
					color={C.u235}
					emissive={C.u235}
					emissiveIntensity={2.4}
					roughness={0.3}
					toneMapped={false}
				/>
			</instancedMesh>

			{/* Halos, so the ten fissile atoms are findable against 1,390 others. */}
			{lightPts.map((pt, i) => (
				<mesh
					key={i}
					position={pt.p}
					ref={(el) => {
						halos.current[i] = el;
					}}
				>
					<sphereGeometry args={[0.19, 14, 14]} />
					<meshBasicMaterial
						color={C.u235}
						transparent
						opacity={0.16}
						depthWrite={false}
						toneMapped={false}
					/>
				</mesh>
			))}
		</group>
	);
}

export default function Ore({ reduced }: { reduced: boolean }) {
	return (
		<>
			<Lighting />
			<Floor />
			<Spin speed={0.12} enabled={!reduced}>
				<OreBody reduced={reduced} />
			</Spin>
			{/* Faint scatter of loose rock so the block does not float in a void. */}
			<Rubble />
		</>
	);
}

function Rubble() {
	const ref = useRef<THREE.InstancedMesh>(null);
	const N = 40;
	useLayoutEffect(() => {
		const rnd = mulberry32(4471);
		// Separate stream for tint so the layout above stays byte-identical.
		const tint = mulberry32(4472);
		if (!ref.current) return;
		for (let i = 0; i < N; i++) {
			const a = rnd() * Math.PI * 2;
			const r = 3.4 + rnd() * 4;
			dummy.position.set(Math.cos(a) * r, -3.05, Math.sin(a) * r);
			dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
			dummy.scale.setScalar(0.12 + rnd() * 0.3);
			dummy.updateMatrix();
			ref.current.setMatrixAt(i, dummy.matrix);
			// Slight grey variation (0.85–1.15 around the base colour) so the ring
			// reads as forty stones rather than one repeated mesh.
			col.setScalar(0.85 + tint() * 0.3);
			ref.current.setColorAt(i, col);
		}
		ref.current.instanceMatrix.needsUpdate = true;
		if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
	}, []);
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
			<dodecahedronGeometry args={[1, 0]} />
			<meshStandardMaterial color="#22252C" roughness={1} flatShading />
		</instancedMesh>
	);
}
