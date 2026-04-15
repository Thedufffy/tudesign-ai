"use client";

import { useEffect, useMemo, useState } from "react";

const CATEGORIES = [
  { label: "Ceket / Jacket", value: "topwear", display: "Ceket" },
  { label: "Elbise / Dress", value: "dress", display: "Elbise" },
  { label: "Mont / Outerwear", value: "outerwear", display: "Mont" },
  { label: "Takı / Jewelry", value: "jewelry", display: "Takı" },
  { label: "Ayakkabı / Shoes", value: "shoes", display: "Ayakkabı" },
  { label: "Çanta / Bag", value: "bag", display: "Çanta" },
  { label: "Alt Giyim / Bottomwear", value: "bottomwear", display: "Alt Giyim" },
] as const;

const COUNTRIES = [
  "Türkiye",
  "Fransa",
  "İtalya",
  "İngiltere",
  "Amerika",
  "Birleşik Arap Emirlikleri",
  "Mısır",
  "Almanya",
  "Norveç",
  "İskandinav",
  "Fas",
  "Diğer",
] as const;

const PRESETS = [
  {
    value: "luxury_studio_clean",
    label: "Luxury Studio Clean / Temiz Lüks Stüdyo",
  },
  {
    value: "editorial_cover_blue",
    label: "Editorial Cover Blue / Mavi Editoryal Kapak",
  },
  {
    value: "motion_campaign",
    label: "Motion Campaign / Hareketli Kampanya",
  },
  {
    value: "sculptural_editorial",
    label: "Sculptural Editorial / Heykelsi Editoryal",
  },
  {
    value: "mirror_editorial",
    label: "Mirror Editorial / Aynalı Editoryal",
  },
  {
    value: "premium_ecommerce",
    label: "Premium Ecommerce / Premium E-Ticaret",
  },
] as const;

const LENS_OPTIONS = [
  { value: "35mm", label: "35mm / Dinamik Geniş Açı" },
  { value: "50mm", label: "50mm / Dengeli Editoryal" },
  { value: "65mm", label: "65mm / Premium Sıkıştırılmış Perspektif" },
  { value: "85mm", label: "85mm / Portre Odaklı Lüks" },
] as const;

const LIGHTING_OPTIONS = [
  { value: "soft_diffused", label: "Soft Diffused / Yumuşak Dağılmış Işık" },
  {
    value: "directional_editorial",
    label: "Directional Editorial / Yönlü Editoryal Işık",
  },
  {
    value: "dramatic_contrast",
    label: "Dramatic Contrast / Dramatik Kontrast",
  },
] as const;

const PRODUCT_FOCUS_OPTIONS = [
  { value: "strong", label: "Strong / Güçlü Ürün Vurgusu" },
  { value: "balanced", label: "Balanced / Dengeli Vurgu" },
  { value: "soft", label: "Soft / Yumuşak Entegrasyon" },
] as const;

const ATMOSPHERE_OPTIONS = [
  { value: "clean_studio", label: "Clean Studio / Temiz Stüdyo" },
  { value: "gradient_backdrop", label: "Gradient Backdrop / Geçişli Arka Fon" },
  { value: "haze", label: "Haze / Hafif Atmosferik Sis" },
  { value: "low_fog", label: "Low Fog / Zeminde İnce Sis" },
] as const;

type UploadKey =
  | "topwear"
  | "bottomwear"
  | "dress"
  | "outerwear"
  | "shoes"
  | "bag"
  | "jewelry";

type FileMap = Partial<Record<UploadKey, File | null>>;
type PreviewMap = Partial<Record<UploadKey, string>>;

export default function FashionStudioPage() {
  const [selectedCategories, setSelectedCategories] = useState<UploadKey[]>([]);
  const [country, setCountry] = useState("Türkiye");
  const [sceneNote, setSceneNote] = useState("");

  const [preset, setPreset] = useState("luxury_studio_clean");
  const [lens, setLens] = useState("50mm");
  const [lighting, setLighting] = useState("soft_diffused");
  const [productFocus, setProductFocus] = useState("strong");
  const [atmosphere, setAtmosphere] = useState<string[]>([
    "clean_studio",
    "gradient_backdrop",
  ]);

  const [advancedMode, setAdvancedMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const [files, setFiles] = useState<FileMap>({});
  const [previews, setPreviews] = useState<PreviewMap>({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [referenceBoard, setReferenceBoard] = useState("");
  const [usedPrompt, setUsedPrompt] = useState("");
  const [error, setError] = useState("");
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);

  const [activeImage, setActiveImage] = useState<string | null>(null);

  const selectedCount = useMemo(
    () => selectedCategories.length,
    [selectedCategories]
  );

  function toggleCategory(category: UploadKey) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  }

  function toggleAtmosphere(value: string) {
    setAtmosphere((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  }

  function handleFileChange(key: UploadKey, file: File | null) {
    setFiles((prev) => ({
      ...prev,
      [key]: file,
    }));

    setPreviews((prev) => {
      const next = { ...prev };

      if (next[key]) {
        URL.revokeObjectURL(next[key] as string);
      }

      next[key] = file ? URL.createObjectURL(file) : "";
      return next;
    });
  }

  async function handleGenerate() {
    try {
      setError("");
      setIsGenerating(true);
      setResults([]);
      setReferenceBoard("");
      setUsedPrompt("");

      const formData = new FormData();
      formData.append("country", country);
      formData.append(
        "prompt",
        sceneNote || "standing naturally in a premium editorial pose"
      );

      formData.append("preset", preset);
      formData.append("lens", lens);
      formData.append("lighting", lighting);
      formData.append("productFocus", productFocus);
      formData.append("angle", "eye_level");
      formData.append("atmosphere", atmosphere.join(","));
      formData.append("advancedMode", String(advancedMode));
      formData.append("customPrompt", customPrompt);

      let uploadedCount = 0;

      for (const key of selectedCategories) {
        const file = files[key];
        if (file) {
          formData.append(key, file);
          uploadedCount += 1;
        }
      }

      if (uploadedCount === 0) {
        throw new Error("En az 1 ürün görseli yüklemelisin.");
      }

      const res = await fetch("/api/fashion/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      console.log("fashion generate response:", data);

      if (!res.ok) {
        throw new Error(data?.error || "Üretim sırasında hata oluştu.");
      }

      if (!data?.ok) {
        throw new Error(data?.error || "Üretim başarısız oldu.");
      }

      setResults(Array.isArray(data.results) ? data.results : []);
      setReferenceBoard(data.referenceBoard || "");
      setUsedPrompt(data.usedPrompt || data.prompt || "");
      setRemainingCredits(
        typeof data.remainingCredits === "number" ? data.remainingCredits : null
      );
    } catch (err: any) {
      setError(err?.message || "Bir hata oluştu.");
    } finally {
      setIsGenerating(false);
    }
  }

  function downloadImage(dataUrl: string, index: number) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `tudesign-fashion-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main
      className="min-h-screen bg-[#0a0a0a] text-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <header className="mb-8 border border-white/10 bg-white/[0.03] px-6 py-5">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
            tuDesign AI
          </p>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                Fashion Studio
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                Ürünlerini yükle, preset seç, çekim dilini belirle ve premium moda
                görsellerini üret.
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
              Aktif kategori: {selectedCount}
              {remainingCredits !== null ? (
                <span className="ml-3 text-white/40">
                  / Kalan kredi: {remainingCredits}
                </span>
              ) : null}
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <div className="border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/30">
                01 / Kategori
              </p>
              <h2 className="mt-2 text-xl font-semibold">Ürün Gruplarını Seç</h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {CATEGORIES.map((category) => {
                  const active = selectedCategories.includes(category.value);

                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => toggleCategory(category.value)}
                      className={`border px-4 py-4 text-left transition ${
                        active
                          ? "border-white/20 bg-white/[0.08]"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="text-base font-medium">
                        {category.label}
                      </div>
                      <div className="mt-2 text-xs text-white/45">
                        {active ? "Seçildi" : "Seçmek için tıkla"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/30">
                02 / Upload
              </p>
              <h2 className="mt-2 text-xl font-semibold">Ürün Görselleri</h2>

              {selectedCategories.length > 0 ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {selectedCategories.map((category) => {
                    const categoryMeta = CATEGORIES.find((c) => c.value === category);
                    const preview = previews[category];

                    return (
                      <div
                        key={category}
                        className="border border-white/10 bg-black/30 p-4"
                      >
                        <div className="mb-3 text-sm font-medium text-white">
                          {categoryMeta?.label}
                        </div>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileChange(
                              category,
                              e.target.files?.[0] || null
                            )
                          }
                          className="block w-full text-sm text-white/75 file:mr-4 file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
                        />

                        {preview ? (
                          <div className="mt-4 flex min-h-[320px] items-center justify-center overflow-hidden border border-white/10 bg-white p-3">
                            <img
                              src={preview}
                              alt={categoryMeta?.display || category}
                              className="max-h-[290px] w-full object-contain bg-white"
                              draggable={false}
                            />
                          </div>
                        ) : (
                          <div className="mt-4 flex h-[320px] items-center justify-center border border-dashed border-white/10 text-sm text-white/35">
                            Henüz görsel yüklenmedi
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 border border-white/10 bg-black/30 p-4 text-sm text-white/45">
                  Kategori seçtiğinde ilgili upload alanları burada açılacak.
                </div>
              )}
            </div>

            <div className="border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/30">
                03 / Ayarlar
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Sahne, Lens ve Prompt Engine
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/70">Ülke</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
                  >
                    {COUNTRIES.map((item) => (
                      <option key={item} value={item} className="bg-black">
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Sahne Notu / Scene Note
                  </label>
                  <input
                    value={sceneNote}
                    onChange={(e) => setSceneNote(e.target.value)}
                    className="w-full border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
                    placeholder="Örn. stüdyo, yürürken, sahil, villa, şehir sokakları..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Preset</label>
                  <select
                    value={preset}
                    onChange={(e) => setPreset(e.target.value)}
                    className="w-full border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
                  >
                    {PRESETS.map((item) => (
                      <option key={item.value} value={item.value} className="bg-black">
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Lens</label>
                  <select
                    value={lens}
                    onChange={(e) => setLens(e.target.value)}
                    className="w-full border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
                  >
                    {LENS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value} className="bg-black">
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Işık / Lighting
                  </label>
                  <select
                    value={lighting}
                    onChange={(e) => setLighting(e.target.value)}
                    className="w-full border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
                  >
                    {LIGHTING_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value} className="bg-black">
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Ürün Odağı / Product Focus
                  </label>
                  <select
                    value={productFocus}
                    onChange={(e) => setProductFocus(e.target.value)}
                    className="w-full border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
                  >
                    {PRODUCT_FOCUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value} className="bg-black">
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-3 block text-sm text-white/70">
                  Atmosfer / Atmosphere
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {ATMOSPHERE_OPTIONS.map((item) => {
                    const active = atmosphere.includes(item.value);

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => toggleAtmosphere(item.value)}
                        className={`border px-4 py-4 text-left transition ${
                          active
                            ? "border-white/20 bg-white/[0.08]"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="mt-2 text-xs text-white/45">
                          {active ? "Aktif" : "Eklemek için tıkla"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">
                    Advanced Mode / Gelişmiş Mod
                  </span>

                  <button
                    type="button"
                    onClick={() => setAdvancedMode(!advancedMode)}
                    className={`border px-3 py-1 text-xs ${
                      advancedMode
                        ? "border-white bg-white text-black"
                        : "border-white/20 text-white/60"
                    }`}
                  >
                    {advancedMode ? "Açık" : "Kapalı"}
                  </button>
                </div>

                {advancedMode ? (
                  <div className="mt-4">
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Kendi promptunu yaz... / Write your own prompt..."
                      className="h-36 w-full border border-white/10 bg-black px-4 py-3 text-sm outline-none"
                    />
                  </div>
                ) : null}
              </div>

              <div className="mt-4 border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white/50">
                Ürün sadakati korunur. Renk, form, silüet ve temel detaylar mümkün
                olduğunca sabit tutulur. Preset sistemi yalnızca çekim dilini ve
                sunum hissini güçlendirir.
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/30">
                Üretim
              </p>
              <h3 className="mt-2 text-xl font-semibold">Moda Görselleştirme</h3>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/35">
                    Ülke
                  </div>
                  <div className="mt-2 text-lg font-medium">{country}</div>
                </div>

                <div className="border border-white/10 bg-black/30 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/35">
                    Kategori
                  </div>
                  <div className="mt-2 text-lg font-medium">{selectedCount}</div>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full border border-white/15 bg-white px-5 py-4 text-sm font-medium text-black transition disabled:opacity-60"
                >
                  {isGenerating ? "Üretim sürüyor..." : "Görsel Üretimini Başlat"}
                </button>
              </div>

              {error ? (
                <div className="mt-4 border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              ) : null}
            </div>

            {referenceBoard ? (
              <div className="border border-white/10 bg-white/[0.03] p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/30">
                  AI REFERANS BOARD
                </p>
                <h3 className="mt-2 text-xl font-semibold">Kullanılan Kolaj</h3>

                <div className="mt-5 flex items-center justify-center overflow-hidden border border-white/10 bg-[#f3f3f1] p-4">
                  <img
                    src={referenceBoard}
                    alt="Reference Board"
                    className="max-h-[760px] w-full object-contain"
                    draggable={false}
                  />
                </div>
              </div>
            ) : null}

            <div className="border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/30">
                ÇIKTILAR
              </p>
              <h3 className="mt-2 text-xl font-semibold">Hazır Varyasyonlar</h3>

              {results.length === 0 ? (
                <div className="mt-5 border border-dashed border-white/10 bg-black/30 p-16 text-sm text-white/35">
                  Henüz sonuç yok.
                </div>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {results.map((img, i) => (
                    <div
                      key={i}
                      className="border border-white/10 bg-black/30 p-4"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveImage(img)}
                        className="group block w-full text-left"
                      >
                        <div className="relative flex min-h-[560px] items-center justify-center overflow-hidden border border-white/10 bg-[#111] p-3">
                          <img
                            src={img}
                            alt={`Varyasyon ${i + 1}`}
                            className="max-h-[680px] w-full object-contain bg-[#111] transition duration-300 group-hover:scale-[1.015]"
                            draggable={false}
                          />

                          <div className="pointer-events-none absolute inset-0 flex items-end justify-between p-4">
                            <div className="bg-black/45 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/70 backdrop-blur-sm">
                              tuDesign AI
                            </div>

                            <div className="bg-black/45 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/70 backdrop-blur-sm">
                              Preview
                            </div>
                          </div>

                          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
                            <span className="select-none text-[30px] font-semibold tracking-[0.42em] text-white/8 md:text-[34px]">
                              TUDESIGN AI
                            </span>
                          </div>
                        </div>
                      </button>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-base font-medium">
                            Varyasyon 0{i + 1}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-white/55">
                            Premium moda görselleştirme çıktısı.
                          </p>
                        </div>

                        <span className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                          AI
                        </span>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveImage(img)}
                          className="flex-1 border border-white/15 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/80 transition hover:bg-white/10"
                        >
                          Büyüt
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadImage(img, i)}
                          className="flex-1 border border-white/15 bg-white px-4 py-3 text-xs uppercase tracking-[0.22em] text-black transition hover:opacity-90"
                        >
                          İndir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {usedPrompt ? (
              <div className="border border-white/10 bg-white/[0.03] p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/30">
                  ENGINE PROMPT
                </p>
                <h3 className="mt-2 text-xl font-semibold">Kullanılan Prompt</h3>

                <pre className="mt-5 max-h-[320px] overflow-auto whitespace-pre-wrap border border-white/10 bg-black/30 p-4 text-xs leading-6 text-white/60">
                  {usedPrompt}
                </pre>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      {activeImage ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 md:p-8"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="relative flex max-h-[94vh] w-full max-w-6xl items-center justify-center border border-white/10 bg-[#0f0f0f] p-3 md:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute right-3 top-3 z-20 flex gap-2">
              <button
                type="button"
                onClick={() => downloadImage(activeImage, 0)}
                className="border border-white/15 bg-white px-3 py-2 text-xs uppercase tracking-[0.25em] text-black"
              >
                İndir
              </button>

              <button
                type="button"
                onClick={() => setActiveImage(null)}
                className="border border-white/15 bg-black/60 px-3 py-2 text-xs uppercase tracking-[0.25em] text-white/70"
              >
                Kapat
              </button>
            </div>

            <div className="relative flex max-h-[86vh] w-full items-center justify-center overflow-hidden border border-white/10 bg-[#111]">
              <img
                src={activeImage}
                alt="Büyük Önizleme"
                className="max-h-[86vh] w-auto max-w-full object-contain bg-[#111]"
                draggable={false}
              />

              <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
                <span className="select-none text-[28px] font-semibold tracking-[0.45em] text-white/10 md:text-[56px]">
                  TUDESIGN AI
                </span>
              </div>

              <div className="pointer-events-none absolute bottom-4 left-4 bg-black/50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/75 backdrop-blur-sm">
                tuDesign AI Preview
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}