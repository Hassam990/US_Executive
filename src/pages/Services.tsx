import { Plane, Ship, Train, Briefcase, MapPin, Camera, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";

export function Services() {
    const services = [
        {
            title: "Airport Transfers",
            icon: Plane,
            desc: "Punctual and stress-free transport to and from all major airports. Flight tracking included to accommodate early arrivals or delays."
        },
        {
            title: "Cruise Port Transfers",
            icon: Ship,
            desc: "Start your vacation the moment you leave your door. Seamless travel to Southampton, Dover, and other major UK cruise terminals."
        },
        {
            title: "Station Transport",
            icon: Train,
            desc: "Effortless connections to major rail networks. We get you to your platform exactly when you need to be there."
        },
        {
            title: "Corporate Account",
            icon: Briefcase,
            desc: "Premium transportation for executives and clients. Reliable, discreet, and always professional with flexible invoicing options."
        },
        {
            title: "Point-to-Point",
            icon: MapPin,
            desc: "Whether it's a business meeting across town or a dinner date in the city, enjoy the journey in unparalleled comfort."
        },
        {
            title: "Sightseeing Tours",
            icon: Camera,
            desc: "Discover beautiful landmarks at your own pace. Our knowledgeable chauffeurs will guide you through iconic routes in luxury."
        }
    ];

    return (
        <main className="min-h-screen bg-[#160008] pt-32 pb-24">
            {/* Background */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
                        World-Class <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-pink-500">Services</span>
                    </h1>
                    <p className="text-xl text-white/70 font-light leading-relaxed">
                        We don't just provide rides; we deliver exceptional travel experiences. Explore our diverse range of transportation solutions tailored to your exacting standards.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, idx) => (
                        <Card key={idx} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm group overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-pink-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                            <CardContent className="p-8">
                                <service.icon className="w-12 h-12 text-pink-400 mb-6 group-hover:scale-110 transition-transform duration-500" />
                                <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
                                <p className="text-white/60 leading-relaxed mb-6">
                                    {service.desc}
                                </p>
                                <ul className="space-y-2 mb-8">
                                    <li className="flex items-center gap-2 text-sm text-white/50"><CheckCircle2 className="w-4 h-4 text-pink-500" /> Professional Chauffeur</li>
                                    <li className="flex items-center gap-2 text-sm text-white/50"><CheckCircle2 className="w-4 h-4 text-pink-500" /> Complimentary Water & Wi-Fi</li>
                                </ul>
                                <Link to="/" className="inline-flex items-center text-pink-400 hover:text-pink-300 font-semibold transition-colors">
                                    Book Now <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    );
}
