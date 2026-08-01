# Uranium

A scroll-through explainer that ends inside a working simulation of the fuel cycle. Written for a Chem 1A element report.

**Live: https://sam-t-g.github.io/chem1a-uranium-sim/**

## Two halves

**The journey** opens the page: nine scroll chapters, each with its own three.js scene, covering how an element that spent eighteen centuries as a glass pigment became the thing treaties are written about.

| | Chapter | Scene |
|---|---|---|
| — | Uranium | Ore turning under a moving rim light |
| 01 | Glassmakers used it as a pigment | Uranium glass flaring green as a UV lamp sweeps past |
| 02 | Klaproth named it after a planet | Pitchblende, and Uranus behind it |
| 03 | The barium result | A nucleus stretching, pinching and splitting, on a loop |
| 04 | Only 0.72% of it is usable | A thousand atoms drifting; seven are U-235 |
| 05 | Separating it at Oak Ridge | A separation hall running out past the fog |
| 06 | The same machine makes both | The assay scale climbing through the 20% line |
| — | The simulation | Stage 01 of the simulation, already on screen |
| — | Sources | The annotated bibliography |

The last chapter's scene *is* the simulation's first scene at the same camera, so pressing **Enter the simulation** changes the interface without cutting away from the image. A back arrow in the simulation header returns to the story.

## The simulation

Six stages, navigable from the rail at the bottom or with the ← → arrow keys. Skippable from the journey header at any point.

| | Stage | What you see |
|---|---|---|
| 01 | Ore | Uraninite with its uranium atoms drawn at true natural abundance: ten U-235 among 1,390 U-238 |
| 02 | Mill | Crush, acid leach, solvent extraction, yellowcake. Chemical separation only, isotope ratio untouched |
| 03 | Convert | Two UF₆ molecules side by side. Identical octahedral geometry, 0.86% apart in mass |
| 04 | Enrich | A cutaway gas centrifuge, plus the cascade behind it growing with the separative work you demand |
| 05 | Fuel | Pellets pressed, sintered, stacked, clad in zircaloy |
| 06 | Fission | A lattice at your chosen assay. Fire a neutron and watch whether the chain survives |

The argument the whole thing is built around: **U-235 and U-238 are chemically identical, so nothing in ordinary chemistry separates them.** The only handle is a 1.3% difference between the isotopes themselves (0.86% once they are inside UF₆), and the cost of exploiting it is what turned an isotopic accident into an object of international law.

### The assay scale

The log-scaled axis on the right of the canvas is present on every stage and never moves. It marks 0.25% tails, 0.72% natural, 5% reactor fuel, the 20% IAEA HEU line, and 90% weapons-grade. Everything else in the simulation is downstream of where the handle sits.

From stage 04 onward the scale is the control: drag the handle, click a labelled value, or focus it and use the arrow keys. Before stage 04 it is locked at natural, and says where the setting lives. The panel carries the same control as a slider, marked with the same values, for stages where the scale is too narrow to aim at.

Both controls click onto the labelled values. Without that, a drag settles at 19.96%, which prints as "20%" but is not over the threshold, and the reading contradicts the state at exactly the line the piece is about.

Cross the 20% line and the interface turns vermilion. That color appears nowhere else.

### The three stages that react to it

**Stage 04** sets the target assay. The readout gives feed, tails and separative work per kilogram of product, and the cascade behind the rotor lights in proportion to the work required. Raising the target from 4.5% to 60% lights most of the hall; the last stretch to 90% adds comparatively little. That asymmetry is the reason enrichment ceilings sit where they do in negotiated agreements.

**Stage 05** tints the pellets by enrichment. That is an encoding, not physics: real fuel pellets look the same at any assay.

**Stage 06** builds a nucleus lattice at the current assay, then induces one fission at the center. At 0.72% the released neutrons are captured by U-238 and the chain dies in a generation or two. At 90% nearly every neutron finds another U-235. Same lattice, same rules, one variable. The counts live on the canvas beside the lattice rather than in the panel, and the control sits in a dock pinned to the top of the panel, so changing the assay and firing again never means scrolling away from the scene.

## What is modeled and what is not

Worth being explicit about, because this is a teaching aid.

- **Real.** The separative work function `V(x) = (2x − 1)·ln(x/(1 − x))` and the feed/tails mass balance, in `src/lib/separation.ts`. At 4.5% product with 0.25% tails it returns ~6.9 SWU and ~9.2 kg feed per kg product, matching published tables. The Graham's law separation factor of 1.0043 is computed from real UF₆ molar masses.
- **Directionally real, magnitude exaggerated.** Centrifuge separation. Heavy really does go to the wall and light really does concentrate toward the axis, with a counter-current between the ends, but a single machine shifts the assay by a fraction of a percent, which would be invisible. The honest numbers are in the readout.
- **Illustrative only.** The chain reaction models branching and nothing else. No cross-sections, no moderation, no geometry, no delayed neutrons. It shows the logic that enrichment controls, not a neutronics result. The neutron interaction radius is a tuned visualisation parameter, not a cross-section: it applies to both isotopes identically, so it cannot tilt the outcome toward either, and it exists because in a lattice only 7 sites across, neutrons threading between sites and leaking out was drowning the assay signal the scene is built to show.
- **Adaptive.** `src/three/AdaptiveQuality.tsx` samples real frame times and moves the renderer between three tiers, dropping pixel ratio first and then bloom. It reads a rolling median rather than a mean, uses a wide dead band between the step-down and step-up thresholds, and requires a long run of good frames before recovering, so the tier cannot flicker.
- **Assay basis.** 0.72% is the atom-percent figure. On a mass basis natural uranium is 0.711%, which is what SWU tables conventionally use, so the effort figures here run a few percent low against published values.

## Stack

- **Vite + React 19 + TypeScript**
- **[@react-three/fiber](https://github.com/pmndrs/react-three-fiber)** — React renderer for three.js
- **[@react-three/drei](https://github.com/pmndrs/drei)** — `OrbitControls`, plus `Environment`/`Lightformer` for a locally generated environment map, so the page fetches nothing from a CDN at runtime
- **[@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing)** — selective bloom and vignette, shared by both canvases (`src/three/Effects.tsx`)
- **zustand** — stage and assay state
- **three.js** — instanced meshes throughout; the fission lattice, ore specks, atom crowd and centrifuge gas are each a single draw call

### The glow convention

Worth knowing before editing any scene, because bloom here is semantic rather than decorative. Only **fissile material, free neutrons, UV fluorescence, indicator lamps and the HEU state** are allowed to glow. Rock and machinery never do.

Bloom triggers on luminance above 1.0, which means:

| To make something glow | Use |
|---|---|
| A single material | `toneMapped={false}` and `emissiveIntensity > 1` |
| Per-instance, on an `instancedMesh` | HDR instance colors: `MeshBasicMaterial` with `toneMapped={false}` and `setColorAt` given a color multiplied past 1.0 |

The second row is the trap. `material.emissive` is one color for the whole instanced mesh, so setting `emissiveIntensity` on an instanced material does not give individual instances a glow — and setting it with no `emissive` color emits nothing at all. Several scenes originally had exactly that bug.

`C.hot` is reserved for one meaning: the assay has crossed the 20% HEU line. It appears nowhere else.

The journey uses ordinary DOM scrolling with a fixed canvas behind it rather than `ScrollControls`, so the chapter text stays styleable CSS and the scenes swap on whichever section owns the middle of the viewport.

No rigid-body physics engine. Rapier or cannon model collisions between solids, which is not what either simulation here needs: centrifugal isotope separation is a drift-and-counter-current problem, and a chain reaction is neutron transport with branching. Both are written directly against the behavior being shown, in `src/three/scenes/Enrichment.tsx` and `src/three/scenes/Fission.tsx`.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173/chem1a-uranium-sim/
npm run build    # typecheck + production build to dist/
npm run preview  # serve the built output
npm run deploy   # build and publish dist/ to the gh-pages branch
```

GitHub Pages serves the `gh-pages` branch. To republish after a change, run `npm run deploy`.

### Optional: deploy on push instead

A ready-to-use Actions workflow sits at `.github-workflow-pending/deploy.yml`. Committing it requires a token with `workflow` scope, which the default `gh` login does not have:

```bash
gh auth refresh -s workflow
mkdir -p .github/workflows && mv .github-workflow-pending/deploy.yml .github/workflows/
git add -A && git commit -m "Deploy via GitHub Actions" && git push
```

Then set Pages source to "GitHub Actions" in repository settings. After that, every push to `main` republishes and `npm run deploy` is no longer needed.

## Accessibility

Keyboard navigable with visible focus rings, and the layout reflows to a single column on narrow screens.

`prefers-reduced-motion` is honoured throughout: every scene renders a legible still, the journey canvas drops to an on-demand frameloop, and programmatic scrolls jump rather than glide. The fission stage is the one place where the run still advances — freezing it left the readout stuck on one neutron and the verdict reading "Propagating." forever, so the physics and counters run while the neutrons themselves stay parked. You get the result without the motion.

Fission flashes ramp in rather than switching on at full brightness, because at weapons assay dozens overlap per second and stacked instantaneous onsets are a strobe.

## Sources

Process chemistry and enrichment figures were checked against:

- [World Nuclear Association — Nuclear Fuel Cycle Overview](https://world-nuclear.org/information-library/nuclear-fuel-cycle/introduction/nuclear-fuel-cycle-overview) and [Conversion and Deconversion](https://world-nuclear.org/information-library/nuclear-fuel-cycle/conversion-enrichment-and-fabrication/conversion-and-deconversion)
- [IAEA — Getting to the Core of the Nuclear Fuel Cycle](https://www.iaea.org/sites/default/files/18/10/nuclearfuelcycle.pdf)
- [Federation of American Scientists — Separation Theory](https://programs.fas.org/ssp/nukes/fuelcycle/centrifuges/separation_theory.html)
- [CIAAW — Atomic Weight of Uranium](https://www.ciaaw.org/uranium.htm)
- [Center for Arms Control and Non-Proliferation — Uranium Enrichment](https://armscontrolcenter.org/uranium-enrichment-for-peace-or-for-weapons/)

Written for Chem 1A, Riverside Community College.
