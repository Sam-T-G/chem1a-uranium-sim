import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C, ASSAY } from "../../theme";
import { Lighting, dummy, mulberry32 } from "../../three/shared";

/**
 * The assay scale as an object.
 *
 * A column climbs from natural abundance toward weapons grade, and where it
 * crosses 20 % the whole thing turns. Nothing about the column changes at that
 * height. The line is drawn by people, on a quantity that is purely physical,
 * and that is the point of the chapter.
 */

const H = 9; // world height of the full scale
const LO = Math.log(0.002);
const HI = Math.log(1.0);

/** Map an assay to a height on the log scale. */
function y(assay: number): number {
	const a = Math.min(Math.max(assay, 0.002), 1);
	return ((Math.log(a) - LO) / (HI - LO)) * H - H / 2;
}

const HOT = new THREE.Color(C.hot);
const COOL = new THREE.Color(C.u235);

// One-shot pulse on the threshold ring when the column first crosses 20 %.
const PULSE_LEN = 0.6; // seconds

const MARKS = [
	{ v: ASSAY.natural, w: 1.5 },
	{ v: ASSAY.leu, w: 1.5 },
	{ v: ASSAY.haleu, w: 2.6 },
	{ v: ASSAY.weapons, w: 1.5 },
];

export default function LineScene({ reduced }: { reduced: boolean }) {
	const fill = useRef<THREE.Mesh>(null);
	const fillMat = useRef<THREE.MeshStandardMaterial>(null);
	const motes = useRef<THREE.InstancedMesh>(null);
	const threshold = useRef<THREE.Mesh>(null);
	const prevHot = useRef(false);
	const pulseT = useRef(Infinity); // seconds since crossing; Infinity = no pulse running

	const N_MOTES = 240;

	useLayoutEffect(() => {
		if (!motes.current) return;
		const rnd = mulberry32(2020);
		for (let i = 0; i < N_MOTES; i++) {
			const a = rnd() * Math.PI * 2;
			const r = 1.1 + rnd() * 2.6;
			dummy.position.set(Math.cos(a) * r, (rnd() - 0.5) * H, Math.sin(a) * r);
			dummy.scale.setScalar(0.03 + rnd() * 0.05);
			dummy.updateMatrix();
			motes.current.setMatrixAt(i, dummy.matrix);
		}
		motes.current.instanceMatrix.needsUpdate = true;
	}, []);

	useFrame((state, dt) => {
		const t = state.clock.elapsedTime;
		// Climb from natural to weapons grade and hold, then reset.
		const cycle = reduced ? 0.62 : (t * 0.11) % 1.35;
		const k = Math.min(cycle, 1);
		const eased = k < 1 ? 1 - Math.pow(1 - k, 2.4) : 1;

		const assay = Math.exp(
			Math.log(ASSAY.natural) +
				eased * (Math.log(ASSAY.weapons) - Math.log(ASSAY.natural)),
		);

		const top = y(assay);
		const bottom = y(ASSAY.natural);
		const height = Math.max(top - bottom, 0.001);
		const hot = assay >= ASSAY.haleu;

		// The crossing is the event of the chapter, so it gets one visible beat:
		// the ring expands and fades over 0.6 s, then returns to its idle state.
		if (!reduced && hot && !prevHot.current) pulseT.current = 0;
		prevHot.current = hot;

		if (fill.current) {
			fill.current.scale.y = height;
			fill.current.position.y = bottom + height / 2;
		}
		if (fillMat.current) {
			if (reduced) {
				fillMat.current.color.copy(hot ? HOT : COOL);
				fillMat.current.emissive.copy(hot ? HOT : COOL);
			} else {
				fillMat.current.color.lerp(hot ? HOT : COOL, 0.12);
				fillMat.current.emissive.lerp(hot ? HOT : COOL, 0.12);
			}
		}
		if (threshold.current) {
			const m = threshold.current.material as THREE.MeshBasicMaterial;
			if (!reduced && pulseT.current < PULSE_LEN) {
				const p = pulseT.current / PULSE_LEN;
				const e = 1 - Math.pow(1 - p, 3); // fast out, so the snap reads as an instant
				const s = 1 + 0.55 * e;
				threshold.current.scale.set(s, s, 1);
				m.opacity = 0.65 + (0.25 - 0.65) * e;
				pulseT.current += dt;
			} else {
				threshold.current.scale.set(1, 1, 1);
				m.opacity = hot ? (reduced ? 0.5 : 0.5 + Math.sin(t * 3) * 0.16) : 0.22;
			}
		}
		if (motes.current && !reduced) motes.current.rotation.y = t * 0.06;
	});

	return (
		<>
			<Lighting />

			{/* The scale itself */}
			<mesh position={[0, 0, 0]}>
				<cylinderGeometry args={[0.055, 0.055, H, 12]} />
				<meshStandardMaterial color="#3A4355" roughness={0.6} metalness={0.3} />
			</mesh>

			{/* The climbing fill */}
			<mesh ref={fill} position={[0, 0, 0]}>
				<cylinderGeometry args={[0.16, 0.16, 1, 16]} />
				<meshStandardMaterial
					ref={fillMat}
					color={C.u235}
					emissive={C.u235}
					emissiveIntensity={2.2}
					roughness={0.3}
					toneMapped={false}
				/>
			</mesh>

			{/* Tick marks at the assays that carry names */}
			{MARKS.map((m) => (
				<group key={m.v} position={[0, y(m.v), 0]}>
					<mesh rotation-z={Math.PI / 2}>
						<cylinderGeometry args={[0.022, 0.022, m.w, 8]} />
						<meshStandardMaterial
							color={m.v === ASSAY.haleu ? C.hot : "#7B879E"}
							emissive={m.v === ASSAY.haleu ? C.hot : "#000000"}
							emissiveIntensity={m.v === ASSAY.haleu ? 1.2 : 0}
							toneMapped={false}
						/>
					</mesh>
					{/* End cap. Only the 20 % one is lit — it is the threshold. */}
					<mesh position={[-m.w / 2, 0, 0]}>
						<sphereGeometry args={[0.06, 12, 12]} />
						{m.v === ASSAY.haleu ? (
							<meshStandardMaterial
								color={C.hot}
								emissive={C.hot}
								emissiveIntensity={2.5}
								toneMapped={false}
							/>
						) : (
							<meshStandardMaterial color="#7B879E" roughness={0.5} metalness={0.3} />
						)}
					</mesh>
				</group>
			))}

			{/* The 20 % plane: a line drawn by people across a physical quantity */}
			<mesh ref={threshold} position={[0, y(ASSAY.haleu), 0]} rotation-x={-Math.PI / 2}>
				<ringGeometry args={[1.35, 2.85, 72]} />
				<meshBasicMaterial
					color={C.hot}
					transparent
					opacity={0.22}
					side={THREE.DoubleSide}
					depthWrite={false}
					toneMapped={false}
				/>
			</mesh>

			<instancedMesh
				ref={motes}
				args={[undefined, undefined, N_MOTES]}
				frustumCulled={false}
			>
				<sphereGeometry args={[1, 6, 6]} />
				<meshBasicMaterial
					color="#5C6880"
					toneMapped={false}
					transparent
					opacity={0.5}
					blending={THREE.AdditiveBlending}
					depthWrite={false}
				/>
			</instancedMesh>
		</>
	);
}
