"use client";

import { useEffect, useState } from "react";

type ReferenceItem = {
  id: string;
  name: string;
  logo: string;
  url: string;
  createdAt: string;
};

export default function PortalReferencesPage() {
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadItems() {
    const res = await fetch("/api/references");
    const data = await res.json();

    if (data.success) {
      setItems(data.items || []);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleSubmit() {
    try {
      setError("");

      if (!name.trim()) {
        throw new Error("Firma adı gerekli.");
      }

      if (!file) {
        throw new Error("Logo dosyası seçmelisin.");
      }

      setUploading(true);

      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const uploadRes = await fetch("/api/references/upload", {
        method: "POST",
        body: uploadForm,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData?.error || "Logo yükleme başarısız.");
      }

      setUploading(false);
      setSaving(true);

      const saveRes = await fetch("/api/references", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          url,
          logo: uploadData.path,
        }),
      });

      const saveData = await saveRes.json();

      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData?.error || "Kayıt başarısız.");
      }

      setName("");
      setUrl("");
      setFile(null);

      const input = document.getElementById(
        "reference-logo-input"
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
    const res = await fetch(`/api/references?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      await loadItems();
    }
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">
            tuDesign AI / References
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            References
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
            Firma logolarını ve bağlantılarını buradan yönetebilirsin.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="mb-4 text-sm font-medium text-white">
              Yeni referans ekle
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Firma adı
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Zara"
                  className="w-full rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Firma linki
                </label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://firmaadi.com"
                  className="w-full rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Logo
                </label>
                <input
                  id="reference-logo-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-white/75"
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
                  ? "Logo yükleniyor..."
                  : saving
                  ? "Kaydediliyor..."
                  : "Referansı kaydet"}
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-white">
                Kayıtlı referanslar
              </p>
              <p className="text-xs text-white/35">{items.length} kayıt</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex h-[120px] items-center justify-center rounded-[18px] border border-white/10 bg-white p-4">
                    <img
                      src={item.logo}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                      draggable={false}
                    />
                  </div>

                  <p className="mt-4 text-base font-medium text-white">
                    {item.name}
                  </p>

                  <p className="mt-2 break-all text-xs leading-5 text-white/45">
                    {item.url || "Link girilmedi"}
                  </p>

                  <div className="mt-4 flex gap-2">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-[14px] border border-white/10 px-3 py-2 text-xs text-white/75 transition hover:bg-white/10 hover:text-white"
                      >
                        Siteyi aç
                      </a>
                    ) : null}

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
          </section>
        </div>
      </div>
    </main>
  );
}