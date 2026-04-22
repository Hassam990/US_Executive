import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { 
    FileText, LogOut, Calendar, 
    User, Info, Clock, Briefcase
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function Dashboard() {
    const [token] = useState<string | null>(localStorage.getItem('adminToken'));
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserDashboard = async () => {
        try {
            const res = await fetch("/api/user/dashboard", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                handleLogout();
            }
        } catch (err) {
            console.error("Dashboard error", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userRole');
        window.location.href = "/login";
    };

    useEffect(() => {
        if (!token) {
            window.location.href = "/login";
            return;
        }
        fetchUserDashboard();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white">
                <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mb-4" />
                <p className="text-pink-500 font-black uppercase tracking-[0.3em] text-sm">Loading Your Bookings...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <header className="h-24 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-black uppercase tracking-tight">My Portal</h1>
                    <div className="h-4 w-px bg-white/10" />
                    <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">User Dashboard</span>
                </div>

                <div className="flex items-center gap-4">
                    <Link to="/apply">
                        <Button variant="ghost" className="rounded-2xl h-12 px-6 border border-white/5 bg-white/5 hover:bg-white/10">
                            <Briefcase className="w-4 h-4 mr-2" />
                            <span className="text-xs font-black uppercase tracking-widest">Driver Application</span>
                        </Button>
                    </Link>
                    <Button onClick={handleLogout} variant="ghost" className="rounded-2xl h-12 px-6 border border-red-500/10 bg-red-500/5 text-red-400 hover:bg-red-500/10">
                        <LogOut className="w-4 h-4 mr-2" />
                        <span className="text-xs font-black uppercase tracking-widest">Logout</span>
                    </Button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-8">
                <div className="mb-12">
                    <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter">Welcome Back</h2>
                    <p className="text-white/40 font-medium">Manage your travel bookings and account status.</p>
                </div>

                <div className="grid gap-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                            <FileText className="text-pink-500" />
                            My Booking History
                        </h3>
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{data?.bookings?.length || 0} Bookings</span>
                    </div>

                    <div className="grid gap-6">
                        {data?.bookings?.map((b: any) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={b.id} 
                                className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 hover:border-pink-500/20 transition-all group"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                                    <div className="flex gap-6">
                                        <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-pink-500/20">
                                            <Calendar className="w-8 h-8 text-pink-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-xl font-black tracking-tight">{b.pickup}</h4>
                                                <div className="w-4 h-px bg-white/20" />
                                                <h4 className="text-xl font-black tracking-tight">{b.dropoff}</h4>
                                            </div>
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                                                {b.date} at {b.time} • {b.vehicle_class}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                            b.status === 'Pending' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                                            b.status === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            'bg-pink-500/10 text-pink-400 border-pink-500/20'
                                        }`}>
                                            {b.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-pink-500/40" />
                                        <div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Booked On</p>
                                            <p className="text-xs font-bold">{new Date(b.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-pink-500/40" />
                                        <div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Passengers</p>
                                            <p className="text-xs font-bold">{b.passengers} PAX</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Info className="w-4 h-4 text-pink-500/40" />
                                        <div>
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Type</p>
                                            <p className="text-xs font-bold">{b.return_date ? 'Return Journey' : 'One-Way'}</p>
                                        </div>
                                    </div>
                                </div>

                                {b.return_date && (
                                    <div className="mt-6 bg-pink-500/5 rounded-2xl p-4 border border-pink-500/10 flex items-center gap-4">
                                        <Info className="w-4 h-4 text-pink-500" />
                                        <p className="text-xs font-bold">
                                            <span className="text-pink-500 uppercase mr-2">Return Scheduled:</span> 
                                            {b.return_date} at {b.return_time}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {(!data?.bookings || data.bookings.length === 0) && (
                            <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-white/5 border-dashed">
                                <FileText className="w-16 h-16 text-white/10 mx-auto mb-4" />
                                <h3 className="text-xl font-black uppercase tracking-tighter opacity-20">No bookings found</h3>
                                <p className="text-white/20 text-sm mt-2">Any bookings you make will appear here.</p>
                                <Link to="/">
                                    <Button className="mt-8 bg-pink-600 hover:bg-pink-500 text-white font-black uppercase tracking-widest rounded-xl px-8 h-12">
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
