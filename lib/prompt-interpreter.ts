import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type InterpretedChange = {
  target: string;
  action: string;
  value: string;
};

export type InterpretedResult = {
  summary_tr: string;
  task_type: "render_edit";
  space_type: "interior" | "exterior" | "unknown";
  style_intent: string;
  preserve: string[];
  changes: InterpretedChange[];
  constraints: string[];
  missing_questions: string[];
};

function buildInterpreterSystemPrompt() {
  return `
You are an expert architectural render prompt interpreter.

Your job:
Convert the user's Turkish interior/exterior render revision request into a structured JSON object.

Rules:
- Understand the user's real design intent, not just literal translation.
- Focus on architectural/interior render editing.
- Preserve layout, camera angle, and proportions by default unless the user clearly asks otherwise.
- Extract what should be changed, added, removed, improved, or preserved.
- If the user says things like "çok bozma", "fazla değiştirme", "aynı kalsın", interpret them as strong preservation instructions.
- If the user asks for realism, interpret that as improvements in lighting, materials, shadows, reflections, textures, and atmosphere when relevant.
- Keep outputs practical, professional, and render-oriented.
- Do not invent unnecessary changes.
- missing_questions should contain only truly important unresolved details, maximum 2 questions.
- summary_tr must be a short Turkish explanation of what the system understood.
- Output JSON only.
`;
}

function buildInterpreterUserPrompt(input: string) {
  return `
User request in Turkish:
"""${input}"""

Return JSON in exactly this structure:

{
  "summary_tr": "string",
  "task_type": "render_edit",
  "space_type": "interior" | "exterior" | "unknown",
  "style_intent": "string",
  "preserve": ["string"],
  "changes": [
    {
      "target": "string",
      "action": "string",
      "value": "string"
    }
  ],
  "constraints": ["string"],
  "missing_questions": ["string"]
}

Important interpretation notes:
- "preserve" should include things like layout, camera angle, architectural proportions where relevant.
- "changes" must be concrete and professional.
- "constraints" should capture negative instructions like do not redesign, do not move objects, do not add random decor, etc.
- Use concise professional English for style_intent, preserve, changes, constraints.
- Use Turkish for summary_tr and missing_questions.
`;
}

function safeParseJson(text: string) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Interpreter JSON parse edilemedi.");
    }
    return JSON.parse(match[0]);
  }
}

export async function interpretUserInput(input: string): Promise<InterpretedResult> {
  if (!input.trim()) {
    throw new Error("Yorumlanacak metin boş.");
  }

  const response = await openai.responses.create({
    model: "gpt-5",
    input: [
      {
        role: "system",
        content: buildInterpreterSystemPrompt(),
      },
      {
        role: "user",
        content: buildInterpreterUserPrompt(input),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "render_interpretation",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary_tr: { type: "string" },
            task_type: { type: "string", enum: ["render_edit"] },
            space_type: {
              type: "string",
              enum: ["interior", "exterior", "unknown"],
            },
            style_intent: { type: "string" },
            preserve: {
              type: "array",
              items: { type: "string" },
            },
            changes: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  target: { type: "string" },
                  action: { type: "string" },
                  value: { type: "string" },
                },
                required: ["target", "action", "value"],
              },
            },
            constraints: {
              type: "array",
              items: { type: "string" },
            },
            missing_questions: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: [
            "summary_tr",
            "task_type",
            "space_type",
            "style_intent",
            "preserve",
            "changes",
            "constraints",
            "missing_questions",
          ],
        },
      },
    },
  });

  const raw =
    response.output_text ||
    (response.output?.[0] as any)?.content?.[0]?.text ||
    "";

  const parsed = safeParseJson(raw);

  return {
    summary_tr: parsed.summary_tr,
    task_type: "render_edit",
    space_type: parsed.space_type || "unknown",
    style_intent: parsed.style_intent || "premium photorealistic visualization",
    preserve: Array.isArray(parsed.preserve) ? parsed.preserve : [],
    changes: Array.isArray(parsed.changes) ? parsed.changes : [],
    constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
    missing_questions: Array.isArray(parsed.missing_questions)
      ? parsed.missing_questions
      : [],
  };
}