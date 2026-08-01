import { ASSAY } from "../theme";
import { fmtAssay } from "../lib/separation";

/**
 * The one element that persists across every stage: a log-scaled assay axis with
 * a live marker. Everything in the simulation is downstream of where this marker
 * sits, so it never leaves the screen.
 */

const LO = 0.002; // below tails, so the tails mark sits on the scale
const HI = 1.0;

function toFrac(assay: number): number {
	const a = Math.min(Math.max(assay, LO), HI);
	return (Math.log(a) - Math.log(LO)) / (Math.log(HI) - Math.log(LO));
}

const TICKS = [
	{ v: ASSAY.tails, label: "0.25  tails", major: false },
	{ v: ASSAY.natural, label: "0.72  natural", major: true },
	{ v: ASSAY.leu, label: "5  reactor fuel", major: true },
	{ v: ASSAY.haleu, label: "20  HEU line", major: true, threshold: true },
	{ v: ASSAY.weapons, label: "90  weapons-grade", major: true },
];

export default function AssayLadder({ assay }: { assay: number }) {
	const heu = assay >= ASSAY.haleu;
	const pos = toFrac(assay) * 100;

	return (
		<div className={`ladder${heu ? " is-heu" : ""}`} aria-hidden="true">
			<span className="ladder-caption">% U-235</span>
			<div className="ladder-axis" />
			<div className="ladder-fill" style={{ height: `${pos}%` }} />

			{TICKS.map((t) => (
				<div
					key={t.label}
					className={`ladder-tick${t.major ? " is-major" : ""}${
						t.threshold ? " is-threshold" : ""
					}`}
					style={{ bottom: `${toFrac(t.v) * 100}%` }}
				>
					{t.label}
				</div>
			))}

			<div className="ladder-marker" style={{ bottom: `${pos}%` }} />
		</div>
	);
}

export function AssayChip({ assay }: { assay: number }) {
	const heu = assay >= ASSAY.haleu;
	return (
		<div className={`assay-chip${heu ? " is-heu" : ""}`}>
			<b>{fmtAssay(assay)}%</b>
			<span>U-235</span>
		</div>
	);
}
