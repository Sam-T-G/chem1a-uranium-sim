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

	// Log slider: most of the interesting behaviour lives below 20 %.
	const sliderValue = ((Math.log(assay) - LO) / (HI - LO)) * 1000;
	const cost = separationCost(assay);

	return (
		<div className={`controls${heu ? " is-heu" : ""}`}>
			<div className={`controls-label${heu ? " is-heu" : ""}`}>
				<span>Target product assay</span>
				<b>{fmtAssay(assay)}%</b>
			</div>

			<input
				type="range"
				min={0}
				max={1000}
				step={1}
				value={sliderValue}
				aria-label="Target product assay, percent uranium-235"
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
					<dt>Feed</dt>
					<dd>
						{cost.feedPerProduct.toFixed(1)}
						<small>kg</small>
					</dd>
				</div>
				<div>
					<dt>Tails</dt>
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
				Per kilogram of product, from natural feed at 0.72% with tails left at
				0.25%. <strong>Watch the effort figure against the assay:</strong> reaching
				60% costs most of the separative work needed to reach 90%. That asymmetry is
				why a stockpile part-way up the scale is treated as most of the way to a
				weapon.
			</p>

			{heu && (
				<p className="warn">
					<b>Above the 20% line</b>
					The IAEA classes anything above 20% U-235 as highly enriched uranium. The
					centrifuges have not changed. Only how long they were left running.
				</p>
			)}

			<p className="note">
				Separation inside the rotor is drawn exaggerated so the mechanism is
				visible. One real machine shifts the assay by a fraction of a percent, which
				is why the cascade behind it grows as you raise the target.
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
				? "Chain stopped only because the lattice ran out of U-235."
				: "Chain terminated. Every neutron was captured by U-238 or leaked out."
			: // Threshold set from observed runs: sub-20 % assays peak in the low
				// single digits, weapons assay clears this comfortably.
				stats.neutrons > 24
				? "Runaway. Neutron population is multiplying faster than it is lost."
				: stats.neutrons > 0
					? "Propagating."
					: "Idle. Fire a neutron to start.";

	return (
		<div className="controls">
			<div className="controls-label">
				<span>Chain reaction · lattice at {fmtAssay(assay)}%</span>
			</div>

			<dl className="readout">
				<div>
					<dt>Fissions</dt>
					<dd>{stats.fissions}</dd>
				</div>
				<div>
					<dt>Free n</dt>
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
				{firing ? "Reset lattice" : "Fire a neutron"}
			</button>

			<p className="note">{verdict}</p>

			<p className="note">
				The run starts by inducing one fission at the centre. What the assay decides
				is whether that fission propagates. Go back to <strong>stage 04</strong>,
				change the assay, and run this again: at 0.72% the released neutrons are
				captured by U-238 within a generation or two, and at 90% almost every one
				finds another U-235. That comparison is the argument for why enrichment
				exists.
			</p>

			<p className="note">
				Branching only. Cross-sections, moderation and geometry are not modelled, so
				treat this as a diagram of the logic rather than a neutronics result.
			</p>
		</div>
	);
}
