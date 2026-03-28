"use client";

import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Giriş başarısız.");
        setLoading(false);
        return;
      }

      window.location.href = "/portal";
    } catch (err) {
      console.error(err);
      setError("Bağlantı sırasında bir hata oluştu.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0c] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
          <div className="mb-3 text-xs uppercase tracking-[0.28em] text-white/35">
            Admin
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
            Giriş Yap
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/55">
            References Control Panel erişimi için şifreni gir.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
            />

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full rounded-full bg-white py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Kontrol ediliyor..." : "Giriş Yap"}
            </button>

            {error && (
              <div className="rounded-xl border border-red-500/15 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}