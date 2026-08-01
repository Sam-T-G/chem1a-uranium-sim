import { ASSAY } from "../theme";
import { useSim } from "../store";
import { fmtAssay, separationCost } from "../lib/separation";

const LO = Math.log(ASSAY.natural);
const HI = Math.log(0.93);

const PRESETS = [
	{ label: "natural 0.72", v: ASSAY.natural },
	{ label: "reactor 4.5", v: 0.045 },
	{ label: "HALEU 19.75", v: 0.1975 },
	{ label: "weapons 90", v: 0.9 },
];

/** Enrichment stage: the assay slider plus the real cost of the assay chosen. */
export function EnrichmentControls() {
	const assay = useSim((s) => s.assay);
	const setAssay = useSim((s) => s.setAssay);
	const heu = assay >= ASSAY.haleu;

	// Log slider: most of the interesting behavior lives below 20 %.
	const sliderValue = ((Math.log(assay) - LO) / (HI - LO)) * 1000;
	const cost = separationCost(assay);

	return (
		<div className={`controls${heu ? " is-heu" : ""}`}>
			<div className={`controls-label${heu ? " is-heu" : ""}`}>
				<span>Target enrichment</span>
				<b>{fmtAssay(assay)}%</b>
			</div>

			<input
				type="range"
				min={0}
				max={1000}
				step={1}
				value={sliderValue}
				aria-label="Target enrichment, percent uranium-235"
				style={{ "--fill": `${sliderValue / 10}%` } as React.CSSProperties}
				onChange={(e) => {
					const f = Number(e.target.value) / 1000;
					setAssay(Math.exp(LO + f * (HI - LO)));
				}}
			/>

			<div className="presets">
				{PRESETS.map((p) => (
					<button
						key={p.label}
						type="button"
						className="preset"
						aria-pressed={Math.abs(assay - p.v) < 1e-4}
						onClick={() => setAssay(p.v)}
					>
						{p.label}
					</button>
				))}
			</div>

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
					ordinary uranium. Effort is measured in separative work units, SWU, which
					is just a way of counting how much separating had to happen. The leftover
					still contains a little U-235, just not enough to be worth running again.
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
					The separation inside the machine is drawn much larger than it really
					is, so you can see it happening. One real centrifuge changes the mix by
					a fraction of a percent. That is why the wall of machines behind it
					keeps growing as you ask for more.
			</p>
		</div>
	);
}

/** Fission stage: arm the chain reaction and read what the assay did to it. */
export function FissionControls({
	stats,
}: {
	stats: { fissions: number; neutrons: number; generation: number };
}) {
	const assay = useSim((s) => s.assay);
	const firing = useSim((s) => s.firing);
	const setFiring = useSim((s) => s.setFiring);

	// A run that racks up a large share of the available fissile sites did not
	// die because U-238 ate it: it ran out of fuel. Saying otherwise would
	// misattribute the ending at exactly the assay where the point lands.
	// The absolute floor matters: at natural abundance the lattice holds about
	// two fissile sites, so a share test alone would call a single fission
	// "ran out of fuel" when what actually happened is U-238 ate the neutrons.
	const fissileSites = Math.round(assay * 343);
	const burnedOut = stats.fissions >= 8 && stats.fissions > 0.4 * fissileSites;

	const verdict =
		stats.neutrons === 0 && firing
			? burnedOut
				? "The chain stopped because it ran out of U-235 to split, not because it failed."
				: "The chain died. Every neutron was either absorbed by U-238 or escaped the block."
			: // Threshold set from observed runs: sub-20 % assays peak in the low
				// single digits, weapons assay clears this comfortably.
				stats.neutrons > 24
				? "Running away. Neutrons are being made faster than they are being lost."
				: stats.neutrons > 0
					? "Spreading."
					: "Nothing running. Fire a neutron to start.";

	return (
		<div className="controls">
			<div className="controls-label">
				<span>Chain reaction · block at {fmtAssay(assay)}% U-235</span>
			</div>

			<dl className="readout">
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
						{(stats.fissions * 200) / 1000 < 1
							? stats.fissions * 200
							: ((stats.fissions * 200) / 1000).toFixed(1)}
						<small>{(stats.fissions * 200) / 1000 < 1 ? "MeV" : "GeV"}</small>
					</dd>
				</div>
			</dl>

			<button
				type="button"
				className={`btn${firing ? " is-stop" : ""}`}
				onClick={() => setFiring(!firing)}
			>
				{firing ? "Reset" : "Fire a neutron"}
			</button>

			<p className="note">{verdict}</p>

			<p className="note">
					The run begins by splitting one nucleus in the middle. What the enrichment
					decides is whether that split spreads. Go back to <strong>stage 04</strong>,
					change the enrichment, and run it again: at 0.72% the neutrons that come out
					are absorbed by U-238 almost immediately, and at 90% nearly every one of them
					finds another U-235.
			</p>

			<p className="note">
					This only keeps track of one thing: whether each neutron happens to reach a
					U-235 or a U-238. A real reactor depends on much more than that, so treat the
					counts here as a picture of the idea rather than real numbers.
			</p>
		</div>
	);
}
