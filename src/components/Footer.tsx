import { Mail, Phone, Globe, Instagram, Facebook } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
    return (
        <footer className="bg-black pt-20 pb-10 border-t border-white/5 relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-pink-900/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <Link to="/">
                                <img src="/logo.png" alt="US Executive Travel" className="h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                            </Link>
                        </div>
                        <p className="text-white/60 max-w-sm mb-6 leading-relaxed">
                            Experience the pinnacle of private hire travel. Reliable airport transfers, business travel, and city rides crafted for perfection.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80 hover:bg-pink-500 hover:text-white transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80 hover:bg-pink-500 hover:text-white transition-all">
                                <Facebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Quick Links</h4>
                        <ul className="space-y-4">
                            <li><Link to="/" className="text-white/60 hover:text-pink-400 transition-colors">Book a Ride</Link></li>
                            <li><Link to="/contact" className="text-white/60 hover:text-pink-400 transition-colors">Apply as Driver</Link></li>
                            <li><Link to="/fleet" className="text-white/60 hover:text-pink-400 transition-colors">Our Fleet</Link></li>
                            <li><Link to="/services" className="text-white/60 hover:text-pink-400 transition-colors">Airport Transfers</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Contact Us</h4>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-white/60">
                                <Mail className="w-5 h-5 text-pink-500" />
                                <span>hello@us-executivetravel.com</span>
                            </li>
                            <li className="flex items-center gap-3 text-white/60">
                                <Phone className="w-5 h-5 text-pink-500" />
                                <span>07412671467</span>
                            </li>
                            <li className="flex items-center gap-3 text-white/60">
                                <Globe className="w-5 h-5 text-pink-500" />
                                <span>www.us-executivetravel.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-white/40 text-sm">
                    <p>© {new Date().getFullYear()} US Executive Travel. All rights reserved.</p>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
