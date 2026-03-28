export default function SiteFooter() {
  return (
    <footer
      id="contact"
      className="relative z-10 border-t border-white/10 px-6 py-8 text-sm text-white/45 lg:px-10"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>tuDesign AI</div>

        <div className="flex items-center gap-5">
          <a href="#" className="transition hover:text-white">
            Instagram
          </a>
          <a href="#" className="transition hover:text-white">
            WhatsApp
          </a>
          <a href="#" className="transition hover:text-white">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}