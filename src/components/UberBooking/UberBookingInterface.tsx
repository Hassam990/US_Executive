/* eslint-disable react-refresh/only-export-components */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
    MapPin, Calendar, Clock, Users, ArrowRightLeft, Car, Loader2,
    Plane, Sparkles, CheckCircle2, MessageSquare, Briefcase, Check, Navigation,
    ArrowRight, ShieldCheck, User
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const pickupIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const dropoffIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-pink.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function MapBoundsHandler({ pickup, dropoff }: { pickup: [number, number] | null, dropoff: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (pickup && dropoff) {
            const bounds = L.latLngBounds([pickup, dropoff]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        } else if (pickup) {
            map.setView(pickup, 13);
        } else if (dropoff) {
            map.setView(dropoff, 13);
        }
    }, [pickup, dropoff, map]);
    return null;
}

// UK Airport Presets
const AIRPORT_PRESETS = [
    { name: "Heathrow (LHR)", address: "London Heathrow Airport (LHR), Longford, Hounslow", coords: [51.4700, -0.4543] as [number, number], code: "LHR" },
    { name: "Gatwick (LGW)", address: "London Gatwick Airport (LGW), Horley, Gatwick", coords: [51.1537, -0.1821] as [number, number], code: "LGW" },
    { name: "Manchester (MAN)", address: "Manchester Airport (MAN), Manchester", coords: [53.3588, -2.2727] as [number, number], code: "MAN" },
    { name: "London City (LCY)", address: "London City Airport (LCY), Hartmann Rd, London", coords: [51.5048, 0.0495] as [number, number], code: "LCY" },
    { name: "Luton (LTN)", address: "London Luton Airport (LTN), Airport Way, Luton", coords: [51.8763, -0.3717] as [number, number], code: "LTN" },
    { name: "Stansted (STN)", address: "London Stansted Airport (STN), Bassingbourn Rd, Stansted", coords: [51.8860, 0.2389] as [number, number], code: "STN" },
    { name: "Birmingham (BHX)", address: "Birmingham Airport (BHX), Trident Rd, Birmingham", coords: [52.4539, -1.7480] as [number, number], code: "BHX" },
];

// UK City Hub Presets
const CITY_PRESETS = [
    { name: "Central London", address: "Mayfair, London, UK", coords: [51.5100, -0.1500] as [number, number] },
    { name: "Canary Wharf", address: "Canary Wharf, London, UK", coords: [51.5054, -0.0235] as [number, number] },
    { name: "Manchester City", address: "Manchester City Centre, UK", coords: [53.4808, -2.2426] as [number, number] },
    { name: "Birmingham City", address: "Birmingham City Centre, UK", coords: [52.4862, -1.8904] as [number, number] },
];

// Luxury Fleet Categories
interface VehicleTier {
    id: string;
    name: string;
    models: string;
    tag: string;
    basePrice: number;
    perMile: number;
    pax: number;
    bags: number;
    features: string[];
    icon: React.ForwardRefExoticComponent<Omit<React.SVGProps<SVGSVGElement>, 'ref'> & React.RefAttributes<SVGSVGElement>>;
}

export const VEHICLE_TIERS: VehicleTier[] = [
    {
        id: "Saloon",
        name: "Executive Saloon",
        models: "Mercedes E-Class · BMW 5 Series",
        tag: "Most Popular",
        basePrice: 65,
        perMile: 2.5,
        pax: 4,
        bags: 2,
        features: ["Free Wi-Fi", "Bottled Water", "Phone Charger", "Climate Control"],
        icon: Car
    },
    {
        id: "Executive",
        name: "First Class Luxury",
        models: "Mercedes S-Class · BMW 7 Series",
        tag: "VIP Luxury",
        basePrice: 110,
        perMile: 3.8,
        pax: 3,
        bags: 2,
        features: ["Reclining Massage Seats", "Panoramic Sunroof", "Chauffeur Meet & Greet", "Privacy Curtains"],
        icon: Sparkles
    },
    {
        id: "MPV",
        name: "Executive MPV / Van",
        models: "Mercedes V-Class Extra Long",
        tag: "Groups & Extra Luggage",
        basePrice: 95,
        perMile: 3.2,
        pax: 7,
        bags: 7,
        features: ["Conference Seating", "Ample Luggage Bay", "USB Ports Each Seat", "Complimentary Refreshments"],
        icon: Users
    },
    {
        id: "Estate",
        name: "Luxury Estate",
        models: "Mercedes E-Class Estate · Audi A6 Avant",
        tag: "Spacious Comfort",
        basePrice: 75,
        perMile: 2.8,
        pax: 4,
        bags: 4,
        features: ["Extended Boot Capacity", "Leather Upholstery", "Quiet Cabin", "Refreshments"],
        icon: Briefcase
    }
];

function AddressSearchInput({
    value,
    onChange,
    onLocationSelect,
    placeholder,
    label,
    dotColor = "pink",
    icon: Icon = MapPin
}: {
    value: string;
    onChange: (val: string) => void;
    onLocationSelect?: (lat: number, lon: number, address: string) => void;
    placeholder: string;
    label: string;
    dotColor?: "green" | "pink";
    icon?: React.ForwardRefExoticComponent<Omit<React.SVGProps<SVGSVGElement>, 'ref'> & React.RefAttributes<SVGSVGElement>>;
}) {
    const [suggestions, setSuggestions] = useState<Record<string, string>[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gb&addressdetails=1&limit=5`);
            const data = await res.json();
            setSuggestions(data || []);
            setIsOpen(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            fetchSuggestions(val);
        }, 400);
    };

    const handleSelect = (s: Record<string, string>) => {
        onChange(s.display_name);
        if (onLocationSelect) {
            onLocationSelect(parseFloat(s.lat), parseFloat(s.lon), s.display_name);
        }
        setIsOpen(false);
        setSuggestions([]);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dotColor === 'green' ? 'bg-emerald-400 ring-2 ring-emerald-500/30' : 'bg-pink-500 ring-2 ring-pink-500/30'}`} />
                    {label}
                </span>
            </div>
            <div className="relative">
                <Icon className={`absolute left-3.5 top-3.5 w-5 h-5 ${dotColor === 'green' ? 'text-emerald-400' : 'text-pink-400'}`} />
                <Input
                    value={value}
                    onChange={handleInput}
                    onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
                    required
                    placeholder={placeholder}
                    autoComplete="off"
                    className="pl-11 pr-10 bg-black/60 border-white/10 text-white font-medium placeholder:text-white/30 h-12 focus-visible:ring-pink-500 rounded-xl text-sm transition-all focus:border-pink-500/50"
                />
                {loading && <Loader2 className="absolute right-3 top-3.5 w-5 h-5 text-pink-400 animate-spin" />}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-[1001] w-full mt-2 bg-[#120008]/95 backdrop-blur-2xl border border-pink-500/30 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden">
                    {suggestions.map((s, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSelect(s)}
                            className="px-4 py-3 hover:bg-pink-600/20 cursor-pointer border-b border-white/5 last:border-0 transition-colors flex items-start gap-3"
                        >
                            <MapPin className="w-4 h-4 text-pink-500/70 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-white/90 leading-tight">
                                {s.display_name}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function UberBookingInterface({ isCompact = false }: { isCompact?: boolean }) {
    const { isSignedIn, user } = useUser();

    // Booking Service Mode
    const [serviceMode, setServiceMode] = useState<"airport" | "point" | "hourly">("airport");
    
    // Journey details
    const [isReturn, setIsReturn] = useState(false);
    const [meetAndGreet, setMeetAndGreet] = useState(true);
    const [selectedTier, setSelectedTier] = useState<string>("Saloon");
    
    // Form fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [returnTime, setReturnTime] = useState("");
    const [passengers, setPassengers] = useState("1");
    const [flightNumber, setFlightNumber] = useState("");
    const [hours, setHours] = useState("4");
    const [specialNotes, setSpecialNotes] = useState("");

    // Map Coordinates
    const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
    const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
    
    // Status
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [lastBookingId, setLastBookingId] = useState<number | null>(null);

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

    // Swap pickup and dropoff
    const handleSwapLocations = () => {
        const tempAddr = pickup;
        const tempCoords = pickupCoords;
        setPickup(dropoff);
        setPickupCoords(dropoffCoords);
        setDropoff(tempAddr);
        setDropoffCoords(tempCoords);
    };

    // Calculate approximate distance
    const calculateDistance = (): number | null => {
        if (!pickupCoords || !dropoffCoords) return null;
        const [lat1, lon1] = pickupCoords;
        const [lat2, lon2] = dropoffCoords;
        const R = 3958.8; // Radius of Earth in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.max(3, Math.round(R * c)); // minimum 3 miles
    };

    const distanceMiles = calculateDistance();
    const activeTier = VEHICLE_TIERS.find(t => t.id === selectedTier) || VEHICLE_TIERS[0];
    
    // Price estimation
    const calculatePrice = () => {
        if (serviceMode === "hourly") {
            const h = parseInt(hours) || 4;
            const ratePerHour = activeTier.id === "Executive" ? 65 : activeTier.id === "MPV" ? 60 : 45;
            return h * ratePerHour;
        }
        const dist = distanceMiles || 15;
        let price = activeTier.basePrice + (dist * activeTier.perMile);
        if (meetAndGreet && serviceMode === "airport") price += 15;
        if (isReturn) price = price * 1.9; // 10% discount on return
        return Math.round(price);
    };

    const estimatedPrice = calculatePrice();

    // Fast Preset Handler
    const handleSelectAirportPreset = (preset: typeof AIRPORT_PRESETS[0], isPickupDirection: boolean) => {
        if (isPickupDirection) {
            setPickup(preset.address);
            setPickupCoords(preset.coords);
        } else {
            setDropoff(preset.address);
            setDropoffCoords(preset.coords);
        }
    };

    // Form Submission to Supabase
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        const fullPickup = flightNumber ? `${pickup} (Flight: ${flightNumber})` : pickup;
        const fullDropoff = serviceMode === "hourly" ? `${dropoff || 'As Directed'} (${hours} Hours Hire)` : dropoff;

        const payload = {
            name,
            email,
            phone,
            isReturn,
            pickup: fullPickup,
            dropoff: fullDropoff,
            date,
            time,
            returnDate: isReturn ? returnDate : null,
            returnTime: isReturn ? returnTime : null,
            passengers,
            vehicleClass: activeTier.name,
            notes: `${serviceMode.toUpperCase()} | Estimated Fare: £${estimatedPrice} | ${meetAndGreet ? 'Meet & Greet Included' : ''} | ${specialNotes}`
        };

        try {
            const res = await fetch("/api/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setLastBookingId(data.id || Math.floor(Math.random() * 8000) + 1000);
                setStatus("success");
            } else {
                setStatus("error");
            }
        } catch (err) {
            console.error("Booking error:", err);
            setStatus("error");
        }
    };

    const defaultCenter: [number, number] = pickupCoords || dropoffCoords || [51.5074, -0.1278]; // London

    return (
        <div className={`w-full bg-[#0a0005]/95 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative z-20 ${isCompact ? '' : 'max-w-6xl mx-auto'}`}>
            {/* Top Bar with Mode Switcher */}
            <div className="bg-gradient-to-r from-pink-950/60 via-black to-black border-b border-white/10 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                        <Car className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                            Bespoke <span className="text-pink-500">Executive</span> Booking
                        </h2>
                        <p className="text-white/50 text-xs font-semibold tracking-wider uppercase">
                            Instant chauffeur dispatch · Verified transparent pricing
                        </p>
                    </div>
                </div>

                {/* Service Modes */}
                <div className="flex items-center bg-black/60 p-1 rounded-2xl border border-white/10">
                    <button
                        type="button"
                        onClick={() => setServiceMode("airport")}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            serviceMode === "airport" 
                            ? "bg-pink-600 text-white shadow-lg shadow-pink-600/30" 
                            : "text-white/60 hover:text-white"
                        }`}
                    >
                        <Plane className="w-3.5 h-3.5" />
                        Airport
                    </button>
                    <button
                        type="button"
                        onClick={() => setServiceMode("point")}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            serviceMode === "point" 
                            ? "bg-pink-600 text-white shadow-lg shadow-pink-600/30" 
                            : "text-white/60 hover:text-white"
                        }`}
                    >
                        <Navigation className="w-3.5 h-3.5" />
                        Point to Point
                    </button>
                    <button
                        type="button"
                        onClick={() => setServiceMode("hourly")}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            serviceMode === "hourly" 
                            ? "bg-pink-600 text-white shadow-lg shadow-pink-600/30" 
                            : "text-white/60 hover:text-white"
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        By the Hour
                    </button>
                </div>
            </div>

            {/* Fast Preset Chips (Airport & City Hubs) */}
            <div className="bg-white/[0.02] border-b border-white/5 px-4 sm:px-6 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 shrink-0 flex items-center gap-1 mr-1">
                    <Sparkles className="w-3 h-3" /> Fast Options:
                </span>
                {AIRPORT_PRESETS.map((ap) => (
                    <button
                        key={ap.code}
                        type="button"
                        onClick={() => handleSelectAirportPreset(ap, false)}
                        className="shrink-0 px-3 py-1.5 rounded-full bg-white/5 hover:bg-pink-600/20 hover:border-pink-500/40 border border-white/10 text-white/80 hover:text-white text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plane className="w-3 h-3 text-pink-400" />
                        {ap.name}
                    </button>
                ))}
                {CITY_PRESETS.map((city) => (
                    <button
                        key={city.name}
                        type="button"
                        onClick={() => {
                            setDropoff(city.address);
                            setDropoffCoords(city.coords);
                        }}
                        className="shrink-0 px-3 py-1.5 rounded-full bg-white/5 hover:bg-pink-600/20 hover:border-pink-500/40 border border-white/10 text-white/80 hover:text-white text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <MapPin className="w-3 h-3 text-pink-400" />
                        {city.name}
                    </button>
                ))}
            </div>

            {/* Main Interactive Grid */}
            <div className={`grid ${isCompact ? 'grid-cols-1' : 'lg:grid-cols-12'} gap-0`}>
                {/* Left Controls & Form */}
                <div className={`${isCompact ? 'col-span-1' : 'lg:col-span-7'} p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-white/10`}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Locations Block (connected line) */}
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 relative">
                            <div className="space-y-4 relative">
                                <AddressSearchInput
                                    label="Pick-Up Location"
                                    placeholder="Enter UK address, postcode or hotel..."
                                    value={pickup}
                                    onChange={setPickup}
                                    onLocationSelect={(lat, lon, addr) => {
                                        setPickup(addr);
                                        setPickupCoords([lat, lon]);
                                    }}
                                    dotColor="green"
                                    icon={MapPin}
                                />

                                {/* Swap Button */}
                                <div className="flex justify-end -my-2 relative z-10">
                                    <button
                                        type="button"
                                        onClick={handleSwapLocations}
                                        title="Swap pick-up and drop-off"
                                        className="w-8 h-8 rounded-full bg-black/80 border border-pink-500/30 hover:border-pink-500 text-pink-300 hover:text-white flex items-center justify-center transition-all shadow-md hover:scale-110 cursor-pointer"
                                    >
                                        <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
                                    </button>
                                </div>

                                {serviceMode === "hourly" ? (
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-pink-500" />
                                            Charter Duration
                                        </span>
                                        <select
                                            value={hours}
                                            onChange={(e) => setHours(e.target.value)}
                                            className="w-full px-4 h-12 bg-black/60 border border-white/10 rounded-xl text-white font-medium text-sm focus:border-pink-500 focus:outline-none cursor-pointer"
                                        >
                                            <option value="2" className="bg-black">2 Hours (Local Directed)</option>
                                            <option value="4" className="bg-black">4 Hours (Half Day)</option>
                                            <option value="8" className="bg-black">8 Hours (Full Day Executive)</option>
                                            <option value="12" className="bg-black">12 Hours (Extended Roadshow)</option>
                                        </select>
                                    </div>
                                ) : (
                                    <AddressSearchInput
                                        label="Destination / Drop-off"
                                        placeholder="Enter destination, airport terminal or landmark..."
                                        value={dropoff}
                                        onChange={setDropoff}
                                        onLocationSelect={(lat, lon, addr) => {
                                            setDropoff(addr);
                                            setDropoffCoords([lat, lon]);
                                        }}
                                        dotColor="pink"
                                        icon={MapPin}
                                    />
                                )}
                            </div>

                            {/* Airport Mode Features */}
                            {serviceMode === "airport" && (
                                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-white/70 text-xs font-semibold mb-1 block">Flight Number (Optional)</Label>
                                        <div className="relative">
                                            <Plane className="w-4 h-4 text-pink-400 absolute left-3 top-3.5" />
                                            <Input
                                                placeholder="e.g. BA 1482 / EK 019"
                                                value={flightNumber}
                                                onChange={(e) => setFlightNumber(e.target.value)}
                                                className="pl-9 h-11 bg-black/40 border-white/10 text-white text-xs rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-start gap-3 pt-6">
                                        <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer font-medium">
                                            <input
                                                type="checkbox"
                                                checked={meetAndGreet}
                                                onChange={(e) => setMeetAndGreet(e.target.checked)}
                                                className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 bg-black/50 border-white/20"
                                            />
                                            Meet & Greet in Arrivals (+£15)
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Date, Time & Return Toggle */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-white font-semibold text-xs uppercase tracking-wider">Date of Journey</Label>
                                <div className="relative">
                                    <Calendar className="w-4 h-4 text-pink-400 absolute left-3 top-4 pointer-events-none" />
                                    <Input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="pl-9 h-12 bg-black/60 border-white/10 text-white rounded-xl text-sm [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-white font-semibold text-xs uppercase tracking-wider">Pick-Up Time</Label>
                                <div className="relative">
                                    <Clock className="w-4 h-4 text-pink-400 absolute left-3 top-4 pointer-events-none" />
                                    <Input
                                        type="time"
                                        required
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="pl-9 h-12 bg-black/60 border-white/10 text-white rounded-xl text-sm [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Return Journey Toggle */}
                        <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/10 rounded-xl">
                            <div className="flex items-center gap-2">
                                <ArrowRightLeft className="w-4 h-4 text-pink-400" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Add Return Journey</span>
                                <span className="text-[10px] text-pink-400 font-semibold bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">10% OFF</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={isReturn}
                                onChange={(e) => setIsReturn(e.target.checked)}
                                className="w-5 h-5 rounded text-pink-600 focus:ring-pink-500 bg-black/50 border-white/20 cursor-pointer"
                            />
                        </div>

                        {isReturn && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-pink-950/20 border border-pink-500/30 rounded-2xl animate-in fade-in">
                                <div className="space-y-1.5">
                                    <Label className="text-pink-300 font-semibold text-xs uppercase">Return Date</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={returnDate}
                                        onChange={(e) => setReturnDate(e.target.value)}
                                        className="h-12 bg-black/60 border-pink-500/30 text-white rounded-xl text-sm [color-scheme:dark]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-pink-300 font-semibold text-xs uppercase">Return Time</Label>
                                    <Input
                                        type="time"
                                        required
                                        value={returnTime}
                                        onChange={(e) => setReturnTime(e.target.value)}
                                        className="h-12 bg-black/60 border-pink-500/30 text-white rounded-xl text-sm [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Executive Vehicle Tiers Grid */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-white font-bold text-sm uppercase tracking-wider">Select Vehicle Class</Label>
                                <span className="text-xs text-pink-400 font-medium">All luxury vetted fleet</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {VEHICLE_TIERS.map((tier) => {
                                    const isSelected = selectedTier === tier.id;
                                    const TierIcon = tier.icon;
                                    return (
                                        <div
                                            key={tier.id}
                                            onClick={() => setSelectedTier(tier.id)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                                                isSelected 
                                                ? "bg-pink-600/15 border-pink-500 shadow-[0_0_25px_rgba(236,72,153,0.25)] ring-1 ring-pink-500" 
                                                : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                                            }`}
                                        >
                                            {tier.tag && (
                                                <span className={`absolute top-2 right-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                    isSelected ? "bg-pink-500 text-white" : "bg-white/10 text-white/60"
                                                }`}>
                                                    {tier.tag}
                                                </span>
                                            )}

                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-pink-500 text-white' : 'bg-white/5 text-pink-400'}`}>
                                                        <TierIcon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-white leading-tight">{tier.name}</h4>
                                                        <p className="text-[10px] text-white/40">{tier.models}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 text-[11px] text-white/60 my-2">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3 text-pink-400" /> {tier.pax} Pax
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase className="w-3 h-3 text-pink-400" /> {tier.bags} Bags
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-xs text-white/50 font-medium">Estimated</span>
                                                <span className="text-base font-black text-white">
                                                    £{serviceMode === "hourly" ? (tier.id === "Executive" ? 65 : tier.id === "MPV" ? 60 : 45) * parseInt(hours) : Math.round(tier.basePrice + ((distanceMiles || 15) * tier.perMile) * (isReturn ? 1.9 : 1))}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Passengers Selector */}
                        <div className="space-y-3">
                            <Label className="text-white font-bold text-sm uppercase tracking-wider">Number of Passengers</Label>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPassengers(Math.max(1, parseInt(passengers) - 1).toString())}
                                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                                    >−</button>
                                    <span className="text-white font-black text-xl w-8 text-center">{passengers}</span>
                                    <button
                                        type="button"
                                        onClick={() => setPassengers((parseInt(passengers) + 1).toString())}
                                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                                    >+</button>
                                </div>
                                <span className="text-xs text-white/40 uppercase tracking-widest">Passengers</span>
                            </div>
                        </div>

                        {/* Passenger Contact Information */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-white font-bold text-sm uppercase tracking-wider">Passenger Information</Label>
                                {isSignedIn ? (
                                    <span className="text-[11px] text-pink-400 font-bold flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3" /> Auto-filled from Account
                                    </span>
                                ) : (
                                    <Link to="/login" className="text-[11px] text-pink-400 hover:text-pink-300 font-bold uppercase tracking-wider">
                                        Log in to auto-fill →
                                    </Link>
                                )}
                            </div>

                            {/* Account Status Badge */}
                            {isSignedIn ? (
                                <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-3 flex items-center gap-3 text-xs text-white">
                                    <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
                                    <div>
                                        <span className="font-bold text-pink-300">
                                            Logged in as {user?.firstName || user?.fullName || 'Executive Member'}
                                        </span>
                                        <p className="text-white/60 text-[11px]">
                                            Details auto-filled. You can edit them if booking on behalf of someone else.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2 text-white/70">
                                        <User className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                                        <span>Booking as Guest • No account needed.</span>
                                    </div>
                                    <span className="text-[10px] text-white/40 uppercase tracking-wider">
                                        Receipt sent to email
                                    </span>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <Input
                                        placeholder="Full Name"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-12 bg-black/60 border-white/10 text-white rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="tel"
                                        placeholder="Phone Number (e.g. 07123...)"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="h-12 bg-black/60 border-white/10 text-white rounded-xl text-sm"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Input
                                        type="email"
                                        placeholder="Email Address"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-12 bg-black/60 border-white/10 text-white rounded-xl text-sm"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Input
                                        type="text"
                                        placeholder="Special Notes (Optional)"
                                        value={specialNotes}
                                        onChange={(e) => setSpecialNotes(e.target.value)}
                                        className="h-12 bg-black/60 border-white/10 text-white rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={status === "loading"}
                            className="w-full h-14 bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600 hover:from-pink-500 hover:to-pink-400 text-white font-black text-lg uppercase tracking-wider rounded-xl shadow-[0_10px_35px_rgba(236,72,153,0.35)] transition-all hover:scale-[1.01] cursor-pointer"
                        >
                            {status === "loading" ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" /> Confirming Chauffeur Booking...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Confirm Executive Booking &middot; Est. &pound;{estimatedPrice}
                                </span>
                            )}
                        </Button>

                        {status === "error" && (
                            <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-center text-red-400 text-xs font-semibold">
                                An error occurred while submitting your booking request. Please check your network or WhatsApp us directly.
                            </div>
                        )}
                    </form>
                </div>

                {/* Right Interactive Map & Live Trip Summary */}
                <div className={`${isCompact ? 'col-span-1' : 'lg:col-span-5'} flex flex-col justify-between bg-black/40`}>
                    {/* Live Interactive Leaflet Map */}
                    <div className="w-full h-[320px] lg:h-[400px] relative border-b border-white/10 overflow-hidden">
                        <MapContainer 
                            center={defaultCenter} 
                            zoom={11} 
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                attribution='&copy; OpenStreetMap contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapBoundsHandler pickup={pickupCoords} dropoff={dropoffCoords} />

                            {pickupCoords && (
                                <Marker position={pickupCoords} icon={pickupIcon}>
                                    <Popup><strong>Pick-up:</strong> {pickup}</Popup>
                                </Marker>
                            )}

                            {dropoffCoords && (
                                <Marker position={dropoffCoords} icon={dropoffIcon}>
                                    <Popup><strong>Drop-off:</strong> {dropoff}</Popup>
                                </Marker>
                            )}

                            {pickupCoords && dropoffCoords && (
                                <Polyline 
                                    positions={[pickupCoords, dropoffCoords]} 
                                    color="#ec4899" 
                                    weight={4} 
                                    dashArray="8, 8" 
                                    opacity={0.8}
                                />
                            )}
                        </MapContainer>

                        {/* Floating Live Overlay */}
                        <div className="absolute top-4 left-4 z-[1000] bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-xs text-white flex items-center gap-2 shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-bold">{distanceMiles ? `${distanceMiles} miles route` : 'Live UK Coverage'}</span>
                            <span className="text-white/40">&middot;</span>
                            <span className="text-pink-400 font-semibold">{serviceMode.toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Live Price & Inclusions Card */}
                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                <div>
                                    <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Estimated Trip Total</p>
                                    <h3 className="text-3xl font-black text-white">&pound;{estimatedPrice}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold uppercase tracking-wider border border-pink-500/30">
                                        {activeTier.name}
                                    </span>
                                    <p className="text-[10px] text-white/40 mt-1">Fixed Quote &middot; No Surge</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs text-white/70">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>60 Minutes Free Airport Wait Time</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Live Automated Flight Tracking</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Suited Professional Chauffeur</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Complimentary Bottled Water & Wi-Fi</span>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp Fast Dispatch Button */}
                        <Button
                            type="button"
                            onClick={() => {
                                const msg = encodeURIComponent(
                                    `*NEW EXECUTIVE CHAUFFEUR BOOKING INQUIRY*\n` +
                                    `Service: ${serviceMode.toUpperCase()}\n` +
                                    `Vehicle: ${activeTier.name}\n` +
                                    `Pick-up: ${pickup || 'TBD'}\n` +
                                    `Drop-off: ${dropoff || 'TBD'}\n` +
                                    `Date & Time: ${date} at ${time}\n` +
                                    (isReturn ? `Return: ${returnDate} at ${returnTime}\n` : '') +
                                    (flightNumber ? `Flight: ${flightNumber}\n` : '') +
                                    `Est. Total: £${estimatedPrice}\n` +
                                    `Passenger: ${name || 'Inquiry'} (${phone || 'N/A'})`
                                );
                                window.open(`https://wa.me/447412671467?text=${msg}`, '_blank');
                            }}
                            className="w-full h-12 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm tracking-wide rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <MessageSquare className="w-4 h-4 fill-current" />
                            Instant Dispatch via WhatsApp (07412671467)
                        </Button>
                    </div>
                </div>
            </div>

            {/* Success Modal / Banner */}
            {status === "success" && (
                <div className="absolute inset-0 z-[2000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="max-w-md w-full bg-[#120008] border border-pink-500/40 rounded-3xl p-8 text-center space-y-6 shadow-[0_0_80px_rgba(236,72,153,0.3)]">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                            <Check className="w-8 h-8" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">Booking Confirmed</span>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1">Chauffeur Reserved</h3>
                            <p className="text-xs text-white/60 mt-2 leading-relaxed">
                                Your executive booking reference is <strong className="text-pink-400">#USE-{lastBookingId}</strong>. It has been registered in our database and a confirmation has been dispatched.
                            </p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-left text-xs space-y-1.5 text-white/80">
                            <p><strong>Route:</strong> {pickup} &rarr; {dropoff}</p>
                            <p><strong>Vehicle:</strong> {activeTier.name}</p>
                            <p><strong>Date & Time:</strong> {date} at {time}</p>
                            <p><strong>Fare:</strong> &pound;{estimatedPrice} (Fixed)</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {isSignedIn ? (
                                <Link to="/dashboard" className="w-full">
                                    <Button
                                        type="button"
                                        className="w-full h-12 bg-pink-600 hover:bg-pink-500 text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(236,72,153,0.35)]"
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        View & Track in My Portal <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <Link to="/login" className="w-full">
                                    <Button
                                        type="button"
                                        className="w-full h-12 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2"
                                    >
                                        Log in to Track in Portal <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            )}

                            <Button
                                type="button"
                                onClick={() => {
                                    const msg = encodeURIComponent(`Hello, I just placed booking #USE-${lastBookingId} for ${name}. Pick-up: ${pickup} on ${date} at ${time}.`);
                                    window.open(`https://wa.me/447412671467?text=${msg}`, '_blank');
                                }}
                                className="w-full h-12 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl flex items-center justify-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4 fill-current" />
                                Track / Message via WhatsApp
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setStatus("idle");
                                    setPickup("");
                                    setDropoff("");
                                }}
                                className="w-full h-11 border-white/20 text-white/70 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                            >
                                Book Another Journey
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
