"use client";

import { useEffect, useRef, useState } from "react";

type ImageResult = string[];
type ModeOption = "retouch" | "redesign";

type ReferenceItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  featured: boolean;
};

export default function HomePage() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<ImageResult>([]);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const [mode, setMode] = useState<ModeOption>("retouch");

  const [leadName, setLeadName] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadMessage, setLeadMessage] = useState("");

  const [featuredReferences, setFeaturedReferences] = useState<ReferenceItem[]>(
    []
  );

  const whatsappNumber = "905324207506";

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    let isMounted = true;

    async function fetchReferences() {
      try {
        const res = await fetch("/api/references", {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();

        if (!Array.isArray(data)) return;

        const featuredOnly = data.filter(
          (item: ReferenceItem) => item.featured
        );

        if (isMounted) {
          setFeaturedReferences(featuredOnly);
        }
      } catch (err) {
        console.error("References fetch error:", err);
      }
    }

    fetchReferences();

    return () => {
      isMounted = false;
    };
  }, []);

  function handlePickFile() {
    inputRef.current?.click();
  }

  function handleIncomingFile(incomingFile: File) {
    if (!incomingFile.type.startsWith("image/")) {
      setError("Lütfen geçerli bir görsel yükle.");
      return;
    }

    setFile(incomingFile);
    setImages([]);
    setSelectedResult(null);
    setError("");
    setLeadMessage("");
  }

  async function handleGenerate() {
    if (!file) {
      setError("Önce görsel yükle.");
      return;
    }

    setLoading(true);
    setError("");
    setImages([]);
    setSelectedResult(null);
    setLeadMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("style", "Premium");
      formData.append("mode", mode);
      formData.append("note", "");

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "AI üretimi başarısız oldu.");
        return;
      }

      const resultImages = Array.isArray(data?.images) ? data.images : [];
      setImages(resultImages);

      if (resultImages.length > 0) {
        setSelectedResult(resultImages[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Bağlantı sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  function handleLeadSubmit() {
    if (!leadName.trim() || !leadContact.trim() || !selectedResult) {
      return;
    }

    const message = `Merhaba; tuDesign ai üzerinden oluşturduğum tasarım hakkında sizinle ilerlemek istiyorum.

isim: ${leadName}
iletişim: ${leadContact}

bu tasarımın profesyonel olarak uygulanması veya geliştirilmesi için bilgi alabilir miyim ?`;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, "_blank");
    setLeadMessage("WhatsApp’a yönlendiriliyorsun...");
  }

  const isLeadFormValid =
    leadName.trim().length > 0 &&
    leadContact.trim().length > 0 &&
    !!selectedResult;

  return (
    <div className="min-h-screen bg-[#f6f6f4] text-[#111111] selection:bg-black/10">
      <header className="sticky top-0 z-30 border-b border-black/8 bg-[#f6f6f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <a
            href="/"
            className="text-[1.65rem] font-semibold tracking-[-0.04em] text-black"
          >
            tu.
          </a>

          <nav className="hidden items-center gap-10 text-[13px] uppercase tracking-[0.18em] text-black/60 md:flex">
            <a href="/references" className="transition hover:text-black">
              Projeler
            </a>
            <a href="#studio" className="transition hover:text-black">
              Stüdyo
            </a>
            <a href="#contact" className="transition hover:text-black">
              İletişim
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-12 lg:px-10 lg:pb-28 lg:pt-16">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="flex flex-col justify-between rounded-[2rem] border border-black/8 bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] lg:min-h-[620px] lg:p-10">
              <div>
                <div className="mb-8 text-[11px] uppercase tracking-[0.24em] text-black/35">
                  tuDesign AI / iç mekân görselleştirme
                </div>

                <h1 className="max-w-2xl text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-black sm:text-6xl lg:text-[4.8rem]">
                  Daha güçlü
                  <br />
                  mekânlar için
                  <br />
                  daha rafine bir dil.
                </h1>

                <p className="mt-8 max-w-lg text-[15px] leading-7 text-black/58 sm:text-base">
                  Görselini yükle, yönünü seç ve sunum gücünü artıran, karar
                  sürecini hızlandıran rafine AI varyasyonları al.
                </p>
              </div>

              <div className="mt-14 border-t border-black/8 pt-8">
                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-black/30">
                      Rötuşla
                    </div>
                    <div className="mt-2 text-sm leading-6 text-black/60">
                      Işığı, materyali ve atmosferi güçlendir.
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-black/30">
                      Yön Ver
                    </div>
                    <div className="mt-2 text-sm leading-6 text-black/60">
                      Sunum dilini daha net ve daha güçlü kur.
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-black/30">
                      Yeniden Yorumla
                    </div>
                    <div className="mt-2 text-sm leading-6 text-black/60">
                      AI destekli daha güçlü alternatifler üret.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] lg:p-8">
              <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-black/35">
                Tasarıma başla
              </div>

              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-black">
                Görselini yükle
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-7 text-black/55">
                Bir render, iç mekân fotoğrafı ya da konsept görsel yükle.
                Yönünü seç, sistemin daha rafine mekânsal alternatifler
                üretmesini sağla.
              </p>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const pickedFile = e.target.files?.[0];
                  if (pickedFile) handleIncomingFile(pickedFile);
                }}
              />

              <div
                onClick={handlePickFile}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) handleIncomingFile(droppedFile);
                }}
                className="mt-6 cursor-pointer rounded-[1.75rem] border border-dashed border-black/10 bg-[#fafaf8] p-8 text-center transition hover:border-black/20 hover:bg-[#f3f3ef]"
              >
                {!preview ? (
                  <>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-xl">
                      ↑
                    </div>

                    <div className="mt-5 text-base font-medium text-black">
                      Görseli buraya bırak
                    </div>

                    <div className="mt-2 text-sm text-black/45">
                      JPG, PNG veya WEBP
                    </div>

                    <div className="mt-5 inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white">
                      Dosya Seç
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-[1.25rem] border border-black/8 bg-white">
                      <img
                        src={preview}
                        alt="Yüklenen görsel"
                        className="max-h-[320px] w-full object-contain bg-[#f8f8f5]"
                      />
                    </div>

                    <div className="text-sm text-black/45">
                      Değiştirmek için tekrar tıkla ya da yeni bir dosya sürükle.
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="mb-3 text-sm text-black/70">Yön</div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("retouch")}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      mode === "retouch"
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white text-black/70"
                    }`}
                  >
                    Rötuşla
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("redesign")}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      mode === "redesign"
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white text-black/70"
                    }`}
                  >
                    Yeniden Yorumla
                  </button>
                </div>

                <p className="mt-3 text-sm leading-6 text-black/45">
                  {mode === "retouch"
                    ? "Mekânı korur; ışığı, materyal etkisini ve genel atmosferi iyileştirir."
                    : "Mekânı baz alır ve daha güçlü alternatif tasarım yönleri üretir."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="mt-8 w-full rounded-full bg-black px-6 py-4 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "AI çalışıyor..."
                  : mode === "retouch"
                  ? "Görseli Rötuşla"
                  : "Tasarım Üret"}
              </button>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-500/15 bg-red-500/5 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>

        {(loading || images.length > 0) && (
          <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
            {loading && (
              <div className="rounded-[2rem] border border-black/8 bg-white px-8 py-14 text-center shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-black border-t-transparent" />
                <div className="mt-5 text-xl font-medium text-black">
                  {mode === "retouch"
                    ? "AI görselini rafine ediyor..."
                    : "AI yeni tasarım yönleri üretiyor..."}
                </div>
                <div className="mt-2 text-sm text-black/45">
                  Bu işlem kısa bir süre alabilir.
                </div>
              </div>
            )}

            {!loading && images.length > 0 && (
              <div className="rounded-[2rem] border border-black/8 bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
                <div className="mb-8">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-black/35">
                    Sonuçlar
                  </div>
                  <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-black">
                    AI varyasyonların hazır
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-black/55">
                    En güçlü varyasyonu seç ve profesyonel sürece bizimle
                    WhatsApp üzerinden devam et.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSelectedResult(img);
                        setLeadMessage("");
                      }}
                      className={`overflow-hidden rounded-[1.5rem] border text-left transition ${
                        selectedResult === img
                          ? "border-black shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                          : "border-black/8"
                      }`}
                    >
                      <div className="border-b border-black/8 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-black/35">
                        Varyasyon {index + 1}
                      </div>

                      <img
                        src={img}
                        alt={`Varyasyon ${index + 1}`}
                        className="h-72 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-[1.75rem] border border-black/8 bg-[#fafaf8] p-5">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-black/35">
                      Seçilen
                    </div>

                    <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-black/8 bg-white">
                      {selectedResult ? (
                        <img
                          src={selectedResult}
                          alt="Seçilen sonuç"
                          className="max-h-[360px] w-full object-contain bg-[#f8f8f5]"
                        />
                      ) : (
                        <div className="flex h-[260px] items-center justify-center text-sm text-black/35">
                          Bir varyasyon seç
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-black/8 bg-[#fafaf8] p-6">
                    <div className="text-lg font-medium text-black">
                      Profesyonel olarak devam et
                    </div>

                    <p className="mt-2 text-sm leading-7 text-black/55">
                      İsim ve iletişim bilgilerini doldur, ardından WhatsApp
                      üzerinden bizimle direkt iletişime geç.
                    </p>

                    <div className="mt-5 grid gap-3">
                      <input
                        type="text"
                        placeholder="İsim Soyisim"
                        value={leadName}
                        onChange={(e) => {
                          setLeadName(e.target.value);
                          setLeadMessage("");
                        }}
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-black/30"
                      />

                      <input
                        type="text"
                        placeholder="Telefon / WhatsApp"
                        value={leadContact}
                        onChange={(e) => {
                          setLeadContact(e.target.value);
                          setLeadMessage("");
                        }}
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-black/30"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleLeadSubmit}
                      disabled={!isLeadFormValid}
                      className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      İletişime Geç
                    </button>

                    {leadMessage && (
                      <div className="mt-3 text-sm text-black/55">
                        {leadMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
          <div className="mb-10">
            <div className="text-[11px] uppercase tracking-[0.24em] text-black/35">
              Seçilmiş Projeler
            </div>
            <h2 className="mt-2 max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-black sm:text-4xl">
              Zamansız bir estetik, ölçülü bir yaklaşım.
            </h2>
          </div>

          {featuredReferences.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {featuredReferences.map((item) => (
                <article key={item.id} className="group cursor-pointer">
                  <a href="/references" className="block">
                    <div className="relative overflow-hidden rounded-[2rem] border border-black/8 bg-white">
                      <img
                        src={item.image}
                        alt={item.title}
                        draggable={false}
                        className="h-80 w-full select-none object-cover transition duration-700 ease-out group-hover:scale-[1.025] group-hover:-translate-y-[4px]"
                      />

                      <div className="pointer-events-none absolute inset-0 bg-black/0 transition duration-500 group-hover:bg-black/[0.04]" />
                    </div>

                    <div className="pt-4">
                      <h3 className="text-[18px] font-medium tracking-[-0.02em] text-black transition duration-300 group-hover:opacity-70">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-black/55">
                        {item.subtitle}
                      </p>
                    </div>
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              <div className="overflow-hidden rounded-[2rem] border border-black/8 bg-white">
                <div className="flex h-80 items-center justify-center text-sm text-black/35">
                  Yakında
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-black/8 bg-white">
                <div className="flex h-80 items-center justify-center text-sm text-black/35">
                  Yakında
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-black/8 bg-white">
                <div className="flex h-80 items-center justify-center text-sm text-black/35">
                  Yakında
                </div>
              </div>
            </div>
          )}
        </section>

        <section
          id="studio"
          className="mx-auto grid max-w-7xl gap-10 px-6 pb-24 lg:grid-cols-[0.78fr_1.22fr] lg:px-10"
        >
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-black/35">
              Stüdyo
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black sm:text-4xl">
              Gerçek proje deneyiminden beslenir.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[2rem] border border-black/8 bg-white p-8">
              <p className="text-base leading-8 text-black/60">
                tuDesign AI, mimari sezgiyi daha hızlı karar alma, daha güçlü
                görsel sunum ve daha rafine bir proje diliyle birleştiren bir
                sistemdir.
              </p>
            </div>

            <div className="rounded-[2rem] border border-black/8 bg-white p-8">
              <p className="text-base leading-8 text-black/60">
                Buradaki amaç yalnızca bir efekt üretmek değil; daha sakin,
                daha güçlü ve daha ikna edici mekânsal atmosferler kurmaktır.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer
        id="contact"
        className="border-t border-black/8 px-6 py-8 text-sm text-black/45 lg:px-10"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>tuDesign AI</div>

          <div className="flex items-center gap-5">
            <a href="#" className="transition hover:text-black">
              Instagram
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-black"
            >
              WhatsApp
            </a>
            <a href="#contact" className="transition hover:text-black">
              İletişim
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}