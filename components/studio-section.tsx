function StudioCard({ text }: { text: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
      <p className="text-base leading-8 text-white/65">{text}</p>
    </div>
  );
}

export default function StudioSection() {
  return (
    <section
      id="about"
      className="mx-auto grid max-w-7xl gap-10 px-6 pb-24 lg:grid-cols-[0.78fr_1.22fr] lg:px-10"
    >
      <div>
        <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Studio</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          Built from real project experience.
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <StudioCard text="tuDesign AI, mimari sezgiyi daha hızlı karar alma, daha güçlü görsel sunum ve daha rafine proje diliyle birleştiren bir sistemdir." />
        <StudioCard text="Buradaki yaklaşım bir efekt üretmek değil; daha sakin, daha güçlü ve daha ikna edici mekânsal atmosferler oluşturmaktır." />
      </div>
    </section>
  );
}