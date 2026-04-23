import { BookingWidget } from "./BookingWidget";
import { CheckCircle2, Phone } from "lucide-react";

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden bg-gradient-to-br from-[#160008] via-[#2a0514] to-black">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 z-0" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-900/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 z-0" />

            <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-12 gap-12 items-center">

                {/* Text Content */}
                <div className="lg:col-span-7 space-y-8 pt-8 md:pt-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-lg">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm font-bold uppercase tracking-wider text-white">24/7 Dispatch Operating Now</span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-extrabold text-white tracking-tighter leading-[0.95] uppercase">
                        Travel in <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600">
                            Style,
                        </span> <br />
                        Day or Night
                    </h1>

                    <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-light max-w-2xl">
                        Step into a premium private hire experience designed for comfort, class, and reliability. 
                        Professional chauffeurs at your service 24/7.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 pt-4">
                        <a href="tel:07412671467" className="inline-flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-black px-8 py-4 rounded-xl text-lg transition-transform hover:scale-105 shadow-xl">
                            <Phone className="w-6 h-6 text-pink-500" />
                            07412671467
                        </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-pink-500" />
                            <span className="text-lg font-medium text-white/90">Executive Vehicles</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-pink-500" />
                            <span className="text-lg font-medium text-white/90">Professional Drivers</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-pink-500" />
                            <span className="text-lg font-medium text-white/90">Always On Time</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-pink-500" />
                            <span className="text-lg font-medium text-white/90">24/7 Availability</span>
                        </div>
                    </div>
                </div>

                {/* Booking Form Widget */}
                <div className="lg:col-span-5 w-full relative z-20 xl:translate-x-4">
                    <BookingWidget />
                </div>
            </div>
        </section>
    );
}
