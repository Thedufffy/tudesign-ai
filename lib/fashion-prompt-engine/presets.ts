export type FashionPresetKey =
  | "luxury_studio_clean"
  | "editorial_cover_blue"
  | "motion_campaign"
  | "sculptural_editorial"
  | "mirror_editorial"
  | "premium_ecommerce";

export const FASHION_PRESETS: Record<FashionPresetKey, string> = {
  luxury_studio_clean: `
Preset: Luxury Studio Clean

Direction:
- clean premium studio editorial
- soft diffused key lighting
- calm and refined posing
- polished luxury campaign mood
- balanced composition
- elegant minimal backdrop
- product integrated naturally but clearly
- modern, expensive, controlled
`,

  editorial_cover_blue: `
Preset: Editorial Cover Blue

Direction:
- deep blue gradient studio environment
- high-fashion magazine cover feeling
- strong silhouette against the backdrop
- cool-toned luxury atmosphere
- refined, chic, cinematic editorial mood
- premium balance of blue, white, and neutral tones
- polished cover-shot energy
`,

  motion_campaign: `
Preset: Motion Campaign

Direction:
- subtle forward motion or fabric movement
- selected motion blur in hair, sleeves, or hems
- face remains sharp and controlled
- dynamic campaign energy
- movement-driven elegance
- directional lighting enhances motion edges
- premium cinematic fashion campaign styling
`,

  sculptural_editorial: `
Preset: Sculptural Editorial

Direction:
- fashion image with strong shape language
- voluminous garment behavior
- sculptural folds and controlled silhouette drama
- art-directed posture and elegant tension
- luxurious editorial stillness
- dramatic form without visual chaos
`,

  mirror_editorial: `
Preset: Mirror Editorial

Direction:
- mirror-based editorial composition
- reflected depth and layered image reading
- precise, enigmatic, premium styling
- clean studio geometry
- subtle surreal sophistication
- luxury editorial narrative with reflection
`,

  premium_ecommerce: `
Preset: Premium Ecommerce

Direction:
- cleaner commercial presentation
- highly legible garment and product visibility
- minimal distraction
- refined but less cinematic than campaign mode
- premium catalog-quality look
- realistic fit, texture, and surface clarity
- conversion-friendly but still luxurious
`,
};