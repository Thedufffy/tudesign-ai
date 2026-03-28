type ReferenceCardProps = {
  title: string;
  subtitle: string;
  image: string;
  large?: boolean;
};

export default function ReferenceCard({
  title,
  subtitle,
  image,
  large = false,
}: ReferenceCardProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] ${
        large ? "lg:col-span-7" : "lg:col-span-5"
      }`}
    >
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-95 transition duration-500 group-hover:opacity-100" />

      <img
        src={image}
        alt={title}
        className="h-[520px] w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-95"
      />

      <div className="absolute inset-x-0 bottom-0 z-20 p-7 sm:p-8">
        <div className="max-w-md translate-y-3 transition duration-500 group-hover:translate-y-0">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">
            Project / Case Study
          </div>
          <h3 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-white sm:text-[1.8rem]">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-white/68">{subtitle}</p>
        </div>
      </div>
    </article>
  );
}