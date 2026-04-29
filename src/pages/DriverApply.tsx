import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Car, User, Phone, FileCheck, CheckCircle2, Mail, Camera } from "lucide-react";

export function DriverApply() {
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        license: "",
        vehicle: "",
        experience: "",
        document: ""
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, document: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("submitting");
        try {
            const res = await fetch("/api/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) setStatus("success");
            else setStatus("error");
        } catch (err) {
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 mt-20">
                <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Application Sent!</h2>
                    <p className="text-white/60 text-lg">Thank you for your interest. Our recruitment team will review your details and contact you shortly.</p>
                    <Button onClick={() => window.location.href = '/'} className="bg-white text-black font-bold h-12 px-8 rounded-full hover:bg-white/90">Return Home</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pt-32 pb-20 px-6 relative overflow-hidden">
            <div className="max-w-2xl mx-auto relative z-10">
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter italic">Drive with Us</h1>
                    <p className="text-pink-500 font-bold uppercase tracking-[0.2em] text-sm">Join the US Executive Fleet</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                                    <Input 
                                        required
                                        placeholder="John Doe"
                                        className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-white focus:border-pink-500 transition-all font-medium"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                                    <Input 
                                        required
                                        placeholder="+44 7..."
                                        className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-white focus:border-pink-500 transition-all font-medium"
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                                <Input 
                                    required
                                    type="email"
                                    placeholder="john@example.com"
                                    className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-white focus:border-pink-500 transition-all font-medium"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">PHV License Number</label>
                            <div className="relative">
                                <FileCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                                <Input 
                                    required
                                    placeholder="Enter License Details"
                                    className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-white focus:border-pink-500 transition-all font-medium"
                                    value={formData.license}
                                    onChange={e => setFormData({...formData, license: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Vehicle Make/Model & Year</label>
                            <div className="relative">
                                <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                                <Input 
                                    required
                                    placeholder="e.g. Mercedes E-Class 2023"
                                    className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-white focus:border-pink-500 transition-all font-medium"
                                    value={formData.vehicle}
                                    onChange={e => setFormData({...formData, vehicle: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Relevant Experience</label>
                            <Textarea 
                                required
                                placeholder="Tell us about your experience..."
                                className="bg-black/40 border-white/10 min-h-[120px] rounded-2xl text-white focus:border-pink-500 transition-all font-medium p-4 resize-none"
                                value={formData.experience}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, experience: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">Scan Document (ID / License)</label>
                            <div className="relative">
                                <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                                <Input 
                                    type="file"
                                    accept="image/*,application/pdf"
                                    capture="environment"
                                    className="bg-black/40 border-white/10 h-14 pl-12 rounded-2xl text-white focus:border-pink-500 transition-all font-medium pt-3"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        {status === "error" && <p className="text-red-500 text-xs font-bold text-center">Failed to send application. Please try again.</p>}

                        <Button 
                            type="submit"
                            disabled={status === "submitting"}
                            className="w-full h-16 bg-pink-600 hover:bg-pink-500 text-white font-black text-xl uppercase tracking-widest rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_10px_30px_rgba(236,72,153,0.3)]"
                        >
                            {status === "submitting" ? "PROCESSING..." : "SUBMIT APPLICATION"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
