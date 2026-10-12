import { Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function Header() {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="nav-shell page-width">
    <Link to="/" className="brand-lockup" aria-label="US Executive Travel home"><span className="brand-mark">US</span><span><strong>US Executive</strong><small>Private hire & travel</small></span></Link>
    <nav className={`main-nav ${open ? "open" : ""}`} aria-label="Primary navigation"><Link to="/services" onClick={() => setOpen(false)}>Services</Link><Link to="/fleet" onClick={() => setOpen(false)}>Fleet</Link><Link to="/contact" onClick={() => setOpen(false)}>Contact</Link><Link to="/dashboard" onClick={() => setOpen(false)}>Your journeys</Link></nav>
    <div className="nav-actions"><a className="nav-phone" href="tel:07412671467"><Phone size={15} /> <span>07412 671467</span></a><a className="nav-cta" href="/#booking">Book a car <span>↗</span></a><button className="menu-button" type="button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button></div>
  </div></header>;
}
