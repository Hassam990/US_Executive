import { Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container site-footer-inner">
        <div className="footer-brand">
          <Link to="/" aria-label="US Executive Travel home">
            <img src="/us_executive_logo.png" alt="US Executive Travel — Driven by excellence, defined by class" />
          </Link>
          <p>Private chauffeur journeys across Surrey and the UK, arranged with care from first enquiry to arrival.</p>
        </div>

        <nav className="footer-column" aria-label="Footer navigation">
          <h2>Explore</h2>
          <ul>
            <li><Link to="/services">Our services</Link></li>
            <li><Link to="/fleet">Our fleet</Link></li>
            <li><Link to="/book">Plan a journey</Link></li>
            <li><Link to="/apply">Drive with us</Link></li>
          </ul>
        </nav>

        <div className="footer-column footer-contact-column">
          <h2>Speak to our team</h2>
          <ul className="footer-contact-list">
            <li><Phone size={16} /><a href="tel:07412671467">07412 671467</a></li>
            <li><Mail size={16} /><a href="mailto:hello@us-executivetravel.com">hello@us-executivetravel.com</a></li>
          </ul>
        </div>
      </div>
      <div className="site-container site-footer-bottom">
        <p>© {new Date().getFullYear()} US Executive Travel. All rights reserved.</p>
        <p>Based in Surrey · Available across the UK</p>
      </div>
    </footer>
  );
}
