import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../../theme";
import { Lighting, dummy, isU235 } from "../shared";

/**
 * Chain reaction in a lattice of nuclei.
 *
 * The lattice is populated at the selected assay, so raising or lowering
 * enrichment changes what actually happens: a neutron that reaches U-235 causes
 * fission and releases more neutrons, while one that reaches U-238 is captured
 * and the branch ends there. At natural abundance almost every neutron is
 * absorbed by U-238 within a few generations and the reaction dies. At reactor
 * assay it just sustains. At weapons assay it runs away.
 *
 * Geometry, cross-sections and moderation are not modelled. This shows the
 * branching logic that enrichment controls, not a neutronics calculation.
 */

const GRID = 7;
const SPACING = 1.15;
const N_NUCLEI = GRID * GRID * GRID;
const HALF = ((GRID - 1) / 2) * SPACING;
// Interaction radius, not a cross-section. It applies to U-235 and U-238
// identically, so raising it does not tilt the outcome toward either: it only
// cuts how often a neutron threads between sites and leaks out of a lattice
// this small. Geometric leakage is real, but at 7³ sites it was drowning the
// assay signal the scene exists to show.
const CAPTURE_R = 0.46;
const MAX_NEUTRONS = 900;
const MAX_FLASH = 64;
const FLASH_LIFE = 0.45;

// The nuclei draw with an unlit material and HDR instance colours, so glow is
// per-instance: live U-235 sits past 1.0 and blooms softly, live U-238 stays
// LDR and matte, and spent sites drop to near-background so the burn front
// reads as the lattice going dark behind the flashes.
const COL_U235 = new THREE.Color(C.u235).multiplyScalar(1.9);
const COL_U238 = new THREE.Color(C.u238);
const COL_SPENT = new THREE.Color("#141821");
const COL_FLASH = new THREE.Color("#FFFFFF");
const flashCol = new THREE.Color();

interface Neutron {
	p: THREE.Vector3;
	v: THREE.Vector3;
	alive: boolean;
	age: number;
}

interface Flash {
	x: number;
	y: number;
	z: number;
	age: number;
}

/**
 * Lattice site positions, computed once. The draw loop touches all 343 sites
 * every frame, so returning a fresh tuple per call was allocating thousands of
 * short-lived arrays a second for values that never change.
 */
const LATTICE = new Float32Array(N_NUCLEI * 3);
for (let i = 0; i < N_NUCLEI; i++) {
	LATTICE[i * 3] = (i % GRID) * SPACING - HALF;
	LATTICE[i * 3 + 1] = (Math.floor(i / GRID) % GRID) * SPACING - HALF;
	LATTICE[i * 3 + 2] = Math.floor(i / (GRID * GRID)) * SPACING - HALF;
}

export default function Fission({
	assay,
	firing,
	reduced,
	onStats,
}: {
	assay: number;
	firing: boolean;
	reduced: boolean;
	onStats: (s: { fissions: number; neutrons: number; generation: number }) => void;
}) {
	const nucleiRef = useRef<THREE.InstancedMesh>(null);
	const neutronRef = useRef<THREE.InstancedMesh>(null);
	const flashRef = useRef<THREE.InstancedMesh>(null);

	// Fixed pool of fission flashes, reused as a ring buffer. At weapons assay
	// more than 64 can fire inside one flash lifetime; the oldest gets
	// overwritten, which is exactly when nobody could count them anyway.
	const flashPool = useMemo<Flash[]>(
		() =>
			Array.from({ length: MAX_FLASH }, () => ({ x: 0, y: 0, z: 0, age: FLASH_LIFE })),
		[],
	);
	const flashHead = useRef(0);

	// Nucleus identity is fixed by the assay; `alive` resets on each run.
	const kinds = useMemo(
		() => Array.from({ length: N_NUCLEI }, (_, i) => isU235(i, N_NUCLEI, assay)),
		[assay],
	);
	const alive = useRef<boolean[]>(kinds.map(() => true));
	const neutrons = useRef<Neutron[]>([]);
	const stats = useRef({ fissions: 0, generation: 0 });
	const emit = useRef(0);

	// Reset and seed a starting neutron whenever the run is armed or the assay changes.
	useEffect(() => {
		alive.current = kinds.map(() => true);
		neutrons.current = [];
		stats.current = { fissions: 0, generation: 0 };
		for (const f of flashPool) f.age = FLASH_LIFE;
		flashHead.current = 0;

		if (firing) {
			// Seed on the fissile site nearest the centre so the run always begins
			// with one induced fission. Otherwise the outcome would turn on whether
			// a single arbitrary lattice site happened to be U-235, which says
			// nothing about the assay. What the assay decides is whether that first
			// fission propagates, and that is what this scene is here to show.
			let seed = -1;
			let best = Infinity;
			for (let i = 0; i < N_NUCLEI; i++) {
				if (!kinds[i]) continue;
				const x = LATTICE[i * 3];
				const y = LATTICE[i * 3 + 1];
				const z = LATTICE[i * 3 + 2];
				const d = x * x + y * y + z * z;
				if (d < best) {
					best = d;
					seed = i;
				}
			}
			const sx = seed >= 0 ? LATTICE[seed * 3] : 0;
			const sy = seed >= 0 ? LATTICE[seed * 3 + 1] : 0;
			const sz = seed >= 0 ? LATTICE[seed * 3 + 2] : 0;
			neutrons.current.push({
				p: new THREE.Vector3(sx, sy, sz),
				v: new THREE.Vector3(1, 0.35, 0.6).normalize().multiplyScalar(3.4),
				alive: true,
				age: 0,
			});
		}
		onStats({ fissions: 0, neutrons: firing ? 1 : 0, generation: 0 });
	}, [firing, kinds, onStats, flashPool]);

	useFrame((_, rawDt) => {
		const dt = Math.min(rawDt, 0.033);
		const nMesh = nucleiRef.current;
		const neuMesh = neutronRef.current;
		if (!nMesh || !neuMesh) return;

		// --- advance neutrons -------------------------------------------------
		// Runs under reduced motion too. Freezing it here left the readout stuck
		// on one neutron and the verdict permanently reading "Propagating.",
		// which is worse than showing the result without the animation.
		if (firing) {
			const spawned: Neutron[] = [];
			for (const n of neutrons.current) {
				if (!n.alive) continue;
				n.age += dt;
				n.p.addScaledVector(n.v, dt);

				// Leakage: a neutron that leaves the assembly is gone.
				const bound = HALF + SPACING;
				if (
					Math.abs(n.p.x) > bound ||
					Math.abs(n.p.y) > bound ||
					Math.abs(n.p.z) > bound
				) {
					n.alive = false;
					continue;
				}

				// Nearest lattice site, O(1).
				const ix = Math.round((n.p.x + HALF) / SPACING);
				const iy = Math.round((n.p.y + HALF) / SPACING);
				const iz = Math.round((n.p.z + HALF) / SPACING);
				if (ix < 0 || ix >= GRID || iy < 0 || iy >= GRID || iz < 0 || iz >= GRID)
					continue;

				const idx = ix + iy * GRID + iz * GRID * GRID;
				if (!alive.current[idx]) continue;

				const px = LATTICE[idx * 3];
				const py = LATTICE[idx * 3 + 1];
				const pz = LATTICE[idx * 3 + 2];
				const dx = n.p.x - px;
				const dy = n.p.y - py;
				const dz = n.p.z - pz;
				if (dx * dx + dy * dy + dz * dz > CAPTURE_R * CAPTURE_R) continue;

				// Interaction.
				n.alive = false;
				alive.current[idx] = false;

				if (kinds[idx]) {
					// Fission: release 2 or 3 neutrons, and a flash at the site.
					const f = flashPool[flashHead.current];
					f.x = px;
					f.y = py;
					f.z = pz;
					f.age = 0;
					flashHead.current = (flashHead.current + 1) % MAX_FLASH;

					stats.current.fissions += 1;
					stats.current.generation = Math.max(
						stats.current.generation,
						Math.ceil(n.age * 2.2),
					);
					const count = Math.random() < 0.6 ? 3 : 2;
					if (neutrons.current.length + spawned.length < MAX_NEUTRONS) {
						for (let k = 0; k < count; k++) {
							const dir = new THREE.Vector3(
								Math.random() * 2 - 1,
								Math.random() * 2 - 1,
								Math.random() * 2 - 1,
							);
							if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0);
							dir.normalize().multiplyScalar(2.8 + Math.random() * 1.4);
							spawned.push({
								p: new THREE.Vector3(px, py, pz),
								v: dir,
								alive: true,
								age: n.age,
							});
						}
					}
				}
				// U-238: captured, no new neutrons. The branch simply ends.
			}
			neutrons.current = neutrons.current.filter((n) => n.alive).concat(spawned);

			emit.current += dt;
			if (emit.current > 0.15) {
				emit.current = 0;
				onStats({
					fissions: stats.current.fissions,
					neutrons: neutrons.current.length,
					generation: stats.current.generation,
				});
			}
		}

		// --- draw nuclei ------------------------------------------------------
		for (let i = 0; i < N_NUCLEI; i++) {
			dummy.position.set(LATTICE[i * 3], LATTICE[i * 3 + 1], LATTICE[i * 3 + 2]);
			const live = alive.current[i];
			dummy.scale.setScalar(live ? (kinds[i] ? 0.2 : 0.16) : 0.07);
			dummy.updateMatrix();
			nMesh.setMatrixAt(i, dummy.matrix);
			nMesh.setColorAt(i, live ? (kinds[i] ? COL_U235 : COL_U238) : COL_SPENT);
		}
		nMesh.instanceMatrix.needsUpdate = true;
		if (nMesh.instanceColor) nMesh.instanceColor.needsUpdate = true;

		// --- draw neutrons ----------------------------------------------------
		// Under reduced motion the run still advances (so the counters and the
		// lattice burn-down stay truthful), but the neutrons themselves are
		// parked: the state changes, nothing flies across the screen.
		const list = neutrons.current;
		for (let i = 0; i < MAX_NEUTRONS; i++) {
			if (i < list.length && !reduced) {
				dummy.position.copy(list[i].p);
				dummy.scale.setScalar(0.075);
			} else {
				dummy.position.set(0, -9999, 0);
				dummy.scale.setScalar(0.0001);
			}
			dummy.updateMatrix();
			neuMesh.setMatrixAt(i, dummy.matrix);
		}
		neuMesh.instanceMatrix.needsUpdate = true;

		// --- draw fission flashes ---------------------------------------------
		// Each flash is a short-lived expanding sphere, additive so fading the
		// colour to black fades the flash out. The peak is deliberately modest
		// and ramped in over ~0.1s rather than switched on: at weapons assay
		// dozens overlap per second, and instantaneous full-brightness onsets
		// stacking like that is exactly the strobing pattern to avoid.
		// Dead flashes park far below the scene.
		const fMesh = flashRef.current;
		if (fMesh) {
			for (let i = 0; i < MAX_FLASH; i++) {
				const f = flashPool[i];
				if (firing && !reduced && f.age < FLASH_LIFE) f.age += dt;
				if (!reduced && f.age < FLASH_LIFE) {
					dummy.position.set(f.x, f.y, f.z);
					dummy.scale.setScalar(0.3 + f.age * 3.6);
					dummy.updateMatrix();
					fMesh.setMatrixAt(i, dummy.matrix);
					const rampIn = Math.min(f.age / 0.1, 1);
					flashCol
						.copy(COL_FLASH)
						.multiplyScalar(1.5 * rampIn * (1 - f.age / FLASH_LIFE));
					fMesh.setColorAt(i, flashCol);
				} else {
					dummy.position.set(0, -9999, 0);
					dummy.scale.setScalar(0.0001);
					dummy.updateMatrix();
					fMesh.setMatrixAt(i, dummy.matrix);
				}
			}
			fMesh.instanceMatrix.needsUpdate = true;
			if (fMesh.instanceColor) fMesh.instanceColor.needsUpdate = true;
		}
	});

	return (
		<>
			<Lighting />
			<instancedMesh
				ref={nucleiRef}
				args={[undefined, undefined, N_NUCLEI]}
				frustumCulled={false}
			>
				<icosahedronGeometry args={[1, 1]} />
				{/*
					Unlit on purpose: instanced materials share one emissive colour,
					so per-instance glow has to live in the instance colours. HDR
					colours past 1.0 bloom; the rest stay flat.
				*/}
				<meshBasicMaterial toneMapped={false} />
			</instancedMesh>

			<instancedMesh
				ref={neutronRef}
				args={[undefined, undefined, MAX_NEUTRONS]}
				frustumCulled={false}
			>
				<sphereGeometry args={[1, 8, 8]} />
				<meshStandardMaterial
					color={C.neutron}
					emissive={C.neutron}
					emissiveIntensity={3.4}
					toneMapped={false}
				/>
			</instancedMesh>

			<instancedMesh
				ref={flashRef}
				args={[undefined, undefined, MAX_FLASH]}
				frustumCulled={false}
			>
				<sphereGeometry args={[1, 12, 12]} />
				<meshBasicMaterial
					toneMapped={false}
					transparent
					depthWrite={false}
					blending={THREE.AdditiveBlending}
				/>
			</instancedMesh>
		</>
	);
}
