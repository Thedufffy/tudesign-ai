"use client";

import { useState } from "react";

type PortalModule =
  | "render-lab"
  | "fashion"
  | "references"
  | "uploads"
  | "works"
  | "admin";

type RoleType = "admin" | "client";

type ModuleUser = {
  id: string;
  username: string;
  role: RoleType;
  modules: PortalModule[];
  status: "active" | "passive";
};

const moduleOptions: { key: PortalModule; label: string }[] = [
  { key: "render-lab", label: "Render Lab" },
  { key: "fashion", label: "Fashion" },
  { key: "references", label: "References" },
  { key: "uploads", label: "Uploads" },
  { key: "works", label: "Works" },
  { key: "admin", label: "Admin Panel" },
];

const initialUsers: ModuleUser[] = [
  {
    id: "u-admin",
    username: "admin",
    role: "admin",
    modules: [
      "admin",
      "render-lab",
      "fashion",
      "references",
      "uploads",
      "works",
    ],
    status: "active",
  },
  {
    id: "u-render",
    username: "render",
    role: "client",
    modules: ["render-lab"],
    status: "active",
  },
];

function formatModuleLabel(moduleName: PortalModule) {
  return moduleOptions.find((item) => item.key === moduleName)?.label || moduleName;
}

export default function AdminModulesPage() {
  const [users, setUsers] = useState<ModuleUser[]>(initialUsers);

  function toggleModule(userId: string, moduleName: PortalModule) {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== userId) return user;

        if (user.role === "admin") {
          return user;
        }

        const exists = user.modules.includes(moduleName);

        return {
          ...user,
          modules: exists
            ? user.modules.filter((item) => item !== moduleName)
            : [...user.modules, moduleName],
        };
      })
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
            tuDesign AI / Admin
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Yetki Yönetimi
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
            Kullanıcılara modül erişimi ver, kaldır ve sistem görünürlüğünü kontrol et.
          </p>
        </div>

        <div className="space-y-6">
          {users.map((user) => (
            <section
              key={user.id}
              className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {user.username}
                    </h2>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${
                        user.role === "admin"
                          ? "border-white/10 bg-white text-black"
                          : "border-white/10 bg-white/5 text-white/75"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-white/50">
                    {user.role === "admin"
                      ? "Admin hesaplarının tüm modüllere erişimi otomatik açıktır."
                      : "Bu kullanıcı için modül erişimlerini açıp kapatabilirsin."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.modules.map((moduleName) => (
                    <span
                      key={moduleName}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75"
                    >
                      {formatModuleLabel(moduleName)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {moduleOptions.map((item) => {
                  const enabled = user.modules.includes(item.key);
                  const disabled = user.role === "admin";

                  return (
                    <button
                      key={item.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleModule(user.id, item.key)}
                      className={`rounded-[22px] border p-4 text-left transition ${
                        enabled
                          ? "border-emerald-300/20 bg-emerald-300/10 text-white"
                          : "border-white/10 bg-black/20 text-white/65"
                      } ${disabled ? "cursor-not-allowed opacity-80" : "hover:border-white/20 hover:bg-white/[0.05]"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{item.label}</p>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${
                            enabled
                              ? "bg-white text-black"
                              : "bg-white/10 text-white/65"
                          }`}
                        >
                          {enabled ? "açık" : "kapalı"}
                        </span>
                      </div>

                      <p className="mt-3 text-xs leading-5 text-white/45">
                        {disabled
                          ? "Admin hesaplarında erişim sabit açık tutulur."
                          : "Bu modülün kullanıcı tarafından görüntülenmesini ve açılmasını kontrol eder."}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}