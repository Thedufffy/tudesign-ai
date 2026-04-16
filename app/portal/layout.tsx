"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PortalModule =
  | "render-lab"
  | "fashion"
  | "references"
  | "uploads"
  | "works"
  | "admin";

type PortalSessionUser = {
  username?: string;
  email?: string;
  role?: "admin" | "client";
  modules?: PortalModule[];
};

function hasModuleAccess(user: PortalSessionUser | null, moduleName: PortalModule) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return Array.isArray(user.modules) && user.modules.includes(moduleName);
}

function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block border px-4 py-3 text-sm transition ${
        active
          ? "border-white/20 bg-white/[0.08] text-white"
          : "border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<PortalSessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", preventContextMenu);
    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
    };
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("portal_user");

    if (!raw) {
      router.replace("/admin-login");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PortalSessionUser;
      setUser(parsed);
      setReady(true);
    } catch {
      localStorage.removeItem("portal_user");
      router.replace("/admin-login");
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const blocked =
      (pathname === "/portal/render-lab" &&
        !hasModuleAccess(user, "render-lab")) ||
      (pathname === "/portal/fashion" &&
        !hasModuleAccess(user, "fashion")) ||
      (pathname === "/portal/references" &&
        !hasModuleAccess(user, "references")) ||
      (pathname === "/portal/uploads" &&
        !hasModuleAccess(user, "uploads")) ||
      (pathname === "/portal/works" &&
        !hasModuleAccess(user, "works")) ||
      (pathname.startsWith("/portal/admin") &&
        !hasModuleAccess(user, "admin"));

    if (blocked) {
      router.replace("/portal");
    }
  }, [pathname, router, user]);

  const isAdmin = useMemo(() => user?.role === "admin", [user]);

  function handleLogout() {
    localStorage.removeItem("portal_user");
    router.push("/admin-login");
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-sm text-white/60">Portal yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-white/10 bg-black/40 p-5">
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
              tuDesign AI
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Portal</h2>
            <p className="mt-2 text-sm text-white/45">
              Merkezi kontrol paneli
            </p>
            <p className="mt-3 text-xs text-white/30">
              Kullanıcı: {user.username || user.email || "portal-user"}
            </p>
          </div>

          <div className="space-y-3">
            <NavItem
              href="/portal"
              label="Dashboard"
              active={pathname === "/portal"}
            />

            {hasModuleAccess(user, "render-lab") ? (
              <NavItem
                href="/portal/render-lab"
                label="Render Lab"
                active={pathname === "/portal/render-lab"}
              />
            ) : null}

            {hasModuleAccess(user, "fashion") ? (
              <NavItem
                href="/portal/fashion"
                label="Fashion Studio"
                active={pathname === "/portal/fashion"}
              />
            ) : null}

            {hasModuleAccess(user, "references") ? (
              <NavItem
                href="/portal/references"
                label="References"
                active={pathname === "/portal/references"}
              />
            ) : null}

            {hasModuleAccess(user, "works") ? (
              <NavItem
                href="/portal/works"
                label="Works"
                active={pathname === "/portal/works"}
              />
            ) : null}

            {hasModuleAccess(user, "uploads") ? (
              <NavItem
                href="/portal/uploads"
                label="Uploads"
                active={pathname === "/portal/uploads"}
              />
            ) : null}

            {isAdmin ? (
              <NavItem
                href="/portal/admin/users"
                label="Admin Panel"
                active={pathname.startsWith("/portal/admin")}
              />
            ) : null}
          </div>

          <div className="mt-8 border-t border-white/10 pt-5">
            <button
              onClick={handleLogout}
              className="w-full border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}