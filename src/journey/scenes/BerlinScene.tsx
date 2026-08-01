import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../../theme";
import { Lighting, dummy, mulberry32 } from "../../three/shared";

/**
 * Meitner's liquid-drop picture, on a loop.
 *
 * A nucleus takes a neutron, wobbles, stretches, pinches at the waist and comes
 * apart into two unequal fragments. Unequal on purpose: fission products follow
 * a distribution and the barium/krypton split that gave Hahn and Strassmann
 * their impossible result is one common outcome, not the only one.
 */

const N_NUCLEONS = 150;
// Fragments have cleared the frame by the end of this, so the loop restarts
// off-screen and the reset is never seen.
const PERIOD = 6.2;

const PROTON = new THREE.Color("#E86A5A");
const NEUTRON = new THREE.Color("#8FA6C4");
const FREE_N = new THREE.Color(C.neutron);

// Trail behind the incoming neutron: a short ring buffer of recent positions.
// HDR instance colour past 1.0 so the head of the trail catches bloom.
const TRAIL_N = 7;
const TRAIL_DT = 0.045; // seconds between samples; ~1.2 world units of trail
const TRAIL_HDR = new THREE.Color(C.neutron).multiplyScalar(1.6);

// Scission flash timing. The light is theatrical: scission releases ~170 MeV
// per event, which at this scale would light nothing. It marks the moment,
// it does not model it.
const FLASH_T0 = 4.0;
const FLASH_PEAK = 4.35;
const FLASH_T1 = 4.9;
const FLASH_MAX = 110;
const RING_T0 = 4.15;
const RING_DUR = 1.05;

export default function BerlinScene({ reduced }: { reduced: boolean }) {
	const mesh = useRef<THREE.InstancedMesh>(null);
	const freeMesh = useRef<THREE.InstancedMesh>(null);
	const trailMesh = useRef<THREE.InstancedMesh>(null);
	const flashLight = useRef<THREE.PointLight>(null);
	const ring = useRef<THREE.Mesh>(null);
	const ringMat = useRef<THREE.MeshBasicMaterial>(null);

	// Each nucleon gets a home offset inside the drop and a side allegiance that
	// decides which fragment it leaves with.
	const nucleons = useMemo(() => {
		const rnd = mulberry32(4242);
		return Array.from({ length: N_NUCLEONS }, (_, i) => {
			// Even sampling inside a sphere.
			const u = rnd() * 2 - 1;
			const phi = rnd() * Math.PI * 2;
			const r = Math.cbrt(rnd()) * 1.05;
			const s = Math.sqrt(1 - u * u);
			const home = new THREE.Vector3(
				r * s * Math.cos(phi),
				r * u,
				r * s * Math.sin(phi),
			);
			return {
				home,
				// Split 59/41 so the fragments come out visibly unequal.
				heavy: home.x < 0.16,
				proton: i % 5 === 0,
				jitter: rnd() * Math.PI * 2,
			};
		});
	}, []);

	const FREE_MAX = 3;
	const freeDirs = useMemo(() => {
		const rnd = mulberry32(99);
		return Array.from({ length: FREE_MAX }, () =>
			new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1)
				.normalize()
				.multiplyScalar(1),
		);
	}, []);

	// Trail state. Positions live in a fixed pool; nothing allocates per frame.
	const trail = useMemo(
		() =>
			Array.from({ length: TRAIL_N }, () => new THREE.Vector3(0, -999, 0)),
		[],
	);
	const trailHead = useRef(0);
	const lastSample = useRef(-1);
	const prevT = useRef(0);
	const trailTinted = useRef(false);
	const nucleonsTinted = useRef(false);

	useFrame((state) => {
		if (!mesh.current || !freeMesh.current || !trailMesh.current) return;

		const t = reduced ? 2.2 : state.clock.elapsedTime % PERIOD;
		// Frozen phase under reduced motion so the wobble pose is static.
		const tw = reduced ? 2.2 : state.clock.elapsedTime;

		// Phase map:
		//  0.0-1.4  incoming neutron approaches
		//  1.4-2.6  absorbed, drop wobbles
		//  2.6-4.0  elongates
		//  4.0-4.6  pinches and separates
		//  4.6-6.2  fragments and released neutrons fly clear of the frame
		let elongate = 0;
		let separation = 0;
		let wobble = 0;

		if (t < 1.4) {
			wobble = 0.03;
		} else if (t < 2.6) {
			const k = (t - 1.4) / 1.2;
			wobble = 0.03 + Math.sin(k * Math.PI) * 0.16;
		} else if (t < 4.0) {
			const k = (t - 2.6) / 1.4;
			elongate = k * k;
			wobble = 0.08;
		} else if (t < 4.6) {
			elongate = 1;
			separation = ((t - 4.0) / 0.6) ** 2 * 0.9;
			wobble = 0.05;
		} else {
			elongate = 1;
			separation = 0.9 + (t - 4.6) * 1.5;
			wobble = 0.03;
		}

		for (let i = 0; i < N_NUCLEONS; i++) {
			const n = nucleons[i];
			const side = n.heavy ? -1 : 1;

			// Stretch along x, squeeze the waist.
			const x =
				n.home.x * (1 + elongate * 0.85) + side * separation * (1.1 + elongate);
			const waist = 1 - elongate * 0.32 * (1 - Math.min(Math.abs(n.home.x), 1));
			const y = n.home.y * waist;
			const z = n.home.z * waist;

			const j = wobble * Math.sin(tw * 3 + n.jitter);

			dummy.position.set(x + j, y + j * 0.7, z - j * 0.5);
			dummy.scale.setScalar(0.155);
			dummy.updateMatrix();
			mesh.current.setMatrixAt(i, dummy.matrix);
		}
		mesh.current.instanceMatrix.needsUpdate = true;

		// Nucleon identity never changes, so its colours are written once rather
		// than re-uploaded 150 at a time every frame.
		if (!nucleonsTinted.current) {
			for (let i = 0; i < N_NUCLEONS; i++) {
				mesh.current.setColorAt(i, nucleons[i].proton ? PROTON : NEUTRON);
			}
			if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
			nucleonsTinted.current = true;
		}

		// The incoming neutron, then the released ones.
		for (let i = 0; i < FREE_MAX; i++) {
			if (t < 1.4) {
				// One neutron flying in from the left.
				if (i === 0) {
					const k = t / 1.4;
					dummy.position.set(-7 + k * 6.1, 0.35 * (1 - k), 0.2 * (1 - k));
					dummy.scale.setScalar(0.16);
				} else {
					dummy.position.set(0, -999, 0);
					dummy.scale.setScalar(0.0001);
				}
			} else if (t > 4.6) {
				const k = t - 4.6;
				dummy.position.copy(freeDirs[i]).multiplyScalar(1.4 + k * 4.2);
				dummy.scale.setScalar(0.19);
			} else {
				dummy.position.set(0, -999, 0);
				dummy.scale.setScalar(0.0001);
			}
			dummy.updateMatrix();
			freeMesh.current.setMatrixAt(i, dummy.matrix);
		}
		freeMesh.current.instanceMatrix.needsUpdate = true;

		// --- Trail behind the incoming neutron -------------------------------
		if (!trailTinted.current) {
			for (let i = 0; i < TRAIL_N; i++) trailMesh.current.setColorAt(i, TRAIL_HDR);
			if (trailMesh.current.instanceColor)
				trailMesh.current.instanceColor.needsUpdate = true;
			trailTinted.current = true;
		}

		// Loop wrapped: clear the buffer so the trail never smears from the
		// nucleus back to the left edge.
		if (t < prevT.current) {
			for (let i = 0; i < TRAIL_N; i++) trail[i].set(0, -999, 0);
			lastSample.current = -1;
		}
		prevT.current = t;

		if (!reduced && t < 1.4) {
			if (lastSample.current < 0 || t - lastSample.current >= TRAIL_DT) {
				const k = t / 1.4;
				trail[trailHead.current].set(
					-7 + k * 6.1,
					0.35 * (1 - k),
					0.2 * (1 - k),
				);
				trailHead.current = (trailHead.current + 1) % TRAIL_N;
				lastSample.current = t;
			}
		}

		// Newest sample largest, shrinking toward the tail. After absorption the
		// whole trail collapses over a quarter second rather than blinking out.
		const trailFade = t < 1.4 ? 1 : Math.max(0, 1 - (t - 1.4) / 0.25);
		for (let k = 0; k < TRAIL_N; k++) {
			const p = trail[(trailHead.current - 1 - k + TRAIL_N * 2) % TRAIL_N];
			const s =
				reduced || trailFade <= 0 || p.y < -100
					? 0.0001
					: (0.12 - (0.09 * k) / (TRAIL_N - 1)) * trailFade;
			dummy.position.copy(p);
			dummy.scale.setScalar(s);
			dummy.updateMatrix();
			trailMesh.current.setMatrixAt(k, dummy.matrix);
		}
		trailMesh.current.instanceMatrix.needsUpdate = true;

		// --- Scission flash and shockwave ring -------------------------------
		if (flashLight.current) {
			let flash = 0;
			if (!reduced && t >= FLASH_T0 && t < FLASH_T1) {
				if (t < FLASH_PEAK) {
					const k = (t - FLASH_T0) / (FLASH_PEAK - FLASH_T0);
					flash = FLASH_MAX * k * k;
				} else {
					flash = FLASH_MAX * Math.exp(-(t - FLASH_PEAK) * 9);
				}
			}
			flashLight.current.intensity = flash;
		}

		if (ring.current && ringMat.current) {
			if (!reduced && t >= RING_T0 && t < RING_T0 + RING_DUR) {
				const k = (t - RING_T0) / RING_DUR;
				// Ease-out expansion: fast at scission, coasting as it fades.
				const ease = 1 - (1 - k) * (1 - k);
				ring.current.visible = true;
				ring.current.scale.setScalar(0.3 + 3.9 * ease);
				ringMat.current.opacity = 0.55 * (1 - k);
			} else {
				ring.current.visible = false;
			}
		}
	});

	return (
		<>
			<Lighting />
			<instancedMesh
				ref={mesh}
				args={[undefined, undefined, N_NUCLEONS]}
				frustumCulled={false}
			>
				<sphereGeometry args={[1, 12, 12]} />
				{/*
					White emissive well under the bloom threshold: it lifts the shadowed
					side of the drop so the sphere reads as a volume, without glowing.
					During the flash the point light pushes lit faces past 1.0 and the
					drop blooms for that beat only.
				*/}
				<meshStandardMaterial
					roughness={0.42}
					metalness={0.1}
					emissive="#FFFFFF"
					emissiveIntensity={0.18}
					toneMapped={false}
				/>
			</instancedMesh>

			<instancedMesh
				ref={freeMesh}
				args={[undefined, undefined, FREE_MAX]}
				frustumCulled={false}
			>
				<sphereGeometry args={[1, 12, 12]} />
				<meshStandardMaterial
					color={FREE_N}
					emissive={FREE_N}
					emissiveIntensity={3.2}
					toneMapped={false}
				/>
			</instancedMesh>

			<instancedMesh
				ref={trailMesh}
				args={[undefined, undefined, TRAIL_N]}
				frustumCulled={false}
			>
				<sphereGeometry args={[1, 8, 8]} />
				<meshBasicMaterial toneMapped={false} />
			</instancedMesh>

			{/* Scission flash. Intensity is driven per frame; parked at zero. */}
			<pointLight
				ref={flashLight}
				position={[0, 0, 0]}
				intensity={0}
				color="#CFE8FF"
			/>

			{/*
				Expanding ring at the scission point, tilted a touch off the camera
				axis so it reads as a ring in space rather than a screen overlay.
			*/}
			<mesh ref={ring} visible={false} rotation={[-0.12, 0.35, 0]}>
				<torusGeometry args={[1, 0.02, 8, 64]} />
				<meshBasicMaterial
					ref={ringMat}
					color="#BFE2FF"
					toneMapped={false}
					transparent
					opacity={0}
					depthWrite={false}
				/>
			</mesh>
		</>
	);
}
