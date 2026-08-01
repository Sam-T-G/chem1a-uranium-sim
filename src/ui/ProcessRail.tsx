import { STAGES } from "../data/stages";
import { STAGE_ORDER, useSim } from "../store";

/**
 * The fuel cycle is a genuine ordered process, so the numbering carries real
 * information rather than decorating the nav.
 */
export default function ProcessRail() {
	const stage = useSim((s) => s.stage);
	const setStage = useSim((s) => s.setStage);

	return (
		<nav className="rail" aria-label="Fuel cycle stages">
			{STAGE_ORDER.map((id) => {
				const info = STAGES[id];
				return (
					<button
						key={id}
						type="button"
						className="rail-step"
						aria-current={stage === id}
						onClick={() => setStage(id)}
					>
						<span className="rail-num">{info.index}</span>
						<span className="rail-name">{info.label}</span>
					</button>
				);
			})}
		</nav>
	);
}
