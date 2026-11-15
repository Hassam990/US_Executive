import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = "https://us-executivetravel.com";
const image = `${SITE}/logo.png`;

const pages: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Surrey Chauffeur & Airport Transfers | US Executive Travel",
    description: "Surrey chauffeur service for London and UK airport transfers. Compare vehicles, confirm your fare and plan online.",
  },
  "/services": {
    title: "Surrey Airport & Chauffeur Services | US Executive Travel",
    description: "Book Surrey airport transfers to Heathrow and Gatwick, corporate chauffeur travel, cruise port and station trips, private hire and tours.",
  },
  "/fleet": {
    title: "Executive Cars & MPVs for Hire | US Executive Travel",
    description: "Compare executive chauffeur cars, first class vehicles and MPVs for Surrey airport transfers, business travel and group journeys.",
  },
  "/drivers": {
    title: "Meet Our Chauffeurs | US Executive Travel",
    description: "Get to know the professional chauffeurs behind US Executive Travel and learn about our private hire service.",
  },
  "/contact": {
    title: "Contact US Executive Travel | Surrey Chauffeur Service",
    description: "Contact US Executive Travel about airport transfers, corporate travel, a quote or a special journey. Call 07412 671467.",
  },
  "/book": {
    title: "Plan a Chauffeur Journey | US Executive Travel",
    description: "Request a pre-booked chauffeur journey from Surrey. Enter your pickup, destination and vehicle preference to plan your trip.",
  },
  "/apply": {
    title: "Apply to Join Our Chauffeur Network | US Executive Travel",
    description: "Register your interest in driving with US Executive Travel. Share your details and current licensing, vehicle and availability information.",
  },
  "/privacy-notice": {
    title: "Privacy Notice | US Executive Travel",
    description: "Read how US Executive Travel handles personal information submitted through our website and journey forms.",
  },
};

function setMeta(selector: string, attribute: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    const [key, content] = attribute.split("=");
    element.setAttribute(key, content.replaceAll('"', ""));
    document.head.append(element);
  }
  element.content = value;
}

export function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = pages[pathname] ?? {
      title: "Page Not Found | US Executive Travel",
      description: "The page you’re looking for could not be found. Return to US Executive Travel to plan a journey.",
    };
    const canonical = `${SITE}${pathname === "/" ? "/" : pathname}`;
    const noIndex = pathname === "/admin" || pathname === "/login" || pathname === "/signup" || pathname === "/dashboard" || !pages[pathname];

    document.title = page.title;
    setMeta('meta[name="description"]', 'name="description"', page.description);
    setMeta('meta[name="robots"]', 'name="robots"', noIndex ? "noindex, nofollow" : "index, follow");
    setMeta('meta[property="og:title"]', 'property="og:title"', page.title);
    setMeta('meta[property="og:description"]', 'property="og:description"', page.description);
    setMeta('meta[property="og:url"]', 'property="og:url"', canonical);
    setMeta('meta[property="og:image"]', 'property="og:image"', image);
    setMeta('meta[property="og:type"]', 'property="og:type"', "website");
    setMeta('meta[name="twitter:card"]', 'name="twitter:card"', "summary_large_image");
    setMeta('meta[name="twitter:title"]', 'name="twitter:title"', page.title);
    setMeta('meta[name="twitter:description"]', 'name="twitter:description"', page.description);
    setMeta('meta[name="twitter:image"]', 'name="twitter:image"', image);

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.append(link);
    }
    link.href = canonical;

    const jsonLd = document.getElementById("site-structured-data");
    if (jsonLd) jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "US Executive Travel",
      url: SITE,
      image,
      telephone: "+44 7412 671467",
      email: "hello@us-executivetravel.com",
      description: "Pre-booked executive chauffeur journeys from Surrey to London and destinations across the UK.",
      areaServed: [
        { "@type": "AdministrativeArea", name: "Surrey, England" },
        { "@type": "City", name: "London" },
        { "@type": "Country", name: "United Kingdom" },
      ],
    });
  }, [pathname]);

  return null;
}
