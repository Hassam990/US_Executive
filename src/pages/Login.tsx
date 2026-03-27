import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

export function Login() {
    const [status, setStatus] = useState<"idle" | "loading">("idle");
    const [error, setError] = useState("");
    const [password, setPassword] = useState("");

    // Google Login Integration
    useEffect(() => {
        /* global google */
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
             // @ts-ignore
            google.accounts.id.initialize({
                client_id: "816912441965-ue09q6u0sfc0h8sl6404vpr269rjlaqp.apps.googleusercontent.com",
                callback: handleGoogleResponse
            });
             // @ts-ignore
            google.accounts.id.renderButton(
                document.getElementById("googleBtn"),
                { theme: "filled_blue", size: "large", width: "100%", shape: "pill" }
            );
        };
        return () => { try { document.head.removeChild(script); } catch(e) {} };
    }, []);

    const handleGoogleResponse = async (response: any) => {
        setStatus("loading");
        try {
            const res = await fetch("/api/admin/google-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                localStorage.setItem('adminToken', result.token);
                window.location.href = "/admin";
            } else {
                setError(result.message || "Unauthorized Login");
            }
        } catch (err) {
            setError("Google auth failed.");
        } finally {
            setStatus("idle");
        }
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                localStorage.setItem('adminToken', result.token);
                window.location.href = "/admin";
            } else {
                setError(result.message || "Invalid Password");
            }
        } catch (err) {
            setError("Server connection failed.");
        } finally {
            setStatus("idle");
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-900/20 via-black to-black opacity-80" />
            
            <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative z-10 shadow-[0_0_50px_rgba(236,72,153,0.1)] space-y-8 text-center">
                <div className="space-y-2">
                    <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-500/30">
                        <Lock className="w-8 h-8 text-pink-500" />
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Portal Access</h1>
                    <p className="text-white/40 text-sm font-medium">Welcome back. Please sign in to continue.</p>
                </div>

                <form onSubmit={handlePasswordLogin} className="space-y-6">
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Access Code / Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                            <Input 
                                type="password"
                                required
                                placeholder="••••••••"
                                className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-white focus:border-pink-500 transition-all font-mono tracking-widest"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-xs font-bold">{error}</p>}

                    <Button 
                        disabled={status === "loading"}
                        className="w-full h-14 bg-pink-600 hover:bg-pink-500 text-white font-black text-lg uppercase tracking-widest rounded-2xl transition-all hover:scale-[1.02]"
                    >
                        {status === "loading" ? "AUTHENTICATING..." : "SIGN IN"}
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-[#0a0a0a] px-4 text-white/20 tracking-[0.3em]">Or use security login</span></div>
                </div>

                <div id="googleBtn" className="w-full h-14 flex items-center justify-center rounded-2xl overflow-hidden" />

                <div className="pt-4">
                    <p className="text-white/30 text-xs">Don't have a driver account? <Link to="/apply" className="text-pink-500 font-bold hover:underline">Apply Here</Link></p>
                </div>
            </div>
        </div>
    );
}
