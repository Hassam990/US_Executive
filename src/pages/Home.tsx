import { lazy, Suspense, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, BriefcaseBusiness, Plane, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Hero } from "../components/Hero";
import { SpotlightCard } from "../components/reactbits/SpotlightCard";

gsap.registerPlugin(ScrollTrigger);

const RouteScene = lazy(() =>
  import("../components/RouteScene").then((module) => ({ default: module.RouteScene })),
);

const services = [
  {
    number: "01",
    title: "Airport journeys",
    description: "Door-to-terminal transfers with flight-aware pickup planning and room for your luggage.",
    icon: Plane,
    link: "/services",
  },
  {
    number: "02",
    title: "Business travel",
    description: "A discreet, dependable ride for meetings, roadshows and important client visits.",
    icon: BriefcaseBusiness,
    link: "/services",
  },
  {
    number: "03",
    title: "Special occasions",
    description: "Thoughtful transport for evenings, celebrations and journeys worth taking your time over.",
    icon: Sparkles,
    link: "/services",
  },
];

export function Home() {
  const homeRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!homeRef.current) return;

    const context = gsap.context(() => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const reveals = gsap.utils.toArray<HTMLElement>(".home-reveal");
        reveals.forEach((element) => {
          gsap.fromTo(element, { y: 24, autoAlpha: 0 }, {
            y: 0,
            autoAlpha: 1,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
          });
        });
      });

      return () => media.revert();
    }, homeRef);

    return () => context.revert();
  }, []);

  return (
    <main ref={homeRef} className="site-main home-page">
      <Hero />

      <section id="services" className="site-section services-overview">
        <div className="site-container">
          <div className="section-heading home-reveal">
            <div>
              <p className="eyebrow">Travel, made straightforward</p>
              <h2>Considered journeys for every occasion.</h2>
            </div>
            <Link to="/services" className="text-link">View all services <ArrowUpRight size={16} /></Link>
          </div>

          <div className="service-card-grid">
            {services.map(({ number, title, description, icon: Icon, link }) => (
              <SpotlightCard key={number} className="home-service-card home-reveal">
                <div className="service-card-top">
                  <span className="service-card-number">{number}</span>
                  <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <Link to={link} className="service-card-link">Discover this service <ArrowUpRight size={15} /></Link>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      <section className="journey-section site-section">
        <div className="site-container journey-grid">
          <div className="journey-copy home-reveal">
            <p className="eyebrow">From Surrey to the terminal</p>
            <h2>A smoother journey starts before pickup.</h2>
            <p className="journey-intro">
              Tell us where you’re going and when. We’ll confirm the details and fare, then take care of the journey while you focus on what’s ahead.
            </p>
            <ol className="journey-steps">
              <li><span>1</span><div><strong>Share your plans</strong><p>Choose your pickup, destination and vehicle class.</p></div></li>
              <li><span>2</span><div><strong>Get a clear fare</strong><p>Review your journey details before confirming.</p></div></li>
              <li><span>3</span><div><strong>Travel with confidence</strong><p>Your chauffeur arrives ready for the trip.</p></div></li>
            </ol>
            <Link to="/book" className="text-link journey-link">Start a booking <ArrowUpRight size={16} /></Link>
          </div>

          <div className="route-panel home-reveal">
            <div className="route-panel-top"><span>Our local network</span><span>Surrey · London · Airports</span></div>
            <Suspense fallback={<div className="route-scene-fallback" aria-hidden="true" />}>
              <RouteScene />
            </Suspense>
            <div className="route-place route-place-left"><span className="route-dot" />Surrey</div>
            <div className="route-place route-place-middle"><span className="route-dot" />London</div>
            <div className="route-place route-place-right"><span className="route-dot" />Gatwick</div>
            <div className="route-panel-bottom">A local base, with journeys across the UK.</div>
          </div>
        </div>
      </section>

      <section className="home-coverage site-section home-reveal">
        <div className="site-container coverage-row">
          <div><p className="eyebrow">Based in Surrey</p><h2>Close to home. Ready to go further.</h2></div>
          <p>Serving Reigate, Redhill, Banstead, Horley and the surrounding area, with pre-booked journeys to major UK destinations.</p>
          <Link to="/contact" className="text-link">Ask about your route <ArrowUpRight size={16} /></Link>
        </div>
      </section>

      <section className="home-cta site-section home-reveal">
        <div className="site-container home-cta-inner">
          <div><p className="eyebrow">Your next journey</p><h2>Let’s get you there.</h2></div>
          <div className="home-cta-actions">
            <Link to="/book" className="button button-primary">Plan your journey <ArrowUpRight size={17} /></Link>
            <a href="tel:07412671467" className="home-cta-phone">Prefer to call? 07412 671467</a>
          </div>
        </div>
      </section>
    </main>
  );
}
