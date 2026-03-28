"use client";

import { useState } from "react";
import UploadPanel from "@/components/upload-panel";
import PreviewPanel from "@/components/preview-panel";

function InfoItem({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">{title}</div>
      <div className="mt-2 text-sm leading-6 text-white/70">{value}</div>
    </div>
  );
}

export default function HeroSection() {
  const [, setSelectedFile] = useState<File | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:px-10 lg:pb-32 lg:pt-14">
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
        <div className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl lg:p-10">
          <div>
            <div className="mb-8 text-[11px] uppercase tracking-[0.24em] text-white/40">
              tuDesign AI / interior visualization
            </div>

            <h1 className="max-w-2xl text-5xl font-semibold leading-[0.94] tracking-[-0.05em] text-white sm:text-6xl lg:text-[4.7rem]">
              A quieter
              <br />
              design language
              <br />
              for stronger spaces.
            </h1>

            <p className="mt-8 max-w-lg text-[15px] leading-7 text-white/62 sm:text-base">
              Mimari deneyimi, yapay zekâ destekli yeni bir sunum ve yeniden tasarlama
              sistemiyle bir araya getiriyoruz. Amaç daha çok şey söylemek değil, daha doğru
              etkiyi üretmek.
            </p>
          </div>

          <div className="mt-12 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-3">
            <InfoItem title="Approach" value="Refined visual transformation" />
            <InfoItem title="Output" value="Premium redesign directions" />
            <InfoItem title="Use" value="Presentation, concept, conversion" />
          </div>
        </div>

        <div className="relative min-h-[620px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]">
          <img
            src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80"
            alt="Premium interior"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/30 to-transparent" />

          <div className="relative flex h-full min-h-[620px] flex-col justify-between p-6 sm:p-8 lg:p-10">
            <div className="ml-auto max-w-[320px] rounded-[1.75rem] border border-white/12 bg-black/30 p-5 backdrop-blur-xl">
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                Visual direction
              </div>
              <div className="mt-3 text-lg font-medium tracking-[-0.03em] text-white">
                Calm, premium and presentation-ready spatial transformation.
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
              <UploadPanel
                onImageSelect={(file, previewUrl) => {
                  setSelectedFile(file);
                  setSelectedPreview(previewUrl);
                }}
              />
              <PreviewPanel uploadedPreview={selectedPreview} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}