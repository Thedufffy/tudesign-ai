type PreviewCardProps = {
  label: string;
  image: string;
  alt: string;
};

type PreviewPanelProps = {
  uploadedPreview?: string | null;
};

function PreviewCard({ label, image, alt }: PreviewCardProps) {
  return (
    <div className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/20">
      <div className="border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
        {label}
      </div>
      <img src={image} alt={alt} className="h-44 w-full object-cover" />
    </div>
  );
}

export default function PreviewPanel({ uploadedPreview }: PreviewPanelProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/12 bg-black/35 p-5 backdrop-blur-xl">
      <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">Preview</div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <PreviewCard
          label="Before"
          image={
            uploadedPreview ||
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80"
          }
          alt="Before interior"
        />
        <PreviewCard
          label="After"
          image="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80"
          alt="After interior"
        />
      </div>

      <a
        href="/references"
        className="mt-5 inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/10"
      >
        View Selected Projects
      </a>
    </div>
  );
}