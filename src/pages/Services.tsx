import { ArrowUpRight, BriefcaseBusiness, Camera, MapPin, Plane, Ship, Train } from "lucide-react";
import { Link } from "react-router-dom";
import { SpotlightCard } from "../components/reactbits/SpotlightCard";

const services = [
  {
    title: "Airport transfers",
    icon: Plane,
    description: "Punctual journeys to and from major UK airports. Flight monitoring helps us plan for early arrivals and delays.",
  },
  {
    title: "Cruise port transfers",
    icon: Ship,
    description: "Travel to Southampton, Dover and other UK cruise terminals with a pickup planned around your departure.",
  },
  {
    title: "Station journeys",
    icon: Train,
    description: "A direct, comfortable connection to the station, with pickup timing arranged around your rail travel.",
  },
  {
    title: "Corporate travel",
    icon: BriefcaseBusiness,
    description: "Professional transport for meetings, roadshows and client visits, arranged around your working day.",
  },
  {
    title: "Point-to-point",
    icon: MapPin,
    description: "A private journey across town or further afield, with your destination and pickup agreed in advance.",
  },
  {
    title: "Private tours",
    icon: Camera,
    description: "Explore landmarks at your own pace with a private vehicle and a route shaped around your plans.",
  },
];

export function Services() {
  return (
    <main className="site-page">
      <div className="site-container">
        <header className="page-intro">
          <p className="eyebrow">Our services</p>
          <h1>Good journeys begin with good planning.</h1>
          <p>From airport pickups to business travel, arrange the right vehicle and a clear fare before you set off.</p>
        </header>

        <div className="service-list-grid">
          {services.map(({ title, icon: Icon, description }) => (
            <SpotlightCard key={title} className="service-page-card">
              <Icon aria-hidden="true" size={22} strokeWidth={1.5} />
              <h2>{title}</h2>
              <p>{description}</p>
              <Link to="/book" className="service-card-link">Plan this journey <ArrowUpRight size={15} /></Link>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </main>
  );
}
