// app/api/generate/route.ts

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

function parseReferenceFeatures(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0
    );
  } catch {
    return [];
  }
}

function buildReferenceGuidance(params: {
  hasReferenceImage: boolean;
  referenceFeatures: string[];
  referenceTargetArea?: string;
  referenceExtraNote?: string;
}) {
  const {
    hasReferenceImage,
    referenceFeatures,
    referenceTargetArea,
    referenceExtraNote,
  } = params;

  if (!hasReferenceImage) return "";

  const lines: string[] = [
    "Reference image usage rules:",
    "- the FIRST image is the main scene to revise",
    "- the SECOND image is a material / color / texture / style reference",
    "- use the second image only as reference guidance",
    "- do not copy unrelated objects or composition from the reference image",
    "- do not replace the whole scene with the reference image",
  ];

  if (referenceFeatures.length > 0) {
    lines.push(
      `- focus especially on these reference attributes: ${referenceFeatures.join(
        ", "
      )}`
    );
  } else {
    lines.push(
      "- infer the most relevant material, color, texture, finish, or style cues from the reference image"
    );
  }

  if (referenceTargetArea?.trim()) {
    lines.push(
      `- apply the reference effect only to this target area when possible: ${referenceTargetArea.trim()}`
    );
  } else {
    lines.push("- apply the reference only where the user explicitly requested");
  }

  if (referenceExtraNote?.trim()) {
    lines.push(`- extra guidance: ${referenceExtraNote.trim()}`);
  }

  lines.push("- preserve the rest of the scene unless explicitly changed");

  return lines.join("\n");
}

function buildRevisionPrompt(params: {
  note: string;
  style?: string;
  hasReferenceImage?: boolean;
  referenceFeatures?: string[];
  referenceTargetArea?: string;
  referenceExtraNote?: string;
}) {
  const {
    note,
    style,
    hasReferenceImage,
    referenceFeatures = [],
    referenceTargetArea,
    referenceExtraNote,
  } = params;

  const referenceGuidance = buildReferenceGuidance({
    hasReferenceImage: !!hasReferenceImage,
    referenceFeatures,
    referenceTargetArea,
    referenceExtraNote,
  });

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

${referenceGuidance}

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
    "reference",
    "referans",
    "duvar",
    "zemin",
    "seramik",
    "çini",
    "mermer",
    "kapı",
    "ahşap",
    "tezgah",
  ];

  const score = editKeywords.filter((k) => value.includes(k)).length;

  return {
    isEditLike: score > 0,
    score,
  };
}

function pickEngineOrder(params: {
  note: string;
  hasImage: boolean;
  hasReferenceImage: boolean;
}): EngineName[] {
  const { note, hasImage, hasReferenceImage } = params;
  const intent = detectEditIntent(note);

  if (hasImage && (intent.isEditLike || hasReferenceImage)) {
    return ["openai-edit", "gemini", "openai-generate"];
  }

  if (hasImage) {
    return ["openai-edit", "gemini", "openai-generate"];
  }

  return ["openai-generate"];
}

async function fileToBase64(file: File) {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes).toString("base64");
}

function toDataUrl(file: File, base64: string) {
  return `data:${file.type || "image/jpeg"};base64,${base64}`;
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
  referenceImage?: File | null;
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

    const { image, referenceImage, prompt } = params;

    const mainBase64 = await fileToBase64(image);
    const images: Array<{ image_url: string }> = [
      {
        image_url: toDataUrl(image, mainBase64),
      },
    ];

    if (referenceImage) {
      const referenceBase64 = await fileToBase64(referenceImage);
      images.push({
        image_url: toDataUrl(referenceImage, referenceBase64),
      });
    }

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getOpenAIImageModel(),
        images,
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

    const resultImages = normalizeImageList(
      data?.data?.map((item: any) => item?.b64_json).filter(Boolean) ?? []
    );

    if (!resultImages.length) {
      return {
        success: false,
        error: "OpenAI edit boş sonuç döndürdü.",
      };
    }

    return {
      success: true,
      images: resultImages,
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
  referenceImage?: File | null;
  prompt: string;
}): Promise<EngineResult> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: "GEMINI_API_KEY tanımlı değil.",
      };
    }

    const { image, referenceImage, prompt } = params;

    const mainBase64 = await fileToBase64(image);

    const parts: any[] = [
      {
        inlineData: {
          mimeType: image.type || "image/jpeg",
          data: mainBase64,
        },
      },
    ];

    if (referenceImage) {
      const referenceBase64 = await fileToBase64(referenceImage);
      parts.push({
        inlineData: {
          mimeType: referenceImage.type || "image/jpeg",
          data: referenceBase64,
        },
      });
    }

    parts.push({
      text: prompt,
    });

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
              role: "user",
              parts,
            },
          ],
          generationConfig: {
            temperature: 0.4,
          },
        }),
      }
    );

    const data = await ensureOkJson(response);

    const responseParts = data?.candidates?.[0]?.content?.parts ?? [];
    const images = normalizeImageList(
      responseParts
        .filter((part: any) => !!part?.inlineData?.data)
        .map((part: any) => part.inlineData.data)
    );

    if (!images.length) {
      const textPart = responseParts.find(
        (part: any) => typeof part?.text === "string"
      )?.text;

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
  referenceImage: File | null;
  note: string;
  style?: string;
  referenceFeatures: string[];
  referenceTargetArea?: string;
  referenceExtraNote?: string;
}): Promise<AutoEngineResult> {
  const {
    image,
    referenceImage,
    note,
    style,
    referenceFeatures,
    referenceTargetArea,
    referenceExtraNote,
  } = params;

  const tried = pickEngineOrder({
    note,
    hasImage: !!image,
    hasReferenceImage: !!referenceImage,
  });

  const prompt = buildRevisionPrompt({
    note,
    style,
    hasReferenceImage: !!referenceImage,
    referenceFeatures,
    referenceTargetArea,
    referenceExtraNote,
  });

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
        referenceImage,
        prompt,
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
        referenceImage,
        prompt,
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

    const referenceFeatures = parseReferenceFeatures(
      formData.get("referenceFeatures")
    );
    const referenceTargetArea = String(formData.get("referenceTargetArea") || "").trim();
    const referenceExtraNote = String(formData.get("referenceExtraNote") || "").trim();

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
      referenceFeatures,
      referenceTargetArea,
      referenceExtraNote,
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
      referenceImageUsed: !!referenceFile,
      referenceFeaturesUsed: referenceFeatures,
      referenceTargetArea,
      referenceExtraNote,
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