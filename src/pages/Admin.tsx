import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Lock, Eye, Users, FileText, Clock } from "lucide-react";

export function Admin() {
    const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [status, setStatus] = useState<"idle" | "loading">("idle");

    // Dashboard Data
    const [data, setData] = useState<any>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        try {
            const res = await fetch("http://localhost:5000/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                setToken(result.token);
                localStorage.setItem('adminToken', result.token);
                setError("");
            } else {
                setError(result.message || "Invalid Password");
            }
        } catch (err) {
            setError("Server connection failed.");
        } finally {
            setStatus("idle");
        }
    };

    const fetchDashboard = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/admin/dashboard", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                // Token invalid
                setToken(null);
                localStorage.removeItem('adminToken');
            }
        } catch (err) {
            console.error("Dashboard error", err);
        }
    };

    useEffect(() => {
        if (token) fetchDashboard();
    }, [token]);

    const markCompleted = async (id: number) => {
        try {
            await fetch(`http://localhost:5000/api/admin/bookings/${id}/complete`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchDashboard(); // Refresh
        } catch (err) {
            console.error(err);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-[#160008] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-900/20 via-black to-black opacity-80" />
                <div className="w-full max-w-md bg-black/50 backdrop-blur-2xl border border-pink-500/20 rounded-3xl p-8 relative z-10 shadow-[0_0_50px_rgba(236,72,153,0.1)]">
                    <div className="flex flex-col items-center justify-center mb-8">
                        <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mb-4 border border-pink-500/30">
                            <Lock className="w-8 h-8 text-pink-500" />
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-wider">Admin Portal</h1>
                        <p className="text-white/50 text-sm mt-2">Secure access restricted to authorized personnel.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Enter Master Password..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-white/5 border-pink-500/30 text-white h-14 pl-6 rounded-xl focus-visible:ring-pink-500 font-mono tracking-widest text-lg"
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}

                        <Button disabled={status === "loading"} type="submit" className="w-full h-14 bg-gradient-to-r from-pink-600 to-pink-500 hover:to-pink-400 text-white font-black text-lg uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform">
                            {status === "loading" ? "Authenticating..." : "Access Dashboard"}
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    if (!data) {
        return <div className="min-h-screen flex items-center justify-center bg-[#160008] text-pink-400 font-bold animate-pulse">Loading Analytics Data...</div>;
    }

    return (
        <div className="min-h-screen bg-[#0f0005]">
            <header className="bg-black/80 backdrop-blur-md border-b border-white/10 p-6 sticky top-0 z-50">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/us_executive_logo.png" alt="Logo" className="h-12 opacity-80 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                        <h2 className="text-xl font-bold text-white tracking-widest uppercase">Admin Dashboard</h2>
                    </div>
                    <Button variant="ghost" className="text-pink-400" onClick={() => { setToken(null); localStorage.removeItem('adminToken'); }}>
                        Logout Security Session
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12">
                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-gradient-to-br from-pink-900/40 to-black border border-pink-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <Users className="w-12 h-12 text-pink-500/20 absolute right-4 top-4" />
                        <p className="text-sm text-pink-200/60 font-bold uppercase tracking-widest">Total Unique Views</p>
                        <h3 className="text-4xl font-black text-white mt-2">{data.stats.page_views}</h3>
                        <p className="text-green-400 text-xs mt-2 font-bold">+ Live Active Traffic</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-900/40 to-black border border-pink-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <Eye className="w-12 h-12 text-pink-500/20 absolute right-4 top-4" />
                        <p className="text-sm text-pink-200/60 font-bold uppercase tracking-widest">Active Sessions</p>
                        <h3 className="text-4xl font-black text-white mt-2">{data.stats.active_sessions}</h3>
                        <p className="text-pink-400/50 text-xs mt-2 font-bold">Currently Browsing Portal</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-900/40 to-black border border-pink-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <FileText className="w-12 h-12 text-pink-500/20 absolute right-4 top-4" />
                        <p className="text-sm text-pink-200/60 font-bold uppercase tracking-widest">Total Bookings</p>
                        <h3 className="text-4xl font-black text-white mt-2">{data.stats.total_bookings}</h3>
                        <p className="text-green-400 text-xs mt-2 font-bold">In Local Database</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-900/40 to-black border border-red-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <Clock className="w-12 h-12 text-red-500/20 absolute right-4 top-4" />
                        <p className="text-sm text-red-200/60 font-bold uppercase tracking-widest">Pending Requests</p>
                        <h3 className="text-4xl font-black text-white mt-2">{data.stats.pending_bookings}</h3>
                        <p className="text-red-400/80 text-xs mt-2 font-bold">Needs Dispatch Confirmation</p>
                    </div>
                </div>

                {/* Submissions Table */}
                <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-6">Booking Data Records</h3>
                <div className="bg-black/60 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-widest text-pink-300">
                                    <th className="p-4 font-bold">Date Submitted</th>
                                    <th className="p-4 font-bold">Pick-up</th>
                                    <th className="p-4 font-bold">Drop-off</th>
                                    <th className="p-4 font-bold">Journey Time</th>
                                    <th className="p-4 font-bold">Vehicle</th>
                                    <th className="p-4 font-bold">Status</th>
                                    <th className="p-4 font-bold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.bookings.map((booking: any) => (
                                    <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-white/80 text-sm">
                                        <td className="p-4 font-mono">{new Date(booking.created_at + 'Z').toLocaleString()}</td>
                                        <td className="p-4 font-semibold text-white">{booking.pickup}</td>
                                        <td className="p-4 font-semibold text-white">{booking.dropoff}</td>
                                        <td className="p-4">
                                            {booking.date} {booking.time}
                                            {booking.returnDate && <div className="text-pink-400 text-xs mt-1 font-bold">RET: {booking.returnDate} {booking.returnTime}</div>}
                                        </td>
                                        <td className="p-4">{booking.vehicleClass} <span className="text-xs opacity-50 block">x{booking.passengers} Pax</span></td>
                                        <td className="p-4">
                                            {booking.status === 'Pending' ? (
                                                <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full uppercase tracking-wider border border-red-500/30">Pending</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full uppercase tracking-wider border border-green-500/30">Completed</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {booking.status === 'Pending' && (
                                                <Button size="sm" onClick={() => markCompleted(booking.id)} className="bg-pink-600 hover:bg-pink-500 text-white font-bold h-8 text-xs">
                                                    Mark Done
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {data.bookings.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-white/40 font-bold uppercase tracking-widest">No Bookings Found in Database.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
