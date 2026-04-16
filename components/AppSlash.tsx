"use client";

import { useEffect, useState } from "react";

export default function AppSplash({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("tudesign_splash_shown");

    if (alreadyShown) {
      setVisible(false);
      return;
    }

    const fadeTimer = window.setTimeout(() => {
      setFadeOut(true);
    }, 1800);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("tudesign_splash_shown", "true");
    }, 2500);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {visible ? (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#09090b] transition-opacity duration-700 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="relative flex flex-col items-center">
            <div className="absolute h-40 w-40 rounded-full bg-white/5 blur-3xl" />

            <div className="relative flex flex-col items-center">
              <div className="select-none text-[68px] font-semibold leading-none tracking-[-0.06em] text-white md:text-[90px]">
                tu.
              </div>

              <div className="mt-4 text-[11px] uppercase tracking-[0.45em] text-white/45">
                tuDesign AI
              </div>

              <div className="mt-6 h-[2px] w-24 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/2 animate-[splashLoad_1.4s_ease-in-out_infinite] bg-white" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`transition-opacity duration-500 ${
          visible ? "opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </div>
    </>
  );
}