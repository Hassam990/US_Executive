import CardNav from "./CardNav/CardNav";

const navItems = [
    {
        label: "Services",
        bgColor: "#1a000a",
        textColor: "#fff",
        links: [
            { label: "Airport Transfers", href: "/services", ariaLabel: "Airport Transfers" },
            { label: "Business Class", href: "/services", ariaLabel: "Business Class" },
            { label: "Event Travel", href: "/services", ariaLabel: "Event Travel" }
        ]
    },
    {
        label: "Our Fleet",
        bgColor: "#0a0005",
        textColor: "#fff",
        links: [
            { label: "Executive Saloon", href: "/fleet", ariaLabel: "Executive Saloon" },
            { label: "Premium MPV", href: "/fleet", ariaLabel: "Premium MPV" },
            { label: "Luxury Minivan", href: "/fleet", ariaLabel: "Luxury Minivan" }
        ]
    },
    {
        label: "Company",
        bgColor: "#1a000a",
        textColor: "#fff",
        links: [
            { label: "Contact Us", href: "/contact", ariaLabel: "Contact Us" },
            { label: "Driver Portal", href: "/admin", ariaLabel: "Driver Portal" },
            { label: "Terms of Service", href: "/terms", ariaLabel: "Terms" }
        ]
    }
];

export function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-[100]">
            <CardNav 
                logo="/us_executive_logo.png"
                logoAlt="US Executive Travel"
                items={navItems}
                baseColor="#000"
                menuColor="#ec4899"
                buttonBgColor="#ec4899"
                buttonTextColor="#fff"
                ease="power3.out"
            />
        </header>
    );
}
