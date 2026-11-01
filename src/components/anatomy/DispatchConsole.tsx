import { useEffect, useRef } from "react";
import figure from "./dispatch-figure.svg?raw";
import { startDispatchConsole } from "./dispatch-live.js";

type Props = {
    className?: string;
};

/**
 * The dispatch console: a split-flap board, a pickup dial, a fare drum and the
 * key that lifts when the quote is sealed. The drawing is a static SVG; the
 * generated runtime only touches the nine parts the model moves.
 */
export function DispatchConsole({ className = "" }: Props) {
    const host = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const svg = host.current?.querySelector<SVGSVGElement>(".dc-svg");
        if (!svg) return;
        return startDispatchConsole(svg);
    }, []);

    return (
        <figure className={`relative ${className}`}>
            {/* Pink bloom behind the instrument */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-10 bg-[radial-gradient(closest-side,rgba(236,72,153,0.18),transparent_72%)]"
            />

            <div
                ref={host}
                data-dc-host
                className="relative border border-white/10 bg-[#110b0e] px-5 pb-11 pt-6 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_40px_90px_-40px_rgba(0,0,0,0.9)] sm:px-7 sm:pb-12 sm:pt-8"
            >
                <div className="pointer-events-none absolute inset-x-3.5 inset-y-3.5 font-mono text-[10.5px] leading-none tracking-[0.04em] text-white/30 sm:inset-x-5">
                    <span className="absolute left-0 top-0 text-white/65">FIG. 01 · DISPATCH</span>
                    <span className="absolute right-0 top-0 uppercase tracking-[0.1em]">US Executive</span>
                    <span className="absolute bottom-0 left-0 uppercase tracking-[0.1em]">One cycle · 26 s</span>
                    <span
                        data-readout
                        aria-hidden="true"
                        className="absolute bottom-0 right-0 tabular-nums text-white/65"
                    >
                        DIAL 60 · £--.-- · OPEN
                    </span>
                </div>

                <div
                    className="[&>svg]:mx-auto"
                    // The SVG carries its own prefixed <style>; only `.dc-svg` / `.iso-*` selectors, so it cannot leak.
                    dangerouslySetInnerHTML={{ __html: figure }}
                />
            </div>

            <figcaption className="mt-5 flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/35">
                <span aria-hidden="true" className="h-px w-6 bg-pink-500/60" />
                Set the pickup. Seal the quote. Release the car.
            </figcaption>
        </figure>
    );
}
