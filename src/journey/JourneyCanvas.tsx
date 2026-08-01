import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import type { ChapterId } from "./chapters";
import IntroScene from "./scenes/IntroScene";
import GlassScene from "./scenes/GlassScene";
import NameScene from "./scenes/NameScene";
import BerlinScene from "./scenes/BerlinScene";
import ProblemScene from "./scenes/ProblemScene";
import OakRidgeScene from "./scenes/OakRidgeScene";
import LineScene from "./scenes/LineScene";
import Ore from "../three/scenes/Ore";

/**
 * Per-chapter camera. The handoff chapter deliberately uses the same framing as
 * stage 01 of the simulation, so crossing over is a change of interface rather
 * than a cut to somewhere new.
 */
const VIEWS: Record<ChapterId, [number, number, number]> = {
	intro: [0, 0.9, 6.6],
	glass: [0, 0.9, 12.4],
	name: [0, 0.8, 9.2],
	berlin: [0, 1.0, 9.0],
	problem: [0, 0, 12],
	oakridge: [0, 6.5, 21],
	line: [3.4, 1.1, 11.5],
	handoff: [0, 2.2, 8.4],
};

function Scene({ id, reduced }: { id: ChapterId; reduced: boolean }) {
	switch (id) {
		case "intro":
			return <IntroScene reduced={reduced} />;
		case "glass":
			return <GlassScene reduced={reduced} />;
		case "name":
			return <NameScene reduced={reduced} />;
		case "berlin":
			return <BerlinScene reduced={reduced} />;
		case "problem":
			return <ProblemScene reduced={reduced} />;
		case "oakridge":
			return <OakRidgeScene reduced={reduced} />;
		case "line":
			return <LineScene reduced={reduced} />;
		case "handoff":
			return <Ore reduced={reduced} />;
	}
}

/** Eases the camera between chapter framings instead of cutting. */
function CameraRig({ chapter, reduced }: { chapter: ChapterId; reduced: boolean }) {
	const target = useRef(new THREE.Vector3(...VIEWS[chapter]));
	const { camera } = useThree();

	useEffect(() => {
		target.current.set(...VIEWS[chapter]);
		if (reduced) camera.position.copy(target.current);
	}, [chapter, camera, reduced]);

	useFrame((_, dt) => {
		if (reduced) return;
		camera.position.lerp(target.current, Math.min(1, dt * 1.7));
		camera.lookAt(0, 0, 0);
	});

	return null;
}

export default function JourneyCanvas({
	chapter,
	reduced,
}: {
	chapter: ChapterId;
	reduced: boolean;
}) {
	return (
		<Canvas
			dpr={[1, 2]}
			camera={{ position: VIEWS.intro, fov: 42 }}
			gl={{ antialias: true }}
		>
			<color attach="background" args={["#0B0E14"]} />
			<fog attach="fog" args={["#0B0E14", 16, 52]} />
			<Suspense fallback={null}>
				{/* Keyed so each chapter's scene mounts clean rather than
				    inheriting the previous one's animation state. */}
				<group key={chapter}>
					<Scene id={chapter} reduced={reduced} />
				</group>
			</Suspense>
			<CameraRig chapter={chapter} reduced={reduced} />
		</Canvas>
	);
}
