"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

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
    sketchImage?: string;
    conceptText?: string;
    functionText?: string[];
    detailNotes?: string[];
    materialPalette?: string[];
    colorPalette?: string[];
    spaceType?: string;
    meta?: {
      layoutStyle?: string;
      imageMode?: string;
      generatedBy?: string;
    };
  };
  error?: string;
};

type ModalImage = {
  src: string;
  title: string;
  subtitle?: string;
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

  const [modalImage, setModalImage] = useState<ModalImage | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloadingBoard, setIsDownloadingBoard] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const boardExportRef = useRef<HTMLDivElement | null>(null);

  const isProjectNameValid = useMemo(() => projectName.trim().length >= 3, [projectName]);
  const canUpload = isProjectNameValid;
  const canGenerate = isProjectNameValid && !!file && !isAnalyzing && !isGenerating;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalImage(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
    setModalImage(null);
    setIsSharing(false);
    setIsDownloadingBoard(false);
  }

  function openImageModal(src: string, title: string, subtitle?: string) {
    setModalImage({ src, title, subtitle });
  }

  function downloadImage(src: string, filename: string) {
    try {
      const link = document.createElement("a");
      link.href = src;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      window.open(src, "_blank", "noopener,noreferrer");
    }
  }

  async function shareImage(src: string, title: string) {
    try {
      setIsSharing(true);

      if (navigator.share) {
        await navigator.share({
          title,
          text: title,
          url: src,
        });
        return;
      }

      await navigator.clipboard.writeText(src);
      alert("Paylaşım linki panoya kopyalandı.");
    } catch {
      alert("Paylaşım işlemi tamamlanamadı.");
    } finally {
      setIsSharing(false);
    }
  }

  function handlePrintBoard() {
    window.print();
  }

  async function handleDownloadBoardAsPng() {
    try {
      const node = boardExportRef.current;

      if (!node) {
        throw new Error("Pafta alanı bulunamadı.");
      }

      setIsDownloadingBoard(true);

      const dataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: "#f4efe8",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `${(boardData?.projectTitle || projectName || "board-lab")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase()}-detay-paftasi.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("PNG export error:", error);
      alert("PNG indirme sırasında bir hata oluştu.");
    } finally {
      setIsDownloadingBoard(false);
    }
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
          sketchImage: previewUrl,
          conceptText:
            analyzeData.analysis?.conceptText ||
            "Bu pafta, projeye ait ana mahal görselinin düzenlenmeden korunarak sunum diline aktarılmış detay özetini içerir.",
          functionText: analyzeData.analysis?.functionText || [
            "Ana mahal görseli korunmuştur",
            "Sunum paftası mantığında düzenlenmiştir",
            "Malzeme ve renk dili analiz edilmiştir",
          ],
          detailNotes: analyzeData.analysis?.detailNotes || [
            "Ana görsel paftaya doğrudan yerleştirilmiştir",
            "Yakın plan detay alanları otomatik hazırlanmıştır",
            "Malzeme ve renk alanları sunum dili için çıkarılmıştır",
          ],
          colorPalette: analyzeData.analysis?.colorPalette || [
            "#d8d0c5",
            "#bda98d",
            "#8f7a5f",
            "#e8e0d2",
            "#6d6254",
          ],
          materialPalette:
            analyzeData.analysis?.materialPalette || ["Mermer", "Ahşap", "Duvar", "Zemin"],
          spaceType: analyzeData.analysis?.spaceType || "unknown",
          meta: {
            layoutStyle: "premium-presentation-sheet",
            imageMode: "original-protected",
            generatedBy: "tuDesign AI / Board Lab",
          },
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

  const detailImages =
    boardData?.detailImages?.length
      ? boardData.detailImages.slice(0, 3)
      : boardData?.mainImage
      ? [boardData.mainImage, boardData.mainImage, boardData.mainImage]
      : [];

  const metaInfo = {
    layoutStyle: boardData?.meta?.layoutStyle || "premium-presentation-sheet",
    imageMode: boardData?.meta?.imageMode || "original-protected",
    generatedBy: boardData?.meta?.generatedBy || "tuDesign AI / Board Lab",
  };

  return (
    <main
      className="min-h-screen bg-[#09090b] text-white print:bg-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-board,
          .print-board * {
            visibility: visible !important;
          }
          .print-board {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden print:hidden">
        <div className="absolute left-[-8%] top-[-8%] h-[320px] w-[320px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-[-10%] top-[10%] h-[320px] w-[320px] rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[18%] h-[360px] w-[360px] rounded-full bg-zinc-300/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 print:max-w-none print:px-0 print:py-0">
        <div className="mb-6 rounded-[30px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl md:p-6 print:hidden">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">
                tuDesign AI / Board Lab
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Detay Paftası Oluşturucu
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65 md:text-[15px]">
                Proje adını gir, mahal görselini yükle ve görseli koruyarak daha düzenli,
                daha sunuma uygun, premium bir pafta kurgusu oluştur.
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

        <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)] print:block">
          <aside className="space-y-6 print:hidden">
            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
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
                placeholder="Proje Adı"
                className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
              />

              <div className="mt-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/60">
                Başlık önizlemesi:{" "}
                <span className="text-white/90">
                  {projectName.trim().length >= 3
                    ? `${projectName.trim()} / Detay Paftası`
                    : "Proje Adı / Detay Paftası"}
                </span>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-sm font-medium text-white">Mahal görseli yükleme</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Sistem görseli yeniden tasarlamaz; mevcut görseli pafta düzenine yerleştirir.
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
                  "group flex min-h-[210px] flex-col items-center justify-center rounded-[24px] border border-dashed px-6 text-center transition",
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
                <div className="mt-4 rounded-[24px] border border-white/10 bg-black/30 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                        Preview
                      </p>
                      <p className="mt-1 text-sm text-white/80">Yüklenen ana görsel</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          downloadImage(
                            previewUrl,
                            `${(projectName.trim() || "board-lab").replace(/\s+/g, "-")}-preview.jpg`
                          )
                        }
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 transition hover:bg-white/10"
                      >
                        İndir
                      </button>

                      <button
                        onClick={() => shareImage(previewUrl, "Board Lab Preview")}
                        disabled={isSharing}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 transition hover:bg-white/10 disabled:opacity-50"
                      >
                        Paylaş
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openImageModal(
                        previewUrl,
                        "Yüklenen Görsel",
                        file?.name || "Ana mahal görseli"
                      )
                    }
                    className="block w-full overflow-hidden rounded-[18px] border border-white/10 bg-black/20"
                  >
                    <img
                      src={previewUrl}
                      alt="Yüklenen mahal görseli"
                      className="h-[210px] w-full object-cover transition duration-300 hover:scale-[1.02]"
                      draggable={false}
                    />
                  </button>
                </div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-sm font-medium text-white">Pafta oluştur</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Sistem önce görseli analiz eder, sonra pafta düzenini oluşturur.
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

          <section className="space-y-6 print-board">
            <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl print:rounded-none print:border-none print:bg-white print:p-0 print:backdrop-blur-none">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between print:hidden">
                <div>
                  <p className="text-sm font-medium text-white">Detay paftası önizleme</p>
                  <p className="mt-1 text-xs text-white/45">
                    Daha kompakt, daha profesyonel pafta kurgusu
                  </p>
                </div>

                {boardData ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        openImageModal(
                          boardData.mainImage,
                          `${boardData.projectTitle} / Ana Görsel`,
                          "Paftadaki ana görsel"
                        )
                      }
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 transition hover:bg-white/10"
                    >
                      Görseli Aç
                    </button>

                    <button
                      onClick={handleDownloadBoardAsPng}
                      disabled={isDownloadingBoard}
                      className="rounded-xl border border-white/10 bg-white px-3 py-2 text-xs font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDownloadingBoard ? "PNG hazırlanıyor..." : "PNG İndir"}
                    </button>

                    <button
                      onClick={handlePrintBoard}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 transition hover:bg-white/10"
                    >
                      Yazdır
                    </button>
                  </div>
                ) : null}
              </div>

              {!boardData ? (
                <div className="flex min-h-[720px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-white/40 print:hidden">
                  Henüz pafta oluşturulmadı.
                </div>
              ) : (
                <div className="overflow-auto rounded-[24px] border border-white/10 bg-[#ddd7cf] p-4 print:overflow-visible print:rounded-none print:border-none print:bg-white print:p-0">
                  <div
                    ref={boardExportRef}
                    className="mx-auto min-w-[1080px] bg-[#f4efe8] text-black shadow-[0_24px_80px_rgba(0,0,0,0.18)] print:min-w-0 print:shadow-none"
                  >
                    <div className="grid grid-cols-[1.6fr_0.9fr] border-b border-black/15">
                      <div className="border-r border-black/15 px-7 py-6">
                        <p className="text-[11px] uppercase tracking-[0.35em] text-black/40">
                          {metaInfo.generatedBy}
                        </p>
                        <h2 className="mt-3 text-[36px] font-light leading-none tracking-[0.06em]">
                          {boardData.projectTitle}
                        </h2>
                        <p className="mt-2 text-sm tracking-[0.25em] text-black/55">
                          DETAY PAFTASI
                        </p>
                      </div>

                      <div className="px-7 py-6">
                        <div className="grid grid-cols-2 gap-4 text-[11px] uppercase tracking-[0.16em] text-black/55">
                          <div>
                            <p className="mb-2 text-black/35">Mahal Türü</p>
                            <p className="text-[12px] text-black/80">
                              {boardData.spaceType || "Unknown"}
                            </p>
                          </div>
                          <div>
                            <p className="mb-2 text-black/35">Durum</p>
                            <p className="text-[12px] text-black/80">{metaInfo.layoutStyle}</p>
                          </div>
                          <div>
                            <p className="mb-2 text-black/35">Görsel</p>
                            <p className="text-[12px] text-black/80">{metaInfo.imageMode}</p>
                          </div>
                          <div>
                            <p className="mb-2 text-black/35">Layout</p>
                            <p className="text-[12px] text-black/80">Presentation Sheet</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-[1.45fr_0.9fr] border-b border-black/15">
                      <div className="border-r border-black/15 p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-black/55">
                            Ana Görsel
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              openImageModal(
                                boardData.mainImage,
                                `${boardData.projectTitle} / Ana Görsel`,
                                "Paftadaki ana render"
                              )
                            }
                            className="text-[11px] uppercase tracking-[0.18em] text-black/50 transition hover:text-black"
                          >
                            Büyüt
                          </button>
                        </div>

                        <div className="overflow-hidden border border-black/15 bg-white">
                          <img
                            src={boardData.mainImage}
                            alt="Ana mahal görseli"
                            className="h-[560px] w-full object-cover"
                            draggable={false}
                          />
                        </div>
                      </div>

                      <div className="grid grid-rows-[auto_auto_1fr]">
                        <div className="border-b border-black/15 p-5">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-black/55">
                              Konsept
                            </p>
                            <span className="border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-black/45">
                              Analysis
                            </span>
                          </div>

                          <p className="text-[13px] leading-6 text-black/78">
                            {boardData.conceptText ||
                              "Bu pafta, yüklenen mahal görselinin korunarak daha rafine bir sunum dili ile düzenlenmiş özetini içerir."}
                          </p>
                        </div>

                        <div className="border-b border-black/15 p-5">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-black/55">
                              Sketch Referans
                            </p>
                            <span className="border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-black/45">
                              Concept View
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openImageModal(
                                boardData.sketchImage || boardData.mainImage,
                                `${boardData.projectTitle} / Sketch Referans`,
                                "AI sketch preview"
                              )
                            }
                            className="group block w-full overflow-hidden border border-black/15 bg-[#f8f6f2]"
                          >
                            <div className="relative">
                              <img
                                src={boardData.sketchImage || boardData.mainImage}
                                alt="Sketch referans"
                                className="h-[200px] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                style={{
                                  filter:
                                    "grayscale(1) contrast(1.28) brightness(1.06) saturate(0) sepia(0.1)",
                                  mixBlendMode: "multiply",
                                }}
                                draggable={false}
                              />

                              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),rgba(0,0,0,0.02))]" />

                              <div className="pointer-events-none absolute left-3 top-3 border border-black/10 bg-white/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-black/60 backdrop-blur-sm">
                                Sketch Layer
                              </div>

                              <div className="pointer-events-none absolute bottom-3 right-3 border border-black/10 bg-white/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-black/60 backdrop-blur-sm">
                                Click to expand
                              </div>
                            </div>
                          </button>

                          <p className="mt-3 text-[11px] leading-5 text-black/55">
                            Ana görselin sunum paftası diline yakın, eskiz karakterli yardımcı görünümü.
                          </p>
                        </div>

                        <div className="p-5">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-black/55">
                              Renk Paleti
                            </p>
                            <span className="border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-black/45">
                              Palette
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {paletteColors.map((color, index) => (
                              <div
                                key={`${color}-${index}`}
                                className="relative h-12 w-12 overflow-hidden rounded-full border border-black/15"
                                style={{ backgroundColor: color }}
                                title={color}
                              >
                                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.28),rgba(255,255,255,0))]" />
                              </div>
                            ))}
                          </div>

                          <p className="mt-4 text-[12px] leading-5 text-black/58">
                            Görselden türetilen ana renk dengesi ve malzeme sıcaklığı.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_0.95fr_0.95fr] border-b border-black/15">
                      <div className="border-r border-black/15 p-5">
                        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-black/55">
                          Yakın Plan Detaylar
                        </p>

                        <div className="grid grid-cols-1 gap-3">
                          {detailImages.map((image, index) => (
                            <button
                              key={`${image}-${index}`}
                              type="button"
                              onClick={() =>
                                openImageModal(
                                  image,
                                  `Detay Görseli ${index + 1}`,
                                  `${boardData.projectTitle} / Yakın plan`
                                )
                              }
                              className="overflow-hidden border border-black/15 bg-white text-left"
                            >
                              <img
                                src={image}
                                alt={`Detay görseli ${index + 1}`}
                                className="h-[150px] w-full object-cover transition duration-300 hover:scale-[1.02]"
                                draggable={false}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-r border-black/15 p-5">
                        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-black/55">
                          Fonksiyon / Notlar
                        </p>

                        <ul className="space-y-2 text-[12px] leading-5 text-black/76">
                          {(boardData.functionText?.length
                            ? boardData.functionText
                            : [
                                "Ana mahal görseli korunmuştur",
                                "Sunum dili için sadeleştirilmiştir",
                                "Detay alanları otomatik kurgulanmıştır",
                              ]
                          ).map((item, index) => (
                            <li key={`${item}-${index}`} className="border-b border-black/8 pb-2">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-5">
                        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.2em] text-black/55">
                          Malzeme / Detay Notları
                        </p>

                        {boardData.materialPalette?.length ? (
                          <div className="mb-4 flex flex-wrap gap-2">
                            {boardData.materialPalette.map((item, index) => (
                              <span
                                key={`${item}-${index}`}
                                className="border border-black/15 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.12em] text-black/72"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <ul className="space-y-2 text-[12px] leading-5 text-black/76">
                          {(boardData.detailNotes?.length
                            ? boardData.detailNotes
                            : [
                                "Ana görsel pafta içinde korunmuştur",
                                "Yakın plan alanları otomatik hazırlanmıştır",
                                "Sunum paftası dilinde düzenlenmiştir",
                              ]
                          ).map((item, index) => (
                            <li key={`${item}-${index}`} className="border-b border-black/8 pb-2">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-7 py-4 text-[12px] uppercase tracking-[0.16em] text-black/48">
                      <span>{boardData.sheetTitle}</span>
                      <span>{metaInfo.generatedBy}</span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </section>
        </div>
      </div>

      {modalImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md print:hidden"
          onClick={() => setModalImage(null)}
        >
          <div
            className="w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#111214] shadow-[0_30px_120px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{modalImage.title}</p>
                {modalImage.subtitle ? (
                  <p className="mt-1 truncate text-xs text-white/45">{modalImage.subtitle}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    downloadImage(
                      modalImage.src,
                      `${modalImage.title.toLowerCase().replace(/\s+/g, "-")}.jpg`
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 transition hover:bg-white/10"
                >
                  İndir
                </button>

                <button
                  onClick={() => shareImage(modalImage.src, modalImage.title)}
                  disabled={isSharing}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Paylaş
                </button>

                <button
                  onClick={() => setModalImage(null)}
                  className="rounded-xl border border-white/10 bg-white px-3 py-2 text-xs font-medium text-black transition hover:opacity-90"
                >
                  Kapat
                </button>
              </div>
            </div>

            <div className="max-h-[80vh] overflow-auto bg-black">
              <img
                src={modalImage.src}
                alt={modalImage.title}
                className="h-auto w-full object-contain"
                draggable={false}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}