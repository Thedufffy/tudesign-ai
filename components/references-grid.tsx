import ReferenceCard from "@/components/reference-card";
import { getReferences } from "@/lib/references";

type ReferencesGridProps = {
  onlyFeatured?: boolean;
  title?: string;
  description?: string;
};

export default async function ReferencesGrid({
  onlyFeatured = false,
  title = "References shaped with a more architectural rhythm.",
  description = "Daha az efekt, daha çok atmosfer. Daha az gürültü, daha güçlü sunum hissi. Bu bölümde proje dili öne çıkar; teknoloji ise görünmeden çalışır.",
}: ReferencesGridProps) {
  const allItems = await getReferences();
  const items = onlyFeatured
    ? allItems.filter((item) => item.featured)
    : allItems;

  return (
    <section id="references" className="mx-auto max-w-7xl px-6 pb-24 lg:px-10 lg:pb-32">
      <div className="mb-12 grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
            Selected projects
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-[2.8rem]">
            {title}
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-7 text-white/58">{description}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {items.map((item, index) => (
          <ReferenceCard
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            image={item.image}
            large={index === 0 || index === 3}
          />
        ))}
      </div>
    </section>
  );
}