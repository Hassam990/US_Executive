// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import { Link } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
    Plane, MapPin, Clock, Users, ArrowRightLeft, Loader2,
    CheckCircle2, Car, Briefcase, Sparkles, Navigation,
    Calendar, Phone, User, Mail, MessageSquare, ArrowRight, ShieldCheck
} from "lucide-react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
mapboxgl.accessToken = MAPBOX_TOKEN;

// ── Airport presets ───────────────────────────────────────────────────────────
const AIRPORTS = [
    { name: "Heathrow",   code: "LHR", address: "London Heathrow Airport, Hounslow TW6 1EW", coords: [-0.4543, 51.4700] as [number,number] },
    { name: "Gatwick",    code: "LGW", address: "London Gatwick Airport, Horley RH6 0NP",    coords: [-0.1821, 51.1537] as [number,number] },
    { name: "Stansted",   code: "STN", address: "London Stansted Airport, Stansted CM24 1RW", coords: [0.2389,  51.8860] as [number,number] },
    { name: "Luton",      code: "LTN", address: "London Luton Airport, Luton LU2 9LY",        coords: [-0.3717, 51.8763] as [number,number] },
    { name: "Manchester", code: "MAN", address: "Manchester Airport, Manchester M90 1QX",      coords: [-2.2727, 53.3588] as [number,number] },
    { name: "City",       code: "LCY", address: "London City Airport, London E16 2PX",         coords: [0.0495,  51.5048] as [number,number] },
];

const VEHICLE_TIERS = [
    { id: "Saloon",    name: "Executive Saloon",  models: "Mercedes E-Class · BMW 5 Series", base: 65,  perMile: 2.5, pax: 4, tag: "Most Popular", icon: Car },
    { id: "Executive", name: "First Class",       models: "Mercedes S-Class · BMW 7 Series", base: 110, perMile: 3.8, pax: 3, tag: "VIP Luxury",   icon: Sparkles },
    { id: "MPV",       name: "Executive MPV",     models: "Mercedes V-Class Extra Long",     base: 95,  perMile: 3.2, pax: 7, tag: "Groups",        icon: Users },
    { id: "Estate",    name: "Luxury Estate",     models: "Mercedes E-Class Estate",         base: 75,  perMile: 2.8, pax: 4, tag: "Extra Luggage", icon: Briefcase },
];

// ── Address autocomplete via Mapbox Geocoding API ─────────────────────────────
function AddressInput({ value, onChange, onSelect, placeholder, dotColor = "white" }: {
    value: string;
    onChange: (v: string) => void;
    onSelect?: (coords: [number, number], addr: string) => void;
    placeholder: string;
    dotColor?: "green" | "pink";
}) {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const fetch = async (q: string) => {
        if (q.length < 3) { setSuggestions([]); return; }
        setLoading(true);
        try {
            const res = await window.fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&country=gb&types=address,place,poi,postcode&limit=5&language=en`
            );
            const data = await res.json();
            setSuggestions(data.features || []);
            setOpen(true);
        } catch { /* silent */ } finally { setLoading(false); }
    };

    const dotClass = dotColor === "green"
        ? "bg-emerald-400 ring-4 ring-emerald-400/20"
        : "bg-pink-500 ring-4 ring-pink-500/20";

    return (
        <div className="relative" ref={ref}>
            <div className="flex items-center gap-3 py-3.5">
                <span className={`w-3 h-3 rounded-full shrink-0 ${dotClass}`} />
                <input
                    value={value}
                    onChange={e => {
                        onChange(e.target.value);
                        clearTimeout(timer.current);
                        timer.current = setTimeout(() => fetch(e.target.value), 300);
                    }}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="flex-1 bg-transparent text-white text-[15px] font-semibold placeholder:text-white/35 outline-none border-none"
                />
                {loading && <div className="w-3.5 h-3.5 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin shrink-0" />}
            </div>

            {open && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#110008]/98 backdrop-blur-2xl border border-pink-500/25 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] z-[999]">
                    {suggestions.map((s) => (
                        <button key={s.id} type="button"
                            onClick={() => {
                                onChange(s.place_name);
                                onSelect?.([s.center[0], s.center[1]], s.place_name);
                                setSuggestions([]); setOpen(false);
                            }}
                            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-pink-600/15 transition-colors border-b border-white/5 last:border-0 text-left">
                            <MapPin className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm text-white font-semibold leading-tight">{s.text}</p>
                                <p className="text-[11px] text-white/40 mt-0.5 leading-tight">{s.place_name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type Step = "location" | "details" | "vehicle" | "confirm" | "success";

export default function Book() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const pickupMarker = useRef<mapboxgl.Marker | null>(null);
    const dropoffMarker = useRef<mapboxgl.Marker | null>(null);

    const { isSignedIn, user } = useUser();

    const [step, setStep] = useState<Step>("location");
    const [serviceMode, setServiceMode] = useState<"airport"|"point"|"hourly">("airport");

    // Location
    const [pickup, setPickup]   = useState("");
    const [dropoff, setDropoff] = useState("");
    const [pickupCoords, setPickupCoords]   = useState<[number,number]|null>(null);
    const [dropoffCoords, setDropoffCoords] = useState<[number,number]|null>(null);
    const [flightNumber, setFlightNumber]   = useState("");

    // Details
    const [name, setName]           = useState("");
    const [email, setEmail]         = useState("");
    const [phone, setPhone]         = useState("");
    const [date, setDate]           = useState("");
    const [time, setTime]           = useState("");
    const [passengers, setPassengers] = useState("1");
    const [isReturn, setIsReturn]   = useState(false);
    const [returnDate, setReturnDate] = useState("");
    const [returnTime, setReturnTime] = useState("");
    const [notes, setNotes]         = useState("");

    // Vehicle & Status
    const [selectedVehicle, setSelectedVehicle] = useState("Saloon");
    const [status, setStatus] = useState<"idle"|"loading"|"error">("idle");
    const [bookingId, setBookingId] = useState<number | null>(null);

    // Auto-fill logged-in user details if available
    useEffect(() => {
        if (isSignedIn && user) {
            if (!name) {
                const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.fullName || user.username || "";
                if (fullName) setName(fullName);
            }
            if (!email) {
                const primaryEmail = user.primaryEmailAddress?.emailAddress || "";
                if (primaryEmail) setEmail(primaryEmail);
            }
            if (!phone) {
                const primaryPhone = user.primaryPhoneNumber?.phoneNumber || "";
                if (primaryPhone) setPhone(primaryPhone);
            }
        }
    }, [isSignedIn, user]);

    const activeTier = VEHICLE_TIERS.find(v => v.id === selectedVehicle) ?? VEHICLE_TIERS[0];

    // Distance estimate (miles)
    const distance = (() => {
        if (!pickupCoords || !dropoffCoords) return null;
        const R = 3958.8;
        const dLat = (dropoffCoords[1] - pickupCoords[1]) * Math.PI / 180;
        const dLon = (dropoffCoords[0] - pickupCoords[0]) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(pickupCoords[1]*Math.PI/180) * Math.cos(dropoffCoords[1]*Math.PI/180) * Math.sin(dLon/2)**2;
        return Math.max(3, Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))));
    })();
    const price = distance ? Math.round(activeTier.base + distance * activeTier.perMile) : activeTier.base;

    // ── Init Mapbox map ───────────────────────────────────────────────────────
    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [-0.1278, 51.5074], // London
            zoom: 10,
            attributionControl: false,
        });

        map.current.on("load", () => {
            // Add route source & layer
            map.current!.addSource("route", {
                type: "geojson",
                data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } }
            });
            map.current!.addLayer({
                id: "route",
                type: "line",
                source: "route",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: {
                    "line-color": "#ec4899",
                    "line-width": 5,
                    "line-opacity": 0.9,
                    "line-dasharray": [2, 1],
                }
            });
        });

        return () => { map.current?.remove(); map.current = null; };
    }, []);

    // ── Update markers & route when coords change ─────────────────────────────
    const drawRoute = useCallback(async (from: [number,number], to: [number,number]) => {
        if (!map.current) return;
        try {
            const res = await window.fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
            );
            const data = await res.json();
            const coords = data.routes?.[0]?.geometry?.coordinates;
            if (!coords || !map.current.getSource("route")) return;
            (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData({
                type: "Feature", properties: {},
                geometry: { type: "LineString", coordinates: coords }
            });
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        if (!map.current) return;

        // Pickup marker (green)
        pickupMarker.current?.remove();
        if (pickupCoords) {
            const el = document.createElement("div");
            el.style.cssText = "width:16px;height:16px;background:#10b981;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(16,185,129,0.6)";
            pickupMarker.current = new mapboxgl.Marker({ element: el }).setLngLat(pickupCoords).addTo(map.current!);
        }

        // Dropoff marker (pink)
        dropoffMarker.current?.remove();
        if (dropoffCoords) {
            const el = document.createElement("div");
            el.style.cssText = "width:16px;height:16px;background:#ec4899;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(236,72,153,0.6)";
            dropoffMarker.current = new mapboxgl.Marker({ element: el }).setLngLat(dropoffCoords).addTo(map.current!);
        }

        // Route + fit bounds
        if (pickupCoords && dropoffCoords) {
            drawRoute(pickupCoords, dropoffCoords);
            const bounds = new mapboxgl.LngLatBounds(pickupCoords, pickupCoords).extend(dropoffCoords);
            map.current.fitBounds(bounds, { padding: 100, maxZoom: 13, duration: 1200 });
        } else if (pickupCoords) {
            map.current.flyTo({ center: pickupCoords, zoom: 13, duration: 800 });
        } else if (dropoffCoords) {
            map.current.flyTo({ center: dropoffCoords, zoom: 13, duration: 800 });
        }
    }, [pickupCoords, dropoffCoords, drawRoute]);

    const swapLocations = () => {
        const [a, b, c, d] = [pickup, dropoff, pickupCoords, dropoffCoords];
        setPickup(b); setDropoff(a); setPickupCoords(d); setDropoffCoords(c);
    };

    const handleSubmit = async () => {
        setStatus("loading");
        try {
            const res = await window.fetch("/api/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name, email, phone, isReturn, pickup, dropoff, date, time,
                    returnDate: isReturn ? returnDate : null,
                    returnTime: isReturn ? returnTime : null,
                    passengers, vehicleClass: activeTier.name,
                    notes: `${serviceMode.toUpperCase()} | £${price} est. | ${flightNumber ? `Flight: ${flightNumber}` : ""} | ${notes}`
                })
            });
            if (res.ok) {
                const data = await res.json();
                setBookingId(data.id || Math.floor(Math.random() * 8000) + 1000);
                setStep("success");
                setStatus("idle");
            } else {
                setStatus("error");
            }
        } catch { setStatus("error"); }
    };

    // ── Success screen ────────────────────────────────────────────────────────
    if (step === "success") {
        const refNumber = bookingId ? `#USE-${bookingId}` : "Confirmed";
        const whatsappMsg = encodeURIComponent(
            `Hello US Executive Travel, I just booked reference ${refNumber} for ${name}.\nPick-up: ${pickup}\nDestination: ${dropoff}\nDate: ${date} at ${time}.`
        );

        return (
            <div className="min-h-screen bg-[#0d0005] flex flex-col items-center justify-center p-6 text-center gap-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        Booking Reference: {refNumber}
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mt-3 mb-2">
                        Chauffeur Reserved!
                    </h1>
                    <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
                        Your booking request is logged in our dispatch database. A confirmation has been sent to <strong className="text-white">{email}</strong>.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full max-w-md text-left space-y-2">
                    <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-3">Journey Summary</p>
                    {[["From", pickup], ["To", dropoff], ["Date & Time", `${date} at ${time}`], ["Fleet Tier", activeTier.name], ["Est. Fare", `£${price}`]].map(([l, v]) => (
                        <div key={l} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                            <span className="text-white/50">{l}</span>
                            <span className={`font-bold truncate max-w-[65%] text-right ${l === "Est. Fare" ? "text-pink-400 text-base" : "text-white"}`}>{v}</span>
                        </div>
                    ))}
                </div>

                {/* Portal Tracking Callout */}
                <div className="w-full max-w-md bg-[#16000a] border border-pink-500/30 rounded-2xl p-5 text-left space-y-3">
                    {isSignedIn ? (
                        <>
                            <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider">
                                <ShieldCheck className="w-4 h-4" />
                                Linked to your Passenger Portal
                            </div>
                            <p className="text-xs text-white/70 leading-relaxed">
                                You can track live driver confirmation, trip progress, and return journeys in your personal portal anytime.
                            </p>
                            <Link to="/dashboard" className="w-full flex items-center justify-center gap-2 h-12 bg-pink-600 hover:bg-pink-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_4px_20px_rgba(236,72,153,0.3)]">
                                View & Track in My Portal <ArrowRight className="w-4 h-4" />
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider">
                                <Sparkles className="w-4 h-4" />
                                Track Online via Passenger Portal
                            </div>
                            <p className="text-xs text-white/70 leading-relaxed">
                                Booked as a guest? You can register or log in with <strong className="text-white">{email}</strong> anytime to view and track your ride in your personal portal.
                            </p>
                            <Link to="/login" className="w-full flex items-center justify-center gap-2 h-12 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all">
                                Log in to Track Ride <ArrowRight className="w-4 h-4" />
                            </Link>
                        </>
                    )}
                </div>

                <div className="flex flex-col gap-3 w-full max-w-md">
                    <a
                        href={`https://wa.me/447412671467?text=${whatsappMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-12 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(37,211,102,0.3)]"
                    >
                        <MessageSquare className="w-4 h-4 fill-current" /> Track / Message via WhatsApp
                    </a>

                    <button
                        onClick={() => { setStep("location"); setPickup(""); setDropoff(""); setPickupCoords(null); setDropoffCoords(null); }}
                        className="w-full h-12 border border-white/10 hover:bg-white/5 text-white/70 hover:text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all"
                    >
                        Book Another Journey
                    </button>
                </div>
            </div>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0d0005]">
            {/* Page header */}
            <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                        {isSignedIn ? "✦ Member Booking" : "✦ Guest Booking"}
                    </span>
                    {isSignedIn && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            Auto-filled from your profile
                        </span>
                    )}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight">
                    Reserve Your <span className="text-pink-500">Chauffeur</span>
                </h1>
                <p className="text-white/50 text-sm mt-2">Fixed fares · No hidden charges · Professional chauffeurs</p>
            </div>

            {/* 2-column layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">

                    {/* ── LEFT: Booking Form ── */}
                    <div className="lg:col-span-3 space-y-5">

                        {/* Service mode tabs */}
                        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-1.5 flex gap-1">
                            {[
                                { id: "airport", label: "Airport Transfer", icon: Plane },
                                { id: "point",   label: "Point to Point",  icon: Navigation },
                                { id: "hourly",  label: "By the Hour",     icon: Clock },
                            ].map(({ id, label, icon: Icon }) => (
                                <button key={id} onClick={() => setServiceMode(id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all ${serviceMode === id ? "bg-pink-600 text-white shadow-lg shadow-pink-600/30" : "text-white/40 hover:text-white"}`}>
                                    <Icon className="w-3.5 h-3.5" />{label}
                                </button>
                            ))}
                        </div>

                        {/* UK Airport quick-select */}
                        {serviceMode === "airport" && (
                            <div>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Quick Airport Select</p>
                                <div className="flex flex-wrap gap-2">
                                    {AIRPORTS.map(ap => (
                                        <button key={ap.code} type="button"
                                            onClick={() => { setDropoff(ap.address); setDropoffCoords(ap.coords); }}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${dropoff === ap.address ? "bg-pink-600 border-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]" : "bg-white/[0.04] border-white/10 text-white/60 hover:border-pink-500/40 hover:text-white"}`}>
                                            <Plane className="w-3 h-3 text-pink-400" />{ap.code} · {ap.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Address inputs */}
                        <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
                            <div className="px-4 divide-y divide-white/10">
                                <AddressInput value={pickup} onChange={setPickup} dotColor="green"
                                    placeholder="Pickup — address, postcode or landmark"
                                    onSelect={(coords, addr) => { setPickup(addr); setPickupCoords(coords); }} />
                                <div className="flex justify-end py-1.5">
                                    <button type="button" onClick={swapLocations}
                                        className="w-7 h-7 rounded-full bg-black/60 border border-pink-500/30 text-pink-400 flex items-center justify-center hover:border-pink-500 transition-all">
                                        <ArrowRightLeft className="w-3 h-3 rotate-90" />
                                    </button>
                                </div>
                                <AddressInput value={dropoff} onChange={setDropoff} dotColor="pink"
                                    placeholder="Drop-off — destination"
                                    onSelect={(coords, addr) => { setDropoff(addr); setDropoffCoords(coords); }} />
                            </div>
                        </div>

                        {/* Flight number */}
                        {serviceMode === "airport" && (
                            <div className="relative">
                                <Plane className="absolute left-4 top-3.5 w-4 h-4 text-pink-400" />
                                <input value={flightNumber} onChange={e => setFlightNumber(e.target.value)}
                                    placeholder="Flight number (optional — e.g. BA 1482)"
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-2xl text-white text-sm font-medium pl-11 pr-4 h-12 placeholder:text-white/30 outline-none focus:border-pink-500/50 transition-all" />
                            </div>
                        )}

                        {/* Hourly duration */}
                        {serviceMode === "hourly" && (
                            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Duration</p>
                                <div className="flex gap-2 flex-wrap">
                                    {["2", "3", "4", "6", "8", "10"].map(h => (
                                        <button key={h} type="button"
                                            onClick={() => setNotes(`Hourly: ${h} hours`)}
                                            className="px-4 py-2 rounded-xl text-sm font-bold border border-white/10 bg-white/5 text-white/60 hover:border-pink-500/40 hover:text-white transition-all">
                                            {h}h
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Date / Time row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-pink-400 pointer-events-none" />
                                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-2xl text-white text-sm pl-11 pr-4 h-12 outline-none focus:border-pink-500/50 transition-all" />
                            </div>
                            <div className="relative">
                                <Clock className="absolute left-4 top-3.5 w-4 h-4 text-pink-400 pointer-events-none" />
                                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-2xl text-white text-sm pl-11 pr-4 h-12 outline-none focus:border-pink-500/50 transition-all" />
                            </div>
                        </div>

                        {/* Return journey toggle */}
                        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-0">
                                <div>
                                    <p className="text-sm font-black text-white">Return Journey</p>
                                    <p className="text-[11px] text-white/40">Add a return leg — 10% discount applied</p>
                                </div>
                                <button onClick={() => setIsReturn(!isReturn)}
                                    className={`w-12 h-6 rounded-full border transition-all relative ${isReturn ? "bg-pink-600 border-pink-500" : "bg-white/10 border-white/10"}`}>
                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isReturn ? "left-6" : "left-0.5"}`} />
                                </button>
                            </div>
                            {isReturn && (
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-xl text-white text-sm px-3 h-11 outline-none focus:border-pink-500/50 transition-all" />
                                    <input type="time" value={returnTime} onChange={e => setReturnTime(e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-xl text-white text-sm px-3 h-11 outline-none focus:border-pink-500/50 transition-all" />
                                </div>
                            )}
                        </div>

                        {/* Passengers */}
                        <div className="relative">
                            <Users className="absolute left-4 top-3.5 w-4 h-4 text-pink-400 pointer-events-none" />
                            <select value={passengers} onChange={e => setPassengers(e.target.value)}
                                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl text-white text-sm pl-11 pr-4 h-12 outline-none focus:border-pink-500/50 transition-all appearance-none">
                                {["1","2","3","4","5","6","7","8"].map(n => (
                                    <option key={n} value={n} className="bg-[#0d0005]">{n} Passenger{+n > 1 ? "s" : ""}</option>
                                ))}
                            </select>
                        </div>

                        {/* Vehicle tier selector */}
                        <div>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Select Vehicle Class</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {VEHICLE_TIERS.map(tier => {
                                    const Icon = tier.icon;
                                    const tierPrice = distance ? Math.round(tier.base + distance * tier.perMile) : tier.base;
                                    const sel = selectedVehicle === tier.id;
                                    return (
                                        <button key={tier.id} onClick={() => setSelectedVehicle(tier.id)}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${sel ? "bg-pink-600/20 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.15)]" : "bg-white/[0.03] border-white/10 hover:border-white/20"}`}>
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${sel ? "bg-pink-500/30" : "bg-white/5"}`}>
                                                <Icon className={`w-5 h-5 ${sel ? "text-pink-400" : "text-white/40"}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <p className="text-sm font-black text-white">{tier.name}</p>
                                                    <span className="text-[9px] font-bold text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded-full">{tier.tag}</span>
                                                </div>
                                                <p className="text-[10px] text-white/30 truncate">{tier.models}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-lg font-black text-pink-400">£{tierPrice}</p>
                                                <p className="text-[9px] text-white/30">est.</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Passenger details */}
                        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Passenger Details</p>
                                {isSignedIn ? (
                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Auto-filled ✓</span>
                                ) : (
                                    <span className="text-[9px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">Guest</span>
                                )}
                            </div>
                            <div className="relative">
                                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-pink-400 pointer-events-none" />
                                <input value={name} onChange={e => setName(e.target.value)} required
                                    placeholder="Full name"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-sm pl-10 pr-4 h-12 placeholder:text-white/30 outline-none focus:border-pink-500/50 transition-all" />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-pink-400 pointer-events-none" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                    placeholder="Email address"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-sm pl-10 pr-4 h-12 placeholder:text-white/30 outline-none focus:border-pink-500/50 transition-all" />
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-pink-400 pointer-events-none" />
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                                    placeholder="Mobile number"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-sm pl-10 pr-4 h-12 placeholder:text-white/30 outline-none focus:border-pink-500/50 transition-all" />
                            </div>
                            <div className="relative">
                                <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-pink-400/60 pointer-events-none" />
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                    placeholder="Special requirements (optional)"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl text-white text-sm pl-10 pr-4 pt-3 placeholder:text-white/30 outline-none focus:border-pink-500/50 transition-all resize-none" />
                            </div>
                        </div>

                        {/* Submit */}
                        {status === "error" && (
                            <p className="text-red-400 text-xs font-bold text-center bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                                Submission failed. Please try again or call 07412671467.
                            </p>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={status === "loading" || !pickup || !dropoff || !date || !time || !name || !email || !phone}
                            className="w-full h-16 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_8px_40px_rgba(236,72,153,0.35)] flex items-center justify-center gap-2">
                            {status === "loading"
                                ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                                : <><ShieldCheck className="w-5 h-5" /> Confirm Executive Booking</>}
                        </button>
                        <a href="tel:07412671467" className="flex items-center justify-center gap-2 text-white/30 text-xs hover:text-pink-400 transition-colors mt-2">
                            <Phone className="w-3.5 h-3.5" /> Prefer to call? 07412671467
                        </a>
                    </div>

                    {/* ── RIGHT: Map + Telemetry ── */}
                    <div className="lg:col-span-2 lg:sticky lg:top-24 space-y-5 self-start">

                        {/* Mapbox Route Visualizer */}
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                            style={{ height: 340 }}>
                            <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
                            {/* overlay gradient */}
                            <div className="absolute inset-0 pointer-events-none"
                                style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(13,0,5,0.3))" }} />
                            {!pickupCoords && !dropoffCoords && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                                    <MapPin className="w-8 h-8 text-pink-400/40" />
                                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Enter addresses to see route</p>
                                </div>
                            )}
                        </div>

                        {/* Journey telemetry */}
                        {distance && (
                            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                                <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-4">Journey Telemetry</p>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    {[
                                        { label: "Distance", value: `${distance} mi` },
                                        { label: "Est. Time", value: `${Math.round(distance * 1.5)} min` },
                                        { label: "Fixed Fare", value: `£${price}` },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-black/40 rounded-xl p-3 border border-white/5">
                                            <p className="text-lg font-black text-pink-400">{value}</p>
                                            <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Included VIP amenities */}
                        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                            <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-4">Included with Every Booking</p>
                            <div className="space-y-3">
                                {[
                                    { icon: "✈", text: "Live flight monitoring & free wait time" },
                                    { icon: "🛡", text: "Vetted, licensed chauffeurs only" },
                                    { icon: "📍", text: "Meet & Greet at arrivals hall" },
                                    { icon: "🧳", text: "Complimentary luggage assistance" },
                                    { icon: "💷", text: "Fixed fare — no surge pricing" },
                                    { icon: "📱", text: "WhatsApp driver dispatch & tracking" },
                                ].map(({ icon, text }) => (
                                    <div key={text} className="flex items-center gap-3 text-sm">
                                        <span className="text-base shrink-0">{icon}</span>
                                        <span className="text-white/60">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick contact */}
                        <div className="grid grid-cols-2 gap-3">
                            <a href="https://wa.me/447412671467" target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 h-12 bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 text-[#25D366] font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                                <MessageSquare className="w-4 h-4" /> WhatsApp
                            </a>
                            <a href="tel:07412671467"
                                className="flex items-center justify-center gap-2 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                                <Phone className="w-4 h-4" /> Call Now
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

