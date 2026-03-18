import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export function Header() {
    return (
        <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 transition-all duration-300">
            <div className="relative overflow-hidden bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full px-6 lg:px-8 py-3 flex items-center justify-between shadow-[0_8px_32px_0_rgba(236,72,153,0.2)]">
                {/* Radial Glow Effect */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-500/15 via-transparent to-transparent opacity-70 pointer-events-none" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-2">
                    <Link to="/">
                        <img src="/logo.png" alt="US Executive Travel" className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="relative z-10 hidden md:flex items-center gap-8 text-sm font-bold text-white/70 uppercase tracking-widest">
                    <Link to="/services" className="hover:text-pink-300 transition-colors">Services</Link>
                    <Link to="/fleet" className="hover:text-pink-300 transition-colors">Our Fleet</Link>
                    <Link to="/contact" className="hover:text-pink-300 transition-colors">Contact</Link>
                </nav>

                {/* CTA Buttons */}
                <div className="relative z-10 flex items-center gap-4">
                    <Button variant="ghost" className="text-white hover:text-pink-200 hover:bg-white/5 hidden lg:inline-flex font-semibold">
                        Driver Portal
                    </Button>
                    <Link to="/">
                        <Button className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white border-0 shadow-lg shadow-pink-500/20 rounded-full px-6 py-5 md:px-8 font-extrabold uppercase tracking-wide">
                            Book Now
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
