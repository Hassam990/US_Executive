import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Lock, User, Mail, AlertCircle, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function Signup() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<"idle" | "loading">("idle");
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Google Signup Integration
    useEffect(() => {
        /* global google */
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
             try {
                const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "816912441965-ue09q6u0sfc0h8sl6404vpr269rjlaqp.apps.googleusercontent.com";
                console.log("Google SDK Loaded, initializing with ID:", clientId.substring(0, 10) + "...");

                // @ts-expect-error google is global
                google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleGoogleResponse
                });
                // @ts-expect-error google is global
                google.accounts.id.renderButton(
                    document.getElementById("googleBtn"),
                    { theme: "filled_blue", size: "large", width: "100%", shape: "pill", text: "signup_with" }
                );
             } catch (err) {
                console.error("Google SDK Initialization Error:", err);
             }
        };
        return () => { try { document.head.removeChild(script); } catch { /* ignore */ } };
    }, []);

    const handleGoogleResponse = async (response: any) => {
        setStatus("loading");
        setError("");
        try {
            const res = await fetch("/api/admin/google-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                localStorage.setItem('adminToken', result.token);
                localStorage.setItem('userRole', result.role);
                
                if (result.user) {
                    localStorage.setItem('userData', JSON.stringify(result.user));
                } else {
                    localStorage.setItem('userData', JSON.stringify({ name: name || 'User', email }));
                }
                
                window.dispatchEvent(new Event('auth-change'));
                
                if (result.role === 'admin') navigate("/admin");
                else navigate("/dashboard");
            } else {
                setError(result.message || "Google signup failed");
            }
        } catch (err) {
            console.error("Google Auth Error:", err);
            setError("Google auth failed.");
        } finally {
            setStatus("idle");
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Signup attempt started for:", email);
        setStatus("loading");
        setError("");
        try {
            const signupPayload = { name, email, password };
            console.log("Sending signup payload:", signupPayload);

            const res = await fetch("/api/admin/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(signupPayload)
            });

            console.log("Signup Response status:", res.status);
            const result = await res.json();
            console.log("Signup Response data:", result);

            if (res.ok && result.success) {
                console.log("Signup successful, role:", result.role);
                localStorage.setItem('adminToken', result.token);
                localStorage.setItem('userRole', result.role);
                localStorage.setItem('userData', JSON.stringify({ name, email }));
                window.dispatchEvent(new Event('auth-change'));
                
                if (result.role === 'admin') navigate("/admin");
                else navigate("/dashboard");
            } else {
                console.warn("Signup failed:", result.message);
                setError(result.message || "Signup failed");
            }
        } catch (err) {
            console.error("Signup Fetch Error:", err);
            setError("Server connection failed. Please check if server is running on port 5000.");
        } finally {
            setStatus("idle");
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-900/10 via-black to-black opacity-80" />
            
            <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative z-10 shadow-2xl space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-pink-500/20">
                        <User className="w-8 h-8 text-pink-500" />
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Create Account</h1>
                    <p className="text-white/40 text-sm font-medium">Join US Executive Travel today</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500/50" />
                            <Input 
                                type="text"
                                required
                                placeholder="John Doe"
                                className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-white focus:border-pink-500 transition-all"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500/50" />
                            <Input 
                                type="email"
                                required
                                placeholder="name@example.com"
                                className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-white focus:border-pink-500 transition-all"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500/50" />
                            <Input 
                                type="password"
                                required
                                placeholder="••••••••"
                                className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-white focus:border-pink-500 transition-all"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-red-400 text-xs font-bold">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button 
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full h-14 bg-pink-600 hover:bg-pink-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-pink-600/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        {status === "loading" ? "Creating Account..." : "Create Account"}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-[#0a0a0a] px-4 text-white/20 tracking-[0.3em]">Or use</span></div>
                </div>

                <div id="googleBtn" className="w-full h-14 flex items-center justify-center rounded-2xl overflow-hidden" />

                <div className="pt-2 text-center">
                    <p className="text-white/30 text-xs">Already have an account? <Link to="/login" className="text-pink-500 font-bold hover:underline">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
}
