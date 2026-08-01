import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C, ASSAY } from "../../theme";
import { dummy, isU235, mulberry32 } from "../../three/shared";

/**
 * A crowd of uranium atoms at natural abundance, drifting.
 *
 * 1,000 atoms, so seven of them are U-235. The camera sits inside the crowd and
 * the scarcity is the whole image: you have to look for the green ones, which
 * is exactly the problem. The seven carry HDR instance colors so the bloom
 * pass lifts them; the other 993 stay dull, unlit, and slightly uneven so the
 * crowd still has depth without a single light in the scene.
 */

const N = 1000;
const COL_U235 = new THREE.Color(C.u235);

// Shared pulse for the seven light atoms and their halos. Recomputed once per
// frame into this hoisted color; never allocated in useFrame.
const pulsed = new THREE.Color();
const PULSE_SPEED = 0.8; // rad/s — a slow breath, ~8 s period
const HDR_MID = 2.4; // mid-pulse multiplier; bloom threshold is 1.0
const HDR_SWING = 0.45; // stays well above threshold at the trough

export default function ProblemScene({ reduced }: { reduced: boolean }) {
	const mesh = useRef<THREE.InstancedMesh>(null);
	const group = useRef<THREE.Group>(null);
	const haloRefs = useRef<(THREE.Mesh | null)[]>([]);
	const wrote = useRef(false); // instance buffers written at least once
	const wasReduced = useRef(false);

	const atoms = useMemo(() => {
		const rnd = mulberry32(1789);
		// Second stream for scale and shade so the base layout (seed 1789)
		// is untouched by these additions.
		const rnd2 = mulberry32(4207);
		return Array.from({ length: N }, (_, i) => {
			const light = isU235(i, N, ASSAY.natural);
			const scaleJit = rnd2();
			const shadeMul = 0.75 + rnd2() * 0.25;
			return {
				base: new THREE.Vector3(
					(rnd() - 0.5) * 32,
					(rnd() - 0.5) * 19,
					(rnd() - 0.5) * 26,
				),
				amp: 0.1 + rnd() * 0.22,
				speed: 0.3 + rnd() * 0.6,
				phase: rnd() * Math.PI * 2,
				light,
				// U-238 varies 0.10–0.15 so the crowd feels organic, not stamped.
				scale: light ? 0.26 : 0.1 + scaleJit * 0.05,
				// Unlit flat color reads flat; per-atom darkening stands in for
				// the shading the old lit material provided.
				shade: new THREE.Color(C.u238).multiplyScalar(light ? 1 : shadeMul),
			};
		});
	}, []);

	// Halo positions for the rare fissile atoms, so they can be found at a glance.
	const lightAtoms = useMemo(() => atoms.filter((a) => a.light), [atoms]);
	const lightIndices = useMemo(
		() => atoms.map((a, i) => (a.light ? i : -1)).filter((i) => i >= 0),
		[atoms],
	);

	useFrame((state, dt) => {
		const m = mesh.current;
		if (!m) return;
		const t = state.clock.elapsedTime;

		// One shared pulse; reduced motion holds it at mid-pulse so the still
		// frame is representative, not caught at a trough.
		const s = reduced ? 0 : Math.sin(t * PULSE_SPEED);
		pulsed.copy(COL_U235).multiplyScalar(HDR_MID + HDR_SWING * s);

		// Under reduced motion the buffers are written once (or once more on
		// entering reduced, to settle at the mid-pulse pose) and then left alone.
		const settle = reduced && !wasReduced.current;
		wasReduced.current = reduced;

		if (!reduced || settle || !wrote.current) {
			const firstPass = !wrote.current || settle;
			for (let i = 0; i < N; i++) {
				const a = atoms[i];
				const drift = reduced ? 0 : Math.sin(t * a.speed + a.phase) * a.amp;
				dummy.position.set(
					a.base.x + drift,
					a.base.y + drift * 0.6,
					a.base.z - drift * 0.4,
				);
				dummy.scale.setScalar(a.scale);
				dummy.updateMatrix();
				m.setMatrixAt(i, dummy.matrix);
				// Heavy-atom colors are static; write them on the first full
				// pass only. The seven light ones are refreshed below.
				if (firstPass) m.setColorAt(i, a.shade);
			}
			for (let k = 0; k < lightIndices.length; k++) {
				m.setColorAt(lightIndices[k], pulsed);
			}
			m.instanceMatrix.needsUpdate = true;
			if (m.instanceColor) m.instanceColor.needsUpdate = true;
			wrote.current = true;
		}

		// Halos breathe in sync with the glow.
		const breathe = 1 + 0.12 * s;
		for (let k = 0; k < haloRefs.current.length; k++) {
			const h = haloRefs.current[k];
			if (h) h.scale.setScalar(breathe);
		}

		if (group.current && !reduced) group.current.rotation.y += dt * 0.022;
	});

	return (
		<>
			{/* No <Lighting/>: every material here is unlit, so lights and the
			    environment map would render to nothing. */}
			<group ref={group}>
				<instancedMesh
					ref={mesh}
					args={[undefined, undefined, N]}
					frustumCulled={false}
				>
					<icosahedronGeometry args={[1, 1]} />
					{/* Basic + toneMapped false so per-instance HDR colors pass
					    straight through to the bloom threshold test. */}
					<meshBasicMaterial toneMapped={false} />
				</instancedMesh>

				{lightAtoms.map((a, i) => (
					<mesh
						key={i}
						position={a.base}
						ref={(el) => {
							haloRefs.current[i] = el;
						}}
					>
						<sphereGeometry args={[0.72, 16, 16]} />
						<meshBasicMaterial
							color={C.u235}
							transparent
							opacity={0.12}
							depthWrite={false}
							blending={THREE.AdditiveBlending}
							toneMapped={false}
						/>
					</mesh>
				))}
			</group>
		</>
	);
}
