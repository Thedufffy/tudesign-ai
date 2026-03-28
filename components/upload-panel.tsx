"use client";

import { ChangeEvent, useRef, useState } from "react";

type UploadPanelProps = {
  onImageSelect?: (
    file: File | null,
    previewUrl: string | null,
    uploadedUrl?: string | null
  ) => void;
};

export default function UploadPanel({ onImageSelect }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  function handleOpenFileDialog() {
    inputRef.current?.click();
  }

  async function uploadToSystem(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/user-upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Görsel yüklenemedi.");
    }

    return data.url as string;
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setFileName("");
      setPreviewUrl(null);
      setUploadedUrl(null);
      onImageSelect?.(null, null, null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("Lütfen JPG, PNG veya WEBP formatında bir görsel yükleyin.");
      event.target.value = "";
      setFileName("");
      setPreviewUrl(null);
      setUploadedUrl(null);
      onImageSelect?.(null, null, null);
      return;
    }

    const localUrl = URL.createObjectURL(file);

    setFileName(file.name);
    setPreviewUrl(localUrl);
    setUploadedUrl(null);
    onImageSelect?.(file, localUrl, null);

    try {
      setIsUploading(true);

      const savedUrl = await uploadToSystem(file);

      setUploadedUrl(savedUrl);
      onImageSelect?.(file, localUrl, savedUrl);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Görsel yüklenemedi.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="rounded-[1.75rem] border border-white/12 bg-black/35 p-5 backdrop-blur-xl">
      <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">
        Start a redesign
      </div>

      <div className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
        Upload your image
      </div>

      <div className="mt-2 max-w-md text-sm leading-6 text-white/62">
        Render, interior photo or concept visual. The system creates a more refined
        spatial direction while preserving core proportions.
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.03] p-5 transition hover:border-white/25 hover:bg-white/[0.05]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-white">Drop image here</div>
              <div className="mt-1 text-sm leading-6 text-white/45">
                JPG, PNG or WEBP
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenFileDialog}
              disabled={isUploading}
              className="rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.01] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? "Uploading..." : "Choose File"}
            </button>
          </div>

          {fileName && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
              Selected: <span className="text-white">{fileName}</span>
            </div>
          )}

          {previewUrl && (
            <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/20">
              <div className="border-b border-white/10 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-white/40">
                Uploaded Preview
              </div>
              <img
                src={previewUrl}
                alt="Uploaded preview"
                className="h-56 w-full object-cover"
              />
            </div>
          )}

          {isUploading && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
              Görsel sisteme kaydediliyor...
            </div>
          )}

          {uploadedUrl && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
              Sisteme kaydedildi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}