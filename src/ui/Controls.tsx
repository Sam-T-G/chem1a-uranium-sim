import { useRef } from "react";
import { ASSAY } from "../theme";
import { useSim } from "../store";
import { fmtAssay, separationCost } from "../lib/separation";
import { assayAtRangePos, rangePos, snapAssay } from "../lib/assay";

export interface FissionStats {
	fissions: number;
	neutrons: number;
	generation: number;
}

const PRESETS = [
	{ label: "natural", sub: "0.72", v: ASSAY.natural },
	{ label: "reactor fuel", sub: "5", v: ASSAY.leu },
	{ label: "the 20% line", sub: "20", v: ASSAY.haleu },
	{ label: "weapons", sub: "90", v: ASSAY.weapons },
];

/**
 * Marks under the slider, at the same values the vertical scale is labelled
 * with. Both controls read the same log mapping, so a mark and its tick sit at
 * the same fraction of their track.
 */
const MARKS = [
	{ v: ASSAY.natural, n: "0.72", nudge: "0%" },
	{ v: ASSAY.leu, n: "5", nudge: "-50%" },
	{ v: ASSAY.haleu, n: "20", nudge: "-50%", threshold: true },
	{ v: ASSAY.weapons, n: "90", nudge: "-100%" },
];

/**
 * The enrichment control. It lives in the panel on every stage that reacts to
 * the setting, not only on the enrichment stage: the fuel and the chain reaction
 * are the two places where the number visibly matters, and sending the reader
 * back two stages to change it and then forward again to see the result broke
 * the one comparison the simulation exists to make.
 */
export function AssayControl() {
	const assay = useSim((s) => s.assay);
	const setAssay = useSim((s) => s.setAssay);
	const heu = assay >= ASSAY.haleu;
	const fill = rangePos(assay) * 100;

	// Dragging clicks onto the labelled values; the arrow keys do not, or a
	// single step could never escape the pull of the one it just landed on.
	const dragging = useRef(false);

	return (
		<div className={`assay-ctl${heu ? " is-heu" : ""}`}>
			<div className="assay-ctl-head">
				<span>Enrichment</span>
				<b>
					{fmtAssay(assay)}
					<small>% U-235</small>
				</b>
			</div>

			<div className="assay-ctl-track">
				<input
					type="range"
					min={0}
					max={1000}
					step={1}
					value={Math.round(fill * 10)}
					aria-label="Enrichment, percent uranium-235"
					aria-valuetext={`${fmtAssay(assay)} percent uranium-235`}
					style={{ "--fill": `${fill}%` } as React.CSSProperties}
					onPointerDown={() => {
						dragging.current = true;
					}}
					onPointerUp={() => {
						dragging.current = false;
					}}
					onPointerCancel={() => {
						dragging.current = false;
					}}
					onChange={(e) => {
						const raw = assayAtRangePos(Number(e.target.value) / 1000);
						setAssay(dragging.current ? snapAssay(raw) : raw);
					}}
				/>

				<div className="assay-ctl-marks" aria-hidden="true">
					{MARKS.map((m) => (
						<span
							key={m.n}
							className={`assay-mark${m.threshold ? " is-threshold" : ""}`}
							style={
								{
									left: `${rangePos(m.v) * 100}%`,
									"--nudge": m.nudge,
								} as React.CSSProperties
							}
						>
							{m.n}
						</span>
					))}
				</div>
			</div>

			<div className="presets">
				{PRESETS.map((p) => (
					<button
						key={p.label}
						type="button"
						className="preset"
						aria-pressed={Math.abs(assay - p.v) < 1e-4}
						onClick={() => setAssay(p.v)}
					>
						<b>{p.label}</b>
						<span>{p.sub}%</span>
					</button>
				))}
			</div>
		</div>
	);
}

/** What the chosen assay costs, kept beside the text that explains it. */
export function EnrichmentDetail() {
	const assay = useSim((s) => s.assay);
	const heu = assay >= ASSAY.haleu;
	const cost = separationCost(assay);

	return (
		<div className="controls">
			<dl className="readout">
				<div>
					<dt>Uranium in</dt>
					<dd>
						{cost.feedPerProduct.toFixed(1)}
						<small>kg</small>
					</dd>
				</div>
				<div>
					<dt>Left over</dt>
					<dd>
						{cost.tailsPerProduct.toFixed(1)}
						<small>kg</small>
					</dd>
				</div>
				<div>
					<dt>Effort</dt>
					<dd>
						{cost.swuPerProduct.toFixed(1)}
						<small>SWU</small>
					</dd>
				</div>
			</dl>

			<p className="note">
				For every kilogram of enriched uranium you end up with, starting from
				ordinary uranium. Effort is measured in separative work units, SWU, which is
				just a way of counting how much separating had to happen. The leftover still
				contains a little U-235, just not enough to be worth running again.
				<strong>Watch the effort number as you raise the target:</strong> reaching
				60% already costs most of what 90% costs, which is why a country sitting at
				60% is treated as most of the way there.
			</p>

			{heu && (
				<p className="warn">
					<b>Above the 20% line</b>
					The IAEA classes anything above 20% U-235 as highly enriched uranium. The
					centrifuges have not changed. Only how long they were left running.
				</p>
			)}

			<p className="note">
				The separation inside the machine is drawn much larger than it really is, so
				you can see it happening. One real centrifuge changes the mix by a fraction
				of a percent. That is why the wall of machines behind it keeps growing as you
				ask for more.
			</p>
		</div>
	);
}

/** Why the pellets change color, since nothing else on this stage moves. */
export function FabricationDetail() {
	return (
		<div className="controls">
			<p className="note">
				The pellets are tinted by enrichment so the setting is visible on this stage
				too. Real fuel pellets look the same at any enrichment, which is part of why
				the number has to be measured rather than seen.
			</p>
		</div>
	);
}

function verdictFor(assay: number, stats: FissionStats, firing: boolean): string {
	// A run that racks up a large share of the available fissile sites did not
	// die because U-238 ate it: it ran out of fuel. Saying otherwise would
	// misattribute the ending at exactly the assay where the point lands.
	// The absolute floor matters: at natural abundance the lattice holds about
	// two fissile sites, so a share test alone would call a single fission
	// "ran out of fuel" when what actually happened is U-238 ate the neutrons.
	const fissileSites = Math.round(assay * 343);
	const burnedOut = stats.fissions >= 8 && stats.fissions > 0.4 * fissileSites;

	if (stats.neutrons === 0 && firing)
		return burnedOut
			? "The chain stopped because it ran out of U-235 to split, not because it failed."
			: "The chain died. Every neutron was either absorbed by U-238 or escaped the block.";

	// Threshold set from observed runs: sub-20 % assays peak in the low single
	// digits, weapons assay clears this comfortably.
	if (stats.neutrons > 24)
		return "Running away. Neutrons are being made faster than they are being lost.";
	if (stats.neutrons > 0) return "Spreading.";
	return "Nothing running. Fire a neutron to start.";
}

/** Fission stage: set the block, arm it, read what happened. */
export function FissionControls({ stats }: { stats: FissionStats }) {
	const assay = useSim((s) => s.assay);
	const firing = useSim((s) => s.firing);
	const setFiring = useSim((s) => s.setFiring);

	return (
		<>
			<AssayControl />

			<button
				type="button"
				className={`btn${firing ? " is-stop" : ""}`}
				onClick={() => setFiring(!firing)}
			>
				{firing ? "Reset the block" : "Fire a neutron"}
			</button>

			<p className="verdict">{verdictFor(assay, stats, firing)}</p>
		</>
	);
}

/** Live counts for the run, parked on the canvas beside the lattice they describe. */
export function FissionHud({ stats }: { stats: FissionStats }) {
	const mev = stats.fissions * 200;
	return (
		<dl className="hud">
			<div>
				<dt>Fissions</dt>
				<dd>{stats.fissions}</dd>
			</div>
			<div>
				<dt>Loose neutrons</dt>
				<dd>{stats.neutrons}</dd>
			</div>
			<div>
				<dt>Energy</dt>
				<dd>
					{mev < 1000 ? mev : (mev / 1000).toFixed(1)}
					<small>{mev < 1000 ? "MeV" : "GeV"}</small>
				</dd>
			</div>
		</dl>
	);
}

export function FissionDetail() {
	return (
		<div className="controls">
			<p className="note">
				The run begins by splitting one nucleus in the middle. What the enrichment
				decides is whether that split spreads. Change the enrichment above and fire
				again: at 0.72% the neutrons that come out are absorbed by U-238 almost
				immediately, and at 90% nearly every one of them finds another U-235.
			</p>

			<p className="note">
				This only keeps track of one thing: whether each neutron happens to reach a
				U-235 or a U-238. A real reactor depends on much more than that, so treat the
				counts here as a picture of the idea rather than real numbers.
			</p>
		</div>
	);
}
