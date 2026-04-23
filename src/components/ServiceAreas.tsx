import { motion } from "framer-motion";
import { MapPin, Navigation2, Globe } from "lucide-react";

const areas = [
    "Reigate", "Redhill", "Banstead", "Horley", 
    "Merstham", "Tadworth", "Salfords", "Surrey Areas"
];

export function ServiceAreas() {
    return (
        <section className="py-32 bg-black relative overflow-hidden">
            {/* Background Map Graphic (SVG) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 100 L700 100 L700 700 L100 700 Z" fill="none" stroke="white" strokeWidth="1" />
                    <circle cx="400" cy="400" r="300" fill="none" stroke="white" strokeWidth="0.5" />
                    <path d="M400 100 L400 700 M100 400 L700 400" stroke="white" strokeWidth="0.5" />
                </svg>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-[0.2em]">
                                Our Coverage
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
                                Wherever You Are, <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600">We've Got You Covered</span>
                            </h2>
                            <p className="text-xl text-white/50 max-w-lg font-light leading-relaxed">
                                We provide reliable private hire taxi services across Surrey and all major UK airports. Connected to every destination that matters.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {areas.map((area, idx) => (
                                <motion.div 
                                    key={area}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-pink-500/30 hover:bg-white/10 transition-all group cursor-default"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <span className="text-lg font-bold text-white/80 group-hover:text-white transition-colors">{area}</span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-6 pt-6">
                            <div className="flex items-center gap-2 text-pink-400 font-bold uppercase tracking-widest text-xs">
                                <Navigation2 className="w-4 h-4" />
                                Airport Transfers Available
                            </div>
                            <div className="flex items-center gap-2 text-pink-400 font-bold uppercase tracking-widest text-xs">
                                <Globe className="w-4 h-4" />
                                24/7 Availability
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        {/* Interactive Map Illustration */}
                        <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                            
                            <div className="relative h-full w-full flex items-center justify-center">
                                {/* Pulse Effect */}
                                <div className="absolute w-64 h-64 bg-pink-500/20 rounded-full blur-[80px] animate-pulse" />
                                
                                {/* Map Icon/Graphic */}
                                <div className="relative z-10 w-full h-full flex items-center justify-center">
                                    <div className="grid grid-cols-3 gap-8">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ 
                                                    y: [0, -10, 0],
                                                    opacity: [0.3, 1, 0.3]
                                                }}
                                                transition={{ 
                                                    duration: 3, 
                                                    repeat: Infinity, 
                                                    delay: i * 0.4 
                                                }}
                                                className={`w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.8)] ${i === 5 ? 'scale-150' : ''}`}
                                            />
                                        ))}
                                    </div>
                                    
                                    {/* Connection Lines (SVG) */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                                        <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="white" strokeWidth="1" strokeDasharray="5,5" />
                                        <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="white" strokeWidth="1" strokeDasharray="5,5" />
                                        <line x1="50%" y1="50%" x2="30%" y2="70%" stroke="white" strokeWidth="1" strokeDasharray="5,5" />
                                        <line x1="50%" y1="50%" x2="70%" y2="80%" stroke="white" strokeWidth="1" strokeDasharray="5,5" />
                                    </svg>
                                </div>
                            </div>

                            {/* Floating Stats */}
                            <motion.div 
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute top-12 right-12 p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-2xl"
                            >
                                <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1">Response Time</p>
                                <p className="text-2xl font-black text-white">Under 15m</p>
                            </motion.div>

                            <motion.div 
                                animate={{ y: [0, 5, 0] }}
                                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                                className="absolute bottom-12 left-12 p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-2xl"
                            >
                                <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1">Drivers Online</p>
                                <p className="text-2xl font-black text-white">24/7 Live</p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
