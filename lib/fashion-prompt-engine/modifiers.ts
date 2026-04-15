export type LensOption = "35mm" | "50mm" | "65mm" | "85mm";
export type AngleOption = "eye_level" | "slightly_low" | "slightly_high";
export type LightingOption =
  | "soft_diffused"
  | "directional_editorial"
  | "dramatic_contrast";
export type AtmosphereOption =
  | "clean_studio"
  | "gradient_backdrop"
  | "haze"
  | "low_fog";
export type ProductFocusOption = "soft" | "balanced" | "strong";

export function buildLensModifier(lens: LensOption) {
  switch (lens) {
    case "35mm":
      return `
Lens:
- use a 35mm fashion editorial perspective
- allow slightly more dynamic spatial feel
- useful for motion, walking, or stronger campaign framing
`;
    case "50mm":
      return `
Lens:
- use a 50mm balanced editorial perspective
- natural proportions with premium campaign realism
- ideal for versatile studio fashion imagery
`;
    case "65mm":
      return `
Lens:
- use a 65mm slightly compressed premium editorial lens feeling
- refined subject isolation
- polished magazine portrait-fashion balance
`;
    case "85mm":
      return `
Lens:
- use an 85mm portrait-fashion perspective
- stronger subject isolation
- elegant compression and intimate luxury feel
`;
  }
}

export function buildAngleModifier(angle: AngleOption) {
  switch (angle) {
    case "eye_level":
      return `
Camera angle:
- eye-level framing
- clean, confident, direct editorial presentation
`;
    case "slightly_low":
      return `
Camera angle:
- slightly low angle
- subtle empowerment and fashion authority
- keep proportions believable and premium
`;
    case "slightly_high":
      return `
Camera angle:
- slightly high angle
- refined editorial control
- elegant, composed top-bias perspective
`;
  }
}

export function buildLightingModifier(lighting: LightingOption) {
  switch (lighting) {
    case "soft_diffused":
      return `
Lighting:
- soft diffused key light
- gentle facial shaping
- premium smooth transitions
- elegant bloom on highlights
`;
    case "directional_editorial":
      return `
Lighting:
- directional editorial key light
- controlled shadow depth
- soft rim separation when useful
- cinematic tonal structure
`;
    case "dramatic_contrast":
      return `
Lighting:
- stronger contrast editorial lighting
- sculpted facial and garment depth
- more intense highlight-shadow interplay
- still keep luxury polish and avoid harsh cheap lighting
`;
  }
}

export function buildAtmosphereModifier(atmosphere: AtmosphereOption[]) {
  const blocks: string[] = [];

  if (atmosphere.includes("clean_studio")) {
    blocks.push(`
Atmosphere:
- very clean studio environment
- minimal distractions
- crisp premium set feeling
`);
  }

  if (atmosphere.includes("gradient_backdrop")) {
    blocks.push(`
Backdrop:
- use a softly graded studio backdrop
- smooth tonal transition
- luxury editorial color depth
`);
  }

  if (atmosphere.includes("haze")) {
    blocks.push(`
Atmosphere:
- subtle atmospheric haze for depth
- keep it refined and not heavy
`);
  }

  if (atmosphere.includes("low_fog")) {
    blocks.push(`
Atmosphere:
- low-lying fog near the floor when compositionally helpful
- cinematic but restrained
`);
  }

  return blocks.join("\n");
}

export function buildProductFocusModifier(productFocus: ProductFocusOption) {
  switch (productFocus) {
    case "soft":
      return `
Product focus:
- the product should integrate naturally into the styling
- visible and premium, but not the dominant hero
`;
    case "balanced":
      return `
Product focus:
- balanced emphasis between model, styling, and product
- product should remain clear and premium
`;
    case "strong":
      return `
Product focus:
- the product is a clear hero element
- keep product shape, texture, edges, and branding highly legible
- allow surrounding motion or softness only if product clarity remains intact
`;
  }
}