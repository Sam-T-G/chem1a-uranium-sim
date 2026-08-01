import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import type { ChapterId } from "./chapters";
import Effects from "../three/Effects";
import AdaptiveQuality from "../three/AdaptiveQuality";
import { DPR } from "../theme";
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
	oakridge: [0, 4.2, 20],
	line: [3.4, 1.1, 11.5],
	handoff: [0, 2.2, 8.4],
	sources: [0, 2.2, 9.6],
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
		case "sources":
			return <Ore reduced={reduced} />;
	}
}

/**
 * Eases the camera between chapter framings, with a whisper of pointer
 * parallax so the scenes feel inhabited rather than printed. The parallax
 * moves the look-target, not the camera, so framing stays intact.
 */
function CameraRig({ chapter, reduced }: { chapter: ChapterId; reduced: boolean }) {
	const target = useRef(new THREE.Vector3(...VIEWS[chapter]));
	const look = useRef(new THREE.Vector3(0, 0, 0));
	const { camera } = useThree();

	useEffect(() => {
		target.current.set(...VIEWS[chapter]);
		if (reduced) camera.position.copy(target.current);
	}, [chapter, camera, reduced]);

	useFrame((state, dt) => {
		if (reduced) return;
		camera.position.lerp(target.current, Math.min(1, dt * 1.7));
		look.current.x += (state.pointer.x * 0.55 - look.current.x) * Math.min(1, dt * 2.2);
		look.current.y += (state.pointer.y * 0.3 - look.current.y) * Math.min(1, dt * 2.2);
		camera.lookAt(look.current);
	});

	return null;
}

export default function JourneyCanvas({
	chapter,
	reduced,
	eventSource,
}: {
	chapter: ChapterId;
	reduced: boolean;
	/** The scroll overlay sits above the canvas, so pointer events for the
	    parallax have to be sourced from the root element instead. */
	eventSource: React.RefObject<HTMLElement | null>;
}) {
	return (
		<Canvas
			dpr={DPR}
			camera={{ position: VIEWS.intro, fov: 42 }}
			// Anti-aliasing comes from the composer's multisampling; asking the
			// default framebuffer for it too allocates and resolves a second MSAA
			// buffer that only ever receives the final full-screen quad.
			gl={{ antialias: false }}
			// Under reduced motion every scene here is a still, so idle frames are
			// pure waste. R3F invalidates on mount and on React updates, which is
			// exactly when these scenes change.
			frameloop={reduced ? "demand" : "always"}
			eventSource={eventSource as React.RefObject<HTMLElement>}
			eventPrefix="client"
			onCreated={({ gl }) => {
				// Transmission re-renders the scene into an offscreen target every
				// frame. It is refractive blur, so half resolution is free quality.
				gl.transmissionResolutionScale = 0.5;
			}}
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
			<Effects />
			<AdaptiveQuality />
		</Canvas>
	);
}
