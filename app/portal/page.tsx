"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PortalModule =
  | "render-lab"
  | "fashion"
  | "references"
  | "uploads"
  | "works"
  | "admin";

type PortalUser = {
  username?: string;
  email?: string;
  role?: "admin" | "client";
  modules?: PortalModule[];
};

const modules: {
  title: string;
  description: string;
  href: string;
  moduleKey: PortalModule;
}[] = [
  {
    title: "Render Lab",
    description: "Konuşmalı render revize sistemi ve auto engine üretim akışı.",
    href: "/portal/render-lab",
    moduleKey: "render-lab",
  },
  {
    title: "Fashion",
    description: "Ürün yükleme, model üretimi ve fashion AI akışı.",
    href: "/portal/fashion",
    moduleKey: "fashion",
  },
  {
    title: "References",
    description: "Referans içerikleri ve vitrin alanlarını yönet.",
    href: "/portal/references",
    moduleKey: "references",
  },
  {
    title: "Uploads",
    description: "Kullanıcı yüklemelerini görüntüle ve yönet.",
    href: "/portal/uploads",
    moduleKey: "uploads",
  },
  {
    title: "Works",
    description: "Projeleri ve work içeriklerini düzenle.",
    href: "/portal/works",
    moduleKey: "works",
  },
];

const adminLinks = [
  {
    title: "Kullanıcı Yönetimi",
    description: "Üyelik aç, düzenle ve kullanıcı durumlarını yönet.",
    href: "/portal/admin/users",
  },
  {
    title: "Kredi Yönetimi",
    description: "Render ve fashion kredi tanımlamalarını buradan yap.",
    href: "/portal/admin/credits",
  },
  {
    title: "Yetki Yönetimi",
    description: "Kullanıcılara modül erişimi ver veya kaldır.",
    href: "/portal/admin/modules",
  },
];

function hasModuleAccess(user: PortalUser | null, moduleKey: PortalModule) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return Array.isArray(user.modules) && user.modules.includes(moduleKey);
}

export default function PortalDashboardPage() {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("portal_user");

      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
      }
    } catch (error) {
      console.error("portal_user okunamadı:", error);
      setUser(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  const isAdmin = useMemo(() => user?.role === "admin", [user]);

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[380px] w-[380px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-[320px] w-[320px] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
                tuDesign AI / Portal
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Merkezi Kontrol Paneli
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                Tüm modüller görünür. Hesabına tanımlı olan alanlara giriş
                yapabilir, diğer modülleri görüntüleyebilirsin.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-white/65">
              {hydrated
                ? user
                  ? isAdmin
                    ? "Admin oturumu aktif"
                    : "Kullanıcı oturumu aktif"
                  : "Oturum bilgisi bulunamadı"
                : "Oturum yükleniyor..."}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-sm font-medium text-white">Panel durumu</p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {isAdmin
                  ? "Bu hesap tüm modüllere ve yönetim alanlarına erişebilir."
                  : "Bu hesap yalnızca tanımlı modüllere giriş yapabilir. Diğer modüller görünür ama kilitli kalır."}
              </p>

              {user ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {isAdmin ? (
                    <span className="rounded-full border border-white/10 bg-white px-3 py-1.5 text-xs font-medium text-black">
                      admin
                    </span>
                  ) : Array.isArray(user.modules) && user.modules.length > 0 ? (
                    user.modules.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-white/45">Yetki bulunamadı</span>
                  )}
                </div>
              ) : null}
            </section>

            {isAdmin ? (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-sm font-medium text-white">Admin Panel</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Üyelik, kredi ve yetki işlemleri için ayrı yönetim alanı.
                </p>

                <div className="mt-4 space-y-3">
                  {adminLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-[22px] border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-2 text-xs leading-5 text-white/45">
                        {item.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>

          <section>
            <div className="mb-4">
              <p className="text-sm font-medium text-white">Sistem Modülleri</p>
              <p className="mt-1 text-xs text-white/45">
                Tüm modüller görünür. Hesabında aktif olmayan alanlar kilitli
                görünür.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => {
                const accessible = hasModuleAccess(user, module.moduleKey);

                if (!accessible) {
                  return (
                    <div
                      key={module.href}
                      className="group rounded-[28px] border border-white/10 bg-white/5 p-6 opacity-75 backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
                          Module
                        </p>
                        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-100">
                          Yetki gerekli
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white/92">
                        {module.title}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-white/50">
                        {module.description}
                      </p>

                      <div className="mt-6 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">
                        Bu modül hesabına tanımlı değil
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
                        Module
                      </p>
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100">
                        Aktif
                      </span>
                    </div>

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
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}