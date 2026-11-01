import { Link } from "react-router-dom";
import { CheckCircle2, Phone, Plane, Star, Shield, Clock } from "lucide-react";
import { CarFigure } from "@/components/anatomy/CarFigure";

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0d0005]">

            {/* ── Background ── */}
            <video src="/chauffeur-opens-car-door.mp4" autoPlay muted loop playsInline preload="auto" aria-label="Chauffeur opens car door - background" className="absolute inset-0 w-full h-full object-cover opacity-60 z-0" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0005] via-[#0d0005]/85 to-[#0d0005]/50 z-[1]" />

            {/* Ambient glows */}
            <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-900/15 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="container mx-auto px-6 relative z-10 pt-32 pb-20">
                <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center lg:gap-y-0 xl:gap-x-20">
                <div className="max-w-3xl">

                    {/* Live badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/15 backdrop-blur-md mb-8">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/80">24/7 UK Dispatch Active</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-[clamp(3rem,6.2vw,6rem)] font-black text-white tracking-tighter leading-[0.9] uppercase mb-6">
                        Travel in<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600">
                            Style,
                        </span><br />
                        Day or Night
                    </h1>

                    {/* Subheading */}
                    <p className="text-lg sm:text-xl text-white/60 leading-relaxed font-light max-w-2xl mb-10">
                        Executive chauffeur transport across the UK. Airport transfers, corporate roadshows, and city journeys — all with a guaranteed fixed fare.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-4 mb-0 lg:mb-14">
                        <Link to="/book"
                            className="inline-flex items-center gap-2.5 bg-pink-600 hover:bg-pink-500 text-white font-black px-8 py-4 rounded-2xl text-base uppercase tracking-widest transition-all hover:scale-105 shadow-[0_10px_40px_rgba(236,72,153,0.4)]">
                            <Plane className="w-5 h-5" />
                            Book Now
                        </Link>
                        <a href="tel:07412671467"
                            className="inline-flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-black px-8 py-4 rounded-2xl text-base uppercase tracking-widest transition-all hover:scale-105 backdrop-blur-md">
                            <Phone className="w-5 h-5 text-pink-400" />
                            07412671467
                        </a>
                    </div>

                </div>

                <div className="w-full max-w-xl lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none" />

                <div className="max-w-3xl lg:col-start-1 lg:row-start-2">

                    {/* Trust stats */}
                    <div className="flex flex-wrap items-center gap-6 pb-10 border-b border-white/10 mb-10">
                        {[
                            { value: "5,000+", label: "Journeys Completed" },
                            { value: "4.9★",   label: "Average Rating" },
                            { value: "< 5min", label: "Avg Response Time" },
                        ].map(({ value, label }) => (
                            <div key={label}>
                                <p className="text-2xl font-black text-white">{value}</p>
                                <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-3">
                        {[
                            { icon: CheckCircle2, text: "DBS Vetted Chauffeurs" },
                            { icon: Shield,       text: "Licensed & Insured" },
                            { icon: Plane,        text: "Flight Monitoring" },
                            { icon: Clock,        text: "60 Min Free Wait" },
                            { icon: Star,         text: "Fixed Transparent Pricing" },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] border border-white/10 rounded-full">
                                <Icon className="w-3.5 h-3.5 text-pink-400" />
                                <span className="text-xs font-bold text-white/80">{text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Resolve MCP / DaVinci workflow line */}
                    <div className="mt-6 flex flex-wrap gap-3">
                        <a href="https://github.com/samuelgursky/davinci-resolve-mcp" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-700/20 to-pink-600/20 border border-pink-500/30 text-[11px] font-black uppercase tracking-wider text-pink-300 hover:text-white hover:border-pink-400 transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                            Resolve MCP — grading live
                        </a>
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-[11px] font-bold uppercase tracking-widest text-white/50">
                            DaVinci Studio · 390 tools · 93.6% live-tested
                        </span>
                    </div>

                </div>
                </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0d0005] to-transparent pointer-events-none z-10" />
        </section>
    );
}
