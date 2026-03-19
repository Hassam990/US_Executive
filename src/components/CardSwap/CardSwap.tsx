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
  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 1.2,
          durMove: 1.2,
          durReturn: 1.2,
          promoteOverlap: 0.8
        }
      : {
          ease: 'power2.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.4
        };

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(
    () => childArr.map(() => React.createRef<HTMLDivElement>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length]
  );

  const container = useRef<HTMLDivElement>(null);
  const orderRef = useRef(Array.from({ length: childArr.length }, (_, i) => i));

  useEffect(() => {
    const total = refs.length;
    if (total < 2) return;

    // Initial positioning
    refs.forEach((r, i) => {
      if (r.current) {
        placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
      }
    });

    const trigger = ScrollTrigger.create({
      trigger: container.current,
      start: "top 80%",
      onEnter: () => swap(),
      onEnterBack: () => swap(),
    });

    const swap = () => {
      if (orderRef.current.length < 2) return;

      const [front, ...rest] = orderRef.current;
      const elFront = refs[front].current;
      if (!elFront) return;

      const tl = gsap.timeline();

      // Fix for the overlap: ensure the exiting card loses its focus/zIndex quickly
      tl.to(elFront, {
        y: '+=400',
        opacity: 0,
        scale: 0.8,
        duration: config.durDrop,
        ease: "power2.in"
      });

      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      
      rest.forEach((idx, i) => {
        const el = refs[idx].current;
        const slot = makeSlot(i, cardDistance, verticalDistance, total);
        
        tl.to(el, {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          zIndex: slot.zIndex,
          opacity: slot.opacity,
          duration: config.durMove,
          ease: config.ease
        }, 'promote');
      });

      const backSlot = makeSlot(total - 1, cardDistance, verticalDistance, total);
      tl.addLabel('return', '>-0.2');
      
      tl.set(elFront, { 
        zIndex: backSlot.zIndex,
        x: backSlot.x,
        y: backSlot.y + 100 // start below
      }, 'return');

      tl.to(elFront, {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        opacity: backSlot.opacity,
        scale: 1,
        duration: config.durReturn,
        ease: config.ease
      }, 'return');

      tl.call(() => {
        orderRef.current = [...rest, front];
      });
    };

    // We can also make it trigger on scroll progress if the user wants continuous flipping
    // but a discrete "onEnter" or "onUpdate" threshold is more controlled for this component.
    
    return () => {
      trigger.kill();
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
