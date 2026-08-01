import {
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
	useSyncExternalStore,
	type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { KIND_LABEL, SOURCE_BY_ID, type Source } from "../data/sources";
import { sci } from "./Sci";

/**
 * One citation open at a time, tracked outside React.
 *
 * Per-instance state let every marker on the page pin independently, so a
 * reader could paper the screen with overlapping cards. A single key means
 * opening one closes the last.
 */
let openKey: string | null = null;
const listeners = new Set<() => void>();

function setOpen(key: string | null) {
	openKey = key;
	listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
	listeners.add(l);
	return () => listeners.delete(l);
}

function useOpenKey() {
	return useSyncExternalStore(
		subscribe,
		() => openKey,
		() => null,
	);
}

/** True on phone-width viewports, kept in sync if the window is resized. */
function useCompact() {
	const [compact, setCompact] = useState(
		() =>
			typeof window !== "undefined" &&
			window.matchMedia("(max-width: 820px)").matches,
	);
	useEffect(() => {
		const mq = window.matchMedia("(max-width: 820px)");
		const on = () => setCompact(mq.matches);
		mq.addEventListener("change", on);
		return () => mq.removeEventListener("change", on);
	}, []);
	return compact;
}

function Card({ src }: { src: Source & { n: number } }) {
	return (
		<>
			<span className="cite-pop-kind">
				{KIND_LABEL[src.kind]} · {src.year}
			</span>
			<span className="cite-pop-title">{src.title}</span>
			<span className="cite-pop-meta">
				{src.author} · {src.publisher}
			</span>
			<span className="cite-pop-note">{sci(src.note, src.id)}</span>
			<a
				className="cite-pop-link"
				href={src.url}
				target="_blank"
				rel="noreferrer noopener"
			>
				Open source <span aria-hidden="true">↗</span>
			</a>
		</>
	);
}

/**
 * Inline citation marker.
 *
 * Desktop: a compact tooltip that grows out of the marker on hover or keyboard
 * focus. It is portalled to the body and positioned from the marker's own rect,
 * because the simulation panel is a scroll container and an in-flow tooltip
 * gets clipped by it. Mobile: a bottom sheet, for the same containing-block
 * reason plus the fact that there is no room beside the marker on a phone.
 */
export function Cite({ id }: { id: string }) {
	const src = SOURCE_BY_ID[id];
	const compact = useCompact();
	const popId = useId();
	const open = useOpenKey() === popId;

	const markerRef = useRef<HTMLButtonElement>(null);
	const sheetRef = useRef<HTMLDivElement>(null);
	const [pos, setPos] = useState<{
		left: number;
		top: number;
		placement: "above" | "below";
	} | null>(null);

	// Anchor the desktop tooltip to the marker, clamped into the viewport and
	// flipped below when there is not enough room above.
	const place = useCallback(() => {
		const m = markerRef.current;
		if (!m) return;
		const r = m.getBoundingClientRect();
		const W = 300;
		const GAP = 10;
		const left = Math.min(
			Math.max(12, r.left + r.width / 2 - W / 2),
			window.innerWidth - W - 12,
		);
		const placement = r.top > 250 ? "above" : "below";
		const top = placement === "above" ? r.top - GAP : r.bottom + GAP;
		setPos({ left, top, placement });
	}, []);

	useLayoutEffect(() => {
		if (!open || compact) return;
		place();
		window.addEventListener("scroll", place, true);
		window.addEventListener("resize", place);
		return () => {
			window.removeEventListener("scroll", place, true);
			window.removeEventListener("resize", place);
		};
	}, [open, compact, place]);

	// Escape closes; focus returns to the marker so the reading position is not lost.
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			setOpen(null);
			markerRef.current?.focus();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);

	// The mobile sheet takes focus when it opens, so a keyboard or screen-reader
	// user lands inside it rather than being left behind in the prose.
	useEffect(() => {
		if (open && compact) sheetRef.current?.focus();
	}, [open, compact]);

	if (!src) {
		if (import.meta.env.DEV) console.warn(`Unknown citation id: ${id}`);
		return null;
	}

	const toggle = () => setOpen(open ? null : popId);

	return (
		<span className={`cite${open ? " is-open" : ""}`}>
			<button
				ref={markerRef}
				type="button"
				className="cite-marker"
				aria-expanded={open}
				aria-controls={popId}
				aria-label={`Source ${src.n}: ${src.title}, ${src.author}`}
				onClick={toggle}
				onMouseEnter={() => !compact && setOpen(popId)}
				onFocus={() => !compact && setOpen(popId)}
			>
				{src.n}
			</button>

			{!compact &&
				open &&
				pos &&
				createPortal(
					<span
						className={`cite-tip cite-tip--${pos.placement}`}
						id={popId}
						role="note"
						style={{ left: pos.left, top: pos.top }}
						onMouseLeave={() => setOpen(null)}
					>
						<Card src={src} />
					</span>,
					document.body,
				)}

			{compact &&
				open &&
				createPortal(
					<div className="cite-sheet-wrap">
						<button
							type="button"
							className="cite-sheet-scrim"
							aria-label="Close source"
							onClick={() => setOpen(null)}
						/>
						<div
							ref={sheetRef}
							tabIndex={-1}
							className="cite-sheet"
							id={popId}
							role="dialog"
							aria-label={`Source ${src.n}: ${src.title}`}
						>
							<Card src={src} />
							<button
								type="button"
								className="cite-sheet-close"
								onClick={() => {
									setOpen(null);
									markerRef.current?.focus();
								}}
							>
								Close
							</button>
						</div>
					</div>,
					document.body,
				)}
		</span>
	);
}

/**
 * Shared inline formatter for prose in both the journey and the simulation.
 * Handles `**bold**`, `*italic*`, `[[cite:id]]`, and scientific notation
 * (`UF_6`, `^{235}U`) via the sci parser, so a formula in running prose is set
 * with the same real sub/superscript markup as a display equation.
 */
export function inline(text: string, keyBase: string) {
	const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[\[cite:[a-z0-9-]+\]\])/g);
	const out: ReactNode[] = [];

	for (let i = 0; i < parts.length; i++) {
		const p = parts[i];
		const k = `${keyBase}-${i}`;
		if (!p) continue;

		if (p.startsWith("[[cite:")) {
			// Keep the marker welded to the word before it. Left to itself a
			// marker at a line end wraps alone onto the next line, which reads
			// as a stray number rather than a footnote.
			const prev = out[out.length - 1];
			let tail = "";
			if (typeof prev === "object" && prev !== null && "props" in prev) {
				const prevText = (prev as { props: { "data-raw"?: string } }).props[
					"data-raw"
				];
				if (prevText) {
					const m = prevText.match(/(\S+)$/);
					if (m && m[1].length <= 18) {
						tail = m[1];
						const head = prevText.slice(0, prevText.length - tail.length);
						out[out.length - 1] = (
							<span key={`${k}-head`} data-raw={head}>
								{sci(head, `${k}-head`)}
							</span>
						);
					}
				}
			}
			out.push(
				<span key={k} className="cite-bind">
					{tail && sci(tail, `${k}-tail`)}
					<Cite id={p.slice(7, -2)} />
				</span>,
			);
			continue;
		}

		if (p.startsWith("**") && p.endsWith("**")) {
			out.push(<strong key={k}>{sci(p.slice(2, -2), k)}</strong>);
			continue;
		}
		if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
			out.push(<em key={k}>{sci(p.slice(1, -1), k)}</em>);
			continue;
		}
		// data-raw lets the citation branch above reclaim the trailing word.
		out.push(
			<span key={k} data-raw={p}>
				{sci(p, k)}
			</span>,
		);
	}

	return out;
}
