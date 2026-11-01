import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowDown, ArrowUpRight, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { SplitText } from "./reactbits/SplitText";

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!heroRef.current) return;

    const context = gsap.context(() => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
        timeline
          .fromTo(".hero-kicker", { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55 })
          .fromTo(".split-text-inner", { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.075 }, "-=0.18")
          .fromTo(".hero-copy, .hero-actions, .hero-assurances", { y: 18, autoAlpha: 0 }, {
            y: 0,
            autoAlpha: 1,
            duration: 0.65,
            stagger: 0.12,
          }, "-=0.35");

        return () => timeline.kill();
      });

      return () => media.revert();
    }, heroRef);

    return () => context.revert();
  }, []);

  return (
    <section ref={heroRef} className="hero-section">
      <video
        src="/chauffeur-opens-car-door.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="hero-video"
      />
      <div className="hero-shade" />
      <div className="hero-content site-container">
        <div className="hero-copy-block">
          <div className="hero-kicker"><span /> Private travel, considered</div>
          <h1 className="hero-heading" aria-label="Travel that respects your time.">
            <SplitText text="Travel that" />
            <span className="hero-heading-accent"><SplitText text="respects your time." /></span>
          </h1>
          <p className="hero-copy">
            Executive chauffeur journeys across Surrey and the UK, with a professional driver and a fixed fare agreed before you travel.
          </p>
          <div className="hero-actions">
            <Link to="/book" className="button button-primary">
              Plan your journey <ArrowUpRight aria-hidden="true" size={17} />
            </Link>
            <a href="tel:07412671467" className="button button-secondary">
              <Phone aria-hidden="true" size={16} /> 07412 671467
            </a>
          </div>
          <div className="hero-assurances" aria-label="Service details">
            <span>Available around the clock</span>
            <span>Flight-aware airport pickups</span>
            <span>Clear fares before travel</span>
          </div>
        </div>
      </div>
      <a href="#services" className="hero-scroll-cue" aria-label="Scroll to services">
        <span>Explore the service</span><ArrowDown aria-hidden="true" size={15} />
      </a>
    </section>
  );
}
