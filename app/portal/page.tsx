"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PortalSessionUser = {
  username: string;
  canAccessRenderLab?: boolean;
  canAccessFashion?: boolean;
  canAccessReferences?: boolean;
  canAccessUploads?: boolean;
};

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:bg-white/[0.08]"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-white/35">
        tuDesign AI
      </p>
      <h2 className="mt-4 text-2xl font-semibold text-white group-hover:translate-x-1 transition">
        {title}
      </h2>
      <p className="mt-3 text-sm text-white/60 leading-6">{desc}</p>
    </Link>
  );
}

export default function PortalPage() {
  const [user, setUser] = useState<PortalSessionUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("portal_user");
    if (raw) {
      setUser(JSON.parse(raw));
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        yükleniyor...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
            tuDesign AI / Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Hoşgeldin, {user.username}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Kullanabileceğin modüller aşağıda listelenmiştir.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {user.canAccessRenderLab && (
            <Card
              title="Render Lab"
              desc="Konuşmalı render revize ve üretim sistemi."
              href="/portal/render-lab"
            />
          )}

          {user.canAccessFashion && (
            <Card
              title="Fashion Studio"
              desc="Ürün bazlı model üretim ve sahneleme sistemi."
              href="/portal/fashion"
            />
          )}

          {user.canAccessReferences && (
            <Card
              title="References"
              desc="Referans logoları ve firma bağlantı yönetimi."
              href="/portal/references"
            />
          )}

          {user.canAccessUploads && (
            <Card
              title="Uploads"
              desc="Yüklenen içeriklerin kontrol ve yönetimi."
              href="/portal/uploads"
            />
          )}
        </div>
      </div>
    </main>
  );
}