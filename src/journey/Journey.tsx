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

export default function Journey() {
	const reduced = useSim((s) => s.reducedMotion);
	const setMode = useSim((s) => s.setMode);

	const [active, setActive] = useState<ChapterId>("intro");
	const [progress, setProgress] = useState(0);
	const scroller = useRef<HTMLDivElement>(null);
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

	const jumpTo = useCallback((index: number) => {
		const s = sections.current[index];
		const el = scroller.current;
		if (s && el) el.scrollTo({ top: s.offsetTop, behavior: "smooth" });
	}, []);

	const enterSim = useCallback(() => setMode("sim"), [setMode]);

	return (
		<div className="journey">
			<div className="journey-bg">
				<JourneyCanvas chapter={active} reduced={reduced} />
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

			{/* Chapter dots */}
			<nav className="journey-dots" aria-label="Chapters">
				{CHAPTERS.map((c, i) => (
					<button
						key={c.id}
						type="button"
						className="journey-dot"
						aria-current={active === c.id}
						aria-label={c.heading}
						onClick={() => jumpTo(i)}
					/>
				))}
			</nav>

			<div className="journey-scroll" ref={scroller}>
				{CHAPTERS.map((c, i) => (
					<section
						key={c.id}
						className={`chapter chapter--${c.id}`}
						ref={(el) => {
							sections.current[i] = el;
						}}
					>
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
									<span className="chapter-stat-value">{c.stat.value}</span>
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
					</section>
				))}
			</div>
		</div>
	);
}
