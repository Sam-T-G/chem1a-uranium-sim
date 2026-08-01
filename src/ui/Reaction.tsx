import { sci } from "./Sci";

/**
 * Structured reaction display.
 *
 * A reaction written as one long monospace string overflows the panel and gets
 * clipped, and it forces unrelated things into the same shape: a multi-step
 * industrial process, a balanced nuclear equation and an algebraic ratio are
 * not the same kind of statement. Each gets its own layout, and every layout
 * wraps rather than scrolling, so nothing is ever cut off.
 */

export interface Term {
	/** Formula in sci notation, e.g. "UF_{6}" or "^{235}U". */
	formula: string;
	/** Small caption under the term: state, oxidation number, what it is. */
	label?: string;
}

export type Reaction =
	/** A → B → C. Sequential steps, industrial or geochemical. */
	| { kind: "chain"; steps: Term[] }
	/** Reactants → products, each side summed. */
	| { kind: "equation"; lhs: Term[]; rhs: Term[] }
	/** An algebraic relation, with the answer pulled out. */
	| { kind: "relation"; expr: string; result?: string; resultLabel?: string };

function Species({ term }: { term: Term }) {
	return (
		<span className="rxn-term">
			<span className="rxn-formula">{sci(term.formula, term.formula)}</span>
			{term.label && (
				<span className="rxn-label">{sci(term.label, `${term.formula}-l`)}</span>
			)}
		</span>
	);
}

function Side({ terms }: { terms: Term[] }) {
	return (
		<>
			{terms.map((t, i) => (
				<span className="rxn-group" key={`${t.formula}-${i}`}>
					{i > 0 && <span className="rxn-op">+</span>}
					<Species term={t} />
				</span>
			))}
		</>
	);
}

export default function ReactionView({
	reaction,
	label,
}: {
	reaction: Reaction;
	/** Plain-language reading, so assistive tech gets a sentence not symbols. */
	label?: string;
}) {
	if (reaction.kind === "relation") {
		return (
			<div className="rxn rxn--relation" role="math">
				{label && <span className="sr-only">{label}</span>}
				<div className="rxn-expr" aria-hidden="true">{sci(reaction.expr, "expr")}</div>
				{reaction.result && (
					<div className="rxn-result" aria-hidden="true">
						<span className="rxn-result-value">
							{sci(reaction.result, "res")}
						</span>
						{reaction.resultLabel && (
							<span className="rxn-result-label">{reaction.resultLabel}</span>
						)}
					</div>
				)}
			</div>
		);
	}

	if (reaction.kind === "equation") {
		return (
			<div className="rxn rxn--equation" role="math">
				{label && <span className="sr-only">{label}</span>}
				<span className="rxn-visual" aria-hidden="true">
					<Side terms={reaction.lhs} />
					<span className="rxn-arrow">→</span>
					<Side terms={reaction.rhs} />
				</span>
			</div>
		);
	}

	return (
		<div className="rxn rxn--chain" role="math">
			{label && <span className="sr-only">{label}</span>}
			<span className="rxn-visual" aria-hidden="true">
				{reaction.steps.map((t, i) => (
					<span className="rxn-group" key={`${t.formula}-${i}`}>
						{i > 0 && <span className="rxn-arrow rxn-arrow--step">→</span>}
						<Species term={t} />
					</span>
				))}
			</span>
		</div>
	);
}
