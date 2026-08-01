import type { StageId } from "../store";

export interface StageInfo {
	id: StageId;
	index: string;
	label: string;
	title: string;
	/** One line under the title: what you are looking at. */
	lede: string;
	/** The chemistry, in two or three short paragraphs. */
	body: string[];
	/** Reaction or relation shown in the panel, plain text so it needs no math renderer. */
	equation?: string;
	/** Plain-language reading of the equation, for assistive tech. */
	equationLabel?: string;
	equationNote?: string;
	/** The number that matters at this stage. */
	figure?: { value: string; unit: string; caption: string };
}

export const STAGES: Record<StageId, StageInfo> = {
	ore: {
		id: "ore",
		index: "01",
		label: "Ore",
		title: "Mining",
		lede: "Uranium comes out of the ground as a mineral, not a metal.",
		body: [
			"The principal ore mineral is uraninite, historically called pitchblende: impure uranium dioxide. This is the same material Klaproth analysed in 1789 and the same material the Curies worked through by the ton in the 1890s.[[cite:britannica-klaproth]][[cite:nobel-curie]]",
			"Ore grade varies enormously. Some Canadian deposits run above 15% uranium; many working mines run near 0.1%.[[cite:wna-cycle]] Either way the rock is overwhelmingly not uranium, and the uranium it does contain is already 99.27% U-238.[[cite:iaea-du]]",
			"Ore bodies form because uranium changes solubility with oxidation state. As U(VI) it dissolves and travels in groundwater; where it meets reducing conditions it drops to U(IV) and precipitates. Deposits are where that transition happened.",
		],
		equation: "UO_{2}^{2+}  [soluble, U(VI)]   →   UO_{2}  [insoluble, U(IV)]",
		equationLabel:
			"Uranyl ion, uranium six, soluble, reduces to uranium dioxide, uranium four, insoluble.",
		equationNote: "Redox change is why uranium concentrates into ore bodies at all.",
		figure: {
			value: "0.72",
			unit: "% U-235",
			caption: "Natural abundance, and the same everywhere on Earth.",
		},
	},

	milling: {
		id: "milling",
		index: "02",
		label: "Mill",
		title: "Milling to yellowcake",
		lede: "Crush, leach, precipitate, dry. The output is a traded commodity.",
		body: [
			"Ore is crushed and ground, then leached, usually with sulfuric acid, which takes uranium into solution as uranyl sulfate complexes. Solvent extraction or ion exchange pulls the uranium out of that liquor and leaves most of the rock behind.",
			"Precipitating and drying the product gives yellowcake, chiefly triuranium octoxide. It is roughly 80% uranium by mass and it is what actually gets bought, sold and shipped on the world market.[[cite:wna-cycle]]",
			"Nothing here touches isotopes. Milling is ordinary separation chemistry: it separates uranium from everything that is not uranium. The U-235 fraction leaving the mill is exactly the 0.72% that went in.",
		],
		equation: "ore  →  crush  →  H_{2}SO_{4} leach  →  solvent extraction  →  U_{3}O_{8}",
		equationLabel:
			"Ore, to crushing, to sulfuric acid leach, to solvent extraction, to triuranium octoxide.",
		equationNote: "Chemical separation. Isotope ratio unchanged.",
		figure: {
			value: "~80",
			unit: "% U by mass",
			caption: "Yellowcake concentrate, up from a fraction of a percent in the ore.",
		},
	},

	conversion: {
		id: "conversion",
		index: "03",
		label: "Convert",
		title: "Conversion to UF_{6}",
		lede: "Enrichment needs a gas, and only one uranium compound will do.",
		body: [
			"Yellowcake is reduced to uranium dioxide, treated with hydrogen fluoride to give uranium tetrafluoride, then fluorinated to uranium hexafluoride.[[cite:wna-cycle]]",
			"UF_{6} is the only uranium compound that becomes a gas at a workable temperature. It sublimes rather than melting at atmospheric pressure, and it reacts violently with water, which is a large part of why enrichment plants are difficult industrial facilities.",
			"Fluorine is doing a second job here. It is monoisotopic: every fluorine atom is F-19. So the entire mass difference between the two UF_{6} molecules comes from the uranium, and none of it is smeared out by fluorine isotopes. With any other halogen the separation would be blunted.",
		],
		equation: "U_{3}O_{8}  →  UO_{2}  →  UF_{4}  →  UF_{6}",
		equationLabel:
			"Triuranium octoxide to uranium dioxide to uranium tetrafluoride to uranium hexafluoride.",
		equationNote: "349.03 g/mol with U-235 · 352.04 g/mol with U-238",
		figure: {
			value: "0.86",
			unit: "% mass difference",
			caption: "The only difference between the two molecules, which are otherwise chemically identical.",
		},
	},

	enrichment: {
		id: "enrichment",
		index: "04",
		label: "Enrich",
		title: "Centrifuge enrichment",
		lede: "The only stage where the isotope ratio changes.",
		body: [
			"A gas centrifuge spins UF_{6} at 50,000 to 70,000 rpm. The heavier U-238 molecules drift toward the wall, the lighter U-235 molecules concentrate slightly toward the axis, and a counter-current flow carries the two streams to opposite ends of the rotor.",
			"One machine barely moves the number. Thousands are plumbed in series and parallel as a cascade, each stage feeding the next, compounding a tiny effect into a usable one.[[cite:fas-separation]] The enrichment plant is a machine for multiplying a 0.86% mass difference by itself several thousand times.",
			"The same cascade produces reactor fuel and weapons material. Nothing about the hardware changes between 5% and 90%; you keep running it. That is why treaties count centrifuges and inspect assay rather than restricting uranium ore, which is common.[[cite:iaea-npt]][[cite:armscontrol-enrich]]",
		],
		equation: "r_{235} / r_{238}  =  sqrt(352.04 / 349.03)  =  1.0043",
		equationLabel:
			"Rate of uranium-235 over rate of uranium-238 equals the square root of 352.04 over 349.03, equals 1.0043.",
		equationNote:
			"Graham's law, for the older gaseous-diffusion route: 0.43% enrichment per stage, hence thousands of stages.",
	},

	fabrication: {
		id: "fabrication",
		index: "05",
		label: "Fuel",
		title: "Fuel fabrication",
		lede: "Back out of the gas phase, into a ceramic that survives a reactor core.",
		body: [
			"Enriched UF_{6} is converted back to uranium dioxide powder. The powder is pressed into cylindrical pellets roughly the size of a fingertip, then sintered at high temperature into a hard ceramic and ground to precise dimensions.",
			"Pellets are stacked into tubes of zirconium alloy, chosen because it is nearly transparent to neutrons and holds up to hot pressurised water. Sealed tubes become fuel rods; rods are bundled into assemblies; assemblies are loaded into the core.[[cite:wna-cycle]]",
			"UO_{2} is used rather than uranium metal because it tolerates the temperature and the radiation damage without melting or swelling badly, and because it holds on to most of its own fission products instead of releasing them into the coolant.",
		],
		equation: "UF_{6}  →  UO_{2} powder  →  press  →  sinter  →  clad in zircaloy",
		equationLabel:
			"Uranium hexafluoride to uranium dioxide powder, pressed, sintered, clad in zircaloy.",
		equationNote: "Melting point of UO_{2} is far above the operating temperature of the core.",
		figure: {
			value: "3–5",
			unit: "% U-235",
			caption: "Typical commercial reactor fuel: enough to sustain a chain reaction, not enough for a weapon.",
		},
	},

	fission: {
		id: "fission",
		index: "06",
		label: "Fission",
		title: "The chain reaction",
		lede: "What all the separation was for.",
		body: [
			"A slow neutron absorbed by U-235 pushes the nucleus past its fission barrier. It splits into two lighter fragments and releases two or three more neutrons.[[cite:openstax]] If more than one of those goes on to cause another fission, the reaction sustains itself.",
			"U-238 will not do this with slow neutrons. U-235 has an odd neutron count, so absorbing a neutron pairs it up and the pairing energy alone clears the barrier. U-238 has an even count, gets no pairing bonus, and needs a fast neutron. In a thermal reactor those neutrons have been moderated away, so U-238 mostly just absorbs and becomes plutonium-239.[[cite:openstax]]",
			"Each fission releases roughly 200 MeV. A chemical bond releases a few electronvolts. The ratio is about a hundred million to one, and that is the entire reason a 0.72% isotopic accident reorganised twentieth-century politics.[[cite:aps-fission]]",
		],
		equation: "^{235}U + n  →  ^{141}Ba + ^{92}Kr + 3n + ~200 MeV",
		equationLabel:
			"Uranium-235 plus a neutron gives barium-141 plus krypton-92 plus three neutrons plus about 200 mega-electronvolts.",
		equationNote:
			"One representative split among many. Fission products follow a distribution, not a single pair.",
	},
};
