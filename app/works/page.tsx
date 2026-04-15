import Link from "next/link";
import { getWorks } from "@/lib/work-store";

export default async function WorksPage() {
  const items = await getWorks();

  return (
    <div className="min-h-screen bg-[#f6f6f4] text-black">
      <header className="sticky top-0 z-30 border-b border-black/8 bg-[#f6f6f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link
            href="/"
            className="text-[1.65rem] font-semibold tracking-[-0.04em] text-black"
          >
            tu.
          </Link>

          <nav className="hidden items-center gap-10 text-[13px] uppercase tracking-[0.18em] text-black/60 md:flex">
            <Link href="/references" className="transition hover:text-black">
              References
            </Link>
            <Link href="/works" className="transition hover:text-black">
              Works
            </Link>
            <Link href="/#studio" className="transition hover:text-black">
              Stüdyo
            </Link>
            <Link href="/#contact" className="transition hover:text-black">
              İletişim
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 pb-14 pt-14 lg:px-10 lg:pb-20 lg:pt-20">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-black/35">
                Works
              </div>

              <h1 className="mt-3 text-4xl font-semibold leading-[0.96] tracking-[-0.05em] text-black sm:text-5xl lg:text-[4.3rem]">
                Seçilmiş
                <br />
                proje çalışmaları
              </h1>
            </div>

            <div className="max-w-2xl text-sm leading-7 text-black/55 sm:text-[15px]">
              Farklı ölçeklerde geliştirdiğimiz seçili işlerden bir kesit.
              Mekânsal atmosfer, malzeme dili ve sunum gücü odağında
              şekillenen proje seçkileri burada yer alır.
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
          {items.length === 0 ? (
            <div className="rounded-[2rem] border border-black/8 bg-white p-12 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
              <div className="text-[11px] uppercase tracking-[0.24em] text-black/35">
                Works
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-black">
                Henüz work eklenmedi
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-black/55">
                Portal üzerinden proje görselleri eklendiğinde bu alan otomatik
                olarak dolacak.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => (
                <article
                  key={item.id}
                  className={`group ${
                    index % 5 === 0 ? "md:col-span-2 xl:col-span-2" : ""
                  }`}
                >
                  <div className="overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
                    <div className="relative overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className={`w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04] ${
                          index % 5 === 0 ? "h-[420px]" : "h-[320px]"
                        }`}
                        draggable={false}
                      />

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-90 transition duration-500 group-hover:from-black/45" />

                      <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-5 py-5">
                        <div className="rounded-full border border-white/20 bg-black/15 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
                          Selected Work
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7">
                        <h2 className="max-w-xl text-2xl font-medium tracking-[-0.03em] text-white sm:text-[1.75rem]">
                          {item.title}
                        </h2>
                        {item.subtitle ? (
                          <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
                            {item.subtitle}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-black/8 px-5 py-4 text-[11px] uppercase tracking-[0.18em] text-black/35">
                      <span>tuDesign Works</span>
                      <span className="transition duration-300 group-hover:text-black">
                        Project View
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="border-t border-black/8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 py-14 lg:flex-row lg:items-end lg:px-10">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-black/35">
                Next
              </div>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black">
                Marka referanslarımızı da inceleyin
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-black/55">
                Çalıştığımız markaları ve kurumsal iş ortaklarımızı
                referanslar sayfasında görebilirsiniz.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/references"
                className="inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-black/90"
              >
                References
              </Link>

              <Link
                href="/"
                className="inline-flex rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-black transition hover:border-black/20"
              >
                Ana Sayfa
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}