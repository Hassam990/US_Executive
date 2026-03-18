import { Smartphone, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent } from "./ui/card";

export function Features() {
    const features = [
        {
            icon: <ShieldCheck className="w-8 h-8 text-pink-400" />,
            title: "Professional Drivers",
            description: "Fully vetted, experienced, and dressed to impress for your executive journey."
        },
        {
            icon: <CarIcon />,
            title: "Executive Vehicles",
            description: "Travel in immaculate comfort with our fleet of premium vehicles."
        },
        {
            icon: <Clock className="w-8 h-8 text-pink-400" />,
            title: "Always On Time",
            description: "Punctuality is our priority. We monitor your flights to ensure we're there when you land."
        },
        {
            icon: <Smartphone className="w-8 h-8 text-pink-400" />,
            title: "24/7 Availability",
            description: "Whether it's an early flight or late arrival, our service is available round the clock."
        }
    ];

    return (
        <section className="py-24 bg-[#0a0005] relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-pink-900/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        The Future of <span className="text-pink-400">Executive Travel</span>
                    </h2>
                    <p className="text-lg text-white/60">
                        Avoid last-minute stress and travel in comfort with our professional private hire service. Whether you're heading to the airport, a business meeting, or a special event.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, i) => (
                        <Card key={i} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors duration-300">
                            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-pink-500/10 rounded-2xl">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                                <p className="text-white/60">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* CTA Banner */}
                <div className="mt-24 rounded-3xl bg-gradient-to-r from-[#2a0514] to-pink-900 border border-pink-500/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                    <div className="max-w-xl">
                        <h3 className="text-3xl font-bold text-white mb-4">Your Ride, Right in Your Pocket</h3>
                        <p className="text-pink-100/80 text-lg">
                            With US Executive Travels, your private hire taxi is always just a message away. We make every journey smooth and comfortable.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button className="px-8 py-4 bg-white text-pink-900 rounded-xl font-bold hover:bg-pink-100 transition-colors shadow-lg">
                            Book Now
                        </button>
                        <button className="px-8 py-4 bg-pink-500/20 border border-pink-500/50 text-white rounded-xl font-bold hover:bg-pink-500/30 transition-colors">
                            Visit Our Website
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function CarIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
        </svg>
    );
}
