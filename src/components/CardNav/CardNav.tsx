import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GoArrowUpRight } from 'react-icons/go';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, FileText, ChevronDown } from 'lucide-react';
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const checkUser = () => {
      const userData = localStorage.getItem('userData');
      const token = localStorage.getItem('adminToken');
      console.log("CardNav Auth Sync - Token:", !!token, "User:", userData ? "Found" : "Missing");
      
      if (userData && token) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error("Auth Data Parse Error:", e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkUser();
    
    // Custom event listener for same-tab updates
    const handleAuthChange = () => checkUser();
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', checkUser);

    // Global click listener to close user menu when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest && !target.closest('.user-profile-dropdown')) {
        setIsUserMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    setUser(null);
    setIsUserMenuOpen(false);
    navigate('/login');
  };

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
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
            style={{ color: menuColor || '#000' }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container">
            <Link to="/">
              <img src={logo} alt={logoAlt} className="logo" />
            </Link>
          </div>

          <div className="card-nav-top-links">
            <Link to="/apply" className="card-nav-link-secondary">Apply as Driver</Link>
            
            {user ? (
              <div className="relative user-profile-dropdown" style={{ zIndex: 130 }}>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("User menu button clicked, current state:", isUserMenuOpen);
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  className={`flex items-center gap-2 p-1 pr-3 rounded-full border transition-all cursor-pointer relative z-[140] ${
                    isUserMenuOpen 
                    ? 'bg-pink-600 border-pink-500 shadow-lg shadow-pink-600/20' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0 bg-black/40">
                    {user && user.picture ? (
                      <img src={user.picture} alt={user.name || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-4 h-4 text-pink-500" />
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isUserMenuOpen ? 'text-white' : 'text-white/70'}`}>
                    {(user && user.name) ? user.name.split(' ')[0] : "Account"}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-all ${isUserMenuOpen ? 'rotate-180 text-white' : 'text-white/30'}`} />
                </button>

                {isUserMenuOpen && user && (
                  <>
                    <div 
                      className="fixed inset-0 z-[125] cursor-default" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUserMenuOpen(false);
                      }}
                    />
                    <div className="absolute right-0 mt-3 w-56 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[150] animate-in fade-in slide-in-from-top-3 duration-300 ease-out">
                      <div className="p-4 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                        <p className="text-[11px] font-black text-pink-500 uppercase tracking-widest truncate mb-0.5">{user.name || "User Account"}</p>
                        <p className="text-[9px] text-white/30 font-medium truncate">{user.email || "No email provided"}</p>
                      </div>
                      <div className="p-2">
                        <Link 
                          to={localStorage.getItem('userRole') === 'admin' ? "/admin" : "/dashboard"} 
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <div className="w-6 h-6 rounded-lg bg-pink-500/10 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-pink-500" />
                          </div>
                          View My Portal
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 rounded-xl transition-all mt-1"
                        >
                          <div className="w-6 h-6 rounded-lg bg-red-400/10 flex items-center justify-center">
                            <LogOut className="w-3.5 h-3.5" />
                          </div>
                          Terminate Session
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="card-nav-link-secondary">Login</Link>
            )}
          </div>

          <Link to="/">
            <button
              type="button"
              className="card-nav-cta-button"
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
            >
              Book Now
            </button>
          </Link>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
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
