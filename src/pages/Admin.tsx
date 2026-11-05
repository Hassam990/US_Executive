// eslint-disable-next-line @typescript-eslint/ban-ts-comment

// @ts-nocheck

import { useState, useEffect, useMemo, useCallback } from "react";

import { Button } from "../components/ui/button";
import { DriverApplicationReview } from "@/components/admin/DriverApplicationReview";
import { DriverProfileManager } from "@/components/admin/DriverProfileManager";
import { ChatInbox } from "@/components/admin/ChatInbox";

import { 

    Eye, Users, FileText, Clock, MessageSquare, 

    Briefcase, Trash2, Download, LogOut, MapPin, Calendar, 

    Phone, Mail, User, Info, Search, Lock, ShieldCheck

} from "lucide-react";


import { motion, AnimatePresence } from "framer-motion";

import { useNavigate } from "react-router-dom";

import { useUser, useAuth, useClerk } from "@clerk/react";

// Both emails have full admin panel access

const ADMIN_EMAILS = ['hassamazam999@gmail.com', 'hello@us-executivetravel.com'];

type TabType = 'overview' | 'bookings' | 'messages' | 'drivers' | 'profiles' | 'chats';

interface DashboardStats {

    total_bookings: number;

    pending_bookings: number;

    total_messages: number;

    total_drivers: number;

    total_chats: number;

    page_views: number;

    active_sessions: number;

}

interface DashboardData {

    bookings: Record<string, unknown>[];

    messages: Record<string, unknown>[];

    drivers: Record<string, unknown>[];

    chats: Record<string, unknown>[];

    stats: DashboardStats;

    success: boolean;

    dbConnected: boolean;

}

export function Admin() {

    const navigate = useNavigate();

    // Clerk SSO admin detection

    const { isLoaded, isSignedIn, user } = useUser();

    const { getToken } = useAuth();
    const { signOut } = useClerk();

    // Direct Login State
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState("");

    const handleDirectAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError("");
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
            });
            const result = await res.json();
            if (res.ok && result.token && result.role === 'admin') {
                localStorage.setItem('adminToken', result.token);
                localStorage.setItem('userRole', 'admin');
                setToken(result.token);
                setRole('admin');
                window.dispatchEvent(new Event('auth-change'));
            } else {
                setLoginError(result.message || "Invalid admin credentials");
            }
        } catch {
            setLoginError("Unable to connect to authentication server.");
        } finally {
            setLoginLoading(false);
        }
    };

    const clerkEmail = (user?.primaryEmailAddress?.emailAddress || '').toLowerCase();

    const isClerkAdmin = isLoaded && isSignedIn && ADMIN_EMAILS.includes(clerkEmail);

    // Legacy JWT admin

    const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));

    const [role, setRole] = useState<string | null>(localStorage.getItem('userRole'));

    const isLegacyAdmin = !!token && role === 'admin';

    // Either path grants access

    const isAdmin = isClerkAdmin || isLegacyAdmin;

    const getAdminHeaders = useCallback(async (json = false) => {
        const authToken = isClerkAdmin ? await getToken() : token;
        return {
            ...(json ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${authToken}`,
            ...(isClerkAdmin && clerkEmail ? { "x-user-email": clerkEmail } : {}),
        };
    }, [isClerkAdmin, getToken, token, clerkEmail]);

    const [activeTab, setActiveTab] = useState<TabType>('overview');

    const [searchQuery, setSearchQuery] = useState("");

    const [filterStatus, setFilterStatus] = useState("all");

    const [selectedDriver, setSelectedDriver] = useState<Record<string, unknown> | null>(null);

    // Dashboard Data

    const [data, setData] = useState<DashboardData | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState("");

    // Auth guard: wait for Clerk to load

    useEffect(() => {

        if (!isLoaded) return;

        if (!isAdmin) {

            if (isSignedIn) {

                navigate("/dashboard"); // signed in but not admin

            } else {

                return; // keep on admin page to show admin login form

            }

        }

    }, [isLoaded, isAdmin, isSignedIn, navigate]);

    const fetchDashboard = async (showLoading = false) => {
        if (showLoading) {
            setDashboardLoading(true);
            setDashboardError("");
        }

        try {
            let authToken = token;
            if (isClerkAdmin) {
                try {
                    const clerkToken = await getToken();
                    if (clerkToken) authToken = clerkToken;
                } catch (tokenError) {
                    if (!authToken) throw tokenError;
                }
            }
            if (!authToken) throw new Error("Your admin session has expired. Please sign in again.");

            const headers: Record<string, string> = { Authorization: "Bearer " + authToken };
            if (isClerkAdmin) headers["x-user-email"] = clerkEmail;
            const res = await fetch("/api/admin/dashboard", {                headers,                signal: AbortSignal.timeout(20000),            });            const result = await res.json().catch(() => ({}));

            if (!res.ok) {
                if ((res.status === 401 || res.status === 403) && !isClerkAdmin) {
                    setToken(null);
                    setRole(null);
                    localStorage.removeItem("adminToken");
                    localStorage.removeItem("userRole");
                    localStorage.removeItem("userData");
                    window.dispatchEvent(new Event("auth-change"));
                    navigate("/login");
                }
                throw new Error(result.message || ("Dashboard request failed (" + res.status + ")."));
            }

            setData({
                ...result,
                bookings: Array.isArray(result.bookings) ? result.bookings : [],
                messages: Array.isArray(result.messages) ? result.messages : [],
                drivers: Array.isArray(result.drivers) ? result.drivers : [],
                chats: Array.isArray(result.chats) ? result.chats : [],
                stats: result.stats || {},
            });
            setDashboardError("");
        } catch (err) {
            console.error("Dashboard error", err);
            setDashboardError(err instanceof Error ? err.message : "Could not load the admin dashboard.");
        } finally {
            if (showLoading) setDashboardLoading(false);
        }
    };

    useEffect(() => {
        if (!isAdmin || activeTab !== "overview") return;
        fetchDashboard(true);
        const refreshTimer = window.setInterval(() => fetchDashboard(false), 15000);
        return () => window.clearInterval(refreshTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, token, role, activeTab]);

    const updateBookingStatus = async (id: number, newStatus: string) => {

        try {

            const res = await fetch(`/api/admin/bookings/${id}/status`, {

                method: "POST",

                headers: { 

                    "Authorization": `Bearer ${isClerkAdmin ? (await getToken()) : token}`,
                    ...(isClerkAdmin && clerkEmail ? { "x-user-email": clerkEmail } : {}),

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

                headers: { 
                    "Authorization": `Bearer ${isClerkAdmin ? (await getToken()) : token}`,
                    ...(isClerkAdmin && clerkEmail ? { "x-user-email": clerkEmail } : {})
                }

            });

            if (res.ok) fetchDashboard();

        } catch (err) {

            console.error(err);

        }

    };

    const deleteDriver = async (id: number) => {
        if (!confirm("Are you sure you want to delete this application?")) return;

        try {
            const authToken = isClerkAdmin ? await getToken() : token;
            const res = await fetch("/api/admin/drivers/" + id, {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + authToken,
                    ...(isClerkAdmin && clerkEmail ? { "x-user-email": clerkEmail } : {})
                }
            });

            if (res.ok) {
                fetchDashboard();
                if (selectedDriver?.id === id) setSelectedDriver(null);
            } else {
                const result = await res.json().catch(() => ({}));
                alert(result.message || "Failed to delete driver application.");
            }
        } catch (err) {
            console.error(err);
            alert("Unable to connect to the server.");
        }
    };

    const filteredBookings = useMemo(() => {

        if (!data?.bookings) return [];

        return data.bookings.filter((b: Record<string, unknown>) => {

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

        return data.messages.filter((m: Record<string, unknown>) => {

            const name = m.name || "";

            const message = m.message || "";

            return name.toLowerCase().includes(searchQuery.toLowerCase()) || 

                   message.toLowerCase().includes(searchQuery.toLowerCase());

        });

    }, [data, searchQuery]);

    const filteredDrivers = useMemo(() => {

        if (!data?.drivers) return [];

        return data.drivers.filter((d: Record<string, unknown>) => {

            const name = d.name || "";

            const experience = d.experience || "";

            return name.toLowerCase().includes(searchQuery.toLowerCase()) || 

                   experience.toLowerCase().includes(searchQuery.toLowerCase());

        });

    }, [data, searchQuery]);

    if (!isAdmin) {

        if (!isLoaded) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white">
                    <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mb-4" />
                    <p className="text-pink-500 font-black uppercase tracking-[0.3em] text-sm">Verifying Security Session...</p>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden text-white selection:bg-pink-500/30">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-900/20 via-black to-black opacity-90" />
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-900/20 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-[#0b0b0f] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 to-pink-400 p-0.5 mb-4 shadow-lg shadow-pink-600/30">
                                <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
                                    <ShieldCheck className="w-8 h-8 text-pink-500" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight uppercase">Executive Admin</h1>
                            <p className="text-xs text-white/50 tracking-widest uppercase mt-1">Authorized Personnel Portal</p>
                        </div>

                        {loginError && (
                            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
                                <Info className="w-4 h-4 shrink-0" />
                                <span>{loginError}</span>
                            </div>
                        )}

                        <form onSubmit={handleDirectAdminLogin} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Admin Email</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        required
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        placeholder="hassamazam999@gmail.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Security Key</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="password"
                                        required
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loginLoading}
                                className="w-full h-12 bg-pink-600 hover:bg-pink-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-pink-600/30 transition-all mt-2"
                            >
                                {loginLoading ? "Authenticating..." : "Access Dashboard"}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-white/5 text-center">
                            <p className="text-[11px] text-white/40 mb-3">Or authenticate with Clerk</p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/login")}
                                className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl"
                            >
                                Continue with Clerk SSO
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );

    }

    if (!data) {
        if (dashboardLoading) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white">
                    <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mb-4" />
                    <p className="text-pink-500 font-black uppercase tracking-[0.3em] text-sm">Opening Executive Admin...</p>
                </div>
            );
        }

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white px-6 text-center">
                <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
                    <h2 className="text-xl font-bold">Admin dashboard unavailable</h2>
                    <p className="mt-3 text-sm text-white/60">{dashboardError || "The dashboard could not be opened."}</p>
                    <button onClick={() => fetchDashboard(true)} className="mt-6 rounded-full bg-pink-500 px-6 py-3 text-sm font-bold text-white hover:bg-pink-400">
                        Retry
                    </button>
                </div>
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
                        { id: 'profiles', icon: User, label: 'Driver Profiles' },
                        { id: 'chats', icon: MessageSquare, label: 'Chat Inbox', count: data.stats.total_chats },

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
                            if (isClerkAdmin) signOut();

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

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">

                                    {[

                                        { label: 'Total Traffic', value: data.stats.page_views, icon: Eye, color: 'pink' },

                                        { label: 'Active Now', value: data.stats.active_sessions, icon: Users, color: 'blue' },

                                        { label: 'Bookings', value: data.stats.total_bookings, icon: FileText, color: 'green' },

                                        { label: 'Pending', value: data.stats.pending_bookings, icon: Clock, color: 'orange' },
                                        { label: 'Chats', value: data.stats.total_chats, icon: MessageSquare, color: 'pink' },

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

                                            {data.bookings.slice(0, 5).map((b: Record<string, unknown>) => (

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

                                            {data.messages.slice(0, 5).map((m: Record<string, unknown>) => (

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

                                    {filteredBookings.map((b: Record<string, unknown>) => (

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

                                {filteredMessages.map((m: Record<string, unknown>) => (

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

                                {filteredDrivers.map((d: Record<string, unknown>) => (

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
                                                <span className="inline-flex mt-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-pink-300">{d.application_status || "Application Received"}</span>

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

                                            {d.document && (

                                                <div className="w-full h-24 rounded-xl overflow-hidden border border-white/5 bg-black/40 relative">

                                                    {d.document.startsWith('data:image') ? (

                                                        <img src={d.document} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" alt="Document thumbnail" />

                                                    ) : (

                                                        <div className="flex flex-col items-center justify-center h-full opacity-50">

                                                            <FileText className="w-6 h-6 text-white mb-1" />

                                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">PDF Attached</span>

                                                        </div>

                                                    )}

                                                </div>

                                            )}

                                            <div className="flex items-center gap-2">

                                                <Button 

                                                    onClick={() => setSelectedDriver(d)}

                                                    className="flex-grow bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] h-12 rounded-xl border border-white/5"

                                                >

                                                    View Full Application

                                                </Button>

                                                <Button 

                                                    onClick={() => deleteDriver(d.id)}

                                                    variant="ghost" 

                                                    className="w-12 h-12 rounded-xl border border-white/5 bg-white/5 hover:bg-red-500/20 text-red-400 hover:text-red-400 hover:border-red-500/20 transition-all"

                                                >

                                                    <Trash2 className="w-5 h-5" />

                                                </Button>

                                            </div>

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

                        {activeTab === 'profiles' && (
                            <motion.div key="profiles" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <DriverProfileManager getHeaders={getAdminHeaders} />
                            </motion.div>
                        )}

                        {activeTab === 'chats' && (
                            <motion.div key="chats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <ChatInbox getHeaders={getAdminHeaders} />
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {activeTab === 'overview' && (
                        <section className="mb-8 rounded-[2rem] border border-white/5 bg-white/5 p-6 md:p-8">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-400">Recent Activity</p><h2 className="mt-1 text-xl font-black uppercase tracking-tight">Website chats</h2></div>
                                <Button onClick={() => setActiveTab('chats')} variant="link" className="h-auto p-0 text-xs font-black uppercase tracking-widest text-pink-500">Open inbox</Button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {(data.chats || []).slice(0, 5).map((chat: Record<string, any>) => (
                                    <button type="button" key={chat.id} onClick={() => setActiveTab('chats')} className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/5 bg-black/40 p-4 text-left transition hover:border-pink-500/30">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/15"><MessageSquare className="h-5 w-5 text-pink-400" /></span>
                                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{chat.conversation_type === 'driver' ? `${chat.driver_name || 'Driver'} · ${chat.visitor_name}` : `Support · ${chat.visitor_name}`}</span><span className="block truncate text-[10px] text-white/45">{chat.latest_message?.body || 'Conversation started'}</span></span>
                                        <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest ${chat.status === 'open' ? 'text-green-400' : 'text-white/30'}`}>{chat.status}</span>
                                    </button>
                                ))}
                                {!(data.chats || []).length && <p className="py-5 text-sm text-white/40">New website chats will appear here.</p>}
                            </div>
                        </section>
                    )}

                </div>

            </main>

            {selectedDriver?.application_data && Object.keys(selectedDriver.application_data).length > 0 && (
                <DriverApplicationReview
                    driver={selectedDriver}
                    onClose={() => setSelectedDriver(null)}
                    onRefresh={fetchDashboard}
                    accessToken={getToken}
                    isClerkAdmin={isClerkAdmin}
                    clerkEmail={clerkEmail}
                />
            )}

            {/* Driver Application Modal */}

            <AnimatePresence>

                {selectedDriver && !selectedDriver.application_data && (

                    <motion.div 

                        initial={{ opacity: 0 }}

                        animate={{ opacity: 1 }}

                        exit={{ opacity: 0 }}

                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"

                        onClick={() => setSelectedDriver(null)}

                    >

                        <motion.div 

                            initial={{ scale: 0.95, opacity: 0 }}

                            animate={{ scale: 1, opacity: 1 }}

                            exit={{ scale: 0.95, opacity: 0 }}

                            onClick={(e) => e.stopPropagation()}

                            className="bg-[#0a0505] border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"

                        >

                            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">

                                <div>

                                    <h3 className="text-3xl font-black uppercase tracking-tight">{selectedDriver.name}</h3>

                                    <p className="text-pink-500 font-bold uppercase tracking-widest text-[10px] mt-1">Full Application Review</p>

                                </div>

                                <button 

                                    onClick={() => setSelectedDriver(null)}

                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"

                                >

                                    ✕

                                </button>

                            </div>

                            <div className="space-y-8">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">

                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Email</p>

                                        <p className="text-sm font-bold">{selectedDriver.email}</p>

                                    </div>

                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">

                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Phone</p>

                                        <p className="text-sm font-bold">{selectedDriver.phone}</p>

                                    </div>

                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">

                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">License</p>

                                        <p className="text-sm font-bold">{selectedDriver.license}</p>

                                    </div>

                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">

                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Vehicle</p>

                                        <p className="text-sm font-bold">{selectedDriver.vehicle}</p>

                                    </div>

                                </div>

                                <div className="bg-black/40 p-6 rounded-2xl border border-white/5">

                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Bio / Experience</p>

                                    <p className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">{selectedDriver.experience}</p>

                                </div>

                                {selectedDriver.document ? (

                                    <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4">

                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Scanned Document</p>

                                        {selectedDriver.document.startsWith('data:image') ? (

                                            <img src={selectedDriver.document} alt="Document" className="w-full rounded-xl border border-white/10" />

                                        ) : (

                                            <iframe src={selectedDriver.document} title="Document" className="w-full h-96 rounded-xl border border-white/10 bg-white" />

                                        )}

                                        <a 

                                            href={selectedDriver.document} 

                                            download={`Document_${selectedDriver.name}`}

                                            className="inline-flex items-center gap-2 text-pink-500 font-bold text-xs uppercase hover:text-pink-400 transition-colors"

                                        >

                                            <Download className="w-4 h-4" /> Download Document

                                        </a>

                                    </div>

                                ) : (

                                    <div className="bg-black/40 p-10 rounded-2xl border border-white/5 border-dashed flex flex-col items-center justify-center text-center">

                                        <FileText className="w-12 h-12 text-white/10 mb-4" />

                                        <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No Document Attached</p>

                                        <p className="text-white/20 text-xs mt-2 max-w-sm">This application was either submitted before the document scanning feature was added, or no document was provided.</p>

                                    </div>

                                )}

                            </div>

                        </motion.div>

                    </motion.div>

                )}

            </AnimatePresence>

        </div>

    );

}

