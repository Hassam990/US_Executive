// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GoArrowUpRight } from 'react-icons/go';
import { Link, useLocation } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useUser, UserButton } from '@clerk/react';
import { dark } from '@clerk/themes';
import './CardNav.css';

gsap.registerPlugin(ScrollTrigger);

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

interface UserProfile {
  name?: string;
  email?: string;
  picture?: string;
}

const CardNav: React.FC<CardNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  ease = 'power3.out',
  baseColor = '#fff',
  menuColor,
  buttonBgColor,
  buttonTextColor
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  // Clerk auth state
  const { isSignedIn, user } = useUser();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);



  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement;
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    // Set initial overflow to visible so dropdowns aren't clipped on load
    gsap.set(navEl, { height: 60, overflow: 'visible' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ 
      paused: true,
      onStart: () => { gsap.set(navEl, { overflow: 'hidden' }); },
      onReverseComplete: () => { gsap.set(navEl, { overflow: 'visible' }); }
    });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  // Close menu on route change
  useLayoutEffect(() => {
    if (isExpanded) {
      setIsHamburgerOpen(false);
      const tl = tlRef.current;
      if (tl) {
        tl.reverse();
        tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      } else {
        setIsExpanded(false);
      }
    }
    // Refresh ScrollTrigger globally on route change
    ScrollTrigger.refresh();
  }, [location.pathname]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className={`card-nav-container ${className}`}>
      <nav ref={navRef} className={`card-nav ${isExpanded ? 'open' : ''}`} style={{ backgroundColor: baseColor }}>
        <div className="card-nav-top">
          <button
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            aria-expanded={isExpanded}
            aria-controls="card-nav-content"
            style={{ color: menuColor || '#000' }}
            type="button"
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </button>

          <div className="logo-container">
            <Link to="/">
              <img src={logo} alt={logoAlt} className="logo" />
            </Link>
          </div>

          <div className="card-nav-top-links">
            <Link to="/apply" className="card-nav-link-secondary">Apply as Driver</Link>

            {isSignedIn ? (
              <div className="flex items-center gap-3">
                {/* Admin Console link for admin emails */}
                {['hassamazam999@gmail.com', 'hello@us-executivetravel.com'].includes(
                  (user?.primaryEmailAddress?.emailAddress || '').toLowerCase()
                ) && (
                  <Link
                    to="/admin"
                    className="hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-yellow-400/80 hover:text-yellow-300 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-yellow-400" />
                    Admin Console
                  </Link>
                )}
                {/* Link to portal */}
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-pink-500" />
                  My Portal
                </Link>
                {/* Clerk UserButton — handles avatar, profile, sign out */}
                <UserButton
                  afterSignOutUrl="/login"
                  appearance={{
                    baseTheme: dark,
                    variables: { colorPrimary: '#ec4899' },
                    elements: {
                      userButtonAvatarBox: 'w-9 h-9 ring-2 ring-pink-500/40 hover:ring-pink-500 transition-all',
                      userButtonPopoverCard: 'bg-black/95 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)]',
                      userButtonPopoverActionButton: 'hover:bg-white/5 text-white',
                      userButtonPopoverActionButtonText: 'text-white/80 font-bold text-xs uppercase tracking-widest',
                      userButtonPopoverFooter: 'hidden',
                    },
                  }}
                />
              </div>
            ) : (
              <Link to="/login" className="card-nav-link-secondary">Login</Link>
            )}
          </div>

          <Link
            to="/book"
            className="card-nav-cta-button"
            style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
          >
            Book Now
          </Link>
        </div>

        <div id="card-nav-content" className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <Link key={`${lnk.label}-${i}`} className="nav-card-link" to={lnk.href} aria-label={lnk.ariaLabel}>
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {lnk.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
