"use client";

import { useRef, useState } from "react";

type FileDropzoneProps = {
  title: string;
  subtitle?: string;
};

export default function FileDropzone({
  title,
  subtitle,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(file: File | null) {
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0] || null;
    handleFile(file);
  }

  return (
    <div className="border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3">
        <p className="text-sm font-medium">{title}</p>
        {subtitle ? (
          <p className="mt-1 text-xs text-white/45">{subtitle}</p>
        ) : null}
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`cursor-pointer border border-dashed p-4 transition ${
          isDragging
            ? "border-white/30 bg-white/[0.08]"
            : "border-white/15 bg-black/30"
        }`}
      >
        {!preview ? (
          <div className="flex h-44 flex-col items-center justify-center text-center">
            <p className="text-sm text-white/70">
              Görseli buraya bırak
            </p>
            <p className="mt-2 text-xs text-white/40">
              veya tıklayarak dosya seç
            </p>
          </div>
        ) : (
          <div className="relative">
            <img
              src={preview}
              alt={title}
              className="h-44 w-full object-cover"
              draggable={false}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
              }}
              className="absolute right-2 top-2 border border-white/10 bg-black/70 px-2 py-1 text-xs text-white"
            >
              X
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />
    </div>
  );
}