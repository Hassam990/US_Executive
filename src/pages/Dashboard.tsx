// @ts-nocheck
import { useState, useEffect } from "react";
import { useUser, useAuth, UserButton } from "@clerk/react";
import { Button } from "../components/ui/button";
import {
    FileText, Calendar,
    User, Info, Clock, Briefcase,
    RotateCcw, MessageSquare, Car, ExternalLink, ShieldCheck, MapPin
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { dark } from "@clerk/themes";

export function Dashboard() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const userEmail = user?.primaryEmailAddress?.emailAddress || "";

    const fetchUserDashboard = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        try {
            const token = await getToken();
            const headers: Record<string, string> = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;
            if (userEmail) headers["x-user-email"] = userEmail;

            const url = userEmail
                ? `/api/user/dashboard?email=${encodeURIComponent(userEmail)}`
                : "/api/user/dashboard";

            const res = await fetch(url, { headers });
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (err) {
            console.error("Dashboard error", err);
        } finally {
            setLoading(false);
            if (isManualRefresh) setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) { navigate("/login"); return; }
        fetchUserDashboard();
    }, [isLoaded, isSignedIn, userEmail]);

    if (!isLoaded || loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white">
                <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mb-4" />
                <p className="text-pink-500 font-black uppercase tracking-[0.3em] text-sm">Loading Your Portal...</p>
            </div>
        );
    }

    const bookingsList = data?.bookings || [];

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <header className="h-24 border-b border-white/5 flex items-center justify-between px-6 sm:px-8 bg-black/40 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white hover:text-pink-400 transition-colors">
                        US Executive
                    </Link>
                    <div className="h-4 w-px bg-white/10 hidden sm:block" />
                    <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest hidden sm:inline-block">
                        Passenger Portal
                    </span>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    <Link to="/book">
                        <Button className="rounded-xl h-11 px-4 sm:px-6 bg-pink-600 hover:bg-pink-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(236,72,153,0.3)]">
                            <Car className="w-4 h-4 mr-1.5" />
                            Book Ride
                        </Button>
                    </Link>
                    <Link to="/apply" className="hidden md:inline-flex">
                        <Button variant="ghost" className="rounded-xl h-11 px-4 border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest">
                            <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                            Driver
                        </Button>
                    </Link>
                    {/* Clerk UserButton */}
                    <UserButton
                        appearance={{
                            baseTheme: dark,
                            variables: { colorPrimary: '#ec4899' },
                            elements: {
                                userButtonAvatarBox: 'w-10 h-10 ring-2 ring-pink-500/40 hover:ring-pink-500 transition-all',
                            },
                        }}
                        afterSignOutUrl="/login"
                    />
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 sm:p-10">
                {/* Hero section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black uppercase tracking-widest mb-3">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified Executive Account
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
                            Welcome Back{user?.firstName ? `, ${user.firstName}` : ''}
                        </h2>
                        <p className="text-white/50 text-sm mt-1 font-medium">
                            Logged in as <span className="text-white font-bold">{userEmail}</span> • Live journey tracking and booking history
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => fetchUserDashboard(true)}
                            disabled={refreshing}
                            className="rounded-xl h-11 px-4 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2"
                        >
                            <RotateCcw className={`w-3.5 h-3.5 text-pink-400 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh Status'}
                        </Button>
                    </div>
                </div>

                {/* Booking List */}
                <div className="grid gap-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg sm:text-xl font-black uppercase tracking-widest flex items-center gap-3 text-white">
                            <FileText className="text-pink-500 w-5 h-5" />
                            My Travel Bookings
                        </h3>
                        <span className="text-xs font-black px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/50 uppercase tracking-widest">
                            {bookingsList.length} Total {bookingsList.length === 1 ? 'Booking' : 'Bookings'}
                        </span>
                    </div>

                    <div className="grid gap-6">
                        {bookingsList.map((b: Record<string, unknown>) => {
                            const isPending = b.status === 'Pending';
                            const isConfirmed = b.status === 'Confirmed';
                            const isCompleted = b.status === 'Completed';

                            const statusColor = isPending
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : isConfirmed
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 ring-1 ring-emerald-500/20'
                                : isCompleted
                                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                : 'bg-pink-500/10 text-pink-300 border-pink-500/30';

                            const statusLabel = isPending
                                ? 'Pending Confirmation'
                                : isConfirmed
                                ? 'Chauffeur Confirmed'
                                : isCompleted
                                ? 'Journey Completed'
                                : b.status;

                            const whatsappMessage = encodeURIComponent(
                                `Hello US Executive Travel, I would like a live status update on my booking #USE-${b.id}.\nRoute: ${b.pickup} -> ${b.dropoff}\nDate: ${b.date} at ${b.time}`
                            );

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={b.id}
                                    className="bg-[#0f0006] border border-white/10 rounded-[2rem] p-6 sm:p-8 hover:border-pink-500/40 transition-all shadow-[0_10px_40px_rgba(0,0,0,0.6)] relative overflow-hidden"
                                >
                                    {/* Top status bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black uppercase tracking-wider text-pink-400 bg-pink-500/10 px-3 py-1 rounded-lg border border-pink-500/20">
                                                Ref: #USE-{b.id}
                                            </span>
                                            <span className="text-[11px] text-white/40 font-bold uppercase tracking-widest hidden sm:inline-block">
                                                Booked {new Date(b.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className={`px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border flex items-center gap-2 ${statusColor}`}>
                                                <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-amber-400 animate-pulse' : isConfirmed ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
                                                {statusLabel}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Route & Details */}
                                    <div className="grid md:grid-cols-2 gap-6 items-start">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                                    <MapPin className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Pick-Up Location</p>
                                                    <p className="text-base font-bold text-white leading-snug">{b.pickup}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                                    <MapPin className="w-4 h-4 text-pink-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Drop-Off Destination</p>
                                                    <p className="text-base font-bold text-white leading-snug">{b.dropoff}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Specs */}
                                        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-0.5">Date & Time</span>
                                                <p className="font-bold text-white flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-pink-400" />
                                                    {b.date} • {b.time}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-0.5">Class / Fleet</span>
                                                <p className="font-bold text-white flex items-center gap-1.5">
                                                    <Car className="w-3.5 h-3.5 text-pink-400" />
                                                    {b.vehicle_class || 'Executive'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-0.5">Passengers</span>
                                                <p className="font-bold text-white flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-pink-400" />
                                                    {b.passengers || '1'} PAX
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-0.5">Trip Type</span>
                                                <p className="font-bold text-white">
                                                    {b.return_date ? 'Return Journey' : 'One-Way'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {b.return_date && (
                                        <div className="mt-4 bg-pink-500/5 rounded-xl p-3.5 border border-pink-500/15 flex items-center gap-3">
                                            <Info className="w-4 h-4 text-pink-400 shrink-0" />
                                            <p className="text-xs font-bold text-white/90">
                                                <span className="text-pink-400 uppercase tracking-wider mr-2 font-black">Return Scheduled:</span>
                                                {b.return_date} at {b.return_time}
                                            </p>
                                        </div>
                                    )}

                                    {/* Footer Action buttons */}
                                    <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-xs text-white/50">
                                            <span>Passenger: <strong className="text-white">{b.name}</strong></span>
                                            <span>•</span>
                                            <span>Phone: <strong className="text-white">{b.phone}</strong></span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <a
                                                href={`https://wa.me/447412671467?text=${whatsappMessage}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                                                Live WhatsApp Track
                                            </a>
                                            <a
                                                href="tel:07412671467"
                                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold transition-all"
                                            >
                                                Dispatch Call
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {bookingsList.length === 0 && (
                            <div className="text-center py-20 px-6 bg-[#0f0006] rounded-[2.5rem] border border-white/10 border-dashed">
                                <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto mb-4">
                                    <Car className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight text-white">No Active Bookings Found</h3>
                                <p className="text-white/40 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                                    You don't have any journeys booked under <strong className="text-white">{userEmail}</strong> yet. Book your first ride and track its progress in real-time here.
                                </p>
                                <Link to="/book">
                                    <Button className="mt-8 bg-pink-600 hover:bg-pink-500 text-white font-black uppercase tracking-widest rounded-xl px-8 h-12 shadow-[0_4px_25px_rgba(236,72,153,0.4)]">
                                        Book Your First Trip
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
