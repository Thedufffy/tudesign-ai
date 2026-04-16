"use client";

import { useMemo, useState } from "react";

type CreditUser = {
  id: string;
  username: string;
  role: "admin" | "client";
  renderCredits: number;
  fashionCredits: number;
  status: "active" | "passive";
};

const initialUsers: CreditUser[] = [
  {
    id: "u-admin",
    username: "admin",
    role: "admin",
    renderCredits: 999,
    fashionCredits: 999,
    status: "active",
  },
  {
    id: "u-render",
    username: "render",
    role: "client",
    renderCredits: 24,
    fashionCredits: 0,
    status: "active",
  },
];

export default function AdminCreditsPage() {
  const [users, setUsers] = useState<CreditUser[]>(initialUsers);
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUsers[0].id);
  const [creditType, setCreditType] = useState<"render" | "fashion">("render");
  const [amount, setAmount] = useState("10");
  const [actionType, setActionType] = useState<"add" | "subtract">("add");
  const [message, setMessage] = useState("");

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const totalRenderCredits = useMemo(
    () => users.reduce((sum, user) => sum + user.renderCredits, 0),
    [users]
  );

  const totalFashionCredits = useMemo(
    () => users.reduce((sum, user) => sum + user.fashionCredits, 0),
    [users]
  );

  function handleApplyCredit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const numericAmount = Number(amount);

    if (!selectedUser) {
      setMessage("Önce bir kullanıcı seçmelisin.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage("Geçerli bir kredi miktarı gir.");
      return;
    }

    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== selectedUser.id) return user;

        if (creditType === "render") {
          return {
            ...user,
            renderCredits:
              actionType === "add"
                ? user.renderCredits + numericAmount
                : Math.max(0, user.renderCredits - numericAmount),
          };
        }

        return {
          ...user,
          fashionCredits:
            actionType === "add"
              ? user.fashionCredits + numericAmount
              : Math.max(0, user.fashionCredits - numericAmount),
        };
      })
    );

    setMessage(
      `${selectedUser.username} kullanıcısı için ${
        creditType === "render" ? "render" : "fashion"
      } kredisi ${actionType === "add" ? "artırıldı" : "azaltıldı"}.`
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
            Kredi Yönetimi
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
            Render ve fashion kredi miktarlarını buradan artırabilir veya
            azaltabilirsin.
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
                Toplam render kredisi
              </p>
              <p className="mt-3 text-3xl font-semibold">{totalRenderCredits}</p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">
                Toplam fashion kredisi
              </p>
              <p className="mt-3 text-3xl font-semibold">{totalFashionCredits}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-6">
              <p className="text-sm font-medium text-white">Kredi işlemi</p>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Kullanıcı seç, kredi türünü belirle ve miktarı uygula.
              </p>
            </div>

            <form onSubmit={handleApplyCredit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Kullanıcı
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white outline-none"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Kredi türü
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreditType("render")}
                    className={`rounded-[18px] border px-4 py-3 text-sm transition ${
                      creditType === "render"
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-black/20 text-white/70"
                    }`}
                  >
                    Render
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreditType("fashion")}
                    className={`rounded-[18px] border px-4 py-3 text-sm transition ${
                      creditType === "fashion"
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-black/20 text-white/70"
                    }`}
                  >
                    Fashion
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">İşlem</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActionType("add")}
                    className={`rounded-[18px] border px-4 py-3 text-sm transition ${
                      actionType === "add"
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-black/20 text-white/70"
                    }`}
                  >
                    Kredi ekle
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType("subtract")}
                    className={`rounded-[18px] border px-4 py-3 text-sm transition ${
                      actionType === "subtract"
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-black/20 text-white/70"
                    }`}
                  >
                    Kredi düş
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Miktar</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white outline-none"
                />
              </div>

              {message ? (
                <div className="rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white/75">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-[18px] border border-white/12 bg-white px-4 py-3 text-sm font-medium text-black transition hover:opacity-90"
              >
                İşlemi uygula
              </button>
            </form>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-6">
              <p className="text-sm font-medium text-white">Kredi özeti</p>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Kullanıcı bazlı kredi durumlarını buradan görebilirsin.
              </p>
            </div>

            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-[24px] border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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
                </div>
              ))}

              {users.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-12 text-center text-sm text-white/40">
                  Kredi tanımlı kullanıcı bulunmuyor.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}