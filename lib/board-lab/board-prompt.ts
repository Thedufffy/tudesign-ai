// lib/board-lab/board-prompt.ts

export function buildBoardAnalyzePrompt(projectTitle: string) {
  return `
You are analyzing an architectural or interior space image for a presentation board system.

Return ONLY valid JSON with these keys:
- projectTitle
- spaceType
- conceptText
- functionText
- materialPalette
- colorPalette
- detailNotes

Rules:
- projectTitle MUST be "${projectTitle}"
- Language MUST be Turkish
- Keep sentences short, professional and clean
- Do NOT redesign the project, only analyze
- colorPalette MUST contain 5 HEX colors
- functionText must have 3–5 short items
- materialPalette must have 4–6 materials
- detailNotes must have 3–5 short notes

Focus on:
- material language
- color balance
- lighting
- overall atmosphere

Return JSON only.
`.trim();
}