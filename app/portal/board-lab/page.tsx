// app/portal/board-lab/page.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AnalyzeResponse = {
  success: boolean;
  analysis?: {
    projectTitle?: string;
    spaceType?: string;
    conceptText?: string;
    functionText?: string[];
    materialPalette?: string[];
    colorPalette?: string[];
    detailNotes?: string[];
  };
  error?: string;
};

type GenerateResponse = {
  success: boolean;
  boardHtml?: string;
  boardData?: {
    projectTitle: string;
    sheetTitle: string;
    mainImage: string;
    detailImages?: string[];
    conceptText?: string;
    functionText?: string[];
    detailNotes?: string[];
    materialPalette?: string[];
    colorPalette?: string[];
    spaceType?: string;
  };
  error?: string;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function createColorDots(colors?: string[]) {
  if (!colors?.length) {
    return ["#d8d0c5", "#bda98d", "#8f7a5f", "#e8e0d2", "#6d6254"];
  }

  return colors.slice(0, 5);
}

async function parseJsonSafely<T>(res: Response): Promise<T> {
  const raw = await res.text();

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(
      raw ? `JSON yerine şu döndü: ${raw.slice(0, 220)}` : "Sunucudan boş yanıt döndü."
    );
  }
}

export default function BoardLabPage() {
  const [projectName, setProjectName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [statusText, setStatusText] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [analysis, setAnalysis] = useState<AnalyzeResponse["analysis"] | null>(null);
  const [boardData, setBoardData] = useState<GenerateResponse["boardData"] | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isProjectNameValid = useMemo(
    () => projectName.trim().length >= 3,
    [projectName]
  );

  const canUpload = isProjectNameValid;
  const canGenerate = isProjectNameValid && !!file && !isAnalyzing && !isGenerating;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleOpenFilePicker() {
    if (!canUpload) return;
    fileInputRef.current?.click();
  }

  function applySelectedFile(selected: File | null) {
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      alert("Lütfen geçerli bir görsel yükle.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setAnalysis(null);
    setBoardData(null);
  }

  function handleReset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setProjectName("");
    setFile(null);
    setPreviewUrl("");
    setStatusText("");
    setAnalysis(null);
    setBoardData(null);
    setIsDragging(false);
    setIsAnalyzing(false);
    setIsGenerating(false);
  }

  async function handleAnalyzeAndGenerate() {
    try {
      if (!projectName.trim() || projectName.trim().length < 3) {
        throw new Error("Pafta oluşturmak için en az 3 harfli proje adı gerekli.");
      }

      if (!file) {
        throw new Error("Önce bir mahal görseli yüklemelisin.");
      }

      setIsAnalyzing(true);
      setIsGenerating(false);
      setStatusText("Görsel analiz ediliyor...");
      setAnalysis(null);
      setBoardData(null);

      const analyzeFormData = new FormData();
      analyzeFormData.append("image", file);
      analyzeFormData.append("projectName", projectName.trim());

      const analyzeRes = await fetch("/api/board-lab/analyze", {
        method: "POST",
        body: analyzeFormData,
      });

      const analyzeData = await parseJsonSafely<AnalyzeResponse>(analyzeRes);

      if (!analyzeRes.ok || !analyzeData?.success) {
        throw new Error(analyzeData?.error || "Görsel analizi başarısız oldu.");
      }

      setAnalysis(analyzeData.analysis || null);

      setIsAnalyzing(false);
      setIsGenerating(true);
      setStatusText("Detay paftası hazırlanıyor...");

      const generateFormData = new FormData();
      generateFormData.append("image", file);
      generateFormData.append("projectName", projectName.trim());

      if (analyzeData.analysis) {
        generateFormData.append("analysis", JSON.stringify(analyzeData.analysis));
      }

      const generateRes = await fetch("/api/board-lab/generate", {
        method: "POST",
        body: generateFormData,
      });

      const generateData = await parseJsonSafely<GenerateResponse>(generateRes);

      if (!generateRes.ok || !generateData?.success) {
        throw new Error(generateData?.error || "Detay paftası oluşturulamadı.");
      }

      setBoardData(
        generateData.boardData || {
          projectTitle: projectName.trim(),
          sheetTitle: `${projectName.trim()} / Detay Paftası`,
          mainImage: previewUrl,
          detailImages: previewUrl ? [previewUrl, previewUrl, previewUrl] : [],
          conceptText:
            analyzeData.analysis?.conceptText ||
            "Bu pafta, projeye ait ana mahal görselinin düzenlenmeden korunarak sunum diline aktarılmış detay özetini içerir.",
          functionText:
            analyzeData.analysis?.functionText || [
              "Ana mahal görseli korunmuştur",
              "Sunum paftası mantığında düzenlenmiştir",
              "Malzeme ve renk dili analiz edilmiştir",
            ],
          detailNotes:
            analyzeData.analysis?.detailNotes || [
              "Ana görsel paftaya doğrudan yerleştirilmiştir",
              "Yakın plan detay alanları otomatik hazırlanmıştır",
              "Malzeme ve renk alanları sunum dili için çıkarılmıştır",
            ],
          colorPalette:
            analyzeData.analysis?.colorPalette || ["#d8d0c5", "#bda98d", "#8f7a5f", "#e8e0d2", "#6d6254"],
          materialPalette:
            analyzeData.analysis?.materialPalette || ["Mermer", "Ahşap", "Duvar", "Zemin"],
          spaceType: analyzeData.analysis?.spaceType || "unknown",
        }
      );

      setStatusText("Detay paftası hazırlandı.");
    } catch (error: any) {
      setStatusText("");
      alert(error?.message || "Bir hata oluştu.");
    } finally {
      setIsAnalyzing(false);
      setIsGenerating(false);
    }
  }

  const paletteColors = createColorDots(boardData?.colorPalette || analysis?.colorPalette);

  return (
    <main
      className="min-h-screen bg-[#0a0a0d] text-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-[-8%] h-[320px] w-[320px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-[-10%] top-[10%] h-[300px] w-[300px] rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] h-[340px] w-[340px] rounded-full bg-zinc-300/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">
                tuDesign AI / Board Lab
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Detay Paftası Oluşturucu
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65 md:text-[15px]">
                Proje adını gir, mahal görselini yükle ve aynı görseli koruyarak
                sunum dilinde bir detay paftası oluştur.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10"
            >
              Sıfırla
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-sm font-medium text-white">Proje adı</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Upload alanını açmak için en az 3 karakter gir.
                </p>
              </div>

              <input
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  setBoardData(null);
                  setAnalysis(null);
                }}
                placeholder='Örn: "Fresh Scarfs"'
                className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
              />

              <div className="mt-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/60">
                Başlık önizlemesi:{" "}
                <span className="text-white/90">
                  {projectName.trim().length >= 3
                    ? `${projectName.trim()} / Detay Paftası`
                    : "Proje adı / Detay Paftası"}
                </span>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-sm font-medium text-white">Mahal görseli yükleme</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Yüklenen görsel pafta içinde korunur. Sistem görseli yeniden
                  tasarlamaz; pafta düzenine yerleştirir.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  applySelectedFile(e.target.files?.[0] || null);
                  e.currentTarget.value = "";
                }}
              />

              <div
                onClick={handleOpenFilePicker}
                onDragOver={(e) => {
                  if (!canUpload) return;
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  if (!canUpload) return;
                  e.preventDefault();
                  setIsDragging(false);
                  applySelectedFile(e.dataTransfer.files?.[0] || null);
                }}
                className={[
                  "group flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed px-6 text-center transition",
                  !canUpload
                    ? "cursor-not-allowed border-white/10 bg-black/10 opacity-55"
                    : isDragging
                    ? "cursor-pointer border-amber-300 bg-amber-300/10"
                    : "cursor-pointer border-white/15 bg-black/20 hover:border-white/30 hover:bg-white/[0.06]",
                ].join(" ")}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl text-white/70">
                  ⬆
                </div>

                <p className="text-sm font-medium text-white">
                  {!canUpload
                    ? "Önce en az 3 harfli proje adı gir"
                    : file
                    ? "Görseli değiştirmek için tıkla veya bırak"
                    : "Görseli buraya sürükle bırak"}
                </p>

                <p className="mt-2 text-xs leading-5 text-white/45">
                  PNG, JPG veya WEBP yükleyebilirsin
                </p>
              </div>

              {file ? (
                <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/65">
                  {file.name} · {formatBytes(file.size)}
                </div>
              ) : null}

              {previewUrl ? (
                <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
                  <img
                    src={previewUrl}
                    alt="Yüklenen mahal görseli"
                    className="h-auto w-full object-cover"
                    draggable={false}
                  />
                </div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-sm font-medium text-white">Pafta oluştur</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Sistem önce görseli analiz eder, sonra aynı görseli koruyarak pafta
                  düzenini oluşturur.
                </p>
              </div>

              <button
                onClick={handleAnalyzeAndGenerate}
                disabled={!canGenerate}
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isAnalyzing
                  ? "Analiz ediliyor..."
                  : isGenerating
                  ? "Pafta hazırlanıyor..."
                  : "Detay Paftası Oluştur"}
              </button>

              {statusText ? (
                <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
                  {statusText}
                </div>
              ) : null}
            </section>
          </aside>

          <section className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-sm font-medium text-white">Detay paftası önizleme</p>
                <p className="mt-1 text-xs text-white/45">
                  Aynı mahal görseli kullanılarak oluşturulan sunum paftası
                </p>
              </div>

              {!boardData ? (
                <div className="flex min-h-[720px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-white/40">
                  Henüz pafta oluşturulmadı.
                </div>
              ) : (
                <div className="overflow-auto rounded-[24px] border border-white/10 bg-[#e7e2db] p-5">
                  <div className="mx-auto min-w-[980px] bg-[#efebe5] text-black shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                    <div className="border-b border-black/20 px-6 py-4 text-center">
                      <h2 className="text-3xl font-light tracking-wide">
                        {boardData.projectTitle}
                      </h2>
                      <p className="mt-1 text-base tracking-wide text-black/70">
                        / Detay Paftası
                      </p>
                    </div>

                    <div className="grid grid-cols-[2fr_1fr] gap-0 border-b border-black/20">
                      <div className="border-r border-black/20 p-4">
                        <p className="mb-3 text-[14px] font-medium uppercase tracking-wide">
                          1. Mahal Görseli
                        </p>
                        <div className="overflow-hidden border border-black/15 bg-white">
                          <img
                            src={boardData.mainImage}
                            alt="Ana mahal görseli"
                            className="h-[420px] w-full object-cover"
                            draggable={false}
                          />
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="mb-3 text-[14px] font-medium uppercase tracking-wide">
                          2. Konsept ve Analiz
                        </p>

                        <div className="rounded-none border border-black/15 bg-white p-4">
                          <p className="text-[13px] leading-6 text-black/80">
                            {boardData.conceptText ||
                              "Bu pafta, yüklenen mahal görselinin değişmeden korunarak detay odaklı sunum diline çevrilmiş özetini içerir."}
                          </p>

                          {boardData.functionText?.length ? (
                            <div className="mt-4">
                              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-black/70">
                                Fonksiyon / Notlar
                              </p>
                              <ul className="space-y-1 text-[12px] leading-5 text-black/75">
                                {boardData.functionText.map((item, index) => (
                                  <li key={`${item}-${index}`}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-0 border-b border-black/20">
                      <div className="border-r border-black/20 p-4">
                        <p className="mb-3 text-[14px] font-medium uppercase tracking-wide">
                          3. Yakın Plan Detaylar
                        </p>

                        <div className="grid grid-cols-1 gap-3">
                          {(boardData.detailImages?.length
                            ? boardData.detailImages.slice(0, 3)
                            : [boardData.mainImage, boardData.mainImage, boardData.mainImage]
                          ).map((image, index) => (
                            <div
                              key={`${image}-${index}`}
                              className="overflow-hidden border border-black/15 bg-white"
                            >
                              <img
                                src={image}
                                alt={`Detay görseli ${index + 1}`}
                                className="h-[150px] w-full object-cover"
                                draggable={false}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-r border-black/20 p-4">
                        <p className="mb-3 text-[14px] font-medium uppercase tracking-wide">
                          4. Renk Paleti
                        </p>

                        <div className="border border-black/15 bg-white p-4">
                          <div className="flex flex-wrap gap-3">
                            {paletteColors.map((color, index) => (
                              <div
                                key={`${color}-${index}`}
                                className="h-12 w-12 rounded-full border border-black/15"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>

                          <p className="mt-4 text-[12px] leading-5 text-black/65">
                            Görselden türetilen ana renk dili ve malzeme sıcaklığı
                            sunum paftası için özetlenmiştir.
                          </p>
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="mb-3 text-[14px] font-medium uppercase tracking-wide">
                          5. Malzeme / Detay Notları
                        </p>

                        <div className="border border-black/15 bg-white p-4">
                          {boardData.materialPalette?.length ? (
                            <>
                              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-black/70">
                                Malzeme Başlıkları
                              </p>
                              <div className="mb-4 flex flex-wrap gap-2">
                                {boardData.materialPalette.map((item, index) => (
                                  <span
                                    key={`${item}-${index}`}
                                    className="border border-black/15 px-2 py-1 text-[11px] text-black/75"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </>
                          ) : null}

                          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-black/70">
                            Otomatik Detay Notları
                          </p>

                          <ul className="space-y-1 text-[12px] leading-5 text-black/75">
                            {(boardData.detailNotes?.length
                              ? boardData.detailNotes
                              : [
                                  "Ana görsel pafta içinde korunmuştur",
                                  "Yakın plan detay alanları otomatik oluşturulmuştur",
                                  "Sunum paftası dilinde düzenlenmiştir",
                                ]
                            ).map((item, index) => (
                              <li key={`${item}-${index}`}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 text-right text-[13px] tracking-wide text-black/65">
                      {boardData.sheetTitle}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}