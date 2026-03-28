import { getReferences } from "@/lib/references";

export default async function FeaturedReferences() {
  const allItems = await getReferences();
  const featuredItems = allItems.filter((item) => item.featured);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
            Featured references
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
            Selected visual directions.
          </h2>
        </div>

        <a
          href="/references"
          className="hidden rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/10 md:inline-flex"
        >
          View All References
        </a>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4">
        {featuredItems.map((item) => (
          <article
            key={item.id}
            className="group relative min-w-[320px] flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] sm:min-w-[420px] lg:min-w-[520px]"
          >
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            <img
              src={item.image}
              alt={item.title}
              className="h-[420px] w-full object-cover opacity-85 transition duration-700 group-hover:scale-[1.03]"
            />

            <div className="absolute inset-x-0 bottom-0 z-20 p-6 sm:p-8">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                Featured / Reference
              </div>
              <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-white">
                {item.title}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/68">
                {item.subtitle}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 md:hidden">
        <a
          href="/references"
          className="inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/10"
        >
          View All References
        </a>
      </div>
    </section>
  );
}