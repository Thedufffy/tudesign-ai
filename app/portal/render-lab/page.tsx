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

type PromptVariation = {
  title: string;
  prompt: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  kind?: "normal" | "interpretation" | "success" | "error";
};

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function RenderPage() {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [interpreted, setInterpreted] = useState<InterpretedResult | null>(null);
  const [variations, setVariations] = useState<PromptVariation[]>([]);
  const [results, setResults] = useState<string[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      kind: "normal",
      content:
        "Merhaba. Revize isteğini Türkçe yaz. Önce seni anlayayım, sonra istersek üretime geçelim.",
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canInterpret = useMemo(() => input.trim().length > 0 && !isInterpreting, [input, isInterpreting]);
  const canGenerate = useMemo(
    () => !!file && !!interpreted && !isGenerating,
    [file, interpreted, isGenerating]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function pushMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message]);
  }

  function buildAssistantInterpretationText(data: InterpretedResult) {
    const lines: string[] = [];

    lines.push("İsteğini şöyle anladım:");
    lines.push("");
    lines.push(data.summary_tr);

    if (data.missing_questions?.length > 0) {
      lines.push("");
      lines.push("Netleşebilecek detaylar:");
      for (const q of data.missing_questions) {
        lines.push(`- ${q}`);
      }
    }

    lines.push("");
    lines.push("İstersen görseli yükleyip bu haliyle üretime geçebiliriz.");
    return lines.join("\n");
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

    setInput("");
    setResults([]);
    setIsInterpreting(true);

    try {
      const res = await fetch("/api/render/interpret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: userText }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Yorumlama başarısız oldu.");
      }

      setInterpreted(data.interpreted);
      setVariations(data.variations || []);

      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "interpretation",
        content: buildAssistantInterpretationText(data.interpreted),
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
      if (!file) {
        throw new Error("Önce bir görsel yüklemelisin.");
      }

      if (!interpreted) {
        throw new Error("Önce isteği yorumlatmalısın.");
      }

      setIsGenerating(true);
      setResults([]);

      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "normal",
        content: "Üretime geçiyorum. Üç farklı varyasyon hazırlanıyor...",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("interpreted", JSON.stringify(interpreted));
      formData.append("provider", "openai");

      const res = await fetch("/api/render/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Render üretimi başarısız oldu.");
      }

      setVariations(data.prompts || []);
      setResults(data.images || []);

      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "success",
        content: "Tamamlandı. Aşağıda üç varyasyonu inceleyebilirsin.",
      });
    } catch (error: any) {
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

  function applySelectedFile(selected: File | null) {
    if (!selected) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selected);
    const nextPreview = URL.createObjectURL(selected);
    setPreviewUrl(nextPreview);

    pushMessage({
      id: createId(),
      role: "assistant",
      kind: "normal",
      content: `Görsel yüklendi: ${selected.name}`,
    });
  }

  function handleFileChange(selected: File | null) {
    applySelectedFile(selected);
  }

  function handleOpenFilePicker() {
    fileInputRef.current?.click();
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);

    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      applySelectedFile(dropped);
    }
  }

  function handleResetAll() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setInput("");
    setFile(null);
    setPreviewUrl("");
    setInterpreted(null);
    setVariations([]);
    setResults([]);
    setIsDragging(false);
    setMessages([
      {
        id: createId(),
        role: "assistant",
        kind: "normal",
        content:
          "Yeni bir revize isteğiyle başlayabiliriz. Türkçe yaz, ben yorumlayayım.",
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
                Türkçe isteğini anlar, yapısal olarak yorumlar, İngilizce prompt
                varyasyonları üretir ve görsel üzerinden üç farklı sonuç hazırlar.
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
                <p className="text-sm font-medium text-white">Görsel yükleme</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  İstersen önce metni yaz, istersen görseli hemen bırak. Sistem iki
                  akışta da çalışır.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
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
                  {file ? "Görseli değiştirmek için tıkla veya bırak" : "Görseli buraya sürükle bırak"}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  PNG, JPG veya WEBP yükleyebilirsin
                </p>
              </div>

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
                <p className="text-sm font-medium text-white">Revize isteği</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Örnek: ışıkları daha gerçekçi yap, dolapları sıcak krem tona çek,
                  tavana spot ekle ama mekanı bozma.
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
                  className="rounded-2xl border border-white/10 bg-white text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 px-4 py-3"
                >
                  {isInterpreting ? "Yorumlanıyor..." : "İsteği yorumla"}
                </button>

                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isGenerating ? "Üretiliyor..." : "Devam et ve üret"}
                </button>
              </div>
            </section>

            {interpreted ? (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="mb-4 text-sm font-medium text-white">Yorumlanan yapı</p>

                <div className="space-y-5 text-sm text-white/70">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.24em] text-white/35">
                      Özet
                    </p>
                    <p className="leading-6">{interpreted.summary_tr}</p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.24em] text-white/35">
                      Stil yönü
                    </p>
                    <p className="leading-6">{interpreted.style_intent}</p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.24em] text-white/35">
                      Korunacaklar
                    </p>
                    <div className="space-y-2">
                      {interpreted.preserve.map((item, i) => (
                        <div
                          key={i}
                          className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.24em] text-white/35">
                      Değişiklikler
                    </p>
                    <div className="space-y-3">
                      {interpreted.changes.length > 0 ? (
                        interpreted.changes.map((item, i) => (
                          <div
                            key={i}
                            className="rounded-[22px] border border-white/10 bg-black/20 p-4"
                          >
                            <p className="text-white">
                              <span className="text-white/40">target</span> / {item.target}
                            </p>
                            <p className="mt-1 text-white">
                              <span className="text-white/40">action</span> / {item.action}
                            </p>
                            <p className="mt-1 text-white">
                              <span className="text-white/40">value</span> / {item.value}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p>Genel iyileştirme isteği algılandı.</p>
                      )}
                    </div>
                  </div>

                  {interpreted.missing_questions?.length > 0 ? (
                    <div className="rounded-[22px] border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100">
                      <p className="mb-2 text-sm font-medium">Netleşebilecek detaylar</p>
                      <div className="space-y-1 text-sm">
                        {interpreted.missing_questions.map((item, i) => (
                          <p key={i}>- {item}</p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
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
                        ].join(" ")}
                      >
                        {message.content}
                      </div>
                    </div>
                  );
                })}

                {(isInterpreting || isGenerating) && (
                  <div className="flex justify-start">
                    <div className="rounded-[24px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white/70" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white/50 [animation-delay:120ms]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white/30 [animation-delay:240ms]" />
                        <span className="ml-1">
                          {isInterpreting ? "AI düşünüyor..." : "Render hazırlanıyor..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {variations.length > 0 ? (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">
                    Oluşturulan İngilizce prompt varyasyonları
                  </p>
                  <p className="text-xs text-white/35">3 prompt</p>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  {variations.map((variation, i) => (
                    <div
                      key={i}
                      className="rounded-[24px] border border-white/10 bg-black/20 p-4"
                    >
                      <p className="mb-3 text-sm font-semibold text-white">
                        {variation.title}
                      </p>
                      <pre className="whitespace-pre-wrap text-xs leading-6 text-white/60">
                        {variation.prompt}
                      </pre>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {results.length > 0 ? (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">Üretilen sonuçlar</p>
                  <p className="text-xs text-white/35">3 varyasyon</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {results.map((src, i) => (
                    <div
                      key={i}
                      className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-black/20"
                    >
                      <img
                        src={src}
                        alt={`Render sonucu ${i + 1}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                        draggable={false}
                      />

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />

                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-sm font-medium text-white">
                          {variations[i]?.title || `Varyasyon ${i + 1}`}
                        </p>
                        <p className="mt-1 text-xs text-white/55">
                          tuDesign AI render revision
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}