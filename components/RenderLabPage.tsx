"use client";

import { useEffect, useMemo, useState } from "react";

const PROCESS_STEPS = [
  "Güvenli oturum anahtarı doğrulanıyor...",
  "Proje klasörü özel sunucuya bağlanıyor...",
  "Render varlıkları birleştiriliyor...",
  "Kamera açısı ve mekan sınırları analiz ediliyor...",
  "Orijinal geometri korunuyor...",
  "Malzeme karakteri yeniden işleniyor...",
  "Işık dengesi ve atmosfer derinliği kalibre ediliyor...",
  "Revizyon varyasyonları oluşturuluyor...",
  "Final üretim paketi hazırlanıyor...",
];

const STATUS_CARDS = [
  ["Sunucu Durumu", "Çevrimiçi"],
  ["Üretim Kuyruğu", "Hazır"],
  ["Geometri Kilidi", "Açık"],
  ["Stil Uyumu", "Yüksek"],
] as const;

const OUTPUTS = [
  {
    title: "Varyasyon A",
    desc: "Dengeli ve premium revizyon, mekan bütünlüğü korunur.",
    tone: "Dengeli Premium",
  },
  {
    title: "Varyasyon B",
    desc: "Daha karakterli ve güçlü malzeme kontrastı.",
    tone: "Daha Karakterli",
  },
  {
    title: "Varyasyon C",
    desc: "Daha yumuşak ve rafine atmosfer.",
    tone: "Yumuşak & Rafine",
  },
] as const;

export default function RenderLabPage() {
  const matrixColumns = Array.from({ length: 24 }, (_, i) => i);
  const miniSignals = Array.from({ length: 18 }, (_, i) => i);

  const [isProducing, setIsProducing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedTone, setSelectedTone] = useState("Dengeli Premium");

  useEffect(() => {
    if (!isProducing) return;

    setProgress(0);
    setActiveStep(-1);
    setVisibleLogs([]);
    setIsComplete(false);

    let stepIndex = -1;
    const interval = setInterval(() => {
      stepIndex += 1;

      if (stepIndex < PROCESS_STEPS.length) {
        setActiveStep(stepIndex);
        setVisibleLogs((prev) => [
          ...prev,
          `[${String(stepIndex + 1).padStart(2, "0")}] ${PROCESS_STEPS[stepIndex]}`,
        ]);
        setProgress(
          Math.min(
            100,
            Math.round(((stepIndex + 1) / PROCESS_STEPS.length) * 100)
          )
        );
      }

      if (stepIndex >= PROCESS_STEPS.length - 1) {
        clearInterval(interval);
        setTimeout(() => {
          setIsComplete(true);
        }, 500);
      }
    }, 850);

    return () => clearInterval(interval);
  }, [isProducing]);

  const activeControls = useMemo(() => {
    return [
      ["Perspektif Koruması", activeStep >= 3 ? "Aktif" : "Beklemede"],
      ["Mekan Bütünlüğü", activeStep >= 4 ? "Kilitli" : "Hazırlanıyor"],
      ["Malzeme Uyum Katmanı", activeStep >= 5 ? "Çalışıyor" : "Beklemede"],
      ["Atmosfer Optimizasyonu", activeStep >= 6 ? "Aktif" : "Beklemede"],
      ["Varyasyon Üretimi", activeStep >= 7 ? "Devam Ediyor" : "Beklemede"],
    ];
  }, [activeStep]);

  const resetDemo = () => {
    setIsProducing(false);
    setProgress(0);
    setActiveStep(-1);
    setVisibleLogs([]);
    setIsComplete(false);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />

      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-[0.08]">
        {matrixColumns.map((col) => (
          <div
            key={col}
            className="absolute top-0 h-full w-8 animate-pulse text-[10px] font-mono leading-4 text-emerald-200/70"
            style={{
              left: `${col * 4.3}%`,
              animationDuration: `${2.8 + (col % 5) * 0.7}s`,
              animationDelay: `${(col % 6) * 0.2}s`,
            }}
          >
            <div className="flex h-full flex-col justify-between py-2">
              <span>01A</span>
              <span>SYS</span>
              <span>TRX</span>
              <span>NODE</span>
              <span>REV</span>
              <span>404</span>
              <span>IST</span>
              <span>AI</span>
              <span>MAT</span>
              <span>01A</span>
              <span>SYS</span>
              <span>TRX</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none fixed inset-0 opacity-[0.05] [background-image:linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.22)_50%,transparent_100%)] [background-size:100%_4px]" />

      <header className="relative border-b border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <div>
            <div className="text-[11px] uppercase tracking-[0.35em] text-white/45">
              tuDesign Özel Sistem
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">
              Revizyon Motoru Paneli
            </h1>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
              {isProducing ? "Üretim Modu Aktif" : "Sistem Hazır"}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
              Çalışma Alanı: IST-TR-01
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-6 lg:px-8">
        {!isProducing ? (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="space-y-6">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">
                      Yetkili Üretim Arayüzü
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold">
                      Yeni Görsel Revizyon
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                      Proje görsellerinizi yükleyin, tasarım yönünü belirleyin ve
                      özel üretim ortamında kontrollü revizyon sürecini başlatın.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsProducing(true)}
                    className="rounded-2xl border border-white/15 bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.01]"
                  >
                    Üretimi Başlat
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-5">
                    <div className="text-sm font-medium">Ana Render</div>
                    <div className="mt-2 flex h-40 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-center text-sm text-white/35">
                      Render yükle / sahne önizlemesi ekle
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-5">
                    <div className="text-sm font-medium">Referans Görseller</div>
                    <div className="mt-2 flex h-40 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-center text-sm text-white/35">
                      Stil / malzeme / atmosfer referansları ekle
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="text-sm font-medium">Revizyon Notları</div>
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/45">
                      Kamera açısı korunacak. Mekan oranları bozulmayacak.
                      Malzeme, ışık ve atmosfer daha gerçekçi ve premium hale
                      getirilecek.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="text-sm font-medium">Tasarım Yönü</div>
                    <div className="mt-3 grid gap-2 text-sm text-white/70">
                      {OUTPUTS.map((item) => (
                        <button
                          key={item.tone}
                          onClick={() => setSelectedTone(item.tone)}
                          className={`rounded-xl border px-4 py-3 text-left transition ${
                            selectedTone === item.tone
                              ? "border-white/10 bg-white/[0.05] text-white"
                              : "border-white/10 bg-white/[0.02]"
                          }`}
                        >
                          {item.tone}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">
                      Revizyon Çıktıları
                    </div>
                    <h3 className="mt-2 text-xl font-semibold">Önizleme Yapısı</h3>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60">
                    Parti ID: TD-RV-2026-041
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {OUTPUTS.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex h-36 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white/30">
                        Önizleme
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-base font-medium">{item.title}</div>
                        <span className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                          AI
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/55">
                        {item.desc}
                      </p>
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/65">
                        Hazır bekliyor
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">
                      Sistem Durumu
                    </div>
                    <h3 className="mt-2 text-xl font-semibold">Üretim Takibi</h3>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(110,231,183,0.8)]" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {STATUS_CARDS.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="text-xs uppercase tracking-[0.24em] text-white/35">
                        {label}
                      </div>
                      <div className="mt-2 text-lg font-medium">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/60 p-6 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">
                      Demo Notu
                    </div>
                    <h3 className="mt-2 text-xl font-semibold">Tıklanabilir Akış</h3>
                  </div>
                  <div className="rounded-xl border border-white/10 px-3 py-1.5 font-mono text-xs text-white/60">
                    ETKİLEŞİMLİ
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm leading-6 text-white/60">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    “Üretimi Başlat” butonuna basınca gerçek bir üretim sahnesine
                    geçer.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    Log satırları sırayla akar, yüzde ilerler ve sonuç kartları
                    hazır hale gelir.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    Bu demo tamamen ön yüz deneyimi verir; sonra gerçek upload ve
                    backend bağlanır.
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <section className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-black/80 p-6 shadow-2xl shadow-black/40">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_45%)]" />
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.35em] text-emerald-200/60">
                    Üretim Sahnesi
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold">
                    Özel Revizyon Süreci Başlatıldı
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
                    Sistem, görselleri katman katman işliyormuş gibi ilerler ve
                    özel sunucu altyapısı hissi verir.
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    Üretim Oturumu: Aktif
                  </div>
                  <button
                    onClick={resetDemo}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80 transition hover:bg-white/[0.06]"
                  >
                    Başa Dön
                  </button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">
                        Canlı İşlem Akışı
                      </div>
                      <div className="mt-2 text-lg font-medium">
                        Revizyon Motoru Çalışıyor
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 px-3 py-1.5 font-mono text-xs text-white/60">
                      CANLI AKIŞ
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 font-mono text-sm text-white/70">
                    {visibleLogs.map((line, index) => (
                      <div
                        key={line + index}
                        className="rounded-xl border border-white/10 bg-black/40 px-4 py-3"
                      >
                        {line}
                      </div>
                    ))}

                    {!isComplete && (
                      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-emerald-100">
                        [ÇALIŞIYOR] Revizyon çıktıları hazırlanıyor... _
                      </div>
                    )}

                    {isComplete && (
                      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-emerald-100">
                        [TAMAMLANDI] Final üretim paketi hazır.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">
                          Üretim İlerlemesi
                        </div>
                        <div className="mt-2 text-lg font-medium">İşlem Yüzdesi</div>
                      </div>
                      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 font-mono text-xs text-emerald-100">
                        CANLI _
                      </div>
                    </div>

                    <div className="mt-5 rounded-full border border-white/10 bg-white/[0.04] p-1">
                      <div
                        className="h-3 rounded-full bg-emerald-300 shadow-[0_0_22px_rgba(110,231,183,0.45)] transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-white/50">
                      <span>Başlatıldı</span>
                      <span>%{progress} tamamlandı</span>
                    </div>

                    <div className="mt-5 grid grid-cols-6 gap-2">
                      {miniSignals.map((item) => (
                        <div
                          key={item}
                          className={`h-6 rounded-md border border-white/10 transition-all ${
                            item < Math.round((progress / 100) * miniSignals.length)
                              ? "bg-emerald-300/70"
                              : "bg-white/[0.04]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">
                      Aktif Kontroller
                    </div>
                    <div className="mt-4 grid gap-3">
                      {activeControls.map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/65"
                        >
                          {label}: {value}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/50 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">
                          Üretim Çekirdeği
                        </div>
                        <div className="mt-2 text-lg font-medium">Sistem Durumları</div>
                      </div>
                      <div className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        ["Sunucu", "Çevrimiçi"],
                        ["Node", "Bağlı"],
                        ["Kuyruk", progress > 60 ? "İşleniyor" : "Stabil"],
                        ["Çıktı", isComplete ? "Hazır" : "Hazırlanıyor"],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >
                          <div className="text-xs uppercase tracking-[0.24em] text-white/35">
                            {label}
                          </div>
                          <div className="mt-2 text-base font-medium">{value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-white/35">
                        Sinyal Akışı
                      </div>
                      <div className="mt-3 flex items-center gap-2 overflow-hidden">
                        {Array.from({ length: 20 }, (_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded-full ${
                              i < Math.round((progress / 100) * 20)
                                ? "bg-emerald-300/80"
                                : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isComplete && (
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">
                        Revizyon Çıktıları Hazır
                      </div>
                      <h3 className="mt-2 text-xl font-semibold">
                        Final Varyasyonlar
                      </h3>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-100">
                      Seçili Yön: {selectedTone}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {OUTPUTS.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-white/10 bg-black/30 p-4"
                      >
                        <div className="flex h-40 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white/30">
                          Hazır Çıktı
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-base font-medium">{item.title}</div>
                          <span className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">
                            Tamamlandı
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/55">
                          {item.desc}
                        </p>
                        <div className="mt-4 flex gap-2">
                          <button className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.08]">
                            Önizle
                          </button>
                          <button className="flex-1 rounded-xl border border-white/10 bg-white px-3 py-2 text-sm font-medium text-black transition hover:opacity-95">
                            Seç
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}