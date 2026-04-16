"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Giriş başarısız.");
      }

      if (data?.user) {
        localStorage.setItem("portal_user", JSON.stringify(data.user));
      }

      router.push("/portal");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Giriş sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[380px] w-[380px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-[320px] w-[320px] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
              tuDesign AI
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Portal Giriş
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Yetkili kullanıcı girişi yaparak portal modüllerine erişin.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Kullanıcı adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/25"
                placeholder="Kullanıcı adı"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-white/25"
                placeholder="Şifre"
              />
            </div>

            {error ? (
              <div className="rounded-[18px] border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[18px] border border-white/12 bg-white px-4 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş yap"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}