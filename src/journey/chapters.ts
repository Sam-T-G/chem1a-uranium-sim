export type ChapterId =
	| "intro"
	| "glass"
	| "name"
	| "berlin"
	| "problem"
	| "oakridge"
	| "line"
	| "handoff"
	| "sources";

export interface Chapter {
	id: ChapterId;
	/** Two-digit sequence numeral, rendered as the ghost behind the card. */
	index?: string;
	/** One-word label for the progress rail. */
	short: string;
	/** Small label above the heading. Empty for the intro and handoff. */
	kicker?: string;
	heading: string;
	/** Body paragraphs. */
	body: string[];
	/** The one number this chapter turns on. */
	stat?: { value: string; unit: string; note: string };
}

export const CHAPTERS: Chapter[] = [
	{
		id: "intro",
		short: "Intro",
		heading: "Uranium",
		body: [
			"After watching *Oppenheimer* when it came out I got interested in uranium, and ended up reading about it for a lot longer than I meant to.",
			"The film is about physicists and politics. The thing that stuck with me was a chemistry problem it mostly skips over: to build the bomb they had to separate two versions of the same element, and those two versions behave identically in every chemical reaction you can run. There is no reaction that tells them apart.",
			"I wanted to know how you get around that. This is what I found, with a simulation of the process at the end.[[cite:veritasium]]",
		],
	},

	{
		id: "glass",
		index: "01",
		short: "Pigment",
		kicker: "79 CE – 1930s",
		heading: "Mostly it was used to colour glass",
		body: [
			"Miners in Bohemia hit uranium ore while digging for silver. They called it pitchblende, roughly \"bad luck rock\", because finding it meant the silver had run out. It went on the waste pile.[[cite:strahan]]",
			"It turned out to be good for one thing. Ground up and stirred into molten glass it gave a yellow-green colour that was hard to get any other way. Glassmakers were doing this from the late Middle Ages, and a piece of yellow glass from a Roman villa near Naples, dated to around 79 CE, contains about 1% uranium oxide.[[cite:strahan]]",
			"That stayed uranium's main job for centuries: glass, glazes, and orange dinner plates.[[cite:orau-fiesta]]",
			"The glow you see under UV light is ordinary chemistry rather than radioactivity. The uranyl ion absorbs ultraviolet and re-emits green. People still collect the glass.[[cite:strahan]]",
		],
	},

	{
		id: "name",
		index: "02",
		short: "The name",
		kicker: "1789 – 1896",
		heading: "It is named after a planet",
		body: [
			"In 1789 a Berlin chemist called Martin Heinrich Klaproth dissolved pitchblende in acid and got a yellow compound that matched nothing known. He had found a new element.[[cite:britannica-klaproth]]",
			"He named it after Uranus, which William Herschel had spotted eight years earlier. The name has nothing to do with the element. The planet was just recent news.",
			"He also got it wrong. He reduced his compound with charcoal, got a black powder, and announced he had the metal. It was an oxide. Eugène Péligot corrected that in 1841 and made the actual metal.[[cite:britannica-peligot]][[cite:rsc]]",
			"A century later Henri Becquerel left uranium salts on wrapped photographic plates in a drawer, because Paris was overcast and he was waiting for sun. He developed the plates anyway and they were fogged. The uranium had been emitting something through black paper, in the dark, with nothing going in.[[cite:aps-becquerel]]",
			"Marie Curie named that radioactivity. She also noticed pitchblende was more radioactive than its uranium content could account for, concluded there were unknown elements in it, and found polonium and radium. Both are steps in uranium's own decay chain, which nobody knew existed yet.[[cite:nobel-curie]]",
		],
	},

	{
		id: "berlin",
		index: "03",
		short: "Fission",
		kicker: "December 1938",
		heading: "The barium result",
		body: [
			"Otto Hahn and Fritz Strassmann were firing neutrons at uranium in Berlin and chemically separating whatever came back out. Everyone expected slightly heavier elements.",
			"Their chemistry kept saying one of the products was barium.[[cite:mpic]]",
			"Uranium is element 92 and barium is 56. Nothing known at the time took thirty-six protons off a nucleus. Hahn wrote to Lise Meitner about it. The chemistry was solid and neither of them could explain it.[[cite:aps-fission]][[cite:mpic]]",
			"Meitner had fled Germany five months earlier and was in Sweden. Over Christmas, walking with her nephew Otto Frisch, she worked it out: treat the nucleus as a drop of liquid and a large enough one can stretch and split in two. She did the mass arithmetic, found the pieces weighed less than the original, and converted the difference to energy.[[cite:aps-fission]]",
			"Frisch borrowed a word from biology and called it fission.",
			"Hahn published without her and took the 1944 Nobel alone. Meitner never got one.[[cite:aps-fission]]",
		],
		stat: {
			value: "200",
			unit: "MeV per split",
			note: "A chemical reaction gives a few electronvolts per molecule. Fission gives about a hundred million times more per event, which is why everything after 1938 went the way it did.",
		},
	},

	{
		id: "problem",
		index: "04",
		short: "0.72%",
		kicker: "The actual problem",
		heading: "Only 0.72% of it is usable",
		body: [
			"Not all uranium fissions.",
			"What comes out of the ground is 99.27% uranium-238, which will not sustain a chain reaction with slow neutrons. The isotope that will is uranium-235, and it is 0.72% of the total, or about one atom in 139.[[cite:iaea-du]][[cite:ciaaw]]",
			"The reason is small. Uranium-235 has an odd number of neutrons, so absorbing one more pairs them up, and the energy released by that pairing is enough on its own to split the nucleus. Uranium-238 has an even number, gets no pairing energy, and just absorbs the neutron.[[cite:openstax]]",
			"So you need more U-235 than nature gives you, which means separating the two isotopes. This is where chemistry stops being any help.",
			"They are the same element. Same protons, same electrons, same bonds, same reactions. Nothing in the chemical toolkit tells them apart, because chemically there is nothing to tell apart.",
			"The only difference is three neutrons, about 1.3% of the mass. That is the entire thing you have to work with.[[cite:ciaaw]]",
		],
	},

	{
		id: "oakridge",
		index: "05",
		short: "Oak Ridge",
		kicker: "1943 – 1945",
		heading: "Separating it at Oak Ridge",
		body: [
			"To use a mass difference you put the uranium into gas form and let the lighter molecules move slightly faster. That needs a uranium compound that is a gas at a workable temperature, and there is only one: uranium hexafluoride.[[cite:wna-conversion]]",
			"Fluorine helps because it has a single isotope. The whole mass difference between the two UF_{6} molecules comes from the uranium, and nothing blurs it.",
			"Push UF_{6} through a porous barrier and the lighter molecules get through slightly faster. Graham's law gives the ratio, and it works out to about four tenths of one percent per pass. Getting from 0.72% to weapons grade means repeating that thousands of times.[[cite:fas-separation]][[cite:openstax]]",
			"So in 1943 the US built K-25 in Tennessee to do exactly that. Three plants ran in series: S-50 took the assay to about 0.9%, K-25 carried it further, and Y-12 finished it at around 90%.[[cite:nps-oakridge]] K-25 was, on completion, the largest building in the world by floor area, and around 75,000 people lived in a city that did not appear on maps.",
		],
		stat: {
			value: "1.0043",
			unit: "separation per stage",
			note: "sqrt(352.04 / 349.03). Little Boy carried about 64 kg of uranium at roughly 80% enrichment, and under a kilogram of it actually fissioned. Declassified figures vary between accounts.[[cite:britannica-littleboy]]",
		},
	},

	{
		id: "line",
		index: "06",
		short: "The line",
		kicker: "1970 – now",
		heading: "The same machines make both",
		body: [
			"Modern plants use centrifuges rather than porous barriers, but the logic is the same: spin UF_{6} hard, heavy drifts outward, light stays nearer the axis, take the middle, feed the next machine, repeat.[[cite:wna-cycle]]",
			"Reactor fuel is 3–5% U-235. Weapons are around 90%. The hardware is the same either way, so getting from one to the other is a matter of running the machines longer.[[cite:armscontrol-enrich]]",
			"That is why the IAEA draws its line at 20% and why inspectors count centrifuges rather than uranium. Ore is common. Enrichment capacity is not.[[cite:iaea-npt]][[cite:armscontrol-enrich]]",
			"The work is also front-loaded. Getting to 60% takes most of the effort needed to reach 90%, so a stockpile sitting at 60% is closer to weapons grade than the number suggests, and negotiated caps sit well below it.",
			"This is where I spent most of my time. I started with a chemistry question and ended up reading about treaties, because the percentages in news coverage are chemistry numbers. When a headline gives an enrichment level, that is a position on a scale from 0.72% to 90%, and the distance between any two points on it is a real amount of work.",
		],
	},

	{
		id: "handoff",
		short: "Simulation",
		heading: "The simulation",
		body: [
			"What follows is the process in six stages, from ore to chain reaction. Two of them you can change.",
			"In the enrichment stage you set the target assay and see what it costs. Reactor fuel takes about 7 separative work units per kilogram and weapons grade takes over 200, both computed from the standard separative-work formula rather than quoted.[[cite:fas-separation]] The wall of centrifuges behind the machine lights up in proportion.",
			"In the fission stage you set the enrichment and fire a neutron. At 0.72% the chain stops almost immediately, because nearly every nucleus it meets is uranium-238. At 90% it does not stop.",
		],
	},

	{
		id: "sources",
		short: "Sources",
		kicker: "Works cited",
		heading: "Sources",
		body: [
			"Every number here comes from one of the sources below, and any claim with a marker next to it links to the entry that supports it.",
			"The notes say what each source is good for and, in a few cases, what it is not. An industry body knows its own process chemistry but is not neutral on policy. A documentary is good for scale and place, not for figures.",
			"Where sources disagree the text says so rather than picking one. Declassified weapon masses are the clearest example.",
		],
	},
];

export const CHAPTER_IDS = CHAPTERS.map((c) => c.id);
