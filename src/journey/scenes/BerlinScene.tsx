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

export default function BerlinScene({ reduced }: { reduced: boolean }) {
	const mesh = useRef<THREE.InstancedMesh>(null);
	const freeMesh = useRef<THREE.InstancedMesh>(null);

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

	useFrame((state) => {
		if (!mesh.current || !freeMesh.current) return;

		const t = reduced ? 2.2 : state.clock.elapsedTime % PERIOD;

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

			const j = wobble * Math.sin(state.clock.elapsedTime * 3 + n.jitter);

			dummy.position.set(x + j, y + j * 0.7, z - j * 0.5);
			dummy.scale.setScalar(0.155);
			dummy.updateMatrix();
			mesh.current.setMatrixAt(i, dummy.matrix);
			mesh.current.setColorAt(i, n.proton ? PROTON : NEUTRON);
		}
		mesh.current.instanceMatrix.needsUpdate = true;
		if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;

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
				dummy.scale.setScalar(0.16);
			} else {
				dummy.position.set(0, -999, 0);
				dummy.scale.setScalar(0.0001);
			}
			dummy.updateMatrix();
			freeMesh.current.setMatrixAt(i, dummy.matrix);
		}
		freeMesh.current.instanceMatrix.needsUpdate = true;
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
				<meshStandardMaterial
					roughness={0.42}
					metalness={0.1}
					emissiveIntensity={0.25}
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
					emissiveIntensity={2.4}
					toneMapped={false}
				/>
			</instancedMesh>
		</>
	);
}
