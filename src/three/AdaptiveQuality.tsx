import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useSim, type Quality } from "../store";
import { DPR } from "../theme";

/**
 * Watches real frame times and moves the whole pipeline between three quality
 * tiers, so a slow machine gets a smooth low-detail scene instead of a
 * beautiful slideshow.
 *
 * Three things make this behave rather than oscillate:
 *
 *  - It reads the median of a rolling window, not the mean. One long frame from
 *    a garbage collection or a tab switch cannot drag the whole decision.
 *  - The thresholds do not touch. It steps down above 22ms (~45fps) and only
 *    steps back up below 13ms (~77fps), leaving a wide dead band between them.
 *  - Stepping up requires a much longer run of good frames than stepping down
 *    requires of bad ones. Recovering is deliberately reluctant, because a tier
 *    that flickers is worse to look at than one that is simply lower.
 */

const WINDOW = 60; // frames per decision
const DOWN_MS = 22; // slower than this and we drop a tier
const UP_MS = 13; // faster than this, for long enough, and we regain one
const UP_STREAK = 4; // consecutive good windows needed to step up

const ORDER: Quality[] = ["low", "medium", "high"];

/** Renderer pixel ratio ceiling per tier. */
const TIER_DPR: Record<Quality, number> = {
	high: DPR[1],
	medium: Math.min(DPR[1], 1.25),
	low: 1,
};

export default function AdaptiveQuality() {
	const gl = useThree((s) => s.gl);
	const setDpr = useThree((s) => s.setDpr);
	const quality = useSim((s) => s.quality);
	const setQuality = useSim((s) => s.setQuality);

	const times = useRef<number[]>([]);
	const last = useRef(0);
	const goodStreak = useRef(0);
	const raf = useRef(0);

	// Sampled from rAF rather than useFrame so the measurement survives the
	// journey canvas dropping to an on-demand frameloop.
	useEffect(() => {
		const tick = (now: number) => {
			raf.current = requestAnimationFrame(tick);
			if (last.current) {
				const dt = now - last.current;
				// Only discard gaps big enough to be a suspended tab or a paused
				// debugger. A merely terrible frame is exactly the evidence this
				// is looking for, so it must not be filtered out — and the median
				// already absorbs the occasional single outlier.
				if (dt < 2000) times.current.push(dt);
			}
			last.current = now;

			if (times.current.length < WINDOW) return;
			const sorted = times.current.slice().sort((a, b) => a - b);
			const median = sorted[Math.floor(sorted.length / 2)];
			times.current.length = 0;

			const i = ORDER.indexOf(quality);
			if (median > DOWN_MS && i > 0) {
				goodStreak.current = 0;
				setQuality(ORDER[i - 1]);
			} else if (median < UP_MS && i < ORDER.length - 1) {
				goodStreak.current += 1;
				if (goodStreak.current >= UP_STREAK) {
					goodStreak.current = 0;
					setQuality(ORDER[i + 1]);
				}
			} else {
				goodStreak.current = 0;
			}
		};
		raf.current = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf.current);
	}, [quality, setQuality]);

	// Surface the tier on the document so it is inspectable in devtools and in
	// automated checks without reaching into the store.
	useEffect(() => {
		document.documentElement.dataset.quality = quality;
	}, [quality]);

	// Apply the tier's pixel ratio. Resolution is the cheapest large lever and
	// the least visible one to give up, so it moves first.
	useEffect(() => {
		setDpr(Math.min(TIER_DPR[quality], window.devicePixelRatio));
	}, [quality, setDpr, gl]);

	return null;
}
