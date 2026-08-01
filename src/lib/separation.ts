/**
 * Isotope separation arithmetic.
 *
 * These are the standard textbook relations, not invented approximations.
 * Sources are listed in the repo README. Checked against published figures:
 * 4.5 % product at 0.25 % tails gives ~6.9 SWU/kg and ~9.2 kg feed per kg
 * product, which matches values quoted by the World Nuclear Association.
 */

import { ASSAY } from "../theme";

/** Molar masses (g/mol), used for the Graham's law separation factor. */
export const M_U235 = 235.0439;
export const M_U238 = 238.0508;
export const M_F = 18.9984;
export const M_UF6_235 = M_U235 + 6 * M_F; // 349.03
export const M_UF6_238 = M_U238 + 6 * M_F; // 352.04

/**
 * Ideal gaseous-diffusion separation factor per stage, from Graham's law of
 * effusion. Works out to about 1.0043: four-tenths of one percent per pass.
 */
export const DIFFUSION_ALPHA = Math.sqrt(M_UF6_238 / M_UF6_235);

/**
 * Value function for separative work, V(x) = (2x - 1) ln(x / (1 - x)).
 * Dimensionless.
 */
export function valueFunction(x: number): number {
	const c = Math.min(Math.max(x, 1e-9), 1 - 1e-9);
	return (2 * c - 1) * Math.log(c / (1 - c));
}

export interface SeparationResult {
	/** kg of natural uranium feed per kg of product. */
	feedPerProduct: number;
	/** kg of depleted tails per kg of product. */
	tailsPerProduct: number;
	/** Separative work units per kg of product. */
	swuPerProduct: number;
}

/**
 * Feed, tails and separative work required per kilogram of product at a given
 * product assay. Mass balance plus the standard SWU expression.
 */
export function separationCost(
	productAssay: number,
	feedAssay: number = ASSAY.natural,
	tailsAssay: number = ASSAY.tails,
): SeparationResult {
	const xp = Math.min(Math.max(productAssay, feedAssay), 0.999);
	const feedPerProduct = (xp - tailsAssay) / (feedAssay - tailsAssay);
	const tailsPerProduct = feedPerProduct - 1;

	const swuPerProduct =
		valueFunction(xp) +
		tailsPerProduct * valueFunction(tailsAssay) -
		feedPerProduct * valueFunction(feedAssay);

	return { feedPerProduct, tailsPerProduct, swuPerProduct: Math.max(swuPerProduct, 0) };
}

/**
 * Illustrative neutron multiplication factor for the chain-reaction scene.
 *
 * This is NOT a neutronics calculation. It is a smooth curve chosen so the
 * animation behaves the way a light-water system does at each assay: subcritical
 * below roughly 1 %, self-sustaining in the commercial 3-5 % band, and sharply
 * supercritical at weapons assay. Treat it as a teaching aid, not a result.
 */
export function illustrativeK(assay: number): number {
	const a = Math.min(Math.max(assay, 0), 1);
	return 2.6 * (1 - Math.exp(-a / 0.028)) + 0.55 * a;
}

/** Percent string with sensible precision across four orders of magnitude. */
export function fmtAssay(assay: number): string {
	const pct = assay * 100;
	if (pct < 1) return pct.toFixed(2);
	if (pct < 10) return pct.toFixed(1);
	return pct.toFixed(0);
}
