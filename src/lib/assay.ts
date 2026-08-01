import { ASSAY } from "../theme";

/**
 * One mapping for the enrichment control, shared by the vertical scale over the
 * canvas and the horizontal slider in the panel. They used to carry their own
 * copies with different endpoints, so the two never agreed about where a value
 * sat.
 *
 * Everything is log-scaled. Natural uranium to weapons-grade spans two orders of
 * magnitude, and almost all of the interesting behaviour is in the bottom decade.
 */

/** The control range. Enriching cannot take you below the feed you started with. */
export const ASSAY_MIN = ASSAY.natural;
export const ASSAY_MAX = 0.93;

/** The drawn scale runs wider than the control range so the tails mark has a place. */
export const SCALE_LO = 0.002;
export const SCALE_HI = 1.0;

const LN_MIN = Math.log(ASSAY_MIN);
const LN_MAX = Math.log(ASSAY_MAX);
const LN_LO = Math.log(SCALE_LO);
const LN_HI = Math.log(SCALE_HI);

const clamp01 = (f: number) => Math.min(Math.max(f, 0), 1);

export function clampAssay(a: number): number {
	return Math.min(Math.max(a, ASSAY_MIN), ASSAY_MAX);
}

/** Where a value sits on the drawn scale: 0 at the bottom of the axis, 1 at the top. */
export function scalePos(assay: number): number {
	const a = Math.min(Math.max(assay, SCALE_LO), SCALE_HI);
	return (Math.log(a) - LN_LO) / (LN_HI - LN_LO);
}

/** Where a value sits within the control range: 0 at natural, 1 at the top. */
export function rangePos(assay: number): number {
	return (Math.log(clampAssay(assay)) - LN_MIN) / (LN_MAX - LN_MIN);
}

export function assayAtRangePos(f: number): number {
	return Math.exp(LN_MIN + clamp01(f) * (LN_MAX - LN_MIN));
}

/**
 * The four values both controls are labelled with. The vertical scale's ticks
 * and the panel's preset buttons set the same numbers, so the two never
 * disagree about what "reactor fuel" means.
 */
export const ANCHORS = [
	ASSAY.natural,
	ASSAY.leu,
	ASSAY.haleu,
	ASSAY.weapons,
] as const;

/**
 * Click onto a labelled value when the handle lands within a few pixels of it.
 * Without this a drag settles at 19.96%, which prints as "20%" but is not over
 * the threshold, so the reading and the state contradict each other at exactly
 * the line the whole simulation is about.
 */
export function snapAssay(a: number, tolerance = 0.006): number {
	const p = scalePos(a);
	for (const anchor of ANCHORS) {
		if (Math.abs(scalePos(anchor) - p) < tolerance) return anchor;
	}
	return a;
}

/** Inverse of scalePos, pulled back into the range the control can actually set. */
export function assayAtScalePos(f: number): number {
	return clampAssay(Math.exp(LN_LO + clamp01(f) * (LN_HI - LN_LO)));
}
