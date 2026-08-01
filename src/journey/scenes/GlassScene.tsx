import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../../theme";
import { Lighting } from "../../three/shared";

/**
 * Uranium glass under a sweeping ultraviolet lamp. The vessels sit dull amber in
 * ordinary light and flare green as the lamp passes, which is what actually
 * happens: uranyl absorbs UV and re-emits visible green. It is fluorescence, not
 * radioactivity, and the scene is built to make that distinction obvious.
 */

/** Lathe profile for a stemmed glass. */
function goblet(): THREE.Vector2[] {
	const pts: THREE.Vector2[] = [];
	pts.push(new THREE.Vector2(0.0, -1.5));
	pts.push(new THREE.Vector2(0.62, -1.48));
	pts.push(new THREE.Vector2(0.66, -1.38));
	pts.push(new THREE.Vector2(0.12, -1.3));
	pts.push(new THREE.Vector2(0.09, -0.5));
	pts.push(new THREE.Vector2(0.34, -0.2));
	pts.push(new THREE.Vector2(0.6, 0.35));
	pts.push(new THREE.Vector2(0.72, 0.95));
	pts.push(new THREE.Vector2(0.7, 1.3));
	return pts;
}

/** Lathe profile for a squat vase. */
function vase(): THREE.Vector2[] {
	const pts: THREE.Vector2[] = [];
	pts.push(new THREE.Vector2(0.0, -1.1));
	pts.push(new THREE.Vector2(0.7, -1.05));
	pts.push(new THREE.Vector2(0.95, -0.5));
	pts.push(new THREE.Vector2(0.98, 0.15));
	pts.push(new THREE.Vector2(0.66, 0.7));
	pts.push(new THREE.Vector2(0.58, 1.0));
	pts.push(new THREE.Vector2(0.66, 1.15));
	return pts;
}

/** A shallow bowl. */
function bowl(): THREE.Vector2[] {
	const pts: THREE.Vector2[] = [];
	pts.push(new THREE.Vector2(0.0, -0.55));
	pts.push(new THREE.Vector2(0.55, -0.5));
	pts.push(new THREE.Vector2(0.95, -0.15));
	pts.push(new THREE.Vector2(1.15, 0.3));
	pts.push(new THREE.Vector2(1.18, 0.42));
	return pts;
}

interface PieceProps {
	profile: THREE.Vector2[];
	position: [number, number, number];
	rotation?: number;
	scale?: number;
	/** 0 = daylight amber, 1 = full UV fluorescence. */
	glowRef: React.RefObject<number>;
	phase: number;
	reduced: boolean;
}

const DAYLIGHT = new THREE.Color("#C9B481");
const FLUORESCE = new THREE.Color(C.u235);

function Piece({
	profile,
	position,
	rotation = 0,
	scale = 1,
	glowRef,
	phase,
	reduced,
}: PieceProps) {
	const mat = useRef<THREE.MeshStandardMaterial>(null);
	const halo = useRef<THREE.Mesh>(null);
	const grp = useRef<THREE.Group>(null);

	const geo = useMemo(() => new THREE.LatheGeometry(profile, 48), [profile]);

	useFrame((state) => {
		// Each piece lights as the lamp sweeps past its own x position.
		const sweep = glowRef.current ?? 0;
		const d = Math.abs(sweep - phase);
		const lit = Math.max(0, 1 - d * 2.6);

		if (mat.current) {
			mat.current.color.copy(DAYLIGHT).lerp(FLUORESCE, lit);
			mat.current.emissive.copy(FLUORESCE);
			mat.current.emissiveIntensity = 0.05 + lit * 1.5;
			mat.current.opacity = 0.55 + lit * 0.3;
		}
		if (halo.current) {
			const m = halo.current.material as THREE.MeshBasicMaterial;
			m.opacity = lit * 0.1;
			halo.current.scale.setScalar(0.95 + lit * 0.28);
		}
		if (grp.current && !reduced) {
			grp.current.rotation.y = state.clock.elapsedTime * 0.18 + phase * 3;
		}
	});

	return (
		<group ref={grp} position={position} rotation-z={rotation} scale={scale}>
			<mesh geometry={geo}>
				<meshStandardMaterial
					ref={mat}
					transparent
					opacity={0.6}
					roughness={0.08}
					metalness={0.05}
					side={THREE.DoubleSide}
					toneMapped={false}
				/>
			</mesh>
			<mesh ref={halo}>
				<sphereGeometry args={[1.1, 20, 20]} />
				<meshBasicMaterial
					color={C.u235}
					transparent
					opacity={0}
					depthWrite={false}
					toneMapped={false}
				/>
			</mesh>
		</group>
	);
}

/** The UV lamp itself, tracking left to right. */
function Lamp({
	glowRef,
	reduced,
}: {
	glowRef: React.RefObject<number>;
	reduced: boolean;
}) {
	const grp = useRef<THREE.Group>(null);

	useFrame((state) => {
		const t = reduced ? 0.5 : (Math.sin(state.clock.elapsedTime * 0.45) + 1) / 2;
		glowRef.current = t;
		if (grp.current) grp.current.position.x = -4.6 + t * 9.2;
	});

	return (
		<group ref={grp} position={[0, 3.1, 1.2]}>
			<mesh rotation-z={Math.PI / 2}>
				<cylinderGeometry args={[0.08, 0.08, 1.6, 12]} />
				<meshStandardMaterial
					color="#B39CFF"
					emissive="#8A6CFF"
					emissiveIntensity={2.2}
					toneMapped={false}
				/>
			</mesh>
			<pointLight color="#9B7BFF" intensity={22} distance={9} decay={2} />
		</group>
	);
}

export default function GlassScene({ reduced }: { reduced: boolean }) {
	const glowRef = useRef(0.5);

	const profiles = useMemo(
		() => ({ g: goblet(), v: vase(), b: bowl() }),
		[],
	);

	return (
		<>
			<Lighting />
			<Lamp glowRef={glowRef} reduced={reduced} />

			<Piece
				profile={profiles.v}
				position={[-3.1, -0.2, -0.6]}
				scale={1.05}
				glowRef={glowRef}
				phase={0.08}
				reduced={reduced}
			/>
			<Piece
				profile={profiles.g}
				position={[-1.15, -0.05, 0.5]}
				scale={0.95}
				glowRef={glowRef}
				phase={0.32}
				reduced={reduced}
			/>
			<Piece
				profile={profiles.b}
				position={[0.75, -0.85, -0.2]}
				scale={1.15}
				glowRef={glowRef}
				phase={0.55}
				reduced={reduced}
			/>
			<Piece
				profile={profiles.g}
				position={[2.55, -0.05, 0.4]}
				scale={1.1}
				glowRef={glowRef}
				phase={0.76}
				reduced={reduced}
			/>
			<Piece
				profile={profiles.v}
				position={[4.2, -0.25, -0.7]}
				scale={0.85}
				glowRef={glowRef}
				phase={0.95}
				reduced={reduced}
			/>

			{/* Shelf */}
			<mesh position={[0, -1.62, 0]} receiveShadow>
				<boxGeometry args={[13, 0.16, 3.2]} />
				<meshStandardMaterial color="#2B3140" roughness={0.85} metalness={0.2} />
			</mesh>
		</>
	);
}
