import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EngineName = "openai-edit" | "gemini" | "openai-generate";

type EngineSuccess = {
  success: true;
  images: string[];
  engine: EngineName;
};

type EngineFailure = {
  success: false;
  error: string;
};

type EngineResult = EngineSuccess | EngineFailure;

type AutoEngineResult =
  | {
      ok: true;
      images: string[];
      engine: EngineName;
      tried: EngineName[];
      fallbackUsed: boolean;
    }
  | {
      ok: false;
      tried: EngineName[];
      errors: { engine: EngineName; error: string }[];
    };

function getEngineDisplayName(engine: EngineName) {
  if (engine === "openai-edit") return "Auto Engine / Vision Edit";
  if (engine === "gemini") return "Auto Engine / Gemini Vision";
  return "Auto Engine / Image Generation";
}

function buildRevisionPrompt(
  note: string,
  style?: string,
  hasReferenceImage?: boolean
) {
  return `
You are a premium architectural render revision system.

Revise the uploaded render according to the user's request while preserving:
- original camera angle
- original composition
- room layout
- architectural proportions
- core furniture placement unless explicitly changed

Target output:
- photorealistic
- premium
- elegant
- believable lighting
- natural shadows
- realistic materials
- editorial quality visualization

Style direction:
${style || "premium modern"}

User revision request:
${note || "Improve realism, lighting, and overall premium quality."}

${
  hasReferenceImage
    ? `
Reference image instructions:
- A second uploaded image is provided as a material / color / surface reference
- Use the reference image to transfer material character, color palette, texture feeling, tile logic, stone feeling, wood tone, or surface identity
- Apply the reference only to the area described in the user request
- Do not redesign unrelated parts of the scene
- Preserve scene realism and perspective while adapting the reference material
`
    : ""
}

Important rules:
- do not redesign the whole project unless explicitly requested
- do not break geometry
- do not crop important scene content
- avoid artificial looking textures
- keep scale realistic
- keep the final result polished and convincing
`.trim();
}

function detectEditIntent(note: string) {
  const value = (note || "").toLowerCase();

  const editKeywords = [
    "revize",
    "düzenle",
    "değiştir",
    "ekle",
    "kaldır",
    "ışık",
    "malzeme",
    "materyal",
    "renk",
    "doku",
    "aksesuar",
    "çiçek",
    "spot",
    "gerçekçi",
    "iyileştir",
    "aynı kalsın",
    "bozmadan",
    "preserve",
    "keep",
    "edit",
    "revise",
  ];

  const score = editKeywords.filter((k) => value.includes(k)).length;

  return {
    isEditLike: score > 0,
    score,
  };
}

function pickEngineOrder(params: { note: string; hasImage: boolean }): EngineName[] {
  const { note, hasImage } = params;
  const intent = detectEditIntent(note);

  if (hasImage && intent.isEditLike) {
    return ["openai-edit", "gemini", "openai-generate"];
  }

  if (hasImage) {
    return ["openai-edit", "gemini", "openai-generate"];
  }

  return ["openai-generate", "gemini"];
}

async function fileToBase64(file: File) {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes).toString("base64");
}

function normalizeImageList(images: unknown): string[] {
  if (!Array.isArray(images)) return [];

  return images
    .filter((item): item is string => typeof item === "string" && item.length > 0)
    .map((item) => {
      if (item.startsWith("data:image")) return item;
      return `data:image/png;base64,${item}`;
    });
}

function getOpenAIImageModel() {
  return process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
}

function getGeminiImageModel() {
  return process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview";
}

async function ensureOkJson(response: Response) {
  const text = await response.text();

  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const message =
      parsed?.error?.message ||
      parsed?.error ||
      text ||
      `HTTP ${response.status} hatası`;
    throw new Error(message);
  }

  return parsed;
}

async function runOpenAIEdit(params: {
  image: File;
  prompt: string;
  referenceImage?: File | null;
}): Promise<EngineResult> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "OPENAI_API_KEY tanımlı değil.",
      };
    }

    const { image, prompt, referenceImage } = params;
    const imageBase64 = await fileToBase64(image);
    const imageDataUrl = `data:${image.type || "image/png"};base64,${imageBase64}`;

    let referenceImageDataUrl: string | null = null;

    if (referenceImage) {
      const referenceBase64 = await fileToBase64(referenceImage);
      referenceImageDataUrl = `data:${referenceImage.type || "image/png"};base64,${referenceBase64}`;
    }

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getOpenAIImageModel(),
        images: [
          {
            image_url: imageDataUrl,
          },
          ...(referenceImageDataUrl
            ? [
                {
                  image_url: referenceImageDataUrl,
                },
              ]
            : []),
        ],
        prompt,
        size: "1536x1024",
        quality: "high",
        output_format: "png",
        moderation: "auto",
        input_fidelity: "high",
        n: 1,
      }),
    });

    const data = await ensureOkJson(response);

    const images = normalizeImageList(
      data?.data?.map((item: any) => item?.b64_json).filter(Boolean) ?? []
    );

    if (!images.length) {
      return {
        success: false,
        error: "OpenAI edit boş sonuç döndürdü.",
      };
    }

    return {
      success: true,
      images,
      engine: "openai-edit",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "OpenAI edit hatası",
    };
  }
}

async function runGemini(params: {
  image: File;
  prompt: string;
  referenceImage?: File | null;
}): Promise<EngineResult> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "GEMINI_API_KEY tanımlı değil.",
      };
    }

    const { image, prompt, referenceImage } = params;
    const imageBase64 = await fileToBase64(image);

    let referenceBase64: string | null = null;
    let referenceMimeType: string | null = null;

    if (referenceImage) {
      referenceBase64 = await fileToBase64(referenceImage);
      referenceMimeType = referenceImage.type || "image/png";
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        getGeminiImageModel()
      )}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: image.type || "image/png",
                    data: imageBase64,
                  },
                },
                ...(referenceBase64
                  ? [
                      {
                        inlineData: {
                          mimeType: referenceMimeType || "image/png",
                          data: referenceBase64,
                        },
                      },
                    ]
                  : []),
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
          },
        }),
      }
    );

    const data = await ensureOkJson(response);

    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const images = normalizeImageList(
      parts
        .filter((part: any) => !!part?.inlineData?.data)
        .map((part: any) => part.inlineData.data)
    );

    if (!images.length) {
      const textPart = parts.find((part: any) => typeof part?.text === "string")?.text;
      return {
        success: false,
        error:
          textPart ||
          "Gemini görsel üretmedi veya response içinde inlineData bulunamadı.",
      };
    }

    return {
      success: true,
      images,
      engine: "gemini",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gemini hatası",
    };
  }
}

async function runOpenAIGenerate(params: {
  prompt: string;
}): Promise<EngineResult> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "OPENAI_API_KEY tanımlı değil.",
      };
    }

    const { prompt } = params;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getOpenAIImageModel(),
        prompt,
        size: "1536x1024",
        quality: "high",
        output_format: "png",
        moderation: "auto",
        background: "auto",
        n: 1,
      }),
    });

    const data = await ensureOkJson(response);

    const images = normalizeImageList(
      data?.data?.map((item: any) => item?.b64_json).filter(Boolean) ?? []
    );

    if (!images.length) {
      return {
        success: false,
        error: "OpenAI generate boş sonuç döndürdü.",
      };
    }

    return {
      success: true,
      images,
      engine: "openai-generate",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "OpenAI generate hatası",
    };
  }
}

async function runAutoEngine(params: {
  image: File | null;
  referenceImage?: File | null;
  note: string;
  style?: string;
}): Promise<AutoEngineResult> {
  const { image, referenceImage, note, style } = params;

  const tried = pickEngineOrder({
    note,
    hasImage: !!image,
  });

  const prompt = buildRevisionPrompt(note, style, !!referenceImage);
  const errors: { engine: EngineName; error: string }[] = [];

  for (let i = 0; i < tried.length; i++) {
    const engine = tried[i];
    let result: EngineResult;

    if (engine === "openai-edit") {
      if (!image) {
        errors.push({
          engine,
          error: "OpenAI edit için görsel gerekli.",
        });
        continue;
      }

      result = await runOpenAIEdit({
        image,
        prompt,
        referenceImage,
      });
    } else if (engine === "gemini") {
      if (!image) {
        errors.push({
          engine,
          error: "Gemini image akışı için görsel gerekli.",
        });
        continue;
      }

      result = await runGemini({
        image,
        prompt,
        referenceImage,
      });
    } else {
      result = await runOpenAIGenerate({
        prompt,
      });
    }

    if (result.success) {
      return {
        ok: true,
        images: normalizeImageList(result.images),
        engine: result.engine,
        tried,
        fallbackUsed: i > 0,
      };
    }

    errors.push({
      engine,
      error: result.error,
    });
  }

  return {
    ok: false,
    tried,
    errors,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const image = formData.get("image");
    const referenceImage = formData.get("referenceImage");
    const noteFromNote = String(formData.get("note") || "");
    const noteFromPrompt = String(formData.get("prompt") || "");
    const style = String(formData.get("style") || "premium modern");

    const note = (noteFromNote || noteFromPrompt || "").trim();
    const file = image instanceof File ? image : null;
    const referenceFile = referenceImage instanceof File ? referenceImage : null;

    if (!file && !note) {
      return NextResponse.json(
        {
          success: false,
          error: "Görsel veya revize notu gerekli.",
        },
        { status: 400 }
      );
    }

    const result = await runAutoEngine({
      image: file,
      referenceImage: referenceFile,
      note,
      style,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Hiçbir render motoru başarılı sonuç üretemedi.",
          tried: result.tried,
          details: result.errors,
        },
        { status: 500 }
      );
    }

    const firstImage = result.images[0] ?? null;

    return NextResponse.json({
      success: true,
      image: firstImage,
      images: result.images,
      engine: result.engine,
      engineName: getEngineDisplayName(result.engine),
      fallbackUsed: result.fallbackUsed,
      message: "Render revizesi tamamlandı.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Bilinmeyen bir sunucu hatası oluştu.",
      },
      { status: 500 }
    );
  }
}