import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { ASSAY, C, DPR } from "./theme";
import { STAGES } from "./data/stages";
import { assayAtStage, STAGE_ORDER, useSim, type StageId } from "./store";

import Ore from "./three/scenes/Ore";
import Milling from "./three/scenes/Milling";
import Conversion from "./three/scenes/Conversion";
import Enrichment from "./three/scenes/Enrichment";
import Fabrication from "./three/scenes/Fabrication";
import Fission from "./three/scenes/Fission";

import AssayLadder, { AssayChip } from "./ui/AssayLadder";
import ProcessRail from "./ui/ProcessRail";
import { EnrichmentControls, FissionControls } from "./ui/Controls";
import Journey from "./journey/Journey";
import Effects from "./three/Effects";
import AdaptiveQuality from "./three/AdaptiveQuality";
import { inline } from "./ui/Cite";
import { Equation, sci } from "./ui/Sci";
import WorksCited from "./ui/WorksCited";

/**
 * Boot veil over the first paint: the monogram holds while fonts and the GL
 * context settle, then the whole thing dissolves. Removed from the DOM once
 * the fade finishes so it costs nothing afterward.
 */
function Boot() {
	const [phase, setPhase] = useState<"hold" | "fade" | "gone">("hold");

	useEffect(() => {
		const t1 = window.setTimeout(() => setPhase("fade"), 900);
		const t2 = window.setTimeout(() => setPhase("gone"), 1800);
		return () => {
			window.clearTimeout(t1);
			window.clearTimeout(t2);
		};
	}, []);

	if (phase === "gone") return null;
	return (
		<div className={`boot${phase === "fade" ? " is-fading" : ""}`} aria-hidden="true">
			<div className="boot-mark">
				<sup>235</sup>U
			</div>
			<div className="boot-line" />
			<div className="boot-label">An element report</div>
		</div>
	);
}

/** Camera framing per stage, since the scenes differ a lot in scale. */
const VIEWS: Record<
	StageId,
	{ pos: [number, number, number]; target: [number, number, number] }
> = {
	ore: { pos: [0, 2.2, 8.4], target: [0, 0, 0] },
	milling: { pos: [0.5, 2.8, 14], target: [-0.4, -0.4, 0] },
	conversion: { pos: [0, 1.1, 11.6], target: [0, 0, 0] },
	enrichment: { pos: [5.2, 1.6, 14.5], target: [0, 0, 0] },
	fabrication: { pos: [1.0, 1.2, 17], target: [-0.8, 0.2, 0] },
	fission: { pos: [12, 8, 13.5], target: [0, 0, 0] },
};

const LEGENDS: Partial<Record<StageId, { dot: string; text: string }[]>> = {
	ore: [
		{ dot: C.u235, text: "U-235 · 1 in 139" },
		{ dot: C.u238, text: "U-238 · everything else" },
	],
	conversion: [
		{ dot: C.u235, text: "^{235}UF_{6} · 349.03 g/mol" },
		{ dot: C.u238, text: "^{238}UF_{6} · 352.04 g/mol" },
	],
	enrichment: [
		{ dot: C.u235, text: "U-235 · drifts toward the axis" },
		{ dot: C.u238, text: "U-238 · driven to the wall" },
		{ dot: C.cake, text: "cascade · lit by separative work" },
	],
	fission: [
		{ dot: C.u235, text: "U-235 · fissions" },
		{ dot: C.u238, text: "U-238 · captures, branch ends" },
		{ dot: C.neutron, text: "free neutron" },
	],
};

function CameraRig({ stage }: { stage: StageId }) {
	const ref = useRef<OrbitControlsImpl>(null);

	useEffect(() => {
		const c = ref.current;
		if (!c) return;
		const v = VIEWS[stage];
		c.object.position.set(...v.pos);
		c.target.set(...v.target);
		c.update();
	}, [stage]);

	return (
		<OrbitControls
			ref={ref}
			enablePan={false}
			minDistance={4}
			maxDistance={26}
			enableDamping
			dampingFactor={0.08}
		/>
	);
}

export default function App() {
	const mode = useSim((s) => s.mode);
	const setReducedMotion = useSim((s) => s.setReducedMotion);

	// Detected once at the root so both the journey and the simulation honour it.
	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		const apply = () => setReducedMotion(mq.matches);
		apply();
		mq.addEventListener("change", apply);
		return () => mq.removeEventListener("change", apply);
	}, [setReducedMotion]);

	return (
		<>
			<Boot />
			{mode === "journey" ? <Journey /> : <Simulation />}
		</>
	);
}

function Simulation() {
	const stage = useSim((s) => s.stage);
	const rawAssay = useSim((s) => s.assay);
	const spinning = useSim((s) => s.spinning);
	const firing = useSim((s) => s.firing);
	const reduced = useSim((s) => s.reducedMotion);
	const setMode = useSim((s) => s.setMode);
	const next = useSim((s) => s.next);
	const prev = useSim((s) => s.prev);

	// Mirror of the journey's exit: cross-fade back into the story.
	const backToStory = useCallback(() => {
		const go = () => setMode("journey");
		if (!reduced && "startViewTransition" in document) {
			(
				document as Document & { startViewTransition: (cb: () => void) => void }
			).startViewTransition(go);
		} else go();
	}, [setMode, reduced]);

	const info = STAGES[stage];
	const shownAssay = assayAtStage(stage, rawAssay);

	const [fissionStats, setFissionStats] = useState({
		fissions: 0,
		neutrons: 0,
		generation: 0,
	});
	// Stable identity: Fission resets its lattice whenever this callback changes.
	const onStats = useCallback(
		(s: { fissions: number; neutrons: number; generation: number }) =>
			setFissionStats(s),
		[],
	);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			// Leave arrow keys alone while the assay slider has focus.
			if (document.activeElement instanceof HTMLInputElement) return;
			if (e.key === "ArrowRight") next();
			if (e.key === "ArrowLeft") prev();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [next, prev]);

	const legend = LEGENDS[stage];

	const scene = useMemo(() => {
		switch (stage) {
			case "ore":
				return <Ore reduced={reduced} />;
			case "milling":
				return <Milling reduced={reduced} />;
			case "conversion":
				return <Conversion reduced={reduced} />;
			case "enrichment":
				return <Enrichment assay={rawAssay} spinning={spinning} reduced={reduced} />;
			case "fabrication":
				return <Fabrication assay={rawAssay} reduced={reduced} />;
			case "fission":
				return (
					<Fission
						assay={rawAssay}
						firing={firing}
						reduced={reduced}
						onStats={onStats}
					/>
				);
		}
	}, [stage, rawAssay, spinning, firing, reduced, onStats]);

	const preEnrichment =
		STAGE_ORDER.indexOf(stage) < STAGE_ORDER.indexOf("enrichment");

	return (
		<div className="app">
			<header className="head">
				<button
					type="button"
					className="head-back"
					onClick={backToStory}
					aria-label="Back to the story"
				>
					←
				</button>
				<div className="head-mark">
					<sup>235</sup>U — the fuel cycle
				</div>
				<div className="head-sub">
					stage {STAGE_ORDER.indexOf(stage) + 1} of {STAGE_ORDER.length} · {sci(info.title, `${stage}-head`)}
				</div>
				<div className="head-spacer" />
				<AssayChip assay={shownAssay} />
			</header>

			<div className="stage-area">
				<div className="canvas-wrap">
					<Canvas
						dpr={DPR}
						camera={{ position: VIEWS[stage].pos, fov: 42 }}
						// The composer's multisampling is the only anti-aliasing that
						// reaches the image; a second MSAA default framebuffer would be
						// allocated and resolved every frame for nothing.
						gl={{ antialias: false }}
					>
						<color attach="background" args={["#0B0E14"]} />
						<fog attach="fog" args={["#0B0E14", 20, 62]} />
						<Suspense fallback={null}>{scene}</Suspense>
						<CameraRig stage={stage} />
						<Effects />
						<AdaptiveQuality />
					</Canvas>

					{/* Dissolve on stage change, matching the journey's cuts. */}
					{!reduced && <div key={stage} className="canvas-veil" />}

					{legend && (
						<div className="legend">
							{legend.map((l) => (
								<i key={l.text} style={{ "--dot": l.dot } as React.CSSProperties}>
									{sci(l.text, l.text)}
								</i>
							))}
						</div>
					)}

					<AssayLadder assay={shownAssay} />
					<div className="canvas-hint">
						drag to orbit · scroll to zoom · ← → stages
					</div>
				</div>

				<aside className="panel">
					<div className="panel-inner" key={stage}>
					<span className="panel-ghost" aria-hidden="true">
						{info.index}
					</span>
					<div className="panel-eyebrow">
						<b>{info.index}</b>
						<span>{info.label}</span>
					</div>
					<h1 className="panel-title">{sci(info.title, `${stage}-title`)}</h1>
					<p className="panel-lede">{inline(info.lede, `${stage}-lede`)}</p>

					<div className="panel-body">
						{info.body.map((p, i) => (
							<p key={p.slice(0, 24)}>{inline(p, `${stage}-${i}`)}</p>
						))}
					</div>

					{info.equation && (
						<div className="eqn">
							<Equation label={info.equationLabel}>{info.equation}</Equation>
							{info.equationNote && (
								<small>{inline(info.equationNote, `${stage}-eqn`)}</small>
							)}
						</div>
					)}

					{stage === "enrichment" && <EnrichmentControls />}
					{stage === "fission" && <FissionControls stats={fissionStats} />}

					{info.figure && (
						<div className="figure">
							<span className="figure-value">{sci(info.figure.value, `${stage}-fig`)}</span>
							<span className="figure-unit">{info.figure.unit}</span>
							<p className="figure-caption">{inline(info.figure.caption, `${stage}-cap`)}</p>
						</div>
					)}

					{preEnrichment && (
						<p className="note">
							Assay is fixed at {(ASSAY.natural * 100).toFixed(2)}% through this
							stage. Nothing before enrichment changes the isotope ratio.
						</p>
					)}

					<details className="panel-sources">
						<summary>Works cited</summary>
						<WorksCited />
					</details>
					</div>
				</aside>
			</div>

			<ProcessRail />
		</div>
	);
}
