// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import { Link } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
    Plane, MapPin, Clock, Users, ArrowRightLeft, Loader2,
    CheckCircle2, Car, Briefcase, Sparkles, Navigation,
    Calendar, Phone, User, Mail, ChevronRight, ChevronLeft,
    ArrowRight, ShieldCheck, MessageSquare
} from "lucide-react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
mapboxgl.accessToken = MAPBOX_TOKEN;

const AIRPORTS = [
    { name: "Heathrow",   code: "LHR", address: "London Heathrow Airport, Hounslow TW6 1EW", coords: [-0.4543, 51.4700] as [number,number] },
    { name: "Gatwick",    code: "LGW", address: "London Gatwick Airport, Horley RH6 0NP",    coords: [-0.1821, 51.1537] as [number,number] },
    { name: "Stansted",   code: "STN", address: "London Stansted Airport, Stansted CM24 1RW", coords: [0.2389,  51.8860] as [number,number] },
    { name: "Luton",      code: "LTN", address: "London Luton Airport, Luton LU2 9LY",        coords: [-0.3717, 51.8763] as [number,number] },
    { name: "Manchester", code: "MAN", address: "Manchester Airport, Manchester M90 1QX",      coords: [-2.2727, 53.3588] as [number,number] },
    { name: "City",       code: "LCY", address: "London City Airport, London E16 2PX",         coords: [0.0495,  51.5048] as [number,number] },
];

const VEHICLES = [
    { id: "Saloon",    name: "Executive Saloon",  sub: "Mercedes E-Class · BMW 5 Series", base: 65,  perMile: 2.5, pax: 4, icon: Car,      tag: "Most Popular" },
    { id: "Executive", name: "First Class",       sub: "Mercedes S-Class · BMW 7 Series", base: 110, perMile: 3.8, pax: 3, icon: Sparkles, tag: "VIP" },
    { id: "MPV",       name: "Executive MPV",     sub: "Mercedes V-Class XL",             base: 95,  perMile: 3.2, pax: 7, icon: Users,    tag: "Groups" },
    { id: "Estate",    name: "Luxury Estate",     sub: "Mercedes E-Class Estate",         base: 75,  perMile: 2.8, pax: 4, icon: Briefcase, tag: "Extra Luggage" },
];

// ── Mapbox address input ──────────────────────────────────────────────────────
function PlaceInput({ value, onChange, onSelect, placeholder, icon: Icon, dotColor }: {
    value: string; onChange: (v: string) => void;
    onSelect?: (coords: [number,number], addr: string) => void;
    placeholder: string; icon: any; dotColor: "green" | "pink";
}) {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const t = useRef<any>();

    useEffect(() => {
        const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    const search = async (q: string) => {
        if (q.length < 3) { setSuggestions([]); return; }
        setBusy(true);
        try {
            const r = await window.fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&country=gb&types=address,place,poi,postcode&limit=5`);
            const d = await r.json();
            setSuggestions(d.features || []); setOpen(true);
        } finally { setBusy(false); }
    };

    const dot = dotColor === "green" ? "bg-emerald-400" : "bg-pink-500";

    return (
        <div className="relative" ref={ref}>
            <div className="flex items-center gap-3 px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus-within:border-pink-500/50 transition-colors">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
                <input
                    value={value}
                    onChange={e => { onChange(e.target.value); clearTimeout(t.current); t.current = setTimeout(() => search(e.target.value), 350); }}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="flex-1 min-w-0 bg-transparent text-white text-base placeholder:text-white/30 outline-none"
                />
                {busy ? <Loader2 className="w-4 h-4 text-pink-400 animate-spin shrink-0" /> : <Icon className="w-4 h-4 text-white/20 shrink-0" />}
            </div>
            {open && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#100008] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[999]">
                    {suggestions.map(s => (
                        <button key={s.id} type="button" onClick={() => { onChange(s.place_name); onSelect?.([s.center[0], s.center[1]], s.place_name); setSuggestions([]); setOpen(false); }}
                            className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left">
                            <MapPin className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm text-white font-medium truncate">{s.text}</p>
                                <p className="text-xs text-white/40 truncate">{s.place_name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Step progress indicator ───────────────────────────────────────────────────
const STEPS = ["Journey", "Vehicle", "Details", "Confirm"];

function StepBar({ current }: { current: number }) {
    return (
        <div className="flex items-center gap-1 mb-8">
            {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${i < current ? "bg-pink-600 text-white" : i === current ? "bg-white text-black" : "bg-white/10 text-white/30"}`}>
                            {i < current ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${i === current ? "text-white" : "text-white/30"}`}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-px mb-5 transition-all ${i < current ? "bg-pink-600" : "bg-white/10"}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">{label}</label>
            {children}
        </div>
    );
}

function InputField({ icon: Icon, ...props }: any) {
    return (
        <div className="relative">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400 pointer-events-none" />}
            <input {...props} className={`w-full bg-white/5 border border-white/10 rounded-2xl text-white text-sm h-12 pr-4 placeholder:text-white/30 outline-none focus:border-pink-500/50 transition-colors ${Icon ? "pl-11" : "pl-4"}`} />
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Book() {
    const { isSignedIn, user } = useUser();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const pickupMarker = useRef<mapboxgl.Marker | null>(null);
    const dropoffMarker = useRef<mapboxgl.Marker | null>(null);

    const [step, setStep] = useState(0); // 0=Journey 1=Vehicle 2=Details 3=Confirm
    const [done, setDone] = useState(false);

    // Journey
    const [serviceMode, setServiceMode] = useState<"airport"|"point"|"hourly">("airport");
    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [pickupCoords, setPickupCoords] = useState<[number,number]|null>(null);
    const [dropoffCoords, setDropoffCoords] = useState<[number,number]|null>(null);
    const [flightNo, setFlightNo] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [passengers, setPassengers] = useState("1");
    const [isReturn, setIsReturn] = useState(false);
    const [returnDate, setReturnDate] = useState("");
    const [returnTime, setReturnTime] = useState("");

    // Vehicle
    const [vehicle, setVehicle] = useState("Saloon");

    // Details
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [notes, setNotes] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(false);

    const activeTier = VEHICLES.find(v => v.id === vehicle) ?? VEHICLES[0];
    const distance = (() => {
        if (!pickupCoords || !dropoffCoords) return null;
        const R = 3958.8, dLat = (dropoffCoords[1]-pickupCoords[1])*Math.PI/180, dLon = (dropoffCoords[0]-pickupCoords[0])*Math.PI/180;
        const a = Math.sin(dLat/2)**2 + Math.cos(pickupCoords[1]*Math.PI/180)*Math.cos(dropoffCoords[1]*Math.PI/180)*Math.sin(dLon/2)**2;
        return Math.max(3, Math.round(R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a))));
    })();
    const price = distance ? Math.round(activeTier.base + distance * activeTier.perMile) : activeTier.base;

    // Auto-fill from Clerk
    useEffect(() => {
        if (!isSignedIn || !user) return;
        if (!name) setName([user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "");
        if (!email) setEmail(user.primaryEmailAddress?.emailAddress || "");
    }, [isSignedIn, user]);

    // Mapbox init
    useEffect(() => {
        if (map.current || !mapContainer.current) return;
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [-0.1278, 51.5074], zoom: 10, attributionControl: false,
        });
        map.current.on("load", () => {
            map.current!.addSource("route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } } });
            map.current!.addLayer({ id: "route", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#ec4899", "line-width": 4, "line-opacity": 0.9 } });
        });
        return () => { map.current?.remove(); map.current = null; };
    }, []);

    const drawRoute = useCallback(async (from: [number,number], to: [number,number]) => {
        if (!map.current) return;
        try {
            const r = await window.fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`);
            const d = await r.json();
            const coords = d.routes?.[0]?.geometry?.coordinates;
            if (coords && map.current.getSource("route")) {
                (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
            }
        } catch {}
    }, []);

    useEffect(() => {
        if (!map.current) return;
        pickupMarker.current?.remove();
        if (pickupCoords) {
            const el = Object.assign(document.createElement("div"), { style: "width:14px;height:14px;background:#10b981;border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(16,185,129,0.8)" });
            pickupMarker.current = new mapboxgl.Marker({ element: el }).setLngLat(pickupCoords).addTo(map.current!);
        }
        dropoffMarker.current?.remove();
        if (dropoffCoords) {
            const el = Object.assign(document.createElement("div"), { style: "width:14px;height:14px;background:#ec4899;border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(236,72,153,0.8)" });
            dropoffMarker.current = new mapboxgl.Marker({ element: el }).setLngLat(dropoffCoords).addTo(map.current!);
        }
        if (pickupCoords && dropoffCoords) {
            drawRoute(pickupCoords, dropoffCoords);
            map.current.fitBounds(new mapboxgl.LngLatBounds(pickupCoords, pickupCoords).extend(dropoffCoords), { padding: 80, maxZoom: 13, duration: 1000 });
        } else if (pickupCoords) map.current.flyTo({ center: pickupCoords, zoom: 13 });
        else if (dropoffCoords) map.current.flyTo({ center: dropoffCoords, zoom: 13 });
    }, [pickupCoords, dropoffCoords, drawRoute]);

    const swap = () => {
        const [a, b, c, d] = [pickup, dropoff, pickupCoords, dropoffCoords];
        setPickup(b); setDropoff(a); setPickupCoords(d); setDropoffCoords(c);
    };

    const submit = async () => {
        setSubmitting(true); setSubmitError(false);
        try {
            const res = await window.fetch("/api/book", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, isReturn, pickup, dropoff, date, time, returnDate: isReturn ? returnDate : null, returnTime: isReturn ? returnTime : null, passengers, vehicleClass: activeTier.name, notes: `${serviceMode.toUpperCase()} | £${price} est. | ${flightNo ? `Flight: ${flightNo}` : ""} | ${notes}` })
            });
            if (res.ok) setDone(true); else setSubmitError(true);
        } catch { setSubmitError(true); }
        finally { setSubmitting(false); }
    };

    // ── Success ───────────────────────────────────────────────────────────────
    if (done) {
        const msg = encodeURIComponent(`Hi, my booking: ${name} | ${pickup} → ${dropoff} | ${date} ${time} | ${activeTier.name}`);
        return (
            <div className="min-h-screen bg-[#080004] flex flex-col items-center justify-center px-4 py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Booking Received</h2>
                <p className="text-white/50 text-sm mb-8 max-w-xs">Confirmation sent to <span className="text-white">{email}</span>. Our team will confirm your chauffeur shortly.</p>

                <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-5 text-left mb-6 space-y-2">
                    {[["Pick-up", pickup], ["Drop-off", dropoff], ["Date", `${date} at ${time}`], ["Vehicle", activeTier.name], ["Est. Fare", `£${price}`]].map(([l, v]) => (
                        <div key={l} className="flex justify-between gap-3 text-sm border-b border-white/5 last:border-0 py-1.5">
                            <span className="text-white/40 shrink-0">{l}</span>
                            <span className={`font-semibold text-right truncate ${l === "Est. Fare" ? "text-pink-400" : "text-white"}`}>{v}</span>
                        </div>
                    ))}
                </div>

                <div className="w-full max-w-sm flex flex-col gap-3">
                    <a href={`https://wa.me/447412671467?text=${msg}`} target="_blank" rel="noopener noreferrer"
                        className="w-full h-12 bg-[#25D366] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Message on WhatsApp
                    </a>
                    {isSignedIn ? (
                        <Link to="/dashboard" className="w-full h-12 bg-pink-600 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2">
                            View in My Portal <ArrowRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <Link to="/login" className="w-full h-12 bg-white/10 border border-white/10 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2">
                            Sign in to track ride
                        </Link>
                    )}
                    <button onClick={() => { setDone(false); setStep(0); setPickup(""); setDropoff(""); setPickupCoords(null); setDropoffCoords(null); }}
                        className="text-white/30 text-sm hover:text-white transition-colors py-2">
                        Book another journey
                    </button>
                </div>
            </div>
        );
    }

    // ── Main layout ───────────────────────────────────────────────────────────
    const canNext = [
        pickup && dropoff && date && time,
        !!vehicle,
        name && email && phone,
        true,
    ][step];

    return (
        <div className="booking-page">

            {/* Map — full width, fixed height */}
            <div className="booking-map">
                <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080004] pointer-events-none" />
                {/* Live distance chip */}
                {distance && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                        <span className="text-white text-sm font-bold">{distance} miles · <span className="text-pink-400">£{price} est.</span></span>
                    </div>
                )}
            </div>

            {/* Form card — slides over map */}
            <div className="booking-form-wrap">
                <div className="booking-form-shell">

                    <StepBar current={step} />

                    {/* ── STEP 0: Journey ── */}
                    {step === 0 && (
                        <div className="space-y-4">
                            {/* Service type */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: "airport", label: "Airport", icon: Plane },
                                    { id: "point",   label: "Point to Point", icon: Navigation },
                                    { id: "hourly",  label: "By the Hour", icon: Clock },
                                ].map(({ id, label, icon: Icon }) => (
                                    <button key={id} onClick={() => setServiceMode(id as any)}
                                        className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-xs font-bold transition-all ${serviceMode === id ? "bg-pink-600 border-pink-500 text-white" : "border-white/10 text-white/40 hover:text-white hover:border-white/20"}`}>
                                        <Icon className="w-4 h-4" />
                                        <span className="leading-tight text-center">{label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Airport quick chips */}
                            {serviceMode === "airport" && (
                                <div className="flex flex-wrap gap-2">
                                    {AIRPORTS.map(ap => (
                                        <button key={ap.code} onClick={() => { setDropoff(ap.address); setDropoffCoords(ap.coords); }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${dropoff === ap.address ? "bg-pink-600 border-pink-500 text-white" : "border-white/10 text-white/50 hover:border-pink-500/40 hover:text-white"}`}>
                                            <Plane className="w-3 h-3" />{ap.code} · {ap.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Locations */}
                            <div className="space-y-2">
                                <PlaceInput value={pickup} onChange={setPickup} dotColor="green" icon={MapPin}
                                    placeholder="Pick-up — address or postcode"
                                    onSelect={(c, a) => { setPickup(a); setPickupCoords(c); }} />
                                <div className="flex justify-center -my-1">
                                    <button onClick={swap} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-pink-500/40 transition-colors">
                                        <ArrowRightLeft className="w-3.5 h-3.5 text-pink-400 rotate-90" />
                                    </button>
                                </div>
                                <PlaceInput value={dropoff} onChange={setDropoff} dotColor="pink" icon={MapPin}
                                    placeholder="Drop-off — destination"
                                    onSelect={(c, a) => { setDropoff(a); setDropoffCoords(c); }} />
                            </div>

                            {/* Flight number */}
                            {serviceMode === "airport" && (
                                <Field label="Flight Number (optional)">
                                    <InputField icon={Plane} value={flightNo} onChange={(e: any) => setFlightNo(e.target.value)} placeholder="e.g. BA 1482" />
                                </Field>
                            )}

                            {/* Date & time */}
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Date">
                                    <InputField icon={Calendar} type="date" value={date} onChange={(e: any) => setDate(e.target.value)} />
                                </Field>
                                <Field label="Time">
                                    <InputField icon={Clock} type="time" value={time} onChange={(e: any) => setTime(e.target.value)} />
                                </Field>
                            </div>

                            {/* Passengers */}
                            <Field label="Passengers">
                                <div className="flex gap-2">
                                    {["1","2","3","4","5","6","7"].map(n => (
                                        <button key={n} onClick={() => setPassengers(n)}
                                            className={`flex-1 h-10 rounded-xl text-sm font-bold border transition-all ${passengers === n ? "bg-pink-600 border-pink-500 text-white" : "border-white/10 text-white/40 hover:text-white hover:border-white/20"}`}>
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            {/* Return toggle */}
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <div>
                                    <p className="text-sm font-semibold text-white">Return Journey</p>
                                    <p className="text-xs text-white/40">Add return leg</p>
                                </div>
                                <button onClick={() => setIsReturn(p => !p)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${isReturn ? "bg-pink-600" : "bg-white/10"}`}>
                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isReturn ? "translate-x-6" : "translate-x-0.5"}`} />
                                </button>
                            </div>
                            {isReturn && (
                                <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-pink-500/30">
                                    <Field label="Return Date">
                                        <InputField type="date" value={returnDate} onChange={(e: any) => setReturnDate(e.target.value)} />
                                    </Field>
                                    <Field label="Return Time">
                                        <InputField type="time" value={returnTime} onChange={(e: any) => setReturnTime(e.target.value)} />
                                    </Field>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 1: Vehicle ── */}
                    {step === 1 && (
                        <div className="space-y-3">
                            {VEHICLES.map(v => {
                                const Icon = v.icon;
                                const p = distance ? Math.round(v.base + distance * v.perMile) : v.base;
                                const sel = vehicle === v.id;
                                return (
                                    <button key={v.id} onClick={() => setVehicle(v.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${sel ? "bg-pink-600/15 border-pink-500" : "border-white/10 hover:border-white/20"}`}>
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${sel ? "bg-pink-500/20" : "bg-white/5"}`}>
                                            <Icon className={`w-5 h-5 ${sel ? "text-pink-400" : "text-white/40"}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="text-sm font-bold text-white">{v.name}</p>
                                                <span className="text-xs text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full">{v.tag}</span>
                                            </div>
                                            <p className="text-xs text-white/40 truncate">{v.sub}</p>
                                            <p className="text-xs text-white/30">{v.pax} passengers max</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-lg font-black text-pink-400">£{p}</p>
                                            <p className="text-xs text-white/30">est.</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* ── STEP 2: Details ── */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {isSignedIn && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <p className="text-xs text-emerald-400 font-medium">Details auto-filled from your account</p>
                                </div>
                            )}
                            <Field label="Full Name">
                                <InputField icon={User} value={name} onChange={(e: any) => setName(e.target.value)} placeholder="John Smith" required />
                            </Field>
                            <Field label="Email Address">
                                <InputField icon={Mail} type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="john@example.com" required />
                            </Field>
                            <Field label="Phone Number">
                                <InputField icon={Phone} type="tel" value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+44 7000 000000" required />
                            </Field>
                            <Field label="Special Requests (optional)">
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                                    placeholder="e.g. child seat needed, meet & greet required..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl text-white text-sm px-4 py-3 placeholder:text-white/30 outline-none focus:border-pink-500/50 transition-colors resize-none" />
                            </Field>
                        </div>
                    )}

                    {/* ── STEP 3: Confirm ── */}
                    {step === 3 && (
                        <div className="space-y-4">
                            {/* Journey summary */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Journey</p>
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center gap-1 pt-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                                        <span className="w-px flex-1 bg-white/10" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-3">
                                        <div>
                                            <p className="text-xs text-white/40">Pick-up</p>
                                            <p className="text-sm text-white font-medium leading-snug">{pickup}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/40">Drop-off</p>
                                            <p className="text-sm text-white font-medium leading-snug">{dropoff}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                                    {[["Date", date], ["Time", time], ["Pax", passengers]].map(([l, v]) => (
                                        <div key={l} className="text-center">
                                            <p className="text-xs text-white/30">{l}</p>
                                            <p className="text-sm text-white font-semibold">{v}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Vehicle */}
                            <div className="flex items-center gap-4 p-4 bg-pink-500/10 border border-pink-500/20 rounded-2xl">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center shrink-0">
                                    <activeTier.icon className="w-5 h-5 text-pink-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white">{activeTier.name}</p>
                                    <p className="text-xs text-white/40">{activeTier.sub}</p>
                                </div>
                                <p className="text-xl font-black text-pink-400 shrink-0">£{price}</p>
                            </div>

                            {/* Passenger */}
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <p className="text-xs text-white/40 mb-1">Passenger</p>
                                <p className="text-sm font-semibold text-white">{name}</p>
                                <p className="text-xs text-white/40">{email}</p>
                                <p className="text-xs text-white/40">{phone}</p>
                            </div>

                            {submitError && (
                                <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-2xl p-3">
                                    Failed to submit. Call us on 07412671467.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex gap-3 mt-8">
                        {step > 0 && (
                            <button onClick={() => setStep(s => s - 1)}
                                className="flex items-center gap-2 px-5 h-14 rounded-2xl border border-white/10 text-white/60 font-bold text-sm hover:border-white/20 hover:text-white transition-all">
                                <ChevronLeft className="w-4 h-4" /> Back
                            </button>
                        )}
                        <button
                            onClick={() => step < 3 ? setStep(s => s + 1) : submit()}
                            disabled={!canNext || submitting}
                            className="flex-1 h-14 rounded-2xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-widest transition-all shadow-[0_8px_30px_rgba(236,72,153,0.25)] flex items-center justify-center gap-2">
                            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                : step < 3 ? <>{step === 2 ? "Review Booking" : "Continue"} <ChevronRight className="w-4 h-4" /></>
                                : <><ShieldCheck className="w-4 h-4" /> Confirm Booking</>}
                        </button>
                    </div>

                    {step === 3 && (
                        <p className="text-center text-white/30 text-xs mt-4">
                            By confirming you agree to our terms. Questions? <a href="tel:07412671467" className="text-pink-400 underline">Call 07412671467</a>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
