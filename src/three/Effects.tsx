import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

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
 */
export default function Effects() {
	return (
		<EffectComposer multisampling={4}>
			<Bloom
				mipmapBlur
				luminanceThreshold={1}
				luminanceSmoothing={0.25}
				intensity={0.85}
			/>
			<Vignette eskil={false} offset={0.16} darkness={0.78} />
		</EffectComposer>
	);
}
