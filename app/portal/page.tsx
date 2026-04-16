"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Provider = "gemini" | "chatgpt" | "openai";

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

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function getEngineLabel(provider: Provider) {
  if (provider === "gemini") return "GearRenderEngineV1 çalışıyor";
  if (provider === "chatgpt") return "ChargeRenderEngineV1 çalışıyor";
  return "OnixRenderEngineV1 çalışıyor";
}

export default function RenderPage() {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [provider, setProvider] = useState<Provider>("openai");

  const [interpreted, setInterpreted] = useState<InterpretedResult | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const canInterpret = useMemo(
    () => input.trim().length > 0 && !isInterpreting,
    [input, isInterpreting]
  );

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
    setResult(null);
    setIsInterpreting(true);

    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userText,
          provider,
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
      if (!file) {
        throw new Error("Önce bir görsel yüklemelisin.");
      }

      if (!interpreted) {
        throw new Error("Önce revize isteğini yorumlatmalısın.");
      }

      setIsGenerating(true);
      setResult(null);

      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "normal",
        content: `İstediğin revizeyi oluşturmak için çalışıyorum. ${getEngineLabel(provider)}.`,
      });

      const formData = new FormData();
      formData.append("image", file);
      formData.append("prompt", interpreted.summary_tr);
      formData.append("engine", provider);

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await parseJsonSafely(res);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Render üretimi başarısız oldu.");
      }

      if (!data?.image) {
        throw new Error("Üretim tamamlandı ama görsel dönmedi.");
      }

      setResult(`data:image/png;base64,${data.image}`);

      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "success",
        content: data?.engineName
          ? `Revize hazır. ${data.engineName}.`
          : `Revize hazır. ${getEngineLabel(provider)}.`,
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
    setResult(null);
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
                Revize istediğin alanları yorumlar, gerekirse soru sorar ve yalnızca
                istenen bölgelere odaklanarak tek sonuç üretir.
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
                <p className="text-sm font-medium text-white">Motor seçimi</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  İstersen çalışma akışını motor bazlı test edebilirsin.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  onClick={() => setProvider("gemini")}
                  className={`rounded-2xl border px-4 py-3 text-sm transition ${
                    provider === "gemini"
                      ? "border-white bg-white text-black"
                      : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  GearRenderEngineV1
                </button>

                <button
                  onClick={() => setProvider("chatgpt")}
                  className={`rounded-2xl border px-4 py-3 text-sm transition ${
                    provider === "chatgpt"
                      ? "border-white bg-white text-black"
                      : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  ChargeRenderEngineV1
                </button>

                <button
                  onClick={() => setProvider("openai")}
                  className={`rounded-2xl border px-4 py-3 text-sm transition ${
                    provider === "openai"
                      ? "border-white bg-white text-black"
                      : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  OnixRenderEngineV1
                </button>
              </div>
            </section>

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
                  {file
                    ? "Görseli değiştirmek için tıkla veya bırak"
                    : "Görseli buraya sürükle bırak"}
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
                  Örnek: yalnızca duş alanı duvarını bordo tona çek, zemini koyu
                  seramik yap, diğer tüm alanları koru.
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
                  {isGenerating ? "Üretiliyor..." : "Devam et ve üret"}
                </button>
              </div>
            </section>

            {interpreted ? (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="mb-5">
                  <p className="text-sm font-medium text-white">Revize özeti</p>
                  <p className="mt-1 text-xs text-white/40">
                    Sistem yalnızca istediğin alanlara odaklanarak çalışacak.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-white/35">
                      Anlaşılan istek
                    </p>
                    <p className="text-sm leading-6 text-white/80">
                      {interpreted.summary_tr}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-white/35">
                      Korunacak alanlar
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {interpreted.preserve.length > 0 ? (
                        interpreted.preserve.map((item, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75"
                          >
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-white/50">
                          Ek koruma notu bulunmuyor.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-white/35">
                      Uygulanacak revizeler
                    </p>

                    <div className="space-y-2">
                      {interpreted.changes.length > 0 ? (
                        interpreted.changes.map((item, i) => (
                          <div
                            key={i}
                            className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3"
                          >
                            <p className="text-sm leading-6 text-white/80">{item.value}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-white/50">
                          Genel iyileştirme odaklı bir revize algılandı.
                        </p>
                      )}
                    </div>
                  </div>

                  {interpreted.missing_questions?.length > 0 ? (
                    <div className="rounded-[22px] border border-amber-400/30 bg-amber-400/10 p-4">
                      <p className="mb-3 text-sm font-medium text-amber-100">
                        Netleştirilirse sonuç güçlenir
                      </p>

                      <div className="space-y-2">
                        {interpreted.missing_questions.map((item, i) => (
                          <div
                            key={i}
                            className="rounded-2xl border border-amber-300/20 bg-black/10 px-3 py-2 text-sm text-amber-50"
                          >
                            {item}
                          </div>
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

                {(isInterpreting || isGenerating) && (
                  <div className="flex justify-start">
                    <div className="rounded-[24px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white/70" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white/50 [animation-delay:120ms]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white/30 [animation-delay:240ms]" />
                        <span className="ml-1">
                          {isInterpreting
                            ? "Revize talebin analiz ediliyor..."
                            : `${getEngineLabel(provider)}.`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {result ? (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">Üretilen sonuç</p>
                  <p className="text-xs text-white/35">tek görsel</p>
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