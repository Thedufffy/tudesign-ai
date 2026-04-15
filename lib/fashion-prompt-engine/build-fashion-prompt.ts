import { FASHION_EDITORIAL_BASE } from "./base";
import { FASHION_PRESETS, type FashionPresetKey } from "./presets";
import {
  buildAngleModifier,
  buildAtmosphereModifier,
  buildLensModifier,
  buildLightingModifier,
  buildProductFocusModifier,
  type AngleOption,
  type AtmosphereOption,
  type LensOption,
  type LightingOption,
  type ProductFocusOption,
} from "./modifiers";

export type BuildFashionPromptInput = {
  preset: FashionPresetKey;
  lens: LensOption;
  angle: AngleOption;
  lighting: LightingOption;
  atmosphere: AtmosphereOption[];
  productFocus: ProductFocusOption;

  subjectDescription: string;
  garmentDescription?: string;
  productDescription?: string;
  backgroundDescription?: string;
  poseDescription?: string;
  extraDirection?: string;
};

export function buildFashionPrompt(input: BuildFashionPromptInput) {
  const sections = [
    FASHION_EDITORIAL_BASE,
    FASHION_PRESETS[input.preset],
    buildLensModifier(input.lens),
    buildAngleModifier(input.angle),
    buildLightingModifier(input.lighting),
    buildAtmosphereModifier(input.atmosphere),
    buildProductFocusModifier(input.productFocus),

    `
Subject:
${input.subjectDescription}
`.trim(),

    input.garmentDescription
      ? `
Garment / styling:
${input.garmentDescription}
`.trim()
      : "",

    input.productDescription
      ? `
Product:
${input.productDescription}
`.trim()
      : "",

    input.backgroundDescription
      ? `
Background / set:
${input.backgroundDescription}
`.trim()
      : "",

    input.poseDescription
      ? `
Pose / composition:
${input.poseDescription}
`.trim()
      : "",

    input.extraDirection
      ? `
Additional direction:
${input.extraDirection}
`.trim()
      : "",
  ].filter(Boolean);

  return sections.join("\n\n");
}