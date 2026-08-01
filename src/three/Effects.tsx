import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useSim } from "../store";

/**
 * Shared post pipeline for both the journey and the simulation.
 *
 * Bloom is selective by luminance: only materials that push past 1.0 glow.
 * The convention across every scene is
 *
 *   toneMapped={false}  +  emissiveIntensity > 1        → blooms
 *   toneMapped={false}  +  HDR instance colors (×2+)    → blooms
 *   everything else                                      → does not
 *
 * which keeps the glow semantic: fissile material, free neutrons, UV
 * fluorescence and indicator lamps bloom; rock and machinery never do.
 *
 * The whole pass is tiered. Bloom is the most expensive thing here, so on a
 * struggling machine it loses resolution first and then switches off, leaving
 * the vignette (which costs almost nothing) to keep the framing.
 */
export default function Effects() {
	const quality = useSim((s) => s.quality);

	if (quality === "low") {
		return (
			<EffectComposer multisampling={0}>
				<Vignette eskil={false} offset={0.16} darkness={0.78} />
			</EffectComposer>
		);
	}

	const medium = quality === "medium";
	return (
		<EffectComposer multisampling={medium ? 0 : 4}>
			<Bloom
				mipmapBlur
				luminanceThreshold={1}
				luminanceSmoothing={0.25}
				intensity={medium ? 0.7 : 0.85}
				resolutionScale={medium ? 0.5 : 1}
			/>
			<Vignette eskil={false} offset={0.16} darkness={0.78} />
		</EffectComposer>
	);
}
