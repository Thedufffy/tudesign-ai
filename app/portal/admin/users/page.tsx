"use client";

import { useMemo, useState } from "react";

type PortalModule =
  | "render-lab"
  | "fashion"
  | "references"
  | "uploads"
  | "works"
  | "admin";

type RoleType = "admin" | "client";

type AdminUserRow = {
  id: string;
  username: string;
  role: RoleType;
  modules: PortalModule[];
  renderCredits: number;
  fashionCredits: number;
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

const initialUsers: AdminUserRow[] = [
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
    renderCredits: 999,
    fashionCredits: 999,
    status: "active",
  },
  {
    id: "u-render",
    username: "render",
    role: "client",
    modules: ["render-lab"],
    renderCredits: 24,
    fashionCredits: 0,
    status: "active",
  },
];

function formatModuleLabel(moduleName: PortalModule) {
  return moduleOptions.find((item) => item.key === moduleName)?.label || moduleName;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleType>("client");
  const [selectedModules, setSelectedModules] = useState<PortalModule[]>([
    "render-lab",
  ]);
  const [renderCredits, setRenderCredits] = useState("10");
  const [fashionCredits, setFashionCredits] = useState("0");
  const [formMessage, setFormMessage] = useState("");

  const totalAdmins = useMemo(
    () => users.filter((user) => user.role === "admin").length,
    [users]
  );

  const totalClients = useMemo(
    () => users.filter((user) => user.role === "client").length,
    [users]
  );

  function toggleModule(moduleName: PortalModule) {
    setSelectedModules((prev) => {
      const exists = prev.includes(moduleName);

      if (exists) {
        return prev.filter((item) => item !== moduleName);
      }

      return [...prev, moduleName];
    });
  }

  function handleRoleChange(nextRole: RoleType) {
    setRole(nextRole);

    if (nextRole === "admin") {
      setSelectedModules([
        "admin",
        "render-lab",
        "fashion",
        "references",
        "uploads",
        "works",
      ]);
      return;
    }

    setSelectedModules((prev) => prev.filter((item) => item !== "admin"));
  }

  function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFormMessage("");

    const cleanedUsername = username.trim();
    const cleanedPassword = password.trim();

    if (!cleanedUsername || !cleanedPassword) {
      setFormMessage("Kullanıcı adı ve şifre zorunlu.");
      return;
    }

    if (users.some((user) => user.username.toLowerCase() === cleanedUsername.toLowerCase())) {
      setFormMessage("Bu kullanıcı adı zaten mevcut.");
      return;
    }

    if (role === "client" && selectedModules.length === 0) {
      setFormMessage("En az bir modül seçmelisin.");
      return;
    }

    const nextModules: PortalModule[] =
  role === "admin"
    ? [
        "admin",
        "render-lab",
        "fashion",
        "references",
        "uploads",
        "works",
      ]
    : selectedModules.filter((item) => item !== "admin");

    const nextUser: AdminUserRow = {
      id: `user-${Date.now()}`,
      username: cleanedUsername,
      role,
      modules: nextModules,
      renderCredits: Number(renderCredits || 0),
      fashionCredits: Number(fashionCredits || 0),
      status: "active",
    };

    setUsers((prev) => [nextUser, ...prev]);

    setUsername("");
    setPassword("");
    setRole("client");
    setSelectedModules(["render-lab"]);
    setRenderCredits("10");
    setFashionCredits("0");
    setFormMessage("Kullanıcı taslağı eklendi. Sonraki adımda bunu backend'e bağlarız.");
  }

  function toggleStatus(userId: string) {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === "active" ? "passive" : "active",
            }
          : user
      )
    );
  }

  function deleteUser(userId: string) {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
  }

  return (
    <main className="min-h-screen bg-[#09090b] p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
            tuDesign AI / Admin
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Kullanıcı Yönetimi
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
            Yeni kullanıcı aç, admin tanımla, modül erişimlerini belirle ve kredi
            başlangıçlarını yönet.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">
                Toplam kullanıcı
              </p>
              <p className="mt-3 text-3xl font-semibold">{users.length}</p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">
                Admin hesapları
              </p>
              <p className="mt-3 text-3xl font-semibold">{totalAdmins}</p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">
                Client hesapları
              </p>
              <p className="mt-3 text-3xl font-semibold">{totalClients}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-6">
              <p className="text-sm font-medium text-white">Yeni kullanıcı oluştur</p>
              <p className="mt-2 text-sm leading-6 text-white/50">
                İstersen normal kullanıcı, istersen ek bir admin hesabı açabilirsin.
              </p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Kullanıcı adı
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/25"
                  placeholder="örn. fashion-client"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Şifre</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/25"
                  placeholder="Şifre belirle"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Rol</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleChange("client")}
                    className={`rounded-[18px] border px-4 py-3 text-sm transition ${
                      role === "client"
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-black/20 text-white/70"
                    }`}
                  >
                    Client
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange("admin")}
                    className={`rounded-[18px] border px-4 py-3 text-sm transition ${
                      role === "admin"
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-black/20 text-white/70"
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Modül erişimleri
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {moduleOptions.map((item) => {
                    const checked = selectedModules.includes(item.key);
                    const disabled = role === "admin";

                    return (
                      <button
                        key={item.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleModule(item.key)}
                        className={`rounded-[18px] border px-4 py-3 text-left text-sm transition ${
                          checked
                            ? "border-white/20 bg-white/[0.12] text-white"
                            : "border-white/10 bg-black/20 text-white/60"
                        } ${disabled ? "cursor-not-allowed opacity-80" : ""}`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Render kredisi
                  </label>
                  <input
                    type="number"
                    value={renderCredits}
                    onChange={(e) => setRenderCredits(e.target.value)}
                    className="w-full rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Fashion kredisi
                  </label>
                  <input
                    type="number"
                    value={fashionCredits}
                    onChange={(e) => setFashionCredits(e.target.value)}
                    className="w-full rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white outline-none"
                  />
                </div>
              </div>

              {formMessage ? (
                <div className="rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white/75">
                  {formMessage}
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-[18px] border border-white/12 bg-white px-4 py-3 text-sm font-medium text-black transition hover:opacity-90"
              >
                Kullanıcı oluştur
              </button>
            </form>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-6">
              <p className="text-sm font-medium text-white">Mevcut kullanıcılar</p>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Şimdilik bu ekran demo yönetim paneli gibi çalışır. Sonraki adımda
                backend ve kalıcı kayıtla bağlarız.
              </p>
            </div>

            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-[24px] border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">{user.username}</h2>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${
                            user.role === "admin"
                              ? "border-white/10 bg-white text-black"
                              : "border-white/10 bg-white/5 text-white/75"
                          }`}
                        >
                          {user.role}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] ${
                            user.status === "active"
                              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                              : "border-amber-300/20 bg-amber-300/10 text-amber-100"
                          }`}
                        >
                          {user.status === "active" ? "aktif" : "pasif"}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
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

                    <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[280px]">
                      <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                          Render kredisi
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                          {user.renderCredits}
                        </p>
                      </div>

                      <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                          Fashion kredisi
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                          {user.fashionCredits}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => toggleStatus(user.id)}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                      {user.status === "active" ? "Pasife al" : "Aktif et"}
                    </button>

                    {user.username !== "admin" ? (
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs text-red-100 transition hover:bg-red-500/20"
                      >
                        Kullanıcıyı sil
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}

              {users.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-12 text-center text-sm text-white/40">
                  Henüz kullanıcı bulunmuyor.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}