import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { ServiceAreas } from "../components/ServiceAreas";
import { AirportTransfers } from "../components/AirportTransfers";
import { SafetyBanner } from "../components/SafetyBanner";
import CardSwap, { Card } from "../components/CardSwap/CardSwap";
import { Shield, Clock, Car, Star, Crown, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export function Home() {
    return (
        <main className="bg-black">
            <Hero />
            
            {/* Card Swap Section */}
            <motion.section 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative py-32 overflow-hidden border-t border-white/5 bg-[#0f0005]"
            >
                {/* Decorative background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-pink-900/10 blur-[150px] rounded-full pointer-events-none" />

                <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-[0.2em]">
                            Our Philosophy
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                            Tailored <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600">Executive</span> <br />
                            Experiences
                        </h2>
                        <p className="text-xl text-white/50 max-w-md leading-relaxed font-light">
                            Discover why we are the preferred choice for business professionals and travelers across the UK. Our service is built on reliability, luxury, and unmatched professionalism.
                        </p>
                        <div className="flex gap-8 pt-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-pink-500 border border-white/10 backdrop-blur-sm">
                                    <Star className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">Premium</p>
                                    <p className="text-white/40 text-sm">Finest Fleet</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-pink-500 border border-white/10 backdrop-blur-sm">
                                    <Shield className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">Secure</p>
                                    <p className="text-white/40 text-sm">Fully Vetted</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative h-[600px] flex items-center justify-center">
                        <div className="w-full h-full relative flex items-center justify-center">
                            <CardSwap
                                width={340}
                                height={440}
                                cardDistance={50}
                                verticalDistance={40}
                                skewAmount={4}
                            >
                                <Card className="p-10 flex flex-col justify-between border-white/10 shadow-2xl overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-3xl group-hover:bg-pink-500/10 transition-colors" />
                                    <div className="space-y-6 relative z-10">
                                        <div className="w-14 h-14 bg-pink-600 rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(219,39,119,0.4)]">
                                            <Car className="text-white w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Airport Transfers</h3>
                                            <p className="text-white/60 text-lg leading-relaxed">
                                                Premium chauffeur service to all major UK airports. Real-time flight tracking and meet-and-greet service.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-white/10 flex justify-between items-center text-xs font-bold text-pink-400 uppercase tracking-[0.2em] relative z-10">
                                        <span>RELIABLE</span>
                                        <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,1)]" />
                                        <span>24/7 AVAILABILITY</span>
                                    </div>
                                </Card>

                                <Card className="p-10 flex flex-col justify-between border-white/10 shadow-2xl overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-3xl group-hover:bg-pink-500/10 transition-colors" />
                                    <div className="space-y-6 relative z-10">
                                        <div className="w-14 h-14 bg-pink-600 rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(219,39,119,0.4)]">
                                            <Shield className="text-white w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Business Class</h3>
                                            <p className="text-white/60 text-lg leading-relaxed">
                                                Seamless corporate travel for the modern executive. Professional drivers and immaculate vehicles.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-white/10 flex justify-between items-center text-xs font-bold text-pink-400 uppercase tracking-[0.2em] relative z-10">
                                        <span>PROFESSIONAL</span>
                                        <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,1)]" />
                                        <span>CONFIDENTIAL</span>
                                    </div>
                                </Card>

                                <Card className="p-10 flex flex-col justify-between border-white/10 shadow-2xl overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-3xl group-hover:bg-pink-500/10 transition-colors" />
                                    <div className="space-y-6 relative z-10">
                                        <div className="w-14 h-14 bg-pink-600 rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(219,39,119,0.4)]">
                                            <Clock className="text-white w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Event Travel</h3>
                                            <p className="text-white/60 text-lg leading-relaxed">
                                                Arrive in style for weddings and special occasions. We handle all logistics while you enjoy the ride.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-white/10 flex justify-between items-center text-xs font-bold text-pink-400 uppercase tracking-[0.2em] relative z-10">
                                        <span>LUXURIOUS</span>
                                        <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,1)]" />
                                        <span>MEMORABLE</span>
                                    </div>
                                </Card>
                            </CardSwap>
                        </div>
                    </div>
                </div>
            </motion.section>

            <AirportTransfers />

            {/* Premium Experience Section (Inspired by Image 3) */}
            <section className="py-24 bg-black relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
                                Your Ride, <br />
                                <span className="text-pink-500">Served to Perfection</span>
                            </h2>
                            <p className="text-xl text-white/60 leading-relaxed font-light">
                                At US Executive Travels, we don't just offer rides—we deliver a complete travel experience. 
                                From pickup to drop-off, every journey is handled with care, comfort, and professionalism.
                            </p>
                            <ul className="space-y-4">
                                {["Executive Vehicles", "Professional Drivers", "Always On Time", "24/7 Availability"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/80">
                                        <CheckCircle className="text-pink-500 w-6 h-6" />
                                        <span className="text-lg font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-pink-500/10 to-transparent flex items-center justify-center group"
                        >
                            <div className="absolute inset-0 bg-pink-600/5 blur-3xl group-hover:bg-pink-600/10 transition-all duration-700" />
                            <Crown className="w-32 h-32 text-pink-500/40 group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-[2px]">
                                <p className="text-white text-2xl font-black uppercase tracking-widest mb-2">Premium Travel</p>
                                <p className="text-pink-400 font-bold">Served Right</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <SafetyBanner />
            <ServiceAreas />
            <Features />
        </main>
    );
}
