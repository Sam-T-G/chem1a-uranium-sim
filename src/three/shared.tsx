import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { C } from "../theme";

export const dummy = new THREE.Object3D();
export const col = new THREE.Color();

/** Deterministic pseudo-random so scenes look the same on every load. */
export function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Given an assay, decide isotope identity for particle i of n. Uses Bresenham-
 * style even distribution so the light isotope is spread through the population
 * instead of clumped at one end, which would misread as a concentration.
 */
export function isU235(i: number, n: number, assay: number): boolean {
	const count = Math.round(assay * n);
	if (count <= 0) return false;
	if (count >= n) return true;
	return Math.floor(((i + 1) * count) / n) > Math.floor((i * count) / n);
}

export function Lighting() {
	return (
		<>
			<ambientLight intensity={0.6} />
			<hemisphereLight args={["#9FB2D8", "#2A2418", 0.6]} />
			<directionalLight position={[6, 10, 6]} intensity={2.2} color="#fff6e8" />
			<directionalLight position={[-8, 4, -6]} intensity={0.9} color="#6f8cff" />
			<pointLight position={[0, -6, 4]} intensity={0.5} color={C.cake} />

			{/*
				Built in-scene rather than fetched, so the page stays self-contained.
				Without an environment map the metal surfaces have nothing to reflect
				and render black under direct lights alone.
			*/}
			<Environment resolution={64} frames={1}>
				<Lightformer
					intensity={2.4}
					position={[0, 6, 2]}
					scale={[12, 6, 1]}
					color="#FFF4E2"
				/>
				<Lightformer
					intensity={1.1}
					position={[-7, 2, -4]}
					scale={[8, 8, 1]}
					color="#7E9BFF"
				/>
				<Lightformer
					intensity={0.8}
					position={[7, -2, 3]}
					scale={[8, 8, 1]}
					color={C.cake}
				/>
				<Lightformer
					intensity={0.5}
					position={[0, -6, -4]}
					scale={[10, 6, 1]}
					color="#3B4A63"
				/>
			</Environment>
		</>
	);
}

/** Slow idle rotation for a whole group, disabled under reduced motion. */
export function Spin({
	speed = 0.15,
	enabled = true,
	children,
}: {
	speed?: number;
	enabled?: boolean;
	children: React.ReactNode;
}) {
	const ref = useRef<THREE.Group>(null);
	useFrame((_, dt) => {
		if (ref.current && enabled) ref.current.rotation.y += speed * dt;
	});
	return <group ref={ref}>{children}</group>;
}

/** A flat disc of ground so scenes have a horizon without costing much. */
export function Floor({ y = -3.2 }: { y?: number }) {
	return (
		<mesh rotation-x={-Math.PI / 2} position-y={y} receiveShadow>
			<circleGeometry args={[16, 64]} />
			<meshStandardMaterial color="#1A1F2B" roughness={1} metalness={0} />
		</mesh>
	);
}

/** Emissive material tuned for the isotope colours. */
export function useIsotopeMaterials() {
	return useMemo(
		() => ({
			light: new THREE.MeshStandardMaterial({
				color: C.u235,
				emissive: new THREE.Color(C.u235),
				emissiveIntensity: 1.1,
				roughness: 0.35,
				metalness: 0.1,
			}),
			heavy: new THREE.MeshStandardMaterial({
				color: C.u238,
				emissive: new THREE.Color(C.u238),
				emissiveIntensity: 0.18,
				roughness: 0.7,
				metalness: 0.2,
			}),
		}),
		[],
	);
}
