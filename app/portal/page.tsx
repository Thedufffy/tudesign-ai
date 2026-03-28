"use client";

import { ChangeEvent, useEffect, useState } from "react";

type ReferenceItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  featured: boolean;
};

export default function AdminPage() {
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [featured, setFeatured] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetch("/api/references")
      .then((res) => res.json())
      .then(setReferences);
  }, []);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);

    if (file) {
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setImage("");
    } else {
      setPreviewUrl("");
    }
  }

  async function uploadImageIfNeeded() {
    if (!imageFile) {
      return image.trim();
    }

    const formData = new FormData();
    formData.append("file", imageFile);

    setIsUploading(true);

    const res = await fetch("/api/admin-upload", {
      method: "POST",
      body: formData,
    });

    setIsUploading(false);

    if (!res.ok) {
      throw new Error("Görsel yükleme başarısız oldu.");
    }

    const data = await res.json();

    if (!data?.url) {
      throw new Error("Upload sonrası görsel URL alınamadı.");
    }

    return data.url as string;
  }

  async function refreshReferences() {
    const res = await fetch("/api/references");
    setReferences(await res.json());
  }

  async function handleSubmit() {
    try {
      const finalImage = await uploadImageIfNeeded();

      if (!title.trim() || !subtitle.trim() || !finalImage) {
        alert("Title, subtitle ve görsel alanı zorunlu.");
        return;
      }

      const url = editingId
        ? `/api/references/${editingId}`
        : "/api/references";

      const method = editingId ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          image: finalImage,
          featured,
        }),
      });

      setTitle("");
      setSubtitle("");
      setImage("");
      setImageFile(null);
      setFeatured(false);
      setEditingId(null);
      setPreviewUrl("");

      await refreshReferences();
    } catch (error) {
      console.error(error);
      alert("İşlem sırasında bir hata oluştu.");
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/references/${id}`, {
      method: "DELETE",
    });

    setReferences(references.filter((r) => r.id !== id));
  }

  function handleEdit(item: ReferenceItem) {
    setEditingId(item.id);
    setTitle(item.title);
    setSubtitle(item.subtitle);
    setImage(item.image);
    setFeatured(item.featured);
    setImageFile(null);
    setPreviewUrl(item.image);
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c] px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">
              ADMIN
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">
              References Control Panel
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = "/")}
              className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs text-white/70 transition hover:bg-white/10"
            >
              🏠 Site
            </button>

            <button
              onClick={async () => {
                await fetch("/api/admin-logout", { method: "POST" });
                window.location.href = "/admin-login";
              }}
              className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs text-white/70 transition hover:bg-white/10"
            >
              ⏻ Logout
            </button>

            <div className="group relative">
              <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-sm">
                T
              </div>

              <div className="pointer-events-none absolute right-0 top-full mt-2 w-44 rounded-2xl border border-white/10 bg-[#111] p-2 opacity-0 backdrop-blur-xl transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                <div className="px-3 py-2 text-xs text-white/40">
                  tuDesign Admin
                </div>

                <div className="my-1 h-px bg-white/10" />

                <button
                  onClick={() => (window.location.href = "/")}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10"
                >
                  Siteye Git
                </button>

                <button
                  onClick={async () => {
                    await fetch("/api/admin-logout", { method: "POST" });
                    window.location.href = "/admin-login";
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="mb-4 text-sm text-white/60">
              {editingId ? "Edit Reference" : "Add New Reference"}
            </div>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2"
            />

            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Subtitle"
              className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2"
            />

            <div className="mb-3 rounded-xl border border-dashed border-white/15 bg-white/5 p-4">
              <div className="mb-2 text-sm text-white/60">Image Upload</div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
              />
            </div>

            <input
              value={image}
              onChange={(e) => {
                setImage(e.target.value);
                setImageFile(null);
                setPreviewUrl(e.target.value);
              }}
              placeholder="Image URL"
              className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2"
            />

            {previewUrl && (
              <div className="mb-4 overflow-hidden rounded-xl border border-white/10">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-44 w-full object-cover"
                />
              </div>
            )}

            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              <span className="text-sm text-white/70">
                Featured (Ana sayfa)
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="w-full rounded-full bg-white py-2 text-black disabled:opacity-60"
            >
              {isUploading
                ? "Uploading..."
                : editingId
                ? "Update"
                : "Add"}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {references.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl border border-white/10 p-3"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-16 w-16 rounded-lg object-cover"
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div>{item.title}</div>

                    {item.featured && (
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs text-black">
                        FEATURED
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-white/50">{item.subtitle}</div>
                </div>

                <button
                  onClick={() => handleEdit(item)}
                  className="text-xs text-white/60"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-red-400"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}