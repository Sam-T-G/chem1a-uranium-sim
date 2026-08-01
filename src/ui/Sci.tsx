import type { ReactNode } from "react";

/**
 * Scientific notation as real markup.
 *
 * Unicode sub/superscripts (UF₆, ²³⁵U) were the previous approach and they
 * render badly: no single font in the stack covers the full range, so the
 * browser silently substitutes a different face mid-formula and the digits
 * come out a different size, weight and baseline from the text around them.
 * Real <sub>/<sup> elements are styled by us, stay in the chosen face, and
 * carry the right semantics for assistive tech.
 *
 * Syntax, kept deliberately small:
 *   H_2O            subscript, single character
 *   U_{235}         subscript, braced for multi-character
 *   UO_2^{2+}       superscript, same rules
 *   ^{235}U         leading superscript, for nuclide notation
 *   ->              arrow
 *   <->             equilibrium arrow
 *   ~=              approximately equal
 *   sqrt(...)       radical, with an overline over the radicand
 *   x               left alone; use * for a multiplication sign
 */

const ARROWS: [RegExp, string][] = [
	[/<->/g, "⇌"],
	[/->/g, "→"],
	[/~=/g, "≈"],
	[/>=/g, "≥"],
	[/<=/g, "≤"],
	[/\s\*\s/g, " × "],
];

function applySymbols(s: string): string {
	let out = s;
	for (const [re, ch] of ARROWS) out = out.replace(re, ch);
	return out;
}

/**
 * Splits a formula string into runs of normal text, subscripts and
 * superscripts, plus radicals.
 */
export function sci(text: string, keyBase = "sci"): ReactNode[] {
	const out: ReactNode[] = [];
	let buf = "";
	let k = 0;

	const flush = () => {
		if (buf) {
			out.push(<span key={`${keyBase}-t${k++}`}>{applySymbols(buf)}</span>);
			buf = "";
		}
	};

	for (let i = 0; i < text.length; i++) {
		const c = text[i];

		// sqrt(...) with a proper overline over the radicand.
		if (text.startsWith("sqrt(", i)) {
			flush();
			let depth = 1;
			let j = i + 5;
			let inner = "";
			while (j < text.length && depth > 0) {
				if (text[j] === "(") depth++;
				else if (text[j] === ")") depth--;
				if (depth > 0) inner += text[j];
				j++;
			}
			out.push(
				<span key={`${keyBase}-r${k++}`} className="sci-radical">
					<span className="sci-radix">&#8730;</span>
					<span className="sci-radicand">{sci(inner, `${keyBase}-r${k}`)}</span>
				</span>,
			);
			i = j - 1;
			continue;
		}

		if (c === "_" || c === "^") {
			const isSub = c === "_";
			let content = "";
			let j = i + 1;
			if (text[j] === "{") {
				j++;
				while (j < text.length && text[j] !== "}") content += text[j++];
				j++; // past the closing brace
			} else {
				// Unbraced: take digits, or a single character.
				while (j < text.length && /[0-9]/.test(text[j])) content += text[j++];
				if (!content && j < text.length) content = text[j++];
			}
			if (content) {
				flush();
				out.push(
					isSub ? (
						<sub key={`${keyBase}-s${k++}`}>{content}</sub>
					) : (
						<sup key={`${keyBase}-p${k++}`}>{content}</sup>
					),
				);
				i = j - 1;
				continue;
			}
		}

		buf += c;
	}

	flush();
	return out;
}
