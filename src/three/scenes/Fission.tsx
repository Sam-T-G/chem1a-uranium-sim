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
const CAPTURE_R = 0.34;
const MAX_NEUTRONS = 900;

const COL_U235 = new THREE.Color(C.u235);
const COL_U238 = new THREE.Color(C.u238);
const COL_SPENT = new THREE.Color("#1A1E27");

interface Neutron {
	p: THREE.Vector3;
	v: THREE.Vector3;
	alive: boolean;
	age: number;
}

function latticePos(i: number): [number, number, number] {
	const x = i % GRID;
	const y = Math.floor(i / GRID) % GRID;
	const z = Math.floor(i / (GRID * GRID));
	return [x * SPACING - HALF, y * SPACING - HALF, z * SPACING - HALF];
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
				const [x, y, z] = latticePos(i);
				const d = x * x + y * y + z * z;
				if (d < best) {
					best = d;
					seed = i;
				}
			}
			const [sx, sy, sz] = seed >= 0 ? latticePos(seed) : [0, 0, 0];
			neutrons.current.push({
				p: new THREE.Vector3(sx, sy, sz),
				v: new THREE.Vector3(1, 0.35, 0.6).normalize().multiplyScalar(3.4),
				alive: true,
				age: 0,
			});
		}
		onStats({ fissions: 0, neutrons: firing ? 1 : 0, generation: 0 });
	}, [firing, kinds, onStats]);

	useFrame((_, rawDt) => {
		const dt = Math.min(rawDt, 0.033);
		const nMesh = nucleiRef.current;
		const neuMesh = neutronRef.current;
		if (!nMesh || !neuMesh) return;

		// --- advance neutrons -------------------------------------------------
		if (firing && !reduced) {
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

				const [px, py, pz] = latticePos(idx);
				const dx = n.p.x - px;
				const dy = n.p.y - py;
				const dz = n.p.z - pz;
				if (dx * dx + dy * dy + dz * dz > CAPTURE_R * CAPTURE_R) continue;

				// Interaction.
				n.alive = false;
				alive.current[idx] = false;

				if (kinds[idx]) {
					// Fission: release 2 or 3 neutrons.
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
			const [x, y, z] = latticePos(i);
			dummy.position.set(x, y, z);
			const live = alive.current[i];
			dummy.scale.setScalar(live ? (kinds[i] ? 0.2 : 0.16) : 0.07);
			dummy.updateMatrix();
			nMesh.setMatrixAt(i, dummy.matrix);
			nMesh.setColorAt(i, live ? (kinds[i] ? COL_U235 : COL_U238) : COL_SPENT);
		}
		nMesh.instanceMatrix.needsUpdate = true;
		if (nMesh.instanceColor) nMesh.instanceColor.needsUpdate = true;

		// --- draw neutrons ----------------------------------------------------
		const list = neutrons.current;
		for (let i = 0; i < MAX_NEUTRONS; i++) {
			if (i < list.length) {
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
				<meshStandardMaterial
					roughness={0.35}
					metalness={0.15}
					emissiveIntensity={0.8}
					toneMapped={false}
				/>
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
					emissiveIntensity={2.2}
					toneMapped={false}
				/>
			</instancedMesh>
		</>
	);
}
