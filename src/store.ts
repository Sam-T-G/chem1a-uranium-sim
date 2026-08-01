import { create } from "zustand";
import { ASSAY } from "./theme";

export type StageId =
	| "ore"
	| "milling"
	| "conversion"
	| "enrichment"
	| "fabrication"
	| "fission";

export const STAGE_ORDER: StageId[] = [
	"ore",
	"milling",
	"conversion",
	"enrichment",
	"fabrication",
	"fission",
];

export type Mode = "journey" | "sim";

/**
 * Render tier, moved automatically by AdaptiveQuality from measured frame
 * times. Scenes and effects read it to shed work on slower machines.
 */
export type Quality = "high" | "medium" | "low";

interface SimState {
	/** The narrative runs first; the simulation is where it lands. */
	mode: Mode;
	quality: Quality;
	stage: StageId;
	/** Product assay as a mass fraction of U-235. Only the enrichment stage changes it. */
	assay: number;
	/** Cascade running, which drives the centrifuge animation. */
	spinning: boolean;
	/** Chain reaction armed in the fission stage. */
	firing: boolean;
	reducedMotion: boolean;

	setMode: (m: Mode) => void;
	setQuality: (q: Quality) => void;
	setStage: (s: StageId) => void;
	next: () => void;
	prev: () => void;
	setAssay: (a: number) => void;
	setSpinning: (v: boolean) => void;
	setFiring: (v: boolean) => void;
	setReducedMotion: (v: boolean) => void;
	reset: () => void;
}

export const useSim = create<SimState>((set, get) => ({
	mode: "journey",
	quality: "high",
	stage: "ore",
	assay: ASSAY.natural,
	spinning: true,
	firing: false,
	reducedMotion: false,

	setMode: (mode) => set({ mode }),
	setQuality: (quality) => set({ quality }),
	setStage: (stage) => set({ stage, firing: false }),
	next: () => {
		const i = STAGE_ORDER.indexOf(get().stage);
		if (i < STAGE_ORDER.length - 1)
			set({ stage: STAGE_ORDER[i + 1], firing: false });
	},
	prev: () => {
		const i = STAGE_ORDER.indexOf(get().stage);
		if (i > 0) set({ stage: STAGE_ORDER[i - 1], firing: false });
	},
	setAssay: (assay) => set({ assay }),
	setSpinning: (spinning) => set({ spinning }),
	setFiring: (firing) => set({ firing }),
	setReducedMotion: (reducedMotion) => set({ reducedMotion }),
	reset: () => set({ assay: ASSAY.natural, firing: false, spinning: true }),
}));

/** Stages before enrichment always show natural uranium regardless of the slider. */
export function assayAtStage(stage: StageId, assay: number): number {
	const i = STAGE_ORDER.indexOf(stage);
	return i < STAGE_ORDER.indexOf("enrichment") ? ASSAY.natural : assay;
}
