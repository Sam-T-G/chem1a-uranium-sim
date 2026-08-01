import type { StageId } from "../store";
import type { Reaction } from "../ui/Reaction";

export interface StageInfo {
	id: StageId;
	index: string;
	label: string;
	title: string;
	/** One line under the title: what you are looking at. */
	lede: string;
	/** The chemistry, in two or three short paragraphs. */
	body: string[];
	/** Structured reaction for the panel. */
	reaction?: Reaction;
	/** Plain-language reading of the reaction, for assistive tech. */
	reactionLabel?: string;
	/** One line under the reaction: what it means, not what it says. */
	reactionNote?: string;
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
			"The main ore mineral is uraninite, historically called pitchblende. It is mostly uranium dioxide with impurities, and it is the same material Klaproth analyzed in 1789 and the Curies worked through by the ton in the 1890s.[[cite:britannica-klaproth]][[cite:nobel-curie]]",
			"Ore grade varies a lot. Some Canadian deposits run above 15% uranium; many working mines are near 0.1%.[[cite:wna-cycle]] Either way the rock is mostly not uranium, and the uranium in it is already 99.27% U-238.[[cite:iaea-du]]",
			"Ore deposits exist because uranium's solubility depends on its oxidation state. In its +6 state it dissolves in groundwater and travels. When that water reaches rock that reduces it to +4, it comes out of solution and stays put. Deposits are where that happened, over and over, for a long time.",
		],
		reaction: {
			kind: "chain",
			steps: [
				{ formula: "UO_{2}^{2+}", label: "U(VI) · dissolves and travels" },
				{ formula: "UO_{2}", label: "U(IV) · precipitates and stays" },
			],
		},
		reactionLabel:
			"The uranyl ion, uranium in the plus six state, is reduced to uranium dioxide, uranium in the plus four state.",
		reactionNote:
			"Gaining electrons drops uranium from +6 to +4, and the +4 form is not soluble. That one redox step is what concentrates it into ore.",
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
		lede: "Crush it, dissolve it, pull the uranium back out, dry it.",
		body: [
			"The ore is crushed and ground, then soaked in sulfuric acid, which dissolves the uranium and leaves most of the rock behind as solid waste. The uranium is then pulled back out of that solution and concentrated.",
			"Drying what comes out gives yellowcake, mostly triuranium octoxide. It is around 80% uranium by mass, and it is the form uranium is actually bought and sold in.[[cite:wna-cycle]]",
			"None of this touches isotopes. Milling separates uranium from everything that is not uranium, which is ordinary chemistry. The U-235 fraction leaving the mill is the same 0.72% that went in.",
		],
		reaction: {
			kind: "chain",
			steps: [
				{ formula: "ore", label: "0.1–15% U" },
				{ formula: "crush", label: "grind it fine" },
				{ formula: "H_{2}SO_{4}", label: "dissolve the uranium" },
				{ formula: "U_{3}O_{8}", label: "yellowcake · ~80% U" },
			],
		},
		reactionLabel:
			"Ore is crushed, dissolved in sulfuric acid, and dried to triuranium octoxide.",
		reactionNote:
			"Every step here is a chemical separation, so the ratio of U-235 to U-238 does not move.",
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
			"Yellowcake is converted to uranium dioxide, reacted with hydrogen fluoride to make uranium tetrafluoride, then reacted with more fluorine to make uranium hexafluoride.[[cite:wna-conversion]]",
			"UF_{6} is the only uranium compound that becomes a gas at a temperature you can work with. At normal pressure it goes straight from solid to gas without melting first, and it reacts violently with water, which is part of why enrichment plants are hard to build and run.",
			"Fluorine is a lucky choice for a second reason: it has only one naturally occurring isotope, F-19. So the whole mass difference between the two UF_{6} molecules comes from the uranium. If fluorine came in several isotopes, that difference would be blurred and the separation would be even harder.",
		],
		reaction: {
			kind: "chain",
			steps: [
				{ formula: "U_{3}O_{8}", label: "yellowcake" },
				{ formula: "UO_{2}", label: "oxide" },
				{ formula: "UF_{4}", label: "with HF" },
				{ formula: "UF_{6}", label: "gas · the enrichment feed" },
			],
		},
		reactionLabel:
			"Triuranium octoxide to uranium dioxide to uranium tetrafluoride to uranium hexafluoride.",
		reactionNote:
			"The two versions of the finished gas weigh 349.03 and 352.04 g/mol. Everything after this depends on that gap.",
		figure: {
			value: "0.86",
			unit: "% mass difference",
			caption:
				"The only difference between the two molecules, which are otherwise chemically identical.",
		},
	},

	enrichment: {
		id: "enrichment",
		index: "04",
		label: "Enrich",
		title: "Centrifuge enrichment",
		lede: "The only stage where the isotope ratio changes.",
		body: [
			"A gas centrifuge spins UF_{6} at 50,000 to 70,000 rpm. Spinning that fast throws the heavier U-238 molecules toward the outer wall and leaves the lighter U-235 slightly concentrated nearer the middle. Gas is drawn off separately from the middle and from the wall, so one stream comes out a little richer and the other a little poorer.",
			"One machine barely moves the number. Thousands are connected so each one feeds the next, and a tiny effect repeated thousands of times becomes a usable one.[[cite:fas-separation]] That is what an enrichment plant is: a way of multiplying a 0.86% mass difference by itself over and over.",
			"The same setup makes reactor fuel and weapons material. Nothing about the machines changes between 5% and 90%, you just keep running them. That is why treaties count centrifuges and check enrichment levels rather than restricting uranium ore, which is common.[[cite:iaea-npt]][[cite:armscontrol-enrich]]",
		],
		reaction: {
			kind: "relation",
			expr: "r_{235} / r_{238}  =  sqrt(352.04 / 349.03)",
			result: "1.0043",
			resultLabel: "per stage",
		},
		reactionLabel:
			"The ratio of the rates for uranium-235 and uranium-238 equals the square root of 352.04 over 349.03, which is 1.0043.",
		reactionNote:
			"Graham's law, from the older gaseous-diffusion method: lighter molecules move faster, by the inverse square root of their mass. A 0.43% gain per pass is why those plants needed thousands of stages.",
	},

	fabrication: {
		id: "fabrication",
		index: "05",
		label: "Fuel",
		title: "Fuel fabrication",
		lede: "Out of the gas phase and into a ceramic that can sit in a reactor.",
		body: [
			"The enriched UF_{6} is converted back into uranium dioxide powder. That powder is pressed into small cylindrical pellets about the size of a fingertip, baked at high temperature until it hardens into a dense ceramic, and ground to an exact size.",
			"The pellets are stacked inside tubes of zirconium alloy, which is used because neutrons pass through it easily and it holds up to hot pressurized water. Sealed tubes are fuel rods, rods are bundled into assemblies, and assemblies go into the reactor core.[[cite:wna-cycle]]",
			"UO_{2} is used instead of uranium metal because it handles the heat and the radiation without melting or swelling badly, and because it keeps most of the fragments left over from fission locked inside the pellet instead of letting them into the coolant.",
		],
		reaction: {
			kind: "chain",
			steps: [
				{ formula: "UF_{6}", label: "enriched gas" },
				{ formula: "UO_{2}", label: "powder" },
				{ formula: "pellet", label: "pressed and baked" },
				{ formula: "fuel rod", label: "sealed in zirconium alloy" },
			],
		},
		reactionLabel:
			"Uranium hexafluoride to uranium dioxide powder, pressed and baked into pellets, then sealed into fuel rods.",
		reactionNote:
			"UO_{2} melts far above the temperature a reactor runs at, which is most of why the fuel is a ceramic rather than a metal.",
		figure: {
			value: "3–5",
			unit: "% U-235",
			caption:
				"Typical commercial reactor fuel: enough to sustain a chain reaction, not enough for a weapon.",
		},
	},

	fission: {
		id: "fission",
		index: "06",
		label: "Fission",
		title: "The chain reaction",
		lede: "What all the separation was for.",
		body: [
			"When U-235 absorbs a slow neutron, the nucleus becomes unstable enough to split. It breaks into two smaller nuclei and throws out two or three more neutrons.[[cite:openstax]] If more than one of those goes on to split another nucleus, the reaction keeps itself going.",
			"U-238 will not do this with slow neutrons. U-235 has an odd number of neutrons, so an incoming neutron pairs up with the odd one, and the energy released by that pairing is enough on its own to split the nucleus. U-238 has an even number, gains nothing from pairing, and needs a much faster neutron instead. Reactors deliberately slow their neutrons down, so U-238 mostly just absorbs them and becomes plutonium-239.[[cite:openstax]]",
			"Each fission releases roughly 200 MeV. Breaking a chemical bond releases a few electronvolts. That is a factor of about a hundred million, and it is why a 0.72% isotopic accident ended up reorganizing twentieth-century politics.[[cite:aps-fission]]",
		],
		reaction: {
			kind: "equation",
			lhs: [
				{ formula: "^{235}U", label: "fissile" },
				{ formula: "n", label: "slow neutron" },
			],
			rhs: [
				{ formula: "^{141}Ba" },
				{ formula: "^{92}Kr" },
				{ formula: "3n", label: "keeps the chain going" },
				{ formula: "~200 MeV" },
			],
		},
		reactionLabel:
			"Uranium-235 plus a neutron gives barium-141 plus krypton-92 plus three neutrons plus about 200 mega-electronvolts.",
		reactionNote:
			"This is one common way it splits, not the only one. The two pieces come out in a range of sizes, and the neutron count varies between two and three.",
	},
};
