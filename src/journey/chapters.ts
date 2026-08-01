export type ChapterId =
	| "intro"
	| "glass"
	| "name"
	| "berlin"
	| "problem"
	| "oakridge"
	| "line"
	| "handoff";

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
	/** Pulled-out line, set larger. */
	pull?: string;
}

export const CHAPTERS: Chapter[] = [
	{
		id: "intro",
		short: "Intro",
		heading: "The rock nobody wanted",
		body: [
			"I picked uranium because of a movie.",
			"I watched *Oppenheimer* and came out stuck on something the film mostly moves past. The story is about physicists and politics, but underneath all of it is a chemistry problem nobody in the theater is thinking about: they had to separate two versions of the same element that behave identically in every chemical reaction you can run.",
			"That was the part I could not let go of. Not the bomb. The separation.",
			"So I went looking into how you actually do that. This is what I found, and at the end you can run the whole process yourself.",
		],
	},

	{
		id: "glass",
		index: "01",
		short: "Pigment",
		kicker: "79 CE – 1930s",
		heading: "For eighteen centuries it was just a pigment",
		body: [
			"Miners in Bohemia dug through uranium to reach silver. They called the heavy black rock pitchblende, roughly \"bad luck rock,\" because hitting it meant the silver had run out. It went on the waste pile.",
			"Eventually somebody found the waste pile was good for one thing. Ground up and stirred into molten glass, it turned the glass a beautiful yellow-green. Glassmakers had been doing it since the late Middle Ages, and a fragment of yellow glass from a Roman villa near Naples, dated to around 79 CE, contains about 1% uranium oxide.",
			"That was the entire job. Pigment. Glass and glazes and orange dinner plates, for roughly eighteen hundred years.",
			"The glow is real and it is still just chemistry. The uranyl ion soaks up ultraviolet and hands back visible green. People collect the stuff. It sat in china cabinets for a century before anybody had the faintest idea what else was in there.",
		],
		pull: "Uranium's first job was making things pretty.",
	},

	{
		id: "name",
		index: "02",
		short: "The name",
		kicker: "1789 – 1896",
		heading: "Named after a planet, by a man who never held it",
		body: [
			"In 1789 a Berlin chemist named Martin Heinrich Klaproth dissolved pitchblende in acid and got a yellow compound matching nothing known. A new element.",
			"He named it after Uranus, which William Herschel had spotted eight years earlier and which was still the exciting new thing. The most politically loaded element on the periodic table is named after a planet basically because the planet was in the news.",
			"Then he made a mistake that stood for fifty-two years. He reduced his compound with charcoal, got a black powder, and announced the metal. It was an oxide. Eugène Péligot sorted it out in 1841 and made the real thing.",
			"A century later Henri Becquerel left uranium salts on wrapped photographic plates in a closed drawer, because Paris was overcast and he was waiting for sun. He developed them anyway. They were fogged. The uranium had been firing something through black paper in the dark, with no energy going in.",
			"Marie Curie named that radioactivity. Then she noticed pitchblende was more radioactive than its uranium could account for, concluded there were unknown elements hiding in it, and found polonium and radium. Both, it turns out, are steps in uranium's own decay chain. She was reading a decay series decades before anyone knew decay series existed.",
		],
	},

	{
		id: "berlin",
		index: "03",
		short: "Fission",
		kicker: "December 1938",
		heading: "Barium, where barium could not possibly be",
		body: [
			"Otto Hahn and Fritz Strassmann were firing neutrons at uranium in Berlin and carefully separating whatever came out. Everyone assumed you got slightly heavier elements. Add a particle, get something bigger. Obvious.",
			"Their chemistry kept insisting one product was barium.",
			"Uranium is element 92. Barium is element 56. Known reactions chipped small pieces off a nucleus. Nothing on Earth removed thirty-six protons. Hahn wrote to Lise Meitner that as chemists the result plainly said barium, and that as people who knew physics they could not bring themselves to say so out loud.",
			"Meitner was in Sweden, having fled Germany five months earlier. Over Christmas, walking in the snow with her nephew Otto Frisch, she worked it out: treat the nucleus as a wobbling drop of liquid, and a big enough one can stretch, pinch, and split. She did the mass arithmetic, found the pieces weighed less than the whole, and turned the difference into energy.",
			"Frisch borrowed a word from biology. Fission.",
			"Hahn published without her name on it and took the 1944 Nobel alone. She never got one.",
		],
		stat: {
			value: "200",
			unit: "MeV per split",
			note: "A chemical reaction gives you a few electronvolts per molecule. This is about a hundred million times more, per event. That ratio is why everything after 1938 happened.",
		},
	},

	{
		id: "problem",
		index: "04",
		short: "0.72%",
		kicker: "The actual problem",
		heading: "Only one atom in 139 is any use",
		body: [
			"Not all uranium fissions.",
			"What comes out of the ground is 99.27% uranium-238, which will not sustain a chain reaction with slow neutrons. The isotope that will is uranium-235, and it is 0.72% of the total. One atom in about a hundred and thirty-nine.",
			"The reason is almost silly. Uranium-235 has an odd number of neutrons, so when it absorbs one more they pair up, and the energy released by that pairing alone is enough to tip the nucleus over into splitting. Uranium-238 has an even number, gets no bonus, and just quietly swallows the neutron.",
			"So you need more U-235 than nature hands you. Which means separating the two. Which is where chemistry hits a wall it cannot climb.",
			"They are **the same element**. Same protons, same electrons, same bonds, same reactions. No precipitation, no filtration, no titration, nothing in the entire chemical toolkit tells them apart, because chemically there is nothing to tell apart. Every reaction that works on one works exactly the same on the other.",
			"The only difference is three neutrons. About 1.3% of the mass.",
		],
		pull: "That is the whole handle. One and a third percent, and you have to build an industry on it.",
	},

	{
		id: "oakridge",
		index: "05",
		short: "Oak Ridge",
		kicker: "1943 – 1945",
		heading: "So they built the largest building in the world",
		body: [
			"To use a mass difference you put the uranium in the gas phase and let lighter molecules move slightly faster. That needs a uranium compound that is a gas at a workable temperature, and there is exactly one: uranium hexafluoride.",
			"Fluorine is a lucky break. It comes in one isotope only, so the entire mass difference between the two UF₆ molecules comes from the uranium and none of it gets blurred. With almost any other element in that slot the gap would smear out.",
			"Push UF₆ through a porous barrier and the lighter molecules get through a little faster. Graham's law tells you how much faster, and the answer is the number that should stop you.",
			"Four tenths of one percent per pass. To climb from 0.72% to weapons grade you repeat that thousands of times in a row.",
			"So in 1943 the United States built K-25 in Tennessee to do exactly that, and when it was finished it was the largest building in the world by floor area. Oak Ridge pulled a serious fraction of the country's entire electricity supply. Seventy-five thousand people lived in a city that was not on any map, and nearly none of them knew what they were making.",
			"They were making a number go up by four tenths of a percent at a time.",
		],
		stat: {
			value: "1.0043",
			unit: "separation per stage",
			note: "√(352.04 / 349.03). Little Boy carried about 64 kg of uranium near 80% enrichment. Under one kilogram of it actually fissioned.",
		},
	},

	{
		id: "line",
		index: "06",
		short: "The line",
		kicker: "1970 – now",
		heading: "The same machine makes both",
		body: [
			"Modern plants spin UF₆ in centrifuges at fifty to seventy thousand rpm instead of pushing it through barriers, but the logic is identical: heavy drifts out, light stays in, take the middle, feed the next machine, repeat a few thousand times.",
			"And this is where the chemistry turns into politics, in one sentence. **The machine that makes reactor fuel and the machine that makes weapons material are the same machine.** Power reactors run on 3–5%. Weapons use about 90%. Getting from one to the other does not take different equipment. It takes leaving the equipment running.",
			"That is why the IAEA draws a line at 20%, and why inspectors count centrifuges rather than counting uranium ore. Ore is everywhere and nobody worries about it. Enrichment capacity is the thing.",
			"There is one more wrinkle that sharpens it. The work is front-loaded: getting to 60% eats most of the effort needed to reach 90%, and the last stretch is comparatively cheap. A stockpile sitting at 60% is, in work remaining, most of the way there. Which is why negotiated caps sit far below it and why every step up the scale reads as escalation.",
			"I started this because of a film and expected to end with a chemistry report. I ended up following geopolitics instead, because the numbers in the news turned out to be chemistry numbers. When a headline gives an enrichment percentage, that is a position on a scale running from 0.72% to 90%, and the gap between any two points on it is a real quantity of work somebody has to do with real machines.",
			"I did not know that before. Now I cannot read it any other way.",
		],
		pull: "Nothing about uranium changed between 1937 and 1945. We just found out what it does.",
	},

	{
		id: "handoff",
		short: "Run it",
		heading: "Now run it yourself",
		body: [
			"Reading that enrichment is hard is not the same as seeing why.",
			"What follows is the whole process in six stages, from rock to chain reaction. Two of them you can drive.",
			"In **enrichment**, move the assay slider and watch what it costs. Reactor fuel takes about 7 units of separation work per kilogram. Weapons grade takes over 200. The wall of centrifuges behind the machine lights up in proportion, so the effort curve is something you see instead of something you read.",
			"In **fission**, set the enrichment low and fire a neutron. The chain dies almost immediately, because nearly every nucleus it meets is uranium-238 and just swallows it. Then set it to 90% and fire again. Same lattice, same rules, one variable.",
			"That comparison is this whole story in about four seconds.",
		],
	},
];

export const CHAPTER_IDS = CHAPTERS.map((c) => c.id);
