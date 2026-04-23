import { motion } from "framer-motion";
import { Plane, Home, ArrowRightLeft, CheckCircle2 } from "lucide-react";

export function AirportTransfers() {
    return (
        <section className="py-24 bg-[#0a0005] relative overflow-hidden border-t border-white/5">
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
                        Airport Specialists
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                        Reliable <span className="text-pink-500">Airport Transfers</span>
                    </h2>
                    <p className="text-xl text-white/50 font-light">
                        Start your journey the right way with our premium private hire airport transfer service. 
                        We provide comfortable and reliable transfers to and from all major airports.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <motion.div 
                        whileHover={{ y: -10 }}
                        className="p-8 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-pink-500/30 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                                <Home className="w-8 h-8" />
                            </div>
                            <ArrowRightLeft className="text-white/20 w-8 h-8 group-hover:text-pink-500/50 transition-colors" />
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white">
                                <Plane className="w-8 h-8" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Door to Airport</h3>
                        <p className="text-white/60 mb-6 text-lg leading-relaxed">
                            Perfect for both business and leisure travellers. We pick you up from your doorstep and ensure you reach the terminal with plenty of time to spare.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-white/80 font-medium">
                                <CheckCircle2 className="w-5 h-5 text-pink-500" />
                                Luggage Assistance
                            </li>
                            <li className="flex items-center gap-2 text-white/80 font-medium">
                                <CheckCircle2 className="w-5 h-5 text-pink-500" />
                                Flight Monitoring
                            </li>
                        </ul>
                    </motion.div>

                    <motion.div 
                        whileHover={{ y: -10 }}
                        className="p-8 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-pink-500/30 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white">
                                <Plane className="w-8 h-8" />
                            </div>
                            <ArrowRightLeft className="text-white/20 w-8 h-8 group-hover:text-pink-500/50 transition-colors" />
                            <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                                <Home className="w-8 h-8" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Airport to Door</h3>
                        <p className="text-white/60 mb-6 text-lg leading-relaxed">
                            Book your airport transfer today and avoid the stress of queues and unreliable transport. Your driver will be waiting in the arrivals hall.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-white/80 font-medium">
                                <CheckCircle2 className="w-5 h-5 text-pink-500" />
                                Meet & Greet Service
                            </li>
                            <li className="flex items-center gap-2 text-white/80 font-medium">
                                <CheckCircle2 className="w-5 h-5 text-pink-500" />
                                60 Mins Free Waiting Time
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
