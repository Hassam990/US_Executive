import { useRef, type MouseEvent, type ReactNode } from "react";

import "./spotlight-card.css";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
};

/** React Bits Spotlight Card, kept as editable project source. */
export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(236, 72, 153, 0.14)",
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--mouse-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--mouse-y", `${event.clientY - bounds.top}px`);
    card.style.setProperty("--spotlight-color", spotlightColor);
  };

  return (
    <div ref={cardRef} onMouseMove={handleMouseMove} className={`card-spotlight ${className}`}>
      {children}
    </div>
  );
}
