import { motion } from "framer-motion";
import { ShieldCheck, Crosshair, Navigation } from "lucide-react";

export function SafetyBanner() {
    return (
        <section className="py-24 bg-black relative overflow-hidden">
            {/* Background Car Track Graphic */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[400px] opacity-[0.03] pointer-events-none">
                <div className="w-full h-full border-y-[60px] border-dashed border-white flex items-center justify-center rotate-[-5deg] scale-150" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="relative order-2 lg:order-1">
                        <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/10 bg-gradient-to-br from-[#1a000a] to-[#2a0514] p-12">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                            
                            <div className="relative h-full w-full flex flex-col items-center justify-center gap-8">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute w-full h-full border border-pink-500/20 rounded-full border-dashed"
                                />
                                
                                <div className="w-32 h-32 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/30 relative">
                                    <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-[20px] animate-pulse" />
                                    <Crosshair className="w-16 h-16 text-pink-500 relative z-10" />
                                </div>
                                
                                <div className="text-center space-y-2 relative z-10">
                                    <p className="text-pink-400 font-black uppercase tracking-widest text-sm">GPS Tracking Live</p>
                                    <p className="text-4xl font-black text-white">Always On Track</p>
                                </div>

                                <div className="flex gap-4 relative z-10">
                                    {[1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                                            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/50"
                                        >
                                            Satellite {i} Active
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8 order-1 lg:order-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-[0.2em]">
                            Safety First
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
                            Always Safe. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600">Always Secure.</span>
                        </h2>
                        <p className="text-xl text-white/60 leading-relaxed font-light">
                            With US Executive Travels, every ride is handled with care, precision, and professionalism. 
                            We use advanced tracking technology and strictly vetted drivers to ensure you reach your destination safely and comfortably.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-8 pt-4">
                            <div className="space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-pink-500">
                                    <ShieldCheck className="w-7 h-7" />
                                </div>
                                <h4 className="text-lg font-bold text-white">Fully Vetted</h4>
                                <p className="text-sm text-white/40">DBS checked and professionally trained drivers.</p>
                            </div>
                            <div className="space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-pink-500">
                                    <Navigation className="w-7 h-7" />
                                </div>
                                <h4 className="text-lg font-bold text-white">Real-Time Trace</h4>
                                <p className="text-sm text-white/40">Share your ride status with family and colleagues.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
