import { useEffect, useState } from "react";
import { ArrowRight, CarFront, MapPin, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useChatWidget } from "@/components/chat/ChatContext";

type DriverProfile = {
    id: string;
    display_name: string;
    headline?: string;
    bio?: string;
    base_location?: string;
    photo_url?: string | null;
    vehicle?: { make?: string; model?: string; year?: string; colour?: string; category?: string };
    services?: string[];
};

export function Drivers() {
    const [drivers, setDrivers] = useState<DriverProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { openChat } = useChatWidget();

    useEffect(() => {
        let active = true;
        fetch("/api/drivers")
            .then(async (response) => {
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.message || "Driver profiles are temporarily unavailable.");
                if (active) setDrivers(result.drivers || []);
            })
            .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Driver profiles are temporarily unavailable."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    return (
        <main className="drivers-page">
            <section className="drivers-hero">
                <div className="drivers-hero-glow" aria-hidden="true" />
                <div className="drivers-hero-inner">
                    <p className="drivers-eyebrow"><span /> The people behind every journey</p>
                    <h1>Meet our <em>drivers.</em></h1>
                    <p className="drivers-hero-copy">Professional chauffeurs who bring calm, care and local knowledge to every mile.</p>
                    <a href="#driver-directory" className="drivers-hero-link">Explore the team <ArrowRight size={16} /></a>
                </div>
            </section>

            <section id="driver-directory" className="drivers-directory site-container">
                <div className="drivers-section-heading">
                    <div><p className="drivers-eyebrow">US Executive Travel</p><h2>Our chauffeurs</h2></div>
                    <span>{drivers.length ? `${drivers.length} ${drivers.length === 1 ? "driver" : "drivers"}` : "Growing our team"}</span>
                </div>

                {loading && <div className="drivers-loading" role="status">Loading driver profiles…</div>}
                {error && <div className="drivers-error" role="alert">{error}</div>}
                {!loading && !error && drivers.length === 0 && (
                    <div className="drivers-empty-state">
                        <div className="drivers-empty-art"><UserRound size={32} /><span /></div>
                        <p className="drivers-eyebrow">A team in the making</p>
                        <h3>Our driver profiles are on the way.</h3>
                        <p>We’re welcoming experienced chauffeurs to the team. In the meantime, our management team is here to help with your journey.</p>
                        <div className="drivers-empty-actions">
                            <button type="button" onClick={() => openChat({ type: "support" })}><MessageCircle size={17} /> Ask our team</button>
                            <Link to="/apply">Drive with us <ArrowRight size={15} /></Link>
                        </div>
                    </div>
                )}

                {!loading && drivers.length > 0 && (
                    <div className="drivers-grid">
                        {drivers.map((driver) => {
                            const vehicle = driver.vehicle || {};
                            const vehicleLabel = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
                            return (
                                <article className="driver-public-card" key={driver.id}>
                                    <div className="driver-public-photo">
                                        {driver.photo_url ? <img src={driver.photo_url} alt={driver.display_name} loading="lazy" referrerPolicy="no-referrer" /> : <div className="driver-public-initials">{driver.display_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div>}
                                        <span className="driver-public-badge"><ShieldCheck size={13} /> Professional chauffeur</span>
                                    </div>
                                    <div className="driver-public-content">
                                        <div className="driver-public-heading"><div><p className="drivers-eyebrow">Chauffeur</p><h3>{driver.display_name}</h3></div></div>
                                        {driver.headline && <p className="driver-public-headline">{driver.headline}</p>}
                                        <p className="driver-public-bio">{driver.bio}</p>
                                        <div className="driver-public-details">
                                            {driver.base_location && <span><MapPin size={15} /> {driver.base_location}</span>}
                                            {vehicleLabel && <span><CarFront size={15} /> {vehicleLabel}{vehicle.category ? ` · ${vehicle.category}` : ""}</span>}
                                        </div>
                                        {!!driver.services?.length && <div className="driver-public-services">{driver.services.map((service) => <span key={service}>{service}</span>)}</div>}
                                        <button type="button" className="driver-chat-button" onClick={() => openChat({ type: "driver", driverId: driver.id, driverName: driver.display_name })}>Message driver <MessageCircle size={16} /></button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
