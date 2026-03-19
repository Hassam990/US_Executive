import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import CardSwap, { Card } from "../components/CardSwap/CardSwap";
import { Shield, Clock, Car, Star } from "lucide-react";

export function Home() {
    return (
        <main className="bg-black">
            <Hero />
            
            {/* Card Swap Section */}
            <section className="relative py-24 overflow-hidden border-t border-white/5 bg-[#0f0005]">
                <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                            Tailored <br />
                            <span className="text-pink-500">Executive</span> Experiences
                        </h2>
                        <p className="text-lg text-white/60 max-w-md leading-relaxed">
                            Discover why we are the preferred choice for business professionals and travelers across the UK. Our service is built on reliability, luxury, and unmatched professionalism.
                        </p>
                        <div className="flex gap-4 pt-4">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 border border-pink-500/20">
                                    <Star className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Premium</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 border border-pink-500/20">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Secure</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative h-[500px] flex items-center justify-center">
                        {/* The CardSwap container needs height and relative pos */}
                        <div className="w-full h-full relative flex items-center justify-center mr-12 mt-12">
                            <CardSwap
                                width={320}
                                height={420}
                                cardDistance={40}
                                verticalDistance={50}
                                delay={4500}
                                pauseOnHover={true}
                                skewAmount={4}
                            >
                                <Card className="p-8 flex flex-col justify-between border-pink-500/30 bg-gradient-to-br from-gray-900 to-black shadow-2xl">
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                                            <Car className="text-white w-7 h-7" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase">Airport Transfers</h3>
                                        <p className="text-white/60 leading-relaxed">
                                            Premium chauffeur service to all major UK airports. Real-time flight tracking and meet-and-greet service included.
                                        </p>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-center text-sm font-bold text-pink-400 uppercase tracking-widest">
                                        <span>Reliable</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                        <span>24/7 Service</span>
                                    </div>
                                </Card>

                                <Card className="p-8 flex flex-col justify-between border-pink-500/30 bg-gradient-to-br from-gray-900 to-black shadow-2xl">
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                                            <Shield className="text-white w-7 h-7" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase">Business Class</h3>
                                        <p className="text-white/60 leading-relaxed">
                                            Seamless corporate travel for the modern executive. Professional drivers and immaculate vehicles for your meetings.
                                        </p>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-center text-sm font-bold text-pink-400 uppercase tracking-widest">
                                        <span>Professional</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                        <span>Confidential</span>
                                    </div>
                                </Card>

                                <Card className="p-8 flex flex-col justify-between border-pink-500/30 bg-gradient-to-br from-gray-900 to-black shadow-2xl">
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                                            <Clock className="text-white w-7 h-7" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase">Event Travel</h3>
                                        <p className="text-white/60 leading-relaxed">
                                            Arrive in unparalleled style for weddings, parties, and special occasions. We handle all logistics while you enjoy the ride.
                                        </p>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-center text-sm font-bold text-pink-400 uppercase tracking-widest">
                                        <span>Luxurious</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                        <span>Memorable</span>
                                    </div>
                                </Card>
                            </CardSwap>
                        </div>
                    </div>
                </div>
            </section>

            <Features />
        </main>
    );
}
