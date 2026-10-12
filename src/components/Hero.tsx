import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowDownRight, Check, Clock3, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { BookingWidget } from "./BookingWidget";

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.fromTo(".hero-reveal", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out", delay: 0.12 });
      gsap.fromTo(".booking-card", { y: 30, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "power3.out", delay: 0.28 });
    }, heroRef);
    return () => context.revert();
  }, []);

  return <section className="hero-shell" ref={heroRef}>
    <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" /><div className="hero-grid" />
    <div className="hero-content page-width">
      <div className="hero-copy">
        <div className="status-pill hero-reveal"><span className="status-dot" /> Dispatch is live <span className="status-divider" /> 24/7 service</div>
        <p className="eyebrow hero-reveal">The considered way to travel</p>
        <h1 className="hero-title hero-reveal">Arrive<br /><em>remarkably.</em></h1>
        <p className="hero-lede hero-reveal">Executive travel with the calm, precision and personal attention your time deserves.</p>
        <div className="hero-actions hero-reveal"><a href="#booking" className="primary-button hero-cta">Plan your journey <ArrowDownRight size={18} /></a><a href="tel:07412671467" className="quiet-link">Speak to dispatch <span>07412 671467</span></a></div>
        <div className="trust-strip hero-reveal"><div><Check size={15} /><span>Flight monitoring</span></div><div><Check size={15} /><span>Professional chauffeurs</span></div><div><Check size={15} /><span>Meet & greet</span></div></div>
      </div>
      <div className="hero-booking hero-reveal" id="booking"><BookingWidget /></div>
    </div>
    <div className="hero-meta page-width hero-reveal"><span><MapPin size={15} /> Serving Manchester, Cheshire & the North West</span><span><Clock3 size={15} /> Average response under 4 minutes</span><span><ShieldCheck size={15} /> Licensed & fully insured</span><Sparkles size={15} /></div>
  </section>;
}
