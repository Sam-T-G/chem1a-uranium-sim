import { useCallback, useEffect, useRef, useState } from "react";
import { CHAPTERS, type ChapterId } from "./chapters";
import JourneyCanvas from "./JourneyCanvas";
import { useSim } from "../store";

/** Minimal inline formatter for **bold** and *italic* in the chapter copy. */
function inline(text: string, keyBase: string) {
	const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
	return parts.map((p, i) => {
		const k = `${keyBase}-${i}`;
		if (p.startsWith("**") && p.endsWith("**"))
			return <strong key={k}>{p.slice(2, -2)}</strong>;
		if (p.startsWith("*") && p.endsWith("*") && p.length > 2)
			return <em key={k}>{p.slice(1, -1)}</em>;
		return <span key={k}>{p}</span>;
	});
}

/**
 * Count-up for the chapter stat. Runs once when the chapter card reveals,
 * eases out, and preserves the value's decimal precision so "1.0043" ticks
 * through four decimal places rather than jumping in integers.
 */
function AnimatedStat({
	value,
	active,
	reduced,
}: {
	value: string;
	active: boolean;
	reduced: boolean;
}) {
	const target = parseFloat(value);
	const decimals = value.includes(".") ? value.split(".")[1].length : 0;
	const [shown, setShown] = useState(reduced ? value : "0");
	const done = useRef(false);

	useEffect(() => {
		if (!active || done.current || Number.isNaN(target)) return;
		if (reduced) {
			setShown(value);
			done.current = true;
			return;
		}
		// Marked done only on completion. Setting it up front would strand the
		// value at 0 whenever the effect is torn down mid-flight (StrictMode's
		// double-invoke, or reduced motion flipping partway through).
		const t0 = performance.now();
		const DUR = 1400;
		let raf = 0;
		const tick = (now: number) => {
			const k = Math.min((now - t0) / DUR, 1);
			const eased = 1 - Math.pow(1 - k, 3);
			setShown((target * eased).toFixed(decimals));
			if (k < 1) raf = requestAnimationFrame(tick);
			else done.current = true;
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [active, target, decimals, value, reduced]);

	return <>{Number.isNaN(target) ? value : shown}</>;
}

export default function Journey() {
	const reduced = useSim((s) => s.reducedMotion);
	const setMode = useSim((s) => s.setMode);

	const [active, setActive] = useState<ChapterId>("intro");
	const [progress, setProgress] = useState(0);
	const [revealed, setRevealed] = useState<Set<ChapterId>>(
		() => new Set(["intro"]),
	);
	const scroller = useRef<HTMLDivElement>(null);
	const root = useRef<HTMLDivElement>(null);
	const sections = useRef<(HTMLElement | null)[]>([]);

	// Active chapter comes from whichever section owns the middle of the viewport.
	useEffect(() => {
		const el = scroller.current;
		if (!el) return;

		const onScroll = () => {
			const mid = el.scrollTop + el.clientHeight / 2;
			let idx = 0;
			for (let i = 0; i < sections.current.length; i++) {
				const s = sections.current[i];
				if (s && s.offsetTop <= mid) idx = i;
			}
			setActive(CHAPTERS[idx].id);
			const max = el.scrollHeight - el.clientHeight;
			setProgress(max > 0 ? el.scrollTop / max : 0);
		};

		onScroll();
		el.addEventListener("scroll", onScroll, { passive: true });
		return () => el.removeEventListener("scroll", onScroll);
	}, []);

	// Reveal cards once, as they approach the viewport centre.
	useEffect(() => {
		const obs = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (!e.isIntersecting) continue;
					const id = (e.target as HTMLElement).dataset.chapter as ChapterId;
					setRevealed((prev) => {
						if (prev.has(id)) return prev;
						const next = new Set(prev);
						next.add(id);
						return next;
					});
					obs.unobserve(e.target);
				}
			},
			{ root: scroller.current, threshold: 0.25 },
		);
		sections.current.forEach((s) => s && obs.observe(s));
		return () => obs.disconnect();
	}, []);

	const jumpTo = useCallback(
		(index: number) => {
			const s = sections.current[index];
			const el = scroller.current;
			if (s && el)
				el.scrollTo({
					top: s.offsetTop,
					// "instant" rather than "auto": auto would defer to the
					// stylesheet's scroll-behavior and animate anyway.
					behavior: reduced ? "instant" : "smooth",
				});
		},
		[reduced],
	);

	// Cross-fade the whole document into the simulation where the browser
	// supports it; plain swap elsewhere.
	const enterSim = useCallback(() => {
		const go = () => setMode("sim");
		if (!reduced && "startViewTransition" in document) {
			(
				document as Document & {
					startViewTransition: (cb: () => void) => void;
				}
			).startViewTransition(go);
		} else go();
	}, [setMode, reduced]);

	return (
		<div className="journey" ref={root}>
			<div className="journey-bg">
				<JourneyCanvas chapter={active} reduced={reduced} eventSource={root} />
				{/* Brief dip on each chapter change so scene cuts read as dissolves. */}
				{!reduced && <div key={active} className="canvas-veil" />}
			</div>

			<header className="journey-head">
				<span className="journey-mark">
					<sup>235</sup>U
				</span>
				<span className="journey-title">The rock nobody wanted</span>
				<span className="journey-spacer" />
				<button type="button" className="journey-skip" onClick={enterSim}>
					Skip to the simulation
				</button>
			</header>

			<div className="journey-progress" aria-hidden="true">
				<span style={{ width: `${progress * 100}%` }} />
			</div>

			{/* Chapter rail: dots with the chapter name surfacing on hover/current. */}
			<nav className="journey-dots" aria-label="Chapters">
				{CHAPTERS.map((c, i) => (
					<button
						key={c.id}
						type="button"
						className="journey-dot"
						aria-current={active === c.id}
						aria-label={c.heading}
						data-label={c.short}
						onClick={() => jumpTo(i)}
					/>
				))}
			</nav>

			<div className="journey-scroll" ref={scroller}>
				{CHAPTERS.map((c, i) => (
					<section
						key={c.id}
						data-chapter={c.id}
						className={`chapter chapter--${c.id}${
							revealed.has(c.id) || reduced ? " is-revealed" : ""
						}`}
						ref={(el) => {
							sections.current[i] = el;
						}}
					>
						{c.index && (
							<span className="chapter-ghost" aria-hidden="true">
								{c.index}
							</span>
						)}
						<div className="chapter-card">
							{c.kicker && <p className="chapter-kicker">{c.kicker}</p>}
							<h2 className="chapter-heading">{c.heading}</h2>

							{c.body.map((p, j) => (
								<p key={j} className="chapter-body">
									{inline(p, `${c.id}-${j}`)}
								</p>
							))}

							{c.pull && <p className="chapter-pull">{c.pull}</p>}

							{c.stat && (
								<div className="chapter-stat">
									<span className="chapter-stat-value">
										<AnimatedStat
											value={c.stat.value}
											active={revealed.has(c.id)}
											reduced={reduced}
										/>
									</span>
									<span className="chapter-stat-unit">{c.stat.unit}</span>
									<p className="chapter-stat-note">{c.stat.note}</p>
								</div>
							)}

							{c.id === "intro" && (
								<button
									type="button"
									className="chapter-cta chapter-cta--ghost"
									onClick={() => jumpTo(1)}
								>
									Start reading
								</button>
							)}

							{c.id === "handoff" && (
								<button type="button" className="chapter-cta" onClick={enterSim}>
									Enter the simulation
								</button>
							)}
						</div>

						{c.id === "intro" && (
							<div className="scroll-cue" aria-hidden="true">
								<span className="scroll-cue-line" />
								<span className="scroll-cue-label">scroll</span>
							</div>
						)}
					</section>
				))}
			</div>
		</div>
	);
}
