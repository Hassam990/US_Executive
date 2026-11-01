import { useEffect, useRef } from "react";
import carSvgRaw from "./car-figure.svg?raw";

export function CarFigure({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // car live loop can be added here; static figure for now
    const svg = host.current?.querySelector(".car-svg");
    if (!svg) return;
    // placeholder: lamp opacity fixed at 0.55; no animation cycle for car yet
    return () => {};
  }, []);
  return (
    <figure className={`relative ${className}`} data-car-host>
      <div aria-hidden="true" className="pointer-events-none absolute -inset-10 bg-[radial-gradient(closest-side,rgba(236,72,153,0.16),transparent_72%)]" />
      <div ref={host} className="relative border border-white/10 bg-[#110b0e] px-5 pb-11 pt-6 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_40px_90px_-40px_rgba(0,0,0,0.9)] sm:px-7 sm:pb-12 sm:pt-8">
        <div className="pointer-events-none absolute inset-x-3.5 inset-y-3.5 font-mono text-[10.5px] leading-none tracking-[0.04em] text-white/30 sm:inset-x-5">
          <span className="absolute left-0 top-0 text-white/65">FIG. 02 · CHAUFFEUR</span>
          <span className="absolute right-0 top-0 uppercase tracking-[0.1em]">US Executive</span>
          <span className="absolute bottom-0 left-0 uppercase tracking-[0.1em]">Available — 26 s cycle</span>
          <span className="absolute bottom-0 right-0 tabular-nums text-white/65">LAMP · BADGE · GRILLE</span>
        </div>
        <div dangerouslySetInnerHTML={{ __html: carSvgRaw }} />
      </div>
      <figcaption className="mt-5 flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/35">
        <span aria-hidden="true" className="h-px w-6 bg-pink-500/60" />
        Executive transport — set, seal, release.
      </figcaption>
    </figure>
  );
}
