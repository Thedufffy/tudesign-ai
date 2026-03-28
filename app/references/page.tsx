"use client";

import { useEffect, useState } from "react";

type ReferenceItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  featured: boolean;
};

export default function ReferencesPage() {
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchReferences() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/references", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("References verileri alınamadı.");
        }

        const data = await res.json();

        if (isMounted) {
          setReferences(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("References yüklenirken bir hata oluştu.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchReferences();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f6f4] text-[#111111] selection:bg-black/10">
      <header className="sticky top-0 z-30 border-b border-black/8 bg-[#f6f6f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <a
            href="/"
            className="text-[1.65rem] font-semibold tracking-[-0.04em] text-black"
          >
            tu.
          </a>

          <nav className="hidden items-center gap-10 text-[13px] uppercase tracking-[0.18em] text-black/60 md:flex">
            <a href="/references" className="transition hover:text-black">
              Projeler
            </a>
            <a href="/#studio" className="transition hover:text-black">
              Stüdyo
            </a>
            <a href="/#contact" className="transition hover:text-black">
              İletişim
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-10">
          <div className="mb-12 md:mb-16">
            <div className="mb-5 text-[11px] uppercase tracking-[0.35em] text-black/35 md:text-xs">
              Seçilmiş Projeler
            </div>

            <h1 className="max-w-5xl text-[42px] font-semibold leading-[0.95] tracking-[-0.06em] text-black md:text-[72px]">
              Zamansız bir estetik, ölçülü bir yaklaşım.
            </h1>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="animate-pulse">
                  <div className="aspect-[4/3] bg-black/8" />
                  <div className="mt-4 h-5 w-40 bg-black/8" />
                  <div className="mt-2 h-4 w-28 bg-black/8" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="border border-black/10 bg-white/40 px-5 py-4 text-sm text-black/60">
              {error}
            </div>
          ) : references.length === 0 ? (
            <div className="border border-black/10 bg-white/40 px-5 py-4 text-sm text-black/60">
              Henüz reference eklenmemiş.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {references.map((item) => (
                <article key={item.id} className="group cursor-pointer">
                  <div className="relative overflow-hidden bg-black/5">
                    <img
                      src={item.image}
                      alt={item.title}
                      draggable={false}
                      className="aspect-[4/3] w-full select-none object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] group-hover:-translate-y-1"
                    />

                    <div className="pointer-events-none absolute inset-0 bg-black/0 transition duration-500 group-hover:bg-black/[0.03]" />
                  </div>

                  <div className="pt-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[20px] font-medium tracking-[-0.03em] md:text-[22px]">
                        {item.title}
                      </h2>

                      {item.featured && (
                        <span className="border border-black/15 bg-white/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-black/65">
                          Featured
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-black/52 md:text-[15px]">
                      {item.subtitle}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section
          id="studio"
          className="mx-auto grid max-w-7xl gap-10 px-6 pb-24 lg:grid-cols-[0.78fr_1.22fr] lg:px-10"
        >
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-black/35">
              Stüdyo
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black sm:text-4xl">
              Gerçek proje deneyiminden beslenir.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[2rem] border border-black/8 bg-white p-8">
              <p className="text-base leading-8 text-black/60">
                tuDesign AI, mimari sezgiyi daha hızlı karar alma, daha güçlü
                görsel sunum ve daha rafine bir proje diliyle birleştiren bir
                sistemdir.
              </p>
            </div>

            <div className="rounded-[2rem] border border-black/8 bg-white p-8">
              <p className="text-base leading-8 text-black/60">
                Buradaki amaç yalnızca bir efekt üretmek değil; daha sakin,
                daha güçlü ve daha ikna edici mekânsal atmosferler kurmaktır.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer
        id="contact"
        className="border-t border-black/8 px-6 py-8 text-sm text-black/45 lg:px-10"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>tuDesign AI</div>

          <div className="flex items-center gap-5">
            <a href="#" className="transition hover:text-black">
              Instagram
            </a>
            <a
              href="https://wa.me/905324207506"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-black"
            >
              WhatsApp
            </a>
            <a href="/#contact" className="transition hover:text-black">
              İletişim
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}