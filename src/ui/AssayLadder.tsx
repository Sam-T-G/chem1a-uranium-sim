import { useCallback, useEffect, useRef, useState } from "react";
import { ASSAY } from "../theme";
import { fmtAssay } from "../lib/separation";
import {
	ASSAY_MAX,
	ASSAY_MIN,
	assayAtRangePos,
	assayAtScalePos,
	rangePos,
	scalePos,
	snapAssay,
} from "../lib/assay";
import { useSim } from "../store";

/**
 * The one element that persists across every stage: a log-scaled enrichment axis
 * with a live handle. Everything in the simulation is downstream of where that
 * handle sits, so it never leaves the screen, and from the enrichment stage
 * onward you can drag it directly rather than going back to find a slider.
 *
 * The axis is pinned a fixed distance from the right edge and every label grows
 * leftward from it, so no label can ever run under the panel beside it.
 */

const TICKS = [
	{ v: ASSAY.tails, n: "0.25", label: "leftover", settable: false, major: false },
	{ v: ASSAY.natural, n: "0.72", label: "natural", settable: true, major: true },
	{ v: ASSAY.leu, n: "5", label: "reactor fuel", settable: true, major: true },
	{
		v: ASSAY.haleu,
		n: "20",
		label: "highly enriched",
		settable: true,
		major: true,
		threshold: true,
	},
	{ v: ASSAY.weapons, n: "90", label: "weapons-grade", settable: true, major: true },
];

/**
 * Below this width the scale is a bare 34px strip with its labels dropped, which
 * is too small to aim at and would swallow the vertical swipe that scrolls the
 * page. Small screens drive the value from the panel control instead.
 */
function useCompactViewport(): boolean {
	const [compact, setCompact] = useState(
		() =>
			typeof window !== "undefined" &&
			window.matchMedia("(max-width: 820px)").matches,
	);

	useEffect(() => {
		const mq = window.matchMedia("(max-width: 820px)");
		const apply = () => setCompact(mq.matches);
		apply();
		mq.addEventListener("change", apply);
		return () => mq.removeEventListener("change", apply);
	}, []);

	return compact;
}

export default function AssayLadder({
	assay,
	live,
}: {
	assay: number;
	/** True once the process has reached the stage that can change the ratio. */
	live: boolean;
}) {
	const setAssay = useSim((s) => s.setAssay);
	const setStage = useSim((s) => s.setStage);
	const touched = useSim((s) => s.assayTouched);
	const compact = useCompactViewport();
	const interactive = live && !compact;

	const trackRef = useRef<HTMLDivElement>(null);
	const [dragging, setDragging] = useState(false);

	const heu = assay >= ASSAY.haleu;
	const pos = scalePos(assay) * 100;
	const base = scalePos(ASSAY.natural) * 100;
	const top = scalePos(ASSAY_MAX) * 100;

	const setFromY = useCallback(
		(clientY: number) => {
			const el = trackRef.current;
			if (!el) return;
			const r = el.getBoundingClientRect();
			if (r.height === 0) return;
			setAssay(snapAssay(assayAtScalePos(1 - (clientY - r.top) / r.height)));
		},
		[setAssay],
	);

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const step = e.shiftKey ? 0.1 : 0.025;
			const at = rangePos(assay);
			let next: number;
			switch (e.key) {
				case "ArrowUp":
				case "ArrowRight":
					next = assayAtRangePos(at + step);
					break;
				case "ArrowDown":
				case "ArrowLeft":
					next = assayAtRangePos(at - step);
					break;
				case "PageUp":
					next = assayAtRangePos(at + 0.15);
					break;
				case "PageDown":
					next = assayAtRangePos(at - 0.15);
					break;
				case "Home":
					next = ASSAY_MIN;
					break;
				case "End":
					next = ASSAY_MAX;
					break;
				default:
					return;
			}
			// Left and right also step the stage; the scale keeps them while focused.
			e.preventDefault();
			e.stopPropagation();
			setAssay(next);
		},
		[assay, setAssay],
	);

	const cls = [
		"ladder",
		heu && "is-heu",
		interactive && "is-live",
		interactive && !touched && "is-fresh",
		dragging && "is-dragging",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={cls}>
			<span className="ladder-caption" aria-hidden="true">
				% U-235
			</span>

			<div className="ladder-axis" aria-hidden="true" />
			{/* The reachable part of the scale, so the dead zone below feed reads as
			    somewhere the handle will not go rather than somewhere it is stuck. */}
			<div
				className="ladder-range"
				aria-hidden="true"
				style={{ bottom: `${base}%`, height: `${top - base}%` }}
			/>
			<div
				className="ladder-fill"
				aria-hidden="true"
				style={{ bottom: `${base}%`, height: `${Math.max(pos - base, 0)}%` }}
			/>

			{TICKS.map((t) => {
				const tp = scalePos(t.v) * 100;
				const eclipsed = Math.abs(tp - pos) < 3.4;
				const tickCls = [
					"ladder-tick",
					t.major && "is-major",
					t.threshold && "is-threshold",
					eclipsed && "is-eclipsed",
				]
					.filter(Boolean)
					.join(" ");

				const face = (
					<>
						<b>{t.n}</b> {t.label}
					</>
				);

				return (
					<div key={t.label} className={tickCls} style={{ bottom: `${tp}%` }}>
						{interactive && t.settable ? (
							<button
								type="button"
								className="ladder-tick-btn"
								aria-label={`Set enrichment to ${t.n} percent, ${t.label}`}
								onClick={() => setAssay(t.v)}
							>
								{face}
							</button>
						) : (
							<span className="ladder-tick-txt" aria-hidden="true">
								{face}
							</span>
						)}
					</div>
				);
			})}

			{interactive ? (
				<div
					ref={trackRef}
					className="ladder-track"
					role="slider"
					tabIndex={0}
					aria-label="Enrichment, percent uranium-235"
					aria-orientation="vertical"
					aria-valuemin={Number((ASSAY_MIN * 100).toFixed(2))}
					aria-valuemax={Number((ASSAY_MAX * 100).toFixed(0))}
					aria-valuenow={Number((assay * 100).toFixed(2))}
					aria-valuetext={`${fmtAssay(assay)} percent uranium-235`}
					onKeyDown={onKeyDown}
					onPointerDown={(e) => {
						e.currentTarget.setPointerCapture(e.pointerId);
						setDragging(true);
						setFromY(e.clientY);
					}}
					onPointerMove={(e) => {
						if (dragging) setFromY(e.clientY);
					}}
					onPointerUp={() => setDragging(false)}
					onPointerCancel={() => setDragging(false)}
				>
					<div className="ladder-knob" style={{ bottom: `${pos}%` }}>
						{!touched && <i className="ladder-nudge">drag</i>}
						<span className="ladder-knob-value">{fmtAssay(assay)}%</span>
						<span className="ladder-knob-grip" />
					</div>
				</div>
			) : (
				<>
					<div className="ladder-marker" aria-hidden="true" style={{ bottom: `${pos}%` }} />
					{!live && (
						<button
							type="button"
							className="ladder-jump"
							onClick={() => setStage("enrichment")}
						>
							set at stage 04 →
						</button>
					)}
				</>
			)}
		</div>
	);
}

export function AssayChip({ assay, live }: { assay: number; live?: boolean }) {
	const heu = assay >= ASSAY.haleu;
	return (
		<div className={`assay-chip${heu ? " is-heu" : ""}`}>
			<b>{fmtAssay(assay)}%</b>
			<span>U-235{live ? "" : " · natural"}</span>
		</div>
	);
}
