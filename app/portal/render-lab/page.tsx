// app/portal/render-lab/page.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type InterpretedChange = {
  target: string;
  action: string;
  value: string;
};

type InterpretedResult = {
  summary_tr: string;
  task_type: "render_edit";
  space_type: "interior" | "exterior" | "unknown";
  style_intent: string;
  preserve: string[];
  changes: InterpretedChange[];
  constraints: string[];
  missing_questions: string[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  kind?: "normal" | "interpretation" | "success" | "error" | "question";
};

type CompressionResult = {
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
};

const REFERENCE_FEATURES = [
  "Duvar rengi",
  "Zemin kaplaması",
  "Desen",
  "Aydınlatma",
  "Seramik / çini / mermer",
  "Tezgah",
  "Kapı",
  "Ahşap kaplama",
  "Metal detay",
  "Döşeme / kumaş",
  "Genel stil",
  "Diğer",
] as const;

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatEngineLabel(engine?: string | null) {
  if (!engine) return "Auto Engine aktif";

  if (engine === "openai-edit") return "Auto Engine / Vision Edit";
  if (engine === "gemini") return "Auto Engine / Gemini Vision";
  if (engine === "openai-generate") return "Auto Engine / Image Generation";

  return "Auto Engine aktif";
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const FALLBACK_MESSAGE =
  "İlk üretim denemesi tamamlanamadı. Alternatif render motoru ile devam ediliyor...";

export default function RenderPage() {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState("");
  const [selectedReferenceFeatures, setSelectedReferenceFeatures] = useState<string[]>([]);
  const [referenceTargetArea, setReferenceTargetArea] = useState("");
  const [referenceExtraNote, setReferenceExtraNote] = useState("");

  const [mainCompressionText, setMainCompressionText] = useState("");
  const [referenceCompressionText, setReferenceCompressionText] = useState("");

  const [interpreted, setInterpreted] = useState<InterpretedResult | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompressingMain, setIsCompressingMain] = useState(false);
  const [isCompressingReference, setIsCompressingReference] = useState(false);

  const [usedEngine, setUsedEngine] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");
  const [fallbackMessageVisible, setFallbackMessageVisible] = useState(false);

  const [shareLoading, setShareLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      kind: "normal",
      content:
        "Merhaba. Revize isteğini Türkçe yaz. İsteğini profesyonel şekilde yorumlayacağım. Belirtmediğin alanlarda mevcut ışık, kamera açısı, kadraj ve mekan kurgusunu koruyarak ilerleyeceğim.",
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const referenceInputRef = useRef<HTMLInputElement | null>(null);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canInterpret = useMemo(
    () => input.trim().length > 0 && !isInterpreting,
    [input, isInterpreting]
  );

  const canGenerate = useMemo(
    () =>
      !!file &&
      !!interpreted &&
      !isGenerating &&
      !isCompressingMain &&
      !isCompressingReference,
    [file, interpreted, isGenerating, isCompressingMain, isCompressingReference]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (referencePreviewUrl) URL.revokeObjectURL(referencePreviewUrl);

      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [previewUrl, referencePreviewUrl]);

  function pushMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message]);
  }

  function clearLoadingTimers() {
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }

  function startGenerateStatusFlow() {
    const steps = [
      "Render analiz ediliyor...",
      "Geometri ve açı eşleştiriliyor...",
      "Auto Engine devreye alınıyor...",
      "Revize komutları uygulanıyor...",
      "Final görseller hazırlanıyor...",
    ];

    let stepIndex = 0;
    setStatusText(steps[0]);

    stepIntervalRef.current = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      setStatusText(steps[stepIndex]);
    }, 1800);

    fallbackTimerRef.current = setTimeout(() => {
      setFallbackMessageVisible(true);
      setStatusText(FALLBACK_MESSAGE);

      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "normal",
        content: FALLBACK_MESSAGE,
      });
    }, 9000);
  }

  async function parseJsonSafely(res: Response) {
    const raw = await res.text();

    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(
        raw ? `JSON yerine şu döndü: ${raw.slice(0, 200)}` : "Sunucudan boş yanıt döndü."
      );
    }
  }

  async function dataUrlToFile(dataUrl: string, filename: string) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    return new File([blob], filename, {
      type: blob.type || "image/png",
    });
  }

  function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Görsel okunamadı."));
      };

      img.src = url;
    });
  }

  async function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality?: number
  ) {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas çıktısı alınamadı."));
            return;
          }

          resolve(blob);
        },
        type,
        quality
      );
    });
  }

  async function compressImage(
    originalFile: File,
    options?: {
      maxDimension?: number;
      targetType?: string;
      quality?: number;
      skipBelowBytes?: number;
    }
  ): Promise<CompressionResult> {
    const {
      maxDimension = 2048,
      targetType = "image/jpeg",
      quality = 0.88,
      skipBelowBytes = 2 * 1024 * 1024,
    } = options || {};

    const image = await loadImage(originalFile);

    const originalWidth = image.naturalWidth || image.width;
    const originalHeight = image.naturalHeight || image.height;

    let width = originalWidth;
    let height = originalHeight;

    const largestSide = Math.max(width, height);

    if (largestSide > maxDimension) {
      const scale = maxDimension / largestSide;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    if (
      originalFile.size <= skipBelowBytes &&
      width === originalWidth &&
      height === originalHeight &&
      (originalFile.type === "image/jpeg" ||
        originalFile.type === "image/jpg" ||
        originalFile.type === "image/webp")
    ) {
      return {
        file: originalFile,
        originalSize: originalFile.size,
        compressedSize: originalFile.size,
        width,
        height,
      };
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context oluşturulamadı.");
    }

    ctx.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, targetType, quality);

    const safeName = originalFile.name.replace(/\.[^.]+$/, "");
    const compressedFile = new File([blob], `${safeName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    return {
      file: compressedFile,
      originalSize: originalFile.size,
      compressedSize: compressedFile.size,
      width,
      height,
    };
  }

  function buildCompressionText(result: CompressionResult) {
    if (result.originalSize === result.compressedSize) {
      return `Optimizasyon gerekmedi · ${formatBytes(result.compressedSize)} · ${result.width}x${result.height}`;
    }

    const ratio = Math.max(
      0,
      100 - (result.compressedSize / result.originalSize) * 100
    );

    return `Sıkıştırıldı · ${formatBytes(result.originalSize)} → ${formatBytes(
      result.compressedSize
    )} · %${ratio.toFixed(0)} küçüldü · ${result.width}x${result.height}`;
  }

  function toggleReferenceFeature(feature: string) {
    setSelectedReferenceFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((item) => item !== feature)
        : [...prev, feature]
    );
  }

  function buildEnhancedPrompt(basePrompt: string) {
    const trimmedBasePrompt = basePrompt.trim();

    if (!referenceFile) {
      return trimmedBasePrompt;
    }

    const parts: string[] = [trimmedBasePrompt];

    if (selectedReferenceFeatures.length > 0) {
      parts.push(
        `Referans görselden özellikle şu öğeleri al: ${selectedReferenceFeatures.join(
          ", "
        )}.`
      );
    } else {
      parts.push(
        "Referans görseli malzeme, renk, doku veya stil yönlendirmesi olarak değerlendir."
      );
    }

    if (referenceTargetArea.trim()) {
      parts.push(
        `Referans etkisini özellikle şu alana uygula: ${referenceTargetArea.trim()}.`
      );
    }

    if (referenceExtraNote.trim()) {
      parts.push(`Referans için ek not: ${referenceExtraNote.trim()}.`);
    }

    parts.push(
      "Referans görseli sahnenin tamamına kopyalama; yalnızca istenen alanlarda kontrollü şekilde uygula."
    );

    return parts.join(" ");
  }

  async function handleDownload() {
    try {
      if (!result) return;

      setDownloadLoading(true);

      const link = document.createElement("a");
      link.href = result;
      link.download = `tudesign-render-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleShare() {
    try {
      if (!result) return;

      setShareLoading(true);

      const fileToShare = await dataUrlToFile(
        result,
        `tudesign-render-${Date.now()}.png`
      );

      if (navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        await navigator.share({
          title: "tuDesign AI Render",
          text: "tuDesign AI ile oluşturulan render çıktısı",
          files: [fileToShare],
        });
        return;
      }

      const link = document.createElement("a");
      link.href = result;
      link.download = fileToShare.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Paylaşım hatası:", error);
    } finally {
      setShareLoading(false);
    }
  }

  async function handleInterpret() {
    const userText = input.trim();
    if (!userText) return;

    pushMessage({
      id: createId(),
      role: "user",
      kind: "normal",
      content: userText,
    });

    const enhancedPrompt = buildEnhancedPrompt(userText);

    setInput("");
    setResult(null);
    setUsedEngine(null);
    setStatusText("");
    setFallbackMessageVisible(false);
    setIsInterpreting(true);

    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          mode: "auto",
        }),
      });

      const data = await parseJsonSafely(res);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Yorumlama başarısız oldu.");
      }

      const interpretedData: InterpretedResult = data.interpreted;
      setInterpreted(interpretedData);

      pushMessage({
        id: createId(),
        role: "assistant",
        kind: data?.needsClarification ? "question" : "interpretation",
        content:
          data?.assistantReply ||
          "İsteğini yorumladım. Belirtmediğin alanları koruyarak revizeyi oluşturmaya hazırım.",
      });
    } catch (error: any) {
      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "error",
        content: error?.message || "Yorumlama sırasında bir hata oluştu.",
      });
    } finally {
      setIsInterpreting(false);
    }
  }

  async function handleGenerate() {
    try {
      if (!file) throw new Error("Önce bir görsel yüklemelisin.");
      if (!interpreted) throw new Error("Önce revize isteğini yorumlatmalısın.");

      setIsGenerating(true);
      setResult(null);
      setUsedEngine(null);
      setFallbackMessageVisible(false);

      clearLoadingTimers();
      startGenerateStatusFlow();

      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "normal",
        content: referenceFile
          ? "İstediğin revizeyi oluşturmak için çalışıyorum. Ana görsel ve referans malzeme birlikte analiz ediliyor."
          : "İstediğin revizeyi oluşturmak için çalışıyorum. En uygun render motoru otomatik seçiliyor.",
      });

      const formData = new FormData();
      formData.append("image", file);
      formData.append("note", interpreted.summary_tr);
      formData.append("prompt", interpreted.summary_tr);
      formData.append("mode", "auto");

      if (referenceFile) {
        formData.append("referenceImage", referenceFile);
        formData.append(
          "referenceFeatures",
          JSON.stringify(selectedReferenceFeatures)
        );
        formData.append("referenceTargetArea", referenceTargetArea.trim());
        formData.append("referenceExtraNote", referenceExtraNote.trim());
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await parseJsonSafely(res);
      clearLoadingTimers();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Render üretimi başarısız oldu.");
      }

      let finalImage: string | null = null;

      if (typeof data?.image === "string" && data.image.length > 0) {
        finalImage = data.image.startsWith("data:image")
          ? data.image
          : `data:image/png;base64,${data.image}`;
      } else if (Array.isArray(data?.images) && data.images.length > 0) {
        const firstImage = data.images[0];
        if (typeof firstImage === "string" && firstImage.length > 0) {
          finalImage = firstImage.startsWith("data:image")
            ? firstImage
            : `data:image/png;base64,${firstImage}`;
        }
      }

      if (!finalImage) {
        throw new Error("Üretim tamamlandı ama görsel dönmedi.");
      }

      setResult(finalImage);
      setUsedEngine(data?.engine || data?.engineName || null);

      if (data?.fallbackUsed) {
        setFallbackMessageVisible(true);
        setStatusText(FALLBACK_MESSAGE);
        setTimeout(() => setStatusText("Render revizesi tamamlandı."), 1400);
      } else {
        setStatusText("Render revizesi tamamlandı.");
      }

      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "success",
        content: data?.engineName
          ? `Revize hazır. ${data.engineName}.`
          : data?.engine
          ? `Revize hazır. ${formatEngineLabel(data.engine)}.`
          : "Revize hazır. Auto Engine işlemi tamamladı.",
      });
    } catch (error: any) {
      clearLoadingTimers();
      setStatusText("");

      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "error",
        content: error?.message || "Üretim sırasında bir hata oluştu.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function applySelectedFile(selected: File | null) {
    if (!selected) return;

    try {
      setIsCompressingMain(true);
      setResult(null);

      const compression = await compressImage(selected, {
        maxDimension: 2048,
        targetType: "image/jpeg",
        quality: 0.88,
      });

      if (previewUrl) URL.revokeObjectURL(previewUrl);

      setFile(compression.file);

      const nextPreview = URL.createObjectURL(compression.file);
      setPreviewUrl(nextPreview);
      setMainCompressionText(buildCompressionText(compression));

      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "normal",
        content: `Ana görsel hazırlandı: ${selected.name}\n${buildCompressionText(
          compression
        )}`,
      });
    } catch (error: any) {
      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "error",
        content:
          error?.message || "Ana görsel sıkıştırılırken bir hata oluştu.",
      });
    } finally {
      setIsCompressingMain(false);
    }
  }

  async function applyReferenceFile(selected: File | null) {
    if (!selected) return;

    try {
      setIsCompressingReference(true);
      setResult(null);

      const compression = await compressImage(selected, {
        maxDimension: 1600,
        targetType: "image/jpeg",
        quality: 0.9,
      });

      if (referencePreviewUrl) URL.revokeObjectURL(referencePreviewUrl);

      setReferenceFile(compression.file);

      const nextPreview = URL.createObjectURL(compression.file);
      setReferencePreviewUrl(nextPreview);
      setReferenceCompressionText(buildCompressionText(compression));

      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "normal",
        content: `Referans görsel hazırlandı: ${selected.name}\n${buildCompressionText(
          compression
        )}`,
      });
    } catch (error: any) {
      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "error",
        content:
          error?.message || "Referans görsel sıkıştırılırken bir hata oluştu.",
      });
    } finally {
      setIsCompressingReference(false);
    }
  }

  function handleOpenFilePicker() {
    fileInputRef.current?.click();
  }

  function handleOpenReferencePicker() {
    referenceInputRef.current?.click();
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);

    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      await applySelectedFile(dropped);
    }
  }

  function handleResetAll() {
    clearLoadingTimers();

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (referencePreviewUrl) URL.revokeObjectURL(referencePreviewUrl);

    setInput("");
    setFile(null);
    setPreviewUrl("");
    setReferenceFile(null);
    setReferencePreviewUrl("");
    setSelectedReferenceFeatures([]);
    setReferenceTargetArea("");
    setReferenceExtraNote("");
    setMainCompressionText("");
    setReferenceCompressionText("");
    setInterpreted(null);
    setResult(null);
    setUsedEngine(null);
    setStatusText("");
    setFallbackMessageVisible(false);
    setIsDragging(false);
    setMessages([
      {
        id: createId(),
        role: "assistant",
        kind: "normal",
        content:
          "Yeni bir revize isteğiyle başlayabiliriz. Türkçe yaz, ben yorumlayayım. Belirtmediğin ışık, kamera, kadraj ve genel mekan kurgusunu koruyarak ilerlerim.",
      },
    ]);
  }

  return (
    <main
      className="render-theme min-h-screen bg-[#09090b] text-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[380px] w-[380px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-[320px] w-[320px] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">
                tuDesign AI / Render Lab
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Konuşmalı Render Revize Sistemi
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65 md:text-[15px]">
                Revize istediğin alanları yorumlar, gerekirse soru sorar ve en uygun
                üretim motorunu otomatik seçerek sonucu oluşturur.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResetAll}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10"
              >
                Yeni revize
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-sm font-medium text-white">Akıllı motor yönlendirmesi</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Sistem, revize isteğinin yapısına göre en uygun motoru otomatik seçer.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-sm leading-6 text-white/75">
                  Lokal revizelerde, materyal hassasiyetinde ve üretim kararlılığında
                  uygun motor otomatik belirlenir.
                </p>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-sm font-medium text-white">Ana görsel yükleme</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Mekanın ana render veya fotoğraf görselini yükle.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  await applySelectedFile(e.target.files?.[0] || null);
                  e.currentTarget.value = "";
                }}
              />

              <div
                onClick={handleOpenFilePicker}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={[
                  "group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed px-6 text-center transition",
                  isDragging
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-white/15 bg-black/20 hover:border-white/30 hover:bg-white/[0.06]",
                ].join(" ")}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-white/70">
                  ⬆
                </div>

                <p className="text-sm font-medium text-white">
                  {file
                    ? "Görseli değiştirmek için tıkla veya bırak"
                    : "Görseli buraya sürükle bırak"}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  PNG, JPG veya WEBP yükleyebilirsin
                </p>

                {isCompressingMain ? (
                  <p className="mt-3 text-xs text-cyan-200">
                    Ana görsel optimize ediliyor...
                  </p>
                ) : null}
              </div>

              {mainCompressionText ? (
                <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/65">
                  {mainCompressionText}
                </div>
              ) : null}

              {previewUrl ? (
                <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
                  <img
                    src={previewUrl}
                    alt="Yüklenen görsel önizleme"
                    className="h-auto w-full object-cover"
                    draggable={false}
                  />
                </div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-sm font-medium text-white">
                  Referans malzeme / renk görseli
                </p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  İkinci bir görsel yükleyerek referanstan hangi öğelerin alınacağını
                  seçebilirsin. Böylece sistem daha kontrollü çalışır.
                </p>
              </div>

              <input
                ref={referenceInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  await applyReferenceFile(e.target.files?.[0] || null);
                  e.currentTarget.value = "";
                }}
              />

              <button
                type="button"
                onClick={handleOpenReferencePicker}
                className="group flex min-h-[180px] w-full cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-black/20 px-6 text-center transition hover:border-white/30 hover:bg-white/[0.06]"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-white/70">
                  ⬆
                </div>

                <p className="text-sm font-medium text-white">
                  {referenceFile
                    ? "Referans görseli değiştirmek için tıkla"
                    : "Referans görseli yükle"}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  Malzeme, renk, çini, taş, ahşap veya doku referansı olabilir
                </p>

                {isCompressingReference ? (
                  <p className="mt-3 text-xs text-cyan-200">
                    Referans görsel optimize ediliyor...
                  </p>
                ) : null}
              </button>

              {referenceCompressionText ? (
                <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/65">
                  {referenceCompressionText}
                </div>
              ) : null}

              {referencePreviewUrl ? (
                <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
                  <img
                    src={referencePreviewUrl}
                    alt="Referans görsel önizleme"
                    className="h-auto w-full object-cover"
                    draggable={false}
                  />
                </div>
              ) : null}

              {referenceFile ? (
                <>
                  <div className="mt-5">
                    <p className="text-sm font-medium text-white">
                      Referanstan ne alınsın?
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/45">
                      Birden fazla seçim yapabilirsin.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {REFERENCE_FEATURES.map((feature) => {
                      const isSelected = selectedReferenceFeatures.includes(feature);

                      return (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => toggleReferenceFeature(feature)}
                          className={[
                            "rounded-full border px-3 py-2 text-xs transition",
                            isSelected
                              ? "border-white bg-white text-black"
                              : "border-white/12 bg-black/20 text-white/75 hover:border-white/30 hover:bg-white/[0.06]",
                          ].join(" ")}
                        >
                          {feature}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs text-white/55">
                      Nereye uygulansın? (opsiyonel)
                    </label>
                    <input
                      value={referenceTargetArea}
                      onChange={(e) => setReferenceTargetArea(e.target.value)}
                      placeholder="Örn: sadece duş duvarı, yalnızca zemin, banko önü, kapı yüzeyi..."
                      className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs text-white/55">
                      Referans için ek not (opsiyonel)
                    </label>
                    <textarea
                      value={referenceExtraNote}
                      onChange={(e) => setReferenceExtraNote(e.target.value)}
                      placeholder="Örn: sadece tonu al, deseni birebir kopyalama; daha yumuşak uygula; mevcut sahneye uyumlu kalsın..."
                      className="min-h-[100px] w-full resize-none rounded-[18px] border border-white/10 bg-black/20 p-4 text-sm text-white outline-none placeholder:text-white/25"
                    />
                  </div>
                </>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-sm font-medium text-white">Revize isteği</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Örnek: bu referans görseldeki taşı zemine uygula, bu çinideki
                  renkleri duş duvarına aktar, bu ahşap tonunu yalnızca bankoda kullan.
                </p>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ne yapmak istediğini doğal şekilde yaz..."
                className="min-h-[190px] w-full resize-none rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm text-white outline-none placeholder:text-white/25"
              />

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={handleInterpret}
                  disabled={!canInterpret}
                  className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isInterpreting ? "Yorumlanıyor..." : "İsteği yorumla"}
                </button>

                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isGenerating
                    ? "Üretiliyor..."
                    : isCompressingMain || isCompressingReference
                    ? "Görseller hazırlanıyor..."
                    : "Devam et ve üret"}
                </button>
              </div>

              {statusText ? (
                <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-white/75">
                  {statusText}
                </div>
              ) : null}

              {fallbackMessageVisible ? (
                <div className="mt-4 rounded-[22px] border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                  {FALLBACK_MESSAGE}
                </div>
              ) : null}
            </section>
          </aside>

          <section className="space-y-6">
            <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-sm font-medium text-white">Konuşmalı akış</p>
              </div>

              <div className="max-h-[520px] space-y-4 overflow-y-auto p-5">
                {messages.map((message) => {
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={[
                          "max-w-[86%] whitespace-pre-wrap rounded-[24px] border px-4 py-3 text-sm leading-6",
                          isUser
                            ? "border-white/10 bg-white text-black"
                            : "border-white/10 bg-black/25 text-white/85",
                          message.kind === "error"
                            ? "border-red-400/30 bg-red-500/10 text-red-100"
                            : "",
                          message.kind === "success"
                            ? "border-green-400/30 bg-green-500/10 text-green-100"
                            : "",
                          message.kind === "question"
                            ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                            : "",
                        ].join(" ")}
                      >
                        {message.content}
                      </div>
                    </div>
                  );
                })}

                {(isInterpreting ||
                  isGenerating ||
                  isCompressingMain ||
                  isCompressingReference) && (
                  <div className="flex justify-start">
                    <div className="rounded-[24px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white/70" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white/50 [animation-delay:120ms]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white/30 [animation-delay:240ms]" />
                        <span className="ml-1">
                          {isCompressingMain
                            ? "Ana görsel optimize ediliyor..."
                            : isCompressingReference
                            ? "Referans görsel optimize ediliyor..."
                            : isInterpreting
                            ? "Revize talebin analiz ediliyor..."
                            : statusText || "Auto Engine çalışıyor..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {result ? (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Üretilen sonuç</p>
                    <p className="mt-1 text-xs text-white/35">tek görsel</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {usedEngine ? (
                      <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                        {formatEngineLabel(usedEngine)}
                      </div>
                    ) : null}

                    <button
                      onClick={handleDownload}
                      disabled={downloadLoading}
                      className="rounded-full border border-white/12 bg-white px-4 py-2 text-xs font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadLoading ? "İndiriliyor..." : "İndir"}
                    </button>

                    <button
                      onClick={handleShare}
                      disabled={shareLoading}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {shareLoading ? "Paylaşılıyor..." : "Paylaş"}
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
                  <img
                    src={result}
                    alt="Render sonucu"
                    className="h-auto w-full object-cover"
                    draggable={false}
                  />
                </div>
              </section>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}