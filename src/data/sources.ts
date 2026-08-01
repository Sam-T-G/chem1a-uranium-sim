/**
 * The bibliography.
 *
 * Order here is the citation order shown everywhere: markers in the prose and
 * the works-cited list both use `index + 1`, so the numbering can never drift
 * between them.
 *
 * `note` is the annotation. It says what the source is good for and, where it
 * matters, what it is not good for. An industry body is not a neutral source on
 * policy; a documentary is not a citation for a number. Saying so is part of
 * the citation.
 */

export type SourceKind =
	| "reference"
	| "institutional"
	| "peer-reviewed"
	| "museum"
	| "conference"
	| "textbook"
	| "film";

export interface Source {
	id: string;
	/** Author or issuing body, as it should appear in a citation. */
	author: string;
	title: string;
	publisher: string;
	year: string;
	url: string;
	kind: SourceKind;
	/** What this supports here, and its limits. */
	note: string;
}

export const SOURCES: Source[] = [
	{
		id: "rsc",
		author: "Royal Society of Chemistry",
		title: "Uranium — Element Information, Properties and Uses",
		publisher: "Periodic Table, rsc.org",
		year: "n.d.",
		url: "https://periodic-table.rsc.org/element/92/uranium",
		kind: "reference",
		note: "Physical and chemical data: atomic number 92, relative atomic mass 238.029, melting point 1135 °C, density 19.1 g·cm^{−3}, configuration [Rn] 5f^{3}6d^{1}7s^{2}, oxidation states 6/5/4/3. Also the compact discovery account used for Klaproth and Péligot.",
	},
	{
		id: "ciaaw",
		author: "Commission on Isotopic Abundances and Atomic Weights",
		title: "Atomic Weight of Uranium",
		publisher: "IUPAC (ciaaw.org)",
		year: "1999, current",
		url: "https://www.ciaaw.org/uranium.htm",
		kind: "institutional",
		note: "IUPAC's own commission, so this is the authoritative figure for the standard atomic weight, 238.028 91(3). Used in preference to any secondary quotation of the same number.",
	},
	{
		id: "iaea-du",
		author: "International Atomic Energy Agency",
		title: "Depleted Uranium",
		publisher: "iaea.org",
		year: "n.d.",
		url: "https://www.iaea.org/topics/spent-fuel-management/depleted-uranium",
		kind: "institutional",
		note: "Definitions of natural, depleted and enriched uranium, and the abundance figures that anchor the 0.72% claim running through the whole piece.",
	},
	{
		id: "britannica-klaproth",
		author: "Encyclopædia Britannica",
		title: "Martin Heinrich Klaproth",
		publisher: "britannica.com",
		year: "n.d.",
		url: "https://www.britannica.com/biography/Martin-Heinrich-Klaproth",
		kind: "reference",
		note: "The 1789 identification in pitchblende, the naming after Uranus, and the fact that what Klaproth isolated was an oxide rather than the metal.",
	},
	{
		id: "britannica-peligot",
		author: "Encyclopædia Britannica",
		title: "Eugène-Melchior Péligot",
		publisher: "britannica.com",
		year: "n.d.",
		url: "https://www.britannica.com/biography/Eugene-Melchior-Peligot",
		kind: "reference",
		note: "The 1841 correction: uranium metal produced by reducing uranium tetrachloride with potassium, fifty-two years after Klaproth's oxide.",
	},
	{
		id: "aps-becquerel",
		author: "American Physical Society",
		title: "March 1, 1896: Henri Becquerel Discovers Radioactivity",
		publisher: "APS News",
		year: "2008",
		url: "https://www.aps.org/apsnews/2008/02/becquerel-discovers-radioactivity",
		kind: "institutional",
		note: "The overcast-Paris episode: wrapped plates, a closed drawer, no sunlight, fogged plates anyway. A physics society writing its own discipline's history.",
	},
	{
		id: "nobel-curie",
		author: "Fröman, Nanny",
		title: "Marie and Pierre Curie and the Discovery of Polonium and Radium",
		publisher: "NobelPrize.org, The Nobel Foundation",
		year: "1996",
		url: "https://www.nobelprize.org/prizes/themes/marie-and-pierre-curie-and-the-discovery-of-polonium-and-radium/",
		kind: "institutional",
		note: "Marie Curie coining 'radioactivity', the pitchblende anomaly, and polonium (July 1898) and radium (December 1898). Published by the Nobel Foundation, drawing on the original prize documentation.",
	},
	{
		id: "strahan",
		author: "Strahan, Donna",
		title: "Uranium in Glass, Glazes and Enamels: History, Identification and Handling",
		publisher:
			"Objects Specialty Group Postprints vol. 6, American Institute for Conservation",
		year: "1999",
		url: "https://resources.culturalheritage.org/osg-postprints/v06/strahan/",
		kind: "conference",
		note: "Conservation literature on uranium in glass and glazes: the Roman glass from Cape Posillipo, Bohemian glassmaking, and the commercial period. AIC states plainly that the Postprints are conference proceedings and not peer reviewed, so it is cited as professional conservation work rather than as a refereed paper. The linked page is the abstract; the fuller treatment is Strahan, Studies in Conservation 46(3), 2001.",
	},
	{
		id: "orau-fiesta",
		author: "Oak Ridge Associated Universities",
		title: "Fiestaware",
		publisher: "Museum of Radiation and Radioactivity",
		year: "n.d.",
		url: "https://www.orau.org/health-physics-museum/collection/consumer/ceramics/fiestaware.html",
		kind: "museum",
		note: "Uranium oxide in the Fiesta Red glaze from 1936, halted in 1943 when the government requisitioned the uranium, resumed in 1959 with depleted uranium. An institutional health-physics collection, not a collector's blog.",
	},
	{
		id: "aps-fission",
		author: "American Physical Society",
		title: "December 1938: Discovery of Nuclear Fission",
		publisher: "APS News",
		year: "2007",
		url: "https://www.aps.org/apsnews/2007/12/december-1938-discovery-nuclear-fission",
		kind: "institutional",
		note: "Hahn and Strassmann's barium result and the Meitner–Frisch interpretation over Christmas 1938, including Meitner's exclusion from the 1944 Nobel.",
	},
	{
		id: "mpic",
		author: "Max Planck Institute for Chemistry",
		title: "The Discovery of Nuclear Fission",
		publisher: "mpic.de",
		year: "n.d.",
		url: "https://www.mpic.de/4469988/die-entdeckung-der-kernspaltung",
		kind: "institutional",
		note: "The successor institution to Hahn and Meitner's own institute, which fixes the 19 December 1938 date and the radiochemical separation method that produced the barium identification.",
	},
	{
		id: "fas-separation",
		author: "Federation of American Scientists",
		title: "Separation Theory",
		publisher: "FAS Nuclear Information Project",
		year: "n.d.",
		url: "https://programs.fas.org/ssp/nukes/fuelcycle/centrifuges/separation_theory.html",
		kind: "institutional",
		note: "The physics and mathematics of isotope separation, including separation factors. The technical basis for the Graham's law figure of 1.0043 per gaseous-diffusion stage.",
	},
	{
		id: "wna-cycle",
		author: "World Nuclear Association",
		title: "Nuclear Fuel Cycle Overview",
		publisher: "world-nuclear.org",
		year: "n.d.",
		url: "https://world-nuclear.org/information-library/nuclear-fuel-cycle/introduction/nuclear-fuel-cycle-overview",
		kind: "institutional",
		note: "The cycle end to end at overview level: ore grades, milling to U_{3}O_{8}, enrichment, and fuel fabrication. An industry body, so it is well-informed on process and not a neutral voice on nuclear policy — used here for the chemistry, not the politics.",
	},
	{
		id: "wna-conversion",
		author: "World Nuclear Association",
		title: "Conversion and Deconversion",
		publisher: "world-nuclear.org",
		year: "n.d.",
		url: "https://world-nuclear.org/information-library/nuclear-fuel-cycle/conversion-enrichment-and-fabrication/conversion-and-deconversion",
		kind: "institutional",
		note: "The conversion chemistry in detail: U_{3}O_{8} to UO_{2} to UF_{4} to UF_{6}, and why UF_{6} is the compound the whole industry runs on. Split out from the overview because the overview page does not carry this route step by step.",
	},
	{
		id: "nps-oakridge",
		author: "National Park Service",
		title: "Enriching Uranium",
		publisher: "Manhattan Project National Historical Park",
		year: "n.d.",
		url: "https://home.nps.gov/mapr/learn/uranium.htm",
		kind: "institutional",
		note: "The S-50 / K-25 / Y-12 series at Oak Ridge and the stage-by-stage assay increases, from the federal agency that administers the site.",
	},
	{
		id: "britannica-littleboy",
		author: "Encyclopædia Britannica",
		title: "Little Boy",
		publisher: "britannica.com",
		year: "n.d.",
		url: "https://www.britannica.com/topic/Little-Boy",
		kind: "reference",
		note: "The weapon's uranium mass and enrichment. Declassified figures vary between accounts, so the ~64 kg at roughly 80% assay is given as the standard reported range rather than a settled value.",
	},
	{
		id: "iaea-npt",
		author: "International Atomic Energy Agency",
		title: "Treaty on the Non-Proliferation of Nuclear Weapons",
		publisher: "iaea.org",
		year: "n.d.",
		url: "https://www.iaea.org/topics/non-proliferation-treaty",
		kind: "institutional",
		note: "Entry into force 5 March 1970, 191 States parties, and the Article III safeguards obligation. The agency that actually performs the verification.",
	},
	{
		id: "armscontrol-enrich",
		author: "Center for Arms Control and Non-Proliferation",
		title: "Fact Sheet: Uranium Enrichment — For Peace or for Weapons",
		publisher: "armscontrolcenter.org",
		year: "2021",
		url: "https://armscontrolcenter.org/uranium-enrichment-for-peace-or-for-weapons/",
		kind: "institutional",
		note: "The 20% LEU/HEU dividing line, the 3–5% commercial band and the ~90% weapons-grade figure, explained for a general reader. A policy advocacy organisation, so its framing is not neutral even where its numbers are standard.",
	},
	{
		id: "veritasium",
		author: "Muller, Derek (presenter); Fimeri, Wain (director)",
		title: "Uranium — Twisting the Dragon's Tail",
		publisher: "Genepool Productions, for PBS and SBS",
		year: "2015",
		url: "https://www.youtube.com/watch?v=7nKRGWhXwIg",
		kind: "film",
		note: "Three-part documentary presented by Derek Muller of Veritasium, following uranium across nine countries from the Joachimsthal mines to Chernobyl and Fukushima. Cited for what it genuinely gives you: the sense of place and scale that no data table conveys. It is a popular documentary, so every number in this piece is sourced to the references above rather than to it.",
	},
	{
		id: "openstax",
		author: "Flowers, Paul; Theopold, Klaus; Langley, Richard; Robinson, William R.",
		title: "Chemistry 2e",
		publisher: "OpenStax, Rice University",
		year: "2019",
		url: "https://openstax.org/details/books/chemistry-2e",
		kind: "textbook",
		note: "The course textbook. The basis for the isotope and weighted-average-mass reasoning, Graham's law of effusion, and the nuclear chemistry underlying the fission stage.",
	},
];

/** Lookup by id, with the display number attached. */
export const SOURCE_BY_ID: Record<string, Source & { n: number }> =
	Object.fromEntries(
		SOURCES.map((s, i) => [s.id, { ...s, n: i + 1 }]),
	);

export const KIND_LABEL: Record<SourceKind, string> = {
	reference: "Reference work",
	institutional: "Institutional",
	"peer-reviewed": "Peer-reviewed",
	museum: "Museum collection",
	conference: "Conference proceedings",
	textbook: "Textbook",
	film: "Documentary",
};
