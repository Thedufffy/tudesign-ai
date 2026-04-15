"use client";

import { useEffect, useState } from "react";

type WorkItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  createdAt: string;
};

export default function PortalWorksPage() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadItems() {
    try {
      setError("");

      const res = await fetch("/api/works");
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Works alınamadı.");
      }

      setItems(data.items || []);
    } catch (err: any) {
      setError(err?.message || "Listeleme hatası.");
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleSubmit() {
    try {
      setError("");

      if (!title.trim()) {
        throw new Error("Başlık gerekli.");
      }

      if (!file) {
        throw new Error("Görsel seçmelisin.");
      }

      setUploading(true);

      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const uploadRes = await fetch("/api/works/upload", {
        method: "POST",
        body: uploadForm,
      });

      const uploadText = await uploadRes.text();
      const uploadData = uploadText ? JSON.parse(uploadText) : null;

      if (!uploadRes.ok || !uploadData?.success) {
        throw new Error(uploadData?.error || "Görsel yükleme başarısız.");
      }

      setUploading(false);
      setSaving(true);

      const saveRes = await fetch("/api/works", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim(),
          image: uploadData.path,
        }),
      });

      const saveText = await saveRes.text();
      const saveData = saveText ? JSON.parse(saveText) : null;

      if (!saveRes.ok || !saveData?.success) {
        throw new Error(saveData?.error || "Kayıt başarısız.");
      }

      setTitle("");
      setSubtitle("");
      setFile(null);

      const input = document.getElementById(
        "work-image-input"
      ) as HTMLInputElement | null;

      if (input) input.value = "";

      await loadItems();
    } catch (err: any) {
      setError(err?.message || "Bir hata oluştu.");
    } finally {
      setUploading(false);
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setError("");

      const res = await fetch(`/api/works?id=${id}`, {
        method: "DELETE",
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Silme başarısız.");
      }

      await loadItems();
    } catch (err: any) {
      setError(err?.message || "Silme hatası.");
    }
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">
            tuDesign AI / Works
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Works Yönetimi
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
            Proje görsellerini ve works sayfasında yayınlanacak içerikleri buradan ekleyebilirsin.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="mb-4 text-sm font-medium text-white">Yeni work ekle</p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/70">Başlık</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Residential / Istanbul"
                  className="w-full rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Alt başlık</label>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="AI Assisted Interior Redesign"
                  className="w-full rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Görsel</label>
                <input
                  id="work-image-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-white/75 file:mr-4 file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
                />
              </div>

              {error ? (
                <div className="rounded-[18px] border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                onClick={handleSubmit}
                disabled={uploading || saving}
                className="w-full rounded-[18px] border border-white/12 bg-white px-4 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-40"
              >
                {uploading
                  ? "Görsel yükleniyor..."
                  : saving
                  ? "Kaydediliyor..."
                  : "Work kaydet"}
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-white">Kayıtlı works</p>
              <p className="text-xs text-white/35">{items.length} kayıt</p>
            </div>

            {items.length === 0 ? (
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-6 text-sm text-white/45">
                Henüz work eklenmedi.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="overflow-hidden rounded-[18px] border border-white/10 bg-white">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-[180px] w-full object-cover"
                        draggable={false}
                      />
                    </div>

                    <p className="mt-4 text-base font-medium text-white">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/45">
                      {item.subtitle}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-[14px] border border-red-400/20 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/10"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}