# Uranium-235 — the fuel cycle, stage by stage

An animated 3D walkthrough of what happens to uranium between the mine and the reactor core, built as a companion to a Chem 1A element report.

**Live: https://sam-t-g.github.io/chem1a-uranium-sim/**

## What it shows

Six stages, navigable from the rail at the bottom or with the ← → arrow keys.

| | Stage | What you see |
|---|---|---|
| 01 | Ore | Uraninite with its uranium atoms drawn at true natural abundance: ten U-235 among 1,390 U-238 |
| 02 | Mill | Crush, acid leach, solvent extraction, yellowcake. Chemical separation only, isotope ratio untouched |
| 03 | Convert | Two UF₆ molecules side by side. Identical octahedral geometry, 1.3 % apart in mass |
| 04 | Enrich | A cutaway gas centrifuge, plus the cascade behind it growing with the separative work you demand |
| 05 | Fuel | Pellets pressed, sintered, stacked, clad in zircaloy |
| 06 | Fission | A lattice at your chosen assay. Fire a neutron and watch whether the chain survives |

The argument the whole thing is built around: **U-235 and U-238 are chemically identical, so nothing in ordinary chemistry separates them.** The only handle is a 1.3 % mass difference, and the cost of exploiting it is what turned an isotopic accident into an object of international law.

### The assay ladder

The log-scaled axis on the right of the canvas is present on every stage and never moves. It marks 0.25 % tails, 0.72 % natural, 5 % reactor fuel, the 20 % IAEA HEU line, and 90 % weapons-grade. Everything else in the simulation is downstream of where that marker sits.

Cross the 20 % line and the interface turns vermilion. That colour appears nowhere else.

### The two interactive stages

**Stage 04** sets the target assay. The readout gives feed, tails and separative work per kilogram of product, and the cascade behind the rotor lights in proportion to the work required. Raising the target from 4.5 % to 60 % lights most of the hall; the last stretch to 90 % adds comparatively little. That asymmetry is the reason enrichment ceilings sit where they do in negotiated agreements.

**Stage 06** builds a nucleus lattice at whatever assay stage 04 left behind, then induces one fission at the centre. At 0.72 % the released neutrons are captured by U-238 and the chain dies in a generation or two. At 90 % nearly every neutron finds another U-235. Same lattice, same rules, one variable.

## What is modelled and what is not

Worth being explicit about, because this is a teaching aid.

- **Real.** The separative work function `V(x) = (2x − 1)·ln(x/(1 − x))` and the feed/tails mass balance, in `src/lib/separation.ts`. At 4.5 % product with 0.25 % tails it returns ~6.9 SWU and ~9.2 kg feed per kg product, matching published tables. The Graham's law separation factor of 1.0043 is computed from real UF₆ molar masses.
- **Directionally real, magnitude exaggerated.** Centrifuge separation. Heavy really does go to the wall and light really does concentrate toward the axis, with a counter-current between the ends, but a single machine shifts the assay by a fraction of a percent, which would be invisible. The honest numbers are in the readout.
- **Illustrative only.** The chain reaction models branching and nothing else. No cross-sections, no moderation, no geometry, no delayed neutrons. It shows the logic that enrichment controls, not a neutronics result.
- **Assay basis.** 0.72 % is the atom-percent figure. On a mass basis natural uranium is 0.711 %, which is what SWU tables conventionally use, so the effort figures here run a few percent low against published values.

## Stack

- **Vite + React 19 + TypeScript**
- **[@react-three/fiber](https://github.com/pmndrs/react-three-fiber)** — React renderer for three.js
- **[@react-three/drei](https://github.com/pmndrs/drei)** — `OrbitControls`, plus `Environment`/`Lightformer` for a locally generated environment map, so the page fetches nothing from a CDN at runtime
- **zustand** — stage and assay state
- **three.js** — instanced meshes throughout; the fission lattice, ore specks and centrifuge gas are each a single draw call

No rigid-body physics engine. Rapier or cannon model collisions between solids, which is not what either simulation here needs: centrifugal isotope separation is a drift-and-counter-current problem, and a chain reaction is neutron transport with branching. Both are written directly against the behaviour being shown, in `src/three/scenes/Enrichment.tsx` and `src/three/scenes/Fission.tsx`.

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

Keyboard navigable, visible focus rings, `prefers-reduced-motion` respected (animation stops, scenes stay readable), and the layout reflows to a single column on narrow screens.

## Sources

Process chemistry and enrichment figures were checked against:

- [World Nuclear Association — Nuclear Fuel Cycle Overview](https://world-nuclear.org/information-library/nuclear-fuel-cycle/introduction/nuclear-fuel-cycle-overview) and [Conversion and Deconversion](https://world-nuclear.org/information-library/nuclear-fuel-cycle/conversion-enrichment-and-fabrication/conversion-and-deconversion)
- [IAEA — Getting to the Core of the Nuclear Fuel Cycle](https://www.iaea.org/sites/default/files/18/10/nuclearfuelcycle.pdf)
- [Federation of American Scientists — Separation Theory](https://programs.fas.org/ssp/nukes/fuelcycle/centrifuges/separation_theory.html)
- [CIAAW — Atomic Weight of Uranium](https://www.ciaaw.org/uranium.htm)
- [Center for Arms Control and Non-Proliferation — Uranium Enrichment](https://armscontrolcenter.org/uranium-enrichment-for-peace-or-for-weapons/)

Written for Chem 1A, Riverside Community College.
