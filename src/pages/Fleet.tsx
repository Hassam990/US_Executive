import { Users, Briefcase as Luggage, Check, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";

export function Fleet() {
    const fleet = [
        {
            class: "Business Class",
            models: "Mercedes E-Class, BMW 5 Series, Audi A6",
            desc: "The gold standard for executive travel. Perfect for airport transfers, corporate roadshows, and comfortable long-distance journeys.",
            pax: 3,
            bags: 2,
            features: ["Leather Interior", "Climate Control", "Privacy Glass", "Free Wi-Fi"]
        },
        {
            class: "First Class",
            models: "Mercedes S-Class, BMW 7 Series, Audi A8",
            desc: "Uncompromising luxury and state-of-the-art technology. For when making an entrance and ultimate relaxation are paramount.",
            pax: 3,
            bags: 2,
            features: ["Extra Legroom", "Massage Seats", "Panoramic Roof", "Premium Audio"]
        },
        {
            class: "Executive Van (MPV)",
            models: "Mercedes V-Class",
            desc: "Spacious elegance for group travel. Ideal for family airport returns, financial roadshows, or events with extensive luggage.",
            pax: 7,
            bags: 7,
            features: ["Conference Seating", "Ample Luggage Space", "Sliding Doors", "USB Charging"]
        }
    ];

    return (
        <main className="min-h-screen bg-[#160008] pt-32 pb-24 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-[20%] left-[-10%] w-[800px] h-[800px] bg-pink-900/20 rounded-full blur-[150px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
                        <Shield className="w-4 h-4 text-pink-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-pink-200">Meticulously Maintained</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
                        Our Prestigious <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-pink-500">Fleet</span>
                    </h1>
                    <p className="text-xl text-white/70 font-light leading-relaxed">
                        Step into a sanctuary of peace. Every vehicle in our fleet represents the pinnacle of modern automotive engineering, ensuring your ride is impeccably smooth.
                    </p>
                </div>

                <div className="space-y-12 max-w-5xl mx-auto">
                    {fleet.map((vehicle, idx) => (
                        <Card key={idx} className="bg-white/5 border-white/10 overflow-hidden backdrop-blur-md hover:border-pink-500/30 transition-colors">
                            <div className="grid md:grid-cols-5 flex-col md:flex-row">
                                {/* Visual Placeholder (since exact images aren't provided) */}
                                <div className="md:col-span-2 relative min-h-[250px] bg-gradient-to-br from-black to-pink-950 flex items-center justify-center border-r border-white/5 p-8">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
                                    <div className="text-center relative z-10">
                                        <h4 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/30 drop-shadow-2xl">
                                            {vehicle.class}
                                        </h4>
                                        <div className="mt-4 inline-block px-4 py-1 rounded-full bg-black/50 border border-white/10 text-xs text-white/70">
                                            {vehicle.models}
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="p-8 md:col-span-3 flex flex-col justify-center">
                                    <div className="flex flex-wrap items-center gap-6 mb-6">
                                        <div className="flex items-center gap-2 text-white/80">
                                            <Users className="w-5 h-5 text-pink-400" />
                                            <span className="font-semibold">{vehicle.pax} Passengers</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/80">
                                            <Luggage className="w-5 h-5 text-pink-400" />
                                            <span className="font-semibold">{vehicle.bags} Luggage</span>
                                        </div>
                                    </div>

                                    <p className="text-white/60 leading-relaxed mb-8">
                                        {vehicle.desc}
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 mb-8">
                                        {vehicle.features.map((feature, fIdx) => (
                                            <div key={fIdx} className="flex items-center gap-2 text-sm text-white/70">
                                                <Check className="w-4 h-4 text-pink-500 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-auto">
                                        <Link to="/" className="inline-block px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all">
                                            Request this Class
                                        </Link>
                                    </div>
                                </CardContent>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    );
}
