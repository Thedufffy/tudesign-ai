"use client";

import { ChangeEvent, FormEvent, useState } from "react";

type ReferenceItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  featured: boolean;
};

export default function ReferencesAdminPage() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [featured, setFeatured] = useState(false);
  const [preview, setPreview] = useState("");
  const [items, setItems] = useState<ReferenceItem[]>([
    {
      id: "1",
      title: "Residential / Istanbul",
      subtitle: "AI Assisted Interior Redesign",
      image: "/demo/demo-1.jpg",
      featured: true,
    },
    {
      id: "2",
      title: "Retail / Ankara",
      subtitle: "Premium Space Transformation",
      image: "/demo/demo-2.jpg",
      featured: true,
    },
  ]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);

    if (file) {
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);
      setImageUrl("");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    let finalImage = imageUrl.trim();

    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);

      const res = await fetch("/api/admin-upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        alert("Görsel yüklenemedi.");
        return;
      }

      const data = await res.json();
      finalImage = data.url;
    }

    if (!finalImage) {
      alert("Lütfen görsel yükleyin veya image URL girin.");
      return;
    }

    const newItem: ReferenceItem = {
      id: crypto.randomUUID(),
      title,
      subtitle,
      image: finalImage,
      featured,
    };

    setItems((prev) => [newItem, ...prev]);

    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setImageFile(null);
    setFeatured(false);
    setPreview("");
  }

  return (
    <main className="min-h-screen bg-black text-white px-8 py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-2">
          Admin
        </p>
        <h1 className="text-5xl font-semibold tracking-tight mb-12">
          References Control Panel
        </h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
          <form
            onSubmit={handleSubmit}
            className="border border-neutral-800 bg-neutral-950 p-7"
          >
            <h2 className="mb-6 text-lg font-medium text-neutral-300">
              Add New Reference
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-neutral-800 bg-neutral-900 px-4 py-4 outline-none placeholder:text-neutral-500"
              />

              <input
                type="text"
                placeholder="Subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full border border-neutral-800 bg-neutral-900 px-4 py-4 outline-none placeholder:text-neutral-500"
              />

              <div className="border border-dashed border-neutral-700 bg-neutral-900 p-4">
                <label className="mb-3 block text-sm text-neutral-300">
                  Upload Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-neutral-400
                  file:mr-4 file:border-0 file:bg-white file:px-4 file:py-2
                  file:text-sm file:font-medium file:text-black hover:file:opacity-90"
                />

                {preview && (
                  <div className="mt-4">
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-40 w-full object-cover border border-neutral-800"
                    />
                  </div>
                )}
              </div>

              <div className="text-center text-sm text-neutral-500">veya</div>

              <input
                type="text"
                placeholder="Image URL"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  if (e.target.value.trim()) {
                    setImageFile(null);
                    setPreview(e.target.value);
                  } else {
                    setPreview("");
                  }
                }}
                className="w-full border border-neutral-800 bg-neutral-900 px-4 py-4 outline-none placeholder:text-neutral-500"
              />

              <label className="flex items-center gap-3 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                Featured (Ana sayfa)
              </label>

              <button
                type="submit"
                className="w-full bg-white py-4 text-lg font-medium text-black transition hover:opacity-90"
              >
                Add
              </button>
            </div>
          </form>

          <div className="space-y-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border border-neutral-900 bg-black p-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-20 w-20 object-cover border border-neutral-800"
                  />
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-medium">{item.title}</h3>
                      {item.featured && (
                        <span className="border border-neutral-500 px-2 py-1 text-xs uppercase tracking-wide text-neutral-200">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-400">{item.subtitle}</p>
                  </div>
                </div>

                <div className="flex gap-5 text-xl">
                  <button className="text-neutral-300 hover:text-white">
                    Edit
                  </button>
                  <button className="text-red-500 hover:text-red-400">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}