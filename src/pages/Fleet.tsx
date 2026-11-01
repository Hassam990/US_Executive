import { ArrowUpRight, Briefcase, Check, Users } from "lucide-react";
import { Link } from "react-router-dom";

const fleet = [
  {
    class: "Business class",
    models: "Mercedes E-Class · BMW 5 Series · Audi A6",
    description: "A comfortable, well-appointed choice for airport transfers, meetings and longer journeys.",
    passengers: 3,
    bags: 2,
    features: ["Leather interior", "Climate control", "Privacy glass", "Wi-Fi"],
  },
  {
    class: "First class",
    models: "Mercedes S-Class · BMW 7 Series · Audi A8",
    description: "Extra space and refinement for executive travel, important occasions and a quieter ride.",
    passengers: 3,
    bags: 2,
    features: ["Extra legroom", "Comfort seating", "Panoramic roof", "Premium audio"],
  },
  {
    class: "Executive MPV",
    models: "Mercedes V-Class",
    description: "Room for groups and additional luggage, suited to family airport trips and event travel.",
    passengers: 7,
    bags: 7,
    features: ["Conference seating", "Luggage space", "Sliding doors", "USB charging"],
  },
];

export function Fleet() {
  return (
    <main className="site-page">
      <div className="site-container">
        <header className="page-intro">
          <p className="eyebrow">The fleet</p>
          <h1>Choose the space your journey needs.</h1>
          <p>Comfortable, carefully maintained vehicles for solo travel, executive journeys and groups.</p>
        </header>

        <div className="fleet-list">
          {fleet.map((vehicle) => (
            <article className="fleet-item" key={vehicle.class}>
              <div className="fleet-class-panel">
                <span>US Executive Travel</span>
                <div>
                  <h2>{vehicle.class}</h2>
                  <p>{vehicle.models}</p>
                </div>
              </div>
              <div className="fleet-details">
                <div className="fleet-capacity">
                  <span><Users size={16} /> Up to {vehicle.passengers} passengers</span>
                  <span><Briefcase size={16} /> Up to {vehicle.bags} bags</span>
                </div>
                <p>{vehicle.description}</p>
                <div className="fleet-feature-list">
                  {vehicle.features.map((feature) => (
                    <span key={feature}><Check size={14} /> {feature}</span>
                  ))}
                </div>
                <Link to="/book" className="fleet-request-link">Request this class <ArrowUpRight size={15} /></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
