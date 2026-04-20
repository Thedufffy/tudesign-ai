"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PortalModule =
  | "render-lab"
  | "board-lab"
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
    title: "Board Lab",
    description:
      "Mahal görselini koruyarak detay paftası ve sunum board oluşturma sistemi.",
    href: "/portal/board-lab",
    moduleKey: "board-lab",
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
  {
    title: "Admin",
    description: "Yönetim paneli, kullanıcı yetkileri ve sistem kontrol alanı.",
    href: "/portal/admin",
    moduleKey: "admin",
  },
];

function hasModuleAccess(user: PortalUser | null, moduleKey: PortalModule) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return Array.isArray(user.modules) && user.modules.includes(moduleKey);
}

function getModuleAccent(moduleKey: PortalModule, accessible: boolean) {
  if (!accessible) {
    return {
      badge:
        "border-amber-300/20 bg-amber-300/10 text-amber-100",
      glow: "from-white/5 via-white/0 to-white/0",
    };
  }

  if (moduleKey === "render-lab") {
    return {
      badge:
        "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
      glow: "from-cyan-400/10 via-transparent to-transparent",
    };
  }

  if (moduleKey === "board-lab") {
    return {
      badge:
        "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
      glow: "from-emerald-400/10 via-transparent to-transparent",
    };
  }

  if (moduleKey === "fashion") {
    return {
      badge:
        "border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-100",
      glow: "from-fuchsia-400/10 via-transparent to-transparent",
    };
  }

  if (moduleKey === "admin") {
    return {
      badge:
        "border-violet-300/20 bg-violet-300/10 text-violet-100",
      glow: "from-violet-400/10 via-transparent to-transparent",
    };
  }

  return {
    badge:
      "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    glow: "from-white/10 via-transparent to-transparent",
  };
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
                Tüm modüller tek panelde görünür. Hesabına tanımlı alanlara giriş
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

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-sm font-medium text-white">Öne çıkan modüller</p>
              <div className="mt-4 space-y-3 text-sm text-white/60">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <span className="text-white/90">Render Lab</span>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Revize ve üretim odaklı render akışı
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <span className="text-white/90">Board Lab</span>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Mahal görselinden pafta ve sunum board üretimi
                  </p>
                </div>
                {isAdmin ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                    <span className="text-white/90">Admin</span>
                    <p className="mt-1 text-xs leading-5 text-white/45">
                      Yetki, kontrol ve sistem yönetimi
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
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
                const accent = getModuleAccent(module.moduleKey, accessible);

                if (!accessible) {
                  return (
                    <div
                      key={module.href}
                      className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 opacity-75 backdrop-blur-xl"
                    >
                      <div
                        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.glow}`}
                      />

                      <div className="relative">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
                            Module
                          </p>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${accent.badge}`}
                          >
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
                    </div>
                  );
                }

                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07]"
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.glow}`}
                    />

                    <div className="relative">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
                          Module
                        </p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${accent.badge}`}
                        >
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