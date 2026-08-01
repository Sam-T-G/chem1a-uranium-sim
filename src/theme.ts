/**
 * Palette. The two isotope colours are semantic and are used identically in the
 * 3D scenes and in the UI: if it is chartreuse it is U-235, if it is dull amber
 * it is U-238. Vermilion is reserved for one thing only, crossing the 20 % HEU
 * threshold, so its appearance always means the same thing.
 */
export const C = {
	void: "#0B0E14",
	panel: "#131822",
	panelHi: "#1A2130",
	line: "#232B3A",
	text: "#E8E4DA",
	muted: "#8A93A6",

	u235: "#C8F03C", // uranyl fluorescence green — the light, fissile isotope
	u238: "#7A6A52", // dull heavy amber-grey — the abundant, fertile isotope
	cake: "#E8A33D", // yellowcake amber — process equipment and flow
	hot: "#FF4D3D", // vermilion — HEU threshold only
	neutron: "#7FD8FF", // cold blue — free neutrons
} as const;

/** Assay thresholds, as mass fractions of U-235. */
export const ASSAY = {
	tails: 0.0025, // typical enrichment plant tails assay
	// Natural uranium, atom basis. Quoted as 0.72 % almost everywhere, which is
	// the figure used throughout this simulation. On a mass basis the same
	// material is 0.711 %; SWU tables conventionally use the mass figure, so the
	// effort numbers here run a few percent low against published tables.
	natural: 0.0072,
	leu: 0.05, // upper end of typical commercial reactor fuel
	haleu: 0.2, // IAEA LEU/HEU dividing line
	weapons: 0.9, // conventionally "weapons-grade"
} as const;

/**
 * Device pixel ratio ceiling. Retina phones report 3, which on top of the
 * bloom chain and (in the glass chapter) a transmission pre-pass means a
 * buffer nine times the CSS area. Coarse pointers get a lower cap; the bloom
 * is a blur, so the loss is invisible and the frame budget is not.
 */
export const DPR: [number, number] =
	typeof window !== "undefined" &&
	window.matchMedia("(pointer: coarse)").matches
		? [1, 1.5]
		: [1, 2];
