import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { FileText, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { UserButton, useUser } from "@clerk/react";
import { dark } from "@clerk/themes";
import "./CardNav.css";

interface NavLink {
  label: string;
  ariaLabel?: string;
  href: string;
}

interface NavItem {
  label: string;
  bgColor: string;
  textColor: string;
  links: NavLink[];
}

interface CardNavProps {
  logo: string;
  logoAlt?: string;
  items: NavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

const CardNav: React.FC<CardNavProps> = ({ logo, logoAlt = "Logo", items, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isSignedIn, user } = useUser();
  const location = useLocation();

  useLayoutEffect(() => {
    setIsExpanded(false);
  }, [location.pathname]);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu || !isExpanded) return;

    const context = gsap.context(() => {
      gsap.fromTo(menu, { height: 0, autoAlpha: 0 }, {
        height: "auto",
        autoAlpha: 1,
        duration: 0.36,
        ease: "power2.out",
      });
      gsap.fromTo(".mobile-menu-group", { y: 12, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        duration: 0.32,
        stagger: 0.06,
        delay: 0.08,
        ease: "power2.out",
      });
    }, navRef);

    return () => context.revert();
  }, [isExpanded]);

  const toggleMenu = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      return;
    }

    const menu = menuRef.current;
    if (!menu) {
      setIsExpanded(false);
      return;
    }

    gsap.to(menu, {
      height: 0,
      autoAlpha: 0,
      duration: 0.22,
      ease: "power2.in",
      onComplete: () => setIsExpanded(false),
    });
  };

  const adminEmail = (user?.primaryEmailAddress?.emailAddress || "").toLowerCase();
  const isAdmin = ["hassamazam999@gmail.com", "hello@us-executivetravel.com"].includes(adminEmail);

  return (
    <div className={`card-nav-container ${className}`} ref={navRef}>
      <nav className={`card-nav ${isExpanded ? "open" : ""}`} aria-label="Main navigation">
        <div className="card-nav-top">
          <Link to="/" className="logo-container" aria-label="US Executive Travel home">
            <img src={logo} alt={logoAlt} className="logo" />
          </Link>

          <div className="desktop-nav" aria-label="Pages">
            <Link to="/services">Services</Link>
            <Link to="/fleet">Our fleet</Link>
            <Link to="/contact">Contact</Link>
          </div>

          <div className="card-nav-top-links">
            <Link to="/apply" className="card-nav-link-secondary">Drive with us</Link>
            {isSignedIn ? (
              <div className="account-actions">
                {isAdmin && <Link to="/admin" className="account-link"><FileText size={14} /> Admin</Link>}
                <Link to="/dashboard" className="account-link"><FileText size={14} /> My journeys</Link>
                <UserButton
                  appearance={{
                    theme: dark,
                    variables: { colorPrimary: "#ec4899" },
                    elements: {
                      userButtonAvatarBox: "w-9 h-9 ring-1 ring-white/25 hover:ring-white/60 transition-all",
                      userButtonPopoverCard: "bg-[#171817] border border-white/10 shadow-xl",
                      userButtonPopoverActionButton: "hover:bg-white/5 text-white",
                      userButtonPopoverActionButtonText: "text-white/80 font-medium text-xs",
                      userButtonPopoverFooter: "hidden",
                    },
                  }}
                />
              </div>
            ) : (
              <Link to="/login" className="card-nav-link-secondary">Sign in</Link>
            )}
          </div>

          <Link to="/book" className="card-nav-cta-button">Book a journey</Link>

          <button
            className="hamburger-menu"
            onClick={toggleMenu}
            aria-label={isExpanded ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isExpanded}
            aria-controls="mobile-navigation"
            type="button"
          >
            {isExpanded ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        <div
          id="mobile-navigation"
          className="mobile-menu"
          ref={menuRef}
          aria-hidden={!isExpanded}
          inert={!isExpanded}
        >
          <div className="mobile-menu-groups">
            {items.map((item) => (
              <div className="mobile-menu-group" key={item.label}>
                <p>{item.label}</p>
                {item.links.map((link) => (
                  <Link key={link.label} to={link.href} aria-label={link.ariaLabel}>{link.label}</Link>
                ))}
              </div>
            ))}
          </div>
          <div className="mobile-menu-actions">
            <Link to="/apply">Drive with us</Link>
            {isSignedIn ? <Link to="/dashboard">My journeys</Link> : <Link to="/login">Sign in</Link>}
            <Link to="/book" className="mobile-book-link">Book a journey</Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
