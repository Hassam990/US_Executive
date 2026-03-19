import React, { Children, cloneElement, forwardRef, isValidElement, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './CardSwap.css';

gsap.registerPlugin(ScrollTrigger);

export const Card = forwardRef(({ customClass, ...rest }: any, ref) => (
  <div ref={ref} {...rest} className={`card ${customClass ?? ''} ${rest.className ?? ''}`.trim()} />
));
Card.displayName = 'Card';

const makeSlot = (i: number, distX: number, distY: number, total: number) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 2,
  zIndex: total - i,
  opacity: i === 0 ? 1 : 1 - (i * 0.2)
});

const placeNow = (el: any, slot: any, skew: number) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    opacity: slot.opacity,
    force3D: true
  });

interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  skewAmount?: number;
  easing?: 'elastic' | 'smooth';
  children: React.ReactNode;
}

const CardSwap: React.FC<CardSwapProps> = ({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  skewAmount = 6,
  easing = 'elastic',
  children
}) => {
  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(
    () => childArr.map(() => React.createRef<HTMLDivElement>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length]
  );

  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const total = refs.length;
    if (total < 2) return;

    // Initial positioning
    refs.forEach((r, i) => {
      if (r.current) {
        placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
      }
    });

    const cards = refs.map(r => r.current).filter(Boolean);
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: "top 90%",
        end: "bottom 10%",
        scrub: 1,
      }
    });

    const backSlot = makeSlot(total - 1, cardDistance, verticalDistance, total);

    // Stage 1: Card 0 drops, Cards 1 & 2 move forward
    tl.to(cards[0], { y: "+=300", opacity: 0, scale: 0.8, duration: 1 }, 0);
    tl.to([cards[1], cards[2]], {
      x: (i) => makeSlot(i, cardDistance, verticalDistance, total).x,
      y: (i) => makeSlot(i, cardDistance, verticalDistance, total).y,
      z: (i) => makeSlot(i, cardDistance, verticalDistance, total).z,
      zIndex: (i) => makeSlot(i, cardDistance, verticalDistance, total).zIndex,
      opacity: (i) => makeSlot(i, cardDistance, verticalDistance, total).opacity,
      duration: 1,
    }, 0);
    tl.set(cards[0], { zIndex: backSlot.zIndex }, 1);
    tl.to(cards[0], { x: backSlot.x, y: backSlot.y, z: backSlot.z, opacity: backSlot.opacity, scale: 1, duration: 1 }, 1.1);

    // Stage 2: Card 1 drops, Cards 2 & 0 move forward
    tl.to(cards[1], { y: "+=300", opacity: 0, scale: 0.8, duration: 1 }, 2);
    tl.to([cards[2], cards[0]], {
      x: (i) => makeSlot(i, cardDistance, verticalDistance, total).x,
      y: (i) => makeSlot(i, cardDistance, verticalDistance, total).y,
      z: (i) => makeSlot(i, cardDistance, verticalDistance, total).z,
      zIndex: (i) => makeSlot(i, cardDistance, verticalDistance, total).zIndex,
      opacity: (i) => makeSlot(i, cardDistance, verticalDistance, total).opacity,
      duration: 1,
    }, 2);
    tl.set(cards[1], { zIndex: backSlot.zIndex }, 3);
    tl.to(cards[1], { x: backSlot.x, y: backSlot.y, z: backSlot.z, opacity: backSlot.opacity, scale: 1, duration: 1 }, 3.1);

    // Stage 3: Card 2 drops, Cards 0 & 1 move forward
    tl.to(cards[2], { y: "+=300", opacity: 0, scale: 0.8, duration: 1 }, 4);
    tl.to([cards[0], cards[1]], {
      x: (i) => makeSlot(i, cardDistance, verticalDistance, total).x,
      y: (i) => makeSlot(i, cardDistance, verticalDistance, total).y,
      z: (i) => makeSlot(i, cardDistance, verticalDistance, total).z,
      zIndex: (i) => makeSlot(i, cardDistance, verticalDistance, total).zIndex,
      opacity: (i) => makeSlot(i, cardDistance, verticalDistance, total).opacity,
      duration: 1,
    }, 4);
    tl.set(cards[2], { zIndex: backSlot.zIndex }, 5);
    tl.to(cards[2], { x: backSlot.x, y: backSlot.y, z: backSlot.z, opacity: backSlot.opacity, scale: 1, duration: 1 }, 5.1);

    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDistance, verticalDistance, skewAmount, easing]);

  const rendered = childArr.map((child, i) => {
    if (isValidElement(child)) {
        const element = child as React.ReactElement<any>;
        return cloneElement(element, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(element.props.style ?? {}) }
        });
    }
    return child;
  });

  return (
    <div ref={container} className="card-swap-container" style={{ width, height }}>
      {rendered}
    </div>
  );
};

export default CardSwap;
