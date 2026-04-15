"use client";

import { useEffect, useState } from "react";

type ReferenceLogoItem = {
  id: string;
  name: string;
  logo: string;
  url: string;
  createdAt: string;
};

export default function ReferenceLogoGrid() {
  const [items, setItems] = useState<ReferenceLogoItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadLogos() {
      try {
        const res = await fetch("/api/references", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data?.success || !Array.isArray(data?.items)) {
          return;
        }

        if (isMounted) {
          setItems(data.items);
        }
      } catch (error) {
        console.error("Reference logo fetch error:", error);
      }
    }

    loadLogos();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!items.length) return null;

  return (
    <section className="border-t border-black/8 bg-[#f6f6f4]">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[0.24em] text-black/35">
            Referanslarımız
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-black sm:text-4xl">
            Birlikte çalıştığımız markalar
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-black/55">
            Çalışma kültürümüzü paylaşan markalar ve kurumsal iş ortaklarımız.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const card = (
              <div className="group rounded-[2rem] border border-black/8 bg-white p-8 transition duration-300 hover:-translate-y-[2px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                <div className="flex h-[110px] items-center justify-center">
                  <img
                    src={item.logo}
                    alt={item.name}
                    draggable={false}
                    className="max-h-full max-w-full object-contain opacity-70 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                  />
                </div>

                <div className="mt-6 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-black">
                      {item.name}
                    </p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-black/35">
                      Client Reference
                    </p>
                  </div>

                  {item.url ? (
                    <span className="text-[11px] uppercase tracking-[0.18em] text-black/35 transition group-hover:text-black">
                      Visit
                    </span>
                  ) : null}
                </div>
              </div>
            );

            if (item.url) {
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  {card}
                </a>
              );
            }

            return <div key={item.id}>{card}</div>;
          })}
        </div>
      </div>
    </section>
  );
}