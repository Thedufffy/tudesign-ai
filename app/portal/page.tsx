"use client";

import Link from "next/link";

const modules = [
  {
    title: "Render Lab",
    description: "Konuşmalı render revize sistemi ve auto engine üretim akışı.",
    href: "/portal/render-lab",
  },
  {
    title: "Fashion",
    description: "Ürün yükleme, model üretimi ve fashion AI akışı.",
    href: "/portal/fashion",
  },
  {
    title: "References",
    description: "Referans içerikleri ve vitrin alanlarını yönet.",
    href: "/portal/references",
  },
  {
    title: "Uploads",
    description: "Kullanıcı yüklemelerini görüntüle ve yönet.",
    href: "/portal/uploads",
  },
  {
    title: "Works",
    description: "Projeleri ve work içeriklerini düzenle.",
    href: "/portal/works",
  },
];

export default function PortalDashboardPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[380px] w-[380px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-[320px] w-[320px] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
            tuDesign AI / Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Merkezi Kontrol Paneli
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
            Tüm modüllere buradan erişebilir, üretim akışlarını ayrı ayrı
            yönetebilirsin.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
                Module
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                {module.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/58">
                {module.description}
              </p>

              <div className="mt-6 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs text-white/65 transition group-hover:border-white/20 group-hover:text-white">
                Modüle git
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}