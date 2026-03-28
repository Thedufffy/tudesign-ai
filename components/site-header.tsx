export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0f0f10]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <a href="/" className="text-[1.65rem] font-semibold tracking-[-0.04em] text-white">
          tu.
        </a>

        <nav className="hidden items-center gap-10 text-[13px] uppercase tracking-[0.18em] text-white/60 md:flex">
          <a href="/references" className="transition hover:text-white">
            Projects
          </a>
          <a href="/#about" className="transition hover:text-white">
            Studio
          </a>
          <a href="/#contact" className="transition hover:text-white">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}