import { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/button";
import { 
    Eye, Users, FileText, Clock, MessageSquare, 
    Briefcase, Trash2, Download, LogOut, MapPin, Calendar, 
    Phone, Mail, User, Info, Search
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

type TabType = 'overview' | 'bookings' | 'messages' | 'drivers';

export function Admin() {
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
    const [role, setRole] = useState<string | null>(localStorage.getItem('userRole'));
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    // Dashboard Data
    const [data, setData] = useState<any>(null);

    console.log("Admin Component Render - Token:", !!token, "Role:", role);

    // Strict Role Check & Redirection
    useEffect(() => {
        if (!token) {
            console.log("No token found, redirecting to login");
            navigate("/login");
            return;
        }
        if (role !== 'admin') {
            console.log("User is not admin, role is:", role, "redirecting to dashboard");
            navigate("/dashboard");
        }
    }, [token, role, navigate]);

    const fetchDashboard = async () => {
        try {
            const res = await fetch("/api/admin/dashboard", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                setToken(null);
                setRole(null);
                localStorage.removeItem('adminToken');
                localStorage.removeItem('userRole');
                navigate("/login");
            }
        } catch (err) {
            console.error("Dashboard error", err);
        }
    };

    useEffect(() => {
        if (!token || role !== 'admin') return;
        fetchDashboard();

        const channel = supabase
            .channel('admin_dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchDashboard())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchDashboard())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => fetchDashboard())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [token, role]);

    const updateBookingStatus = async (id: number, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/bookings/${id}/status`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchDashboard();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteBooking = async (id: number) => {
        if (!confirm("Are you sure you want to delete this booking?")) return;
        try {
            const res = await fetch(`/api/admin/bookings/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) fetchDashboard();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredBookings = useMemo(() => {
        if (!data?.bookings) return [];
        return data.bookings.filter((b: any) => {
            const name = b.name || "";
            const email = b.email || "";
            const pickup = b.pickup || "";
            const dropoff = b.dropoff || "";
            
            const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                dropoff.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [data, searchQuery, filterStatus]);

    const filteredMessages = useMemo(() => {
        if (!data?.messages) return [];
        return data.messages.filter((m: any) => {
            const name = m.name || "";
            const message = m.message || "";
            return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   message.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [data, searchQuery]);

    const filteredDrivers = useMemo(() => {
        if (!data?.drivers) return [];
        return data.drivers.filter((d: any) => {
            const name = d.name || "";
            const experience = d.experience || "";
            return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   experience.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [data, searchQuery]);

    if (!token || role !== 'admin') {
        return null;
    }

    if (!data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white">
                <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mb-4" />
                <p className="text-pink-500 font-black uppercase tracking-[0.3em] text-sm">Syncing Systems...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white flex">
            {/* Sidebar */}
            <aside className="w-72 bg-black/50 border-r border-white/5 flex flex-col p-6 hidden lg:flex">
                <div className="flex items-center gap-4 mb-12">
                    <img src="/logo.png" alt="US Executive" className="h-10 w-10 rounded-xl" />
                    <div>
                        <h2 className="font-black text-lg leading-tight">US EXEC</h2>
                        <span className="text-[10px] text-pink-500 font-bold uppercase tracking-widest">Admin v2.0</span>
                    </div>
                </div>

                <nav className="flex-grow space-y-2">
                    {[
                        { id: 'overview', icon: Eye, label: 'Overview' },
                        { id: 'bookings', icon: FileText, label: 'Bookings', count: data.stats.pending_bookings },
                        { id: 'messages', icon: MessageSquare, label: 'Messages', count: data.stats.total_messages },
                        { id: 'drivers', icon: Briefcase, label: 'Applications', count: data.stats.total_drivers },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as TabType)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${activeTab === item.id ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-pink-500/50 group-hover:text-pink-500'}`} />
                                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                            </div>
                            {item.count !== undefined && item.count > 0 && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === item.id ? 'bg-white text-pink-600' : 'bg-pink-500/20 text-pink-500'}`}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="pt-6 border-t border-white/5">
                    <button 
                        onClick={() => { 
                            setToken(null); 
                            setRole(null);
                            localStorage.removeItem('adminToken'); 
                            localStorage.removeItem('userRole');
                        }}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all font-bold text-sm"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Terminate Session</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow flex flex-col">
                <header className="h-24 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-black uppercase tracking-tight">{activeTab}</h1>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live Engine</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-pink-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Global search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white/5 border border-white/5 rounded-2xl h-12 pl-12 pr-6 w-64 text-sm focus:outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all"
                            />
                        </div>
                        <Button variant="ghost" className="rounded-2xl h-12 px-6 border border-white/5 bg-white/5 hover:bg-white/10">
                            <Download className="w-4 h-4 mr-2" />
                            <span className="text-xs font-black uppercase tracking-widest">Export</span>
                        </Button>
                    </div>
                </header>

                <div className="p-8 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div 
                                key="overview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Total Traffic', value: data.stats.page_views, icon: Eye, color: 'pink' },
                                        { label: 'Active Now', value: data.stats.active_sessions, icon: Users, color: 'blue' },
                                        { label: 'Bookings', value: data.stats.total_bookings, icon: FileText, color: 'green' },
                                        { label: 'Pending', value: data.stats.pending_bookings, icon: Clock, color: 'orange' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group hover:border-pink-500/30 transition-all">
                                            <stat.icon className={`w-12 h-12 absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-20 transition-all text-${stat.color}-500`} />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">{stat.label}</p>
                                            <h3 className="text-4xl font-black">{stat.value}</h3>
                                            <div className="mt-4 flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full bg-${stat.color}-500`} />
                                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">System verified</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Recent Activity */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="font-black uppercase tracking-tight text-xl">Recent Bookings</h3>
                                            <Button onClick={() => setActiveTab('bookings')} variant="link" className="text-pink-500 p-0 h-auto font-black text-xs uppercase tracking-widest">View All</Button>
                                        </div>
                                        <div className="space-y-4">
                                            {data.bookings.slice(0, 5).map((b: any) => (
                                                <div key={b.id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center">
                                                            <User className="w-5 h-5 text-pink-500" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm">{b.name}</p>
                                                            <p className="text-[10px] text-white/40 font-medium">{b.pickup} → {b.dropoff}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${b.status === 'Pending' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                                                        {b.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="font-black uppercase tracking-tight text-xl">Recent Messages</h3>
                                            <Button onClick={() => setActiveTab('messages')} variant="link" className="text-pink-500 p-0 h-auto font-black text-xs uppercase tracking-widest">View All</Button>
                                        </div>
                                        <div className="space-y-4">
                                            {data.messages.slice(0, 5).map((m: any) => (
                                                <div key={m.id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                                            <MessageSquare className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                        <div className="max-w-[200px]">
                                                            <p className="font-bold text-sm">{m.name}</p>
                                                            <p className="text-[10px] text-white/40 font-medium truncate">{m.message}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-white/20 font-bold">{new Date(m.created_at).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'bookings' && (
                            <motion.div 
                                key="bookings"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                                            {['all', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => setFilterStatus(s)}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-pink-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{filteredBookings.length} records found</p>
                                </div>

                                <div className="grid gap-4">
                                    {filteredBookings.map((b: any) => (
                                        <div key={b.id} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:border-white/20 transition-all group">
                                            <div className="flex flex-wrap items-start justify-between gap-6">
                                                <div className="flex gap-6">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-pink-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-pink-600/10">
                                                        <User className="w-8 h-8 text-white" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-xl font-black tracking-tight">{b.name}</h4>
                                                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                                            <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-pink-500" /> {b.email}</span>
                                                            <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-pink-500" /> {b.phone}</span>
                                                            <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-pink-500" /> {b.date} at {b.time}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <select 
                                                        value={b.status}
                                                        onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                                                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-pink-500 transition-all cursor-pointer"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Confirmed">Confirmed</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                    <Button onClick={() => deleteBooking(b.id)} variant="ghost" className="w-10 h-10 rounded-xl p-0 text-red-400 hover:bg-red-400/10 hover:text-red-400">
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-8">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                                            <MapPin className="w-4 h-4 text-green-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Pick-up Point</p>
                                                            <p className="text-sm font-bold">{b.pickup}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                                            <MapPin className="w-4 h-4 text-red-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Destination</p>
                                                            <p className="text-sm font-bold">{b.dropoff}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-black/40 rounded-2xl p-4 flex items-center justify-around border border-white/5">
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Vehicle</p>
                                                        <p className="text-xs font-bold text-pink-500 uppercase">{b.vehicle_class}</p>
                                                    </div>
                                                    <div className="w-px h-8 bg-white/5" />
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Passengers</p>
                                                        <p className="text-xs font-bold text-white uppercase">{b.passengers} PAX</p>
                                                    </div>
                                                    <div className="w-px h-8 bg-white/5" />
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Type</p>
                                                        <p className="text-xs font-bold text-white uppercase">{b.return_date ? 'Return' : 'One-way'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {b.return_date && (
                                                <div className="mt-4 bg-pink-500/5 rounded-2xl p-4 border border-pink-500/10 flex items-center gap-4">
                                                    <Info className="w-4 h-4 text-pink-500" />
                                                    <p className="text-xs font-bold">
                                                        <span className="text-pink-500 uppercase mr-2">Return Journey:</span> 
                                                        Scheduled for {b.return_date} at {b.return_time}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {filteredBookings.length === 0 && (
                                        <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-white/5 border-dashed">
                                            <FileText className="w-16 h-16 text-white/10 mx-auto mb-4" />
                                            <h3 className="text-xl font-black uppercase tracking-tighter opacity-20">No matching bookings found</h3>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'messages' && (
                            <motion.div 
                                key="messages"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4"
                            >
                                {filteredMessages.map((m: any) => (
                                    <div key={m.id} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:border-white/20 transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                                                    <User className="w-6 h-6 text-blue-500" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg">{m.name}</h4>
                                                    <div className="flex items-center gap-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                                        <span>{m.email}</span>
                                                        <span>•</span>
                                                        <span>{m.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{new Date(m.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className="bg-black/40 rounded-2xl p-6 border border-white/5">
                                            <p className="text-sm leading-relaxed text-white/80">{m.message}</p>
                                        </div>
                                    </div>
                                ))}
                                {filteredMessages.length === 0 && (
                                    <div className="text-center py-20">
                                        <MessageSquare className="w-16 h-16 text-white/10 mx-auto mb-4" />
                                        <h3 className="text-xl font-black uppercase tracking-tighter opacity-20">Inbox is empty</h3>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'drivers' && (
                            <motion.div 
                                key="drivers"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {filteredDrivers.map((d: any) => (
                                    <div key={d.id} className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 hover:border-white/20 transition-all relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-pink-600 transition-all group-hover:rotate-12">
                                                <Briefcase className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <h4 className="text-2xl font-black tracking-tight">{d.name}</h4>
                                                <p className="text-pink-500 text-[10px] font-black uppercase tracking-widest">Professional PHV Driver</p>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-sm font-bold text-white/60">
                                                    <Mail className="w-4 h-4 text-pink-500" /> {d.email}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm font-bold text-white/60">
                                                    <Phone className="w-4 h-4 text-pink-500" /> {d.phone}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">License</p>
                                                    <p className="text-xs font-bold uppercase">{d.license}</p>
                                                </div>
                                                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Vehicle</p>
                                                    <p className="text-xs font-bold uppercase">{d.vehicle}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Bio / Experience</p>
                                                <p className="text-xs text-white/60 leading-relaxed line-clamp-3">{d.experience}</p>
                                            </div>

                                            <Button className="w-full bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] h-12 rounded-xl border border-white/5">
                                                View Full Application
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {filteredDrivers.length === 0 && (
                                    <div className="col-span-full text-center py-20">
                                        <Users className="w-16 h-16 text-white/10 mx-auto mb-4" />
                                        <h3 className="text-xl font-black uppercase tracking-tighter opacity-20">No applications found</h3>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
