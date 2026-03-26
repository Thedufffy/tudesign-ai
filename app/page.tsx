"use client";

import { useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  Square,
  Minus,
  Leaf,
  Gem,
  Clock,
  Wand2,
  Sparkles,
} from "lucide-react";

type ImageResult = string[];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImageResult>([]);
  const [selectedStyle, setSelectedStyle] = useState("Modern");
  const [mode, setMode] = useState<"retouch" | "redesign">("retouch");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const disableRightClick = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", disableRightClick);
    return () => document.removeEventListener("contextmenu", disableRightClick);
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (incomingFile: File) => {
    setFile(incomingFile);
    setError("");
    setImages([]);
    setLeadMessage("");
  };

  const handleGenerate = async () => {
    if (!file) {
      setError("Önce görsel yükle.");
      return;
    }

    setLoading(true);
    setImages([]);
    setError("");
    setLeadMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("style", selectedStyle);
      formData.append("mode", mode);
      formData.append("note", note);

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "AI üretimi başarısız oldu.");
        setImages([]);
        return;
      }

      setImages(Array.isArray(data?.images) ? data.images : []);
    } catch (err) {
      console.error(err);
      setError("Bağlantı sırasında bir hata oluştu.");
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSubmit = () => {
    if (!leadName.trim() || !leadContact.trim()) {
      setLeadMessage("Lütfen isim ve iletişim bilgini gir.");
      return;
    }

    const whatsappNumber = "905324207506";

    const message = `
Merhaba, tuDesign AI üzerinden oluşturduğum tasarım hakkında sizinle ilerlemek istiyorum.

İsim: ${leadName}
İletişim: ${leadContact}

Düzenleme modu: ${
      mode === "retouch" ? "Rötuşla" : "Yeniden Yorumla"
    }
Seçtiğim stil: ${selectedStyle}
Ek not: ${note || "Belirtilmedi"}

Bu tasarımın profesyonel olarak uygulanması veya geliştirilmesi için bilgi alabilir miyim?
    `.trim();

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, "_blank");
    setLeadMessage("Yönlendiriliyorsun...");
  };

  const styles = [
    { name: "Modern", icon: <Square size={14} /> },
    { name: "Minimal", icon: <Minus size={14} /> },
    { name: "Doğal", icon: <Leaf size={14} /> },
    { name: "Premium", icon: <Gem size={14} /> },
    { name: "Retro", icon: <Clock size={14} /> },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8f8f6] to-[#ecece8] text-[#1a1a1a]">
      <section className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-block text-xs bg-black/5 px-3 py-1 rounded-full mb-4">
            tuDesign AI Sihirbazı
          </div>

          <h1 className="text-5xl font-semibold mb-6 leading-tight tracking-tight">
            Mekanını yapay zeka ile yeniden keşfet
          </h1>

          <p className="text-neutral-500 mb-6">
            Fotoğrafını yükle, düzenleme modunu ve stilini seç. tuDesign AI,
            mekanın için güçlü iç mekan varyasyonları oluştursun.
          </p>

          <div className="w-20 h-[2px] bg-black/10 mt-6 rounded-full"></div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow border border-white/40">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const droppedFile = e.dataTransfer.files?.[0];
              if (droppedFile) handleFile(droppedFile);
            }}
            className="border border-dashed rounded-xl p-8 text-center mb-5 cursor-pointer bg-white/60"
          >
            {!preview ? (
              <>
                <UploadCloud className="mx-auto w-10 h-10 text-neutral-400 mb-2" />
                <p className="text-sm text-neutral-400">Görsel yükle</p>
              </>
            ) : (
              <div className="space-y-2">
                <img
                  src={preview}
                  alt="Yüklenen görsel önizleme"
                  className="mx-auto rounded-xl max-h-60 object-cover"
                />
                <p className="text-xs text-neutral-400">
                  Görseli değiştirmek için tıkla veya yeni dosya sürükle
                </p>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const pickedFile = e.target.files?.[0];
                if (pickedFile) handleFile(pickedFile);
              }}
            />
          </div>

          <div className="mb-5">
            <p className="text-sm mb-2">Düzenleme modu</p>

            <div className="flex gap-2 flex-wrap mb-2">
              <button
                type="button"
                onClick={() => setMode("retouch")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition ${
                  mode === "retouch"
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black/20"
                }`}
              >
                <Wand2 size={14} />
                Rötuşla
              </button>

              <button
                type="button"
                onClick={() => setMode("redesign")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition ${
                  mode === "redesign"
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black/20"
                }`}
              >
                <Sparkles size={14} />
                Yeniden Yorumla
              </button>
            </div>

            <p className="text-xs text-neutral-500 leading-5">
              {mode === "retouch"
                ? "Mevcut tasarımı koruyarak ışık, malzeme ve atmosferi geliştirir."
                : "Mekanı referans alarak yeni bir tasarım dili ve güçlü bir alternatif üretir."}
            </p>
          </div>

          <div className="mb-4">
            <p className="text-sm mb-2">Stil seçimi</p>

            <div className="flex gap-2 flex-wrap">
              {styles.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setSelectedStyle(s.name)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm transition ${
                    selectedStyle === s.name
                      ? "bg-black text-white border-black"
                      : "bg-white border-black/20"
                  }`}
                >
                  {s.icon}
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="Ek not (isteğe bağlı)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border rounded-xl p-3 mb-4 text-sm"
          />

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl shadow-lg hover:scale-[1.02] transition disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading
              ? "AI düşünüyor..."
              : mode === "retouch"
              ? "Görseli rötuşla"
              : "Yeni tasarım oluştur"}
          </button>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      </section>

      {loading && (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">
            {mode === "retouch" ? "AI rötuş yapıyor..." : "AI yeni tasarım üretiyor..."}
          </p>
          <p className="text-sm text-neutral-400 mt-2">
            {mode === "retouch"
              ? "Mekanın detayları iyileştiriliyor"
              : "Mekan yeni bir tasarım diliyle yorumlanıyor"}
          </p>
        </div>
      )}

      {Array.isArray(images) && images.length > 0 && !loading && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="mb-6">
            <p className="text-sm text-neutral-400 mb-1">Sonuçlar hazır</p>
            <h2 className="text-xl font-medium">
              {mode === "retouch"
                ? "tuDesign AI farkıyla rötuşlu varyasyonlar hazır...!"
                : "tuDesign AI farkıyla yeni tasarım varyasyonları hazır...!"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative group rounded-xl overflow-hidden shadow"
              >
                <img
                  src={img}
                  alt={`Varyasyon ${i + 1}`}
                  className="w-full h-full object-cover"
                />

                <div className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-2 py-1 rounded">
                  tuDesign
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow p-6">
            <h3 className="text-xl font-medium mb-2">
              Beğendiğin tasarımı profesyonel olarak hayata geçirmek ister misin?
            </h3>

            <p className="text-sm text-neutral-500 mb-5">
              Talebini bırak, sana en uygun çözüm için kısa sürede dönüş yapalım.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="İsim Soyisim"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="w-full border rounded-xl p-3 text-sm bg-white"
              />

              <input
                type="text"
                placeholder="Telefon veya WhatsApp"
                value={leadContact}
                onChange={(e) => setLeadContact(e.target.value)}
                className="w-full border rounded-xl p-3 text-sm bg-white"
              />
            </div>

            <button
              type="button"
              onClick={handleLeadSubmit}
              className="w-full md:w-auto bg-black text-white px-6 py-3 rounded-xl shadow-lg hover:scale-[1.02] transition"
            >
              Proje talebi oluştur
            </button>

            {leadMessage && (
              <p className="mt-4 text-sm text-neutral-700">{leadMessage}</p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}