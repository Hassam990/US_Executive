import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { MapPin, Calendar, Clock, Users, ArrowRightLeft, Car, Loader2 } from "lucide-react";

/**
 * AddressAutocomplete component uses Nominatim (OpenStreetMap) to fetch 
 * free UK-localized address suggestions without requiring an API key.
 */
function AddressAutocomplete({
    value,
    onChange,
    placeholder,
    name,
    icon: Icon
}: {
    value: string,
    onChange: (name: string, val: string) => void,
    placeholder: string,
    name: string,
    icon: React.ElementType
}) {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSuggestions = async (query: string) => {
        if (query.trim().length < 3) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        try {
            // Restrict to UK (gb)
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gb&addressdetails=1&limit=5`);
            const data = await res.json();
            setSuggestions(data);
            setIsOpen(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(name, val);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            fetchSuggestions(val);
        }, 500); // 500ms debounce
    };

    const handleSelect = (address: string) => {
        onChange(name, address);
        setIsOpen(false);
        setSuggestions([]);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <Icon className="absolute left-3 top-4 w-5 h-5 text-pink-400" />
            <Input
                name={name}
                value={value}
                onChange={handleInput}
                onFocus={() => { if (suggestions.length > 0) setIsOpen(true) }}
                required
                placeholder={placeholder}
                autoComplete="off"
                className="pl-10 pr-10 bg-black/40 border-pink-500/30 text-pink-100 font-semibold placeholder:text-pink-300/50 h-14 focus-visible:ring-pink-500 rounded-xl"
            />
            {loading && <Loader2 className="absolute right-3 top-4 w-5 h-5 text-pink-400 animate-spin" />}

            {/* Dropdown Suggestions */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-[#1a000d]/95 backdrop-blur-xl border border-pink-500/30 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
                    {suggestions.map((s, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSelect(s.display_name)}
                            className="px-4 py-3 hover:bg-pink-600/20 cursor-pointer border-b border-white/5 last:border-0 transition-colors flex items-start gap-3"
                        >
                            <MapPin className="w-4 h-4 text-pink-500/50 mt-1 flex-shrink-0" />
                            <span className="text-sm text-pink-100/90 leading-tight">
                                {s.display_name}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function BookingWidget() {
    const [isReturn, setIsReturn] = useState(false);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        pickup: "",
        dropoff: "",
        date: "",
        time: "",
        returnDate: "",
        returnTime: "",
        passengers: "1",
        vehicleClass: "Saloon"
    });

    const handleFieldChange = (name: string, value: string) => {
        setFormData(p => ({ ...p, [name]: value }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        handleFieldChange(e.target.name, e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        try {
            const response = await fetch("/api/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isReturn, ...formData })
            });

            if (response.ok) {
                setStatus("success");
            } else {
                const errData = await response.json().catch(() => ({}));
                console.error("Server error:", errData);
                setStatus("error");
            }
        } catch (error) {
            console.error("Network error:", error);
            setStatus("error");
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-visible rounded-2xl">
            {/* Header Area */}
            <div className="bg-pink-600/20 border-b border-pink-500/20 p-6 flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Book a Taxi</h3>
                    <p className="text-white/70 text-sm mt-1 font-medium">Fast, reliable, and secure online booking.</p>
                </div>
                <div className="w-12 h-12 bg-pink-500/30 rounded-xl flex items-center justify-center">
                    <Car className="w-6 h-6 text-pink-300" />
                </div>
            </div>

            <div className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Return Toggle */}
                    <div className="flex items-center justify-end mb-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <span className={`text-sm font-bold uppercase tracking-wider ${isReturn ? "text-pink-300" : "text-white/60 group-hover:text-white"}`}>Return Journey</span>
                            <div className={`w-12 h-6 rounded-full transition-colors relative ${isReturn ? 'bg-pink-500' : 'bg-black/40 border border-white/10'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isReturn ? 'left-7' : 'left-1'}`} />
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={isReturn}
                                onChange={(e) => setIsReturn(e.target.checked)}
                            />
                        </label>
                    </div>

                    {/* Contact Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white font-semibold">Full Name</Label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="John Doe"
                                className="bg-black/40 border-pink-500/30 text-pink-100 h-14 focus-visible:ring-pink-500 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white font-semibold">Phone Number</Label>
                            <Input
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                placeholder="07123 456789"
                                className="bg-black/40 border-pink-500/30 text-pink-100 h-14 focus-visible:ring-pink-500 rounded-xl"
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label className="text-white font-semibold">Email Address</Label>
                            <Input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="john@example.com"
                                className="bg-black/40 border-pink-500/30 text-pink-100 h-14 focus-visible:ring-pink-500 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-white font-semibold flex justify-between items-center">
                                Pick-up
                                <span className="text-xs text-pink-400 font-normal">UK Only</span>
                            </Label>
                            <AddressAutocomplete
                                name="pickup"
                                value={formData.pickup}
                                onChange={handleFieldChange}
                                placeholder="Start typing address or postcode..."
                                icon={MapPin}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white font-semibold flex items-center gap-2">
                                <div className="w-1 h-1 bg-pink-500 rounded-full opacity-50" />
                                <div className="w-1 h-1 bg-pink-500 rounded-full opacity-50" />
                                <div className="w-1 h-1 bg-pink-500 rounded-full opacity-50" />
                                Drop-off
                            </Label>
                            <AddressAutocomplete
                                name="dropoff"
                                value={formData.dropoff}
                                onChange={handleFieldChange}
                                placeholder="Start typing destination..."
                                icon={MapPin}
                            />
                        </div>
                    </div>

                    {/* Date/Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Calendar className="absolute left-3 top-4 w-5 h-5 text-pink-400/70" />
                                <Input
                                    name="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                    className="pl-10 bg-black/40 border-pink-500/30 text-pink-100 h-14 focus-visible:ring-pink-500 rounded-xl [color-scheme:dark]"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Clock className="absolute left-3 top-4 w-5 h-5 text-pink-400/70" />
                                <Input
                                    name="time"
                                    type="time"
                                    value={formData.time}
                                    onChange={handleChange}
                                    required
                                    className="pl-10 bg-black/40 border-pink-500/30 text-pink-100 h-14 focus-visible:ring-pink-500 rounded-xl [color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Return Date/Time */}
                    {isReturn && (
                        <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-pink-950/40 rounded-xl border border-pink-500/30">
                            <div className="col-span-2 text-pink-300 font-bold text-sm mb-1 uppercase tracking-wider flex items-center gap-2">
                                <ArrowRightLeft className="w-4 h-4" /> Return Details
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-4 w-5 h-5 text-pink-400/70" />
                                <Input
                                    name="returnDate"
                                    type="date"
                                    value={formData.returnDate}
                                    onChange={handleChange}
                                    required
                                    className="pl-10 bg-black/40 border-pink-500/30 text-pink-100 h-14 focus-visible:ring-pink-500 rounded-xl [color-scheme:dark]"
                                />
                            </div>
                            <div className="relative">
                                <Clock className="absolute left-3 top-4 w-5 h-5 text-pink-400/70" />
                                <Input
                                    name="returnTime"
                                    type="time"
                                    value={formData.returnTime}
                                    onChange={handleChange}
                                    required
                                    className="pl-10 bg-black/40 border-pink-500/30 text-pink-100 h-14 focus-visible:ring-pink-500 rounded-xl [color-scheme:dark]"
                                />
                            </div>
                        </div>
                    )}

                    {/* Specifications */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white font-semibold">Passengers</Label>
                            <div className="relative">
                                <Users className="absolute left-3 top-4 w-5 h-5 text-pink-400/70" />
                                <select
                                    name="passengers"
                                    value={formData.passengers}
                                    onChange={handleChange}
                                    className="w-full pl-10 bg-black/40 border border-pink-500/30 rounded-xl text-pink-100 h-14 focus-visible:ring-pink-500 appearance-none font-semibold cursor-pointer"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n} className="bg-[#2a0514] text-pink-100">{n} Passenger(s)</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white font-semibold">Vehicle</Label>
                            <div className="relative">
                                <select
                                    name="vehicleClass"
                                    value={formData.vehicleClass}
                                    onChange={handleChange}
                                    className="w-full pl-4 bg-black/40 border border-pink-500/30 rounded-xl text-pink-100 h-14 focus-visible:ring-pink-500 appearance-none font-semibold cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23fbcfe8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem top 50%", backgroundSize: "0.65rem auto" }}
                                >
                                    <option value="Saloon" className="bg-[#2a0514] text-pink-100">Saloon Car</option>
                                    <option value="Estate" className="bg-[#2a0514] text-pink-100">Estate Car</option>
                                    <option value="Executive" className="bg-[#2a0514] text-pink-100">Executive</option>
                                    <option value="MPV" className="bg-[#2a0514] text-pink-100">MPV / Minibus</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" disabled={status === "loading" || status === "success"} className="w-full h-16 mt-4 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-black text-xl tracking-wide rounded-xl shadow-[0_10px_30px_rgba(236,72,153,0.4)] transition-all hover:scale-[1.02] border-b-4 border-pink-800 uppercase">
                        {status === "loading" ? "Calculating..." : status === "success" ? "Quote Sent!" : "Get Quote / Book Taxi"}
                    </Button>

                    {status === "success" && (
                        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mt-4 text-center">
                            <p className="text-sm font-bold text-green-400">
                                Booking request received! We will text your confirmation shortly.
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
