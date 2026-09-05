import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const SmoothCursor: React.FC = () => {
  const ringRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOverTablet, setIsOverTablet] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const ring = ringRef.current;
    if (!ring) return;

    // Enable native cursor hiding on landing page
    document.body.classList.add('hide-native-cursor');

    // Faster snappier tracking physics (duration: 0.14s, power3.out)
    const xTo = gsap.quickTo(ring, 'x', { duration: 0.14, ease: 'power3.out' });
    const yTo = gsap.quickTo(ring, 'y', { duration: 0.14, ease: 'power3.out' });

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);

      const x = e.clientX;
      const y = e.clientY;

      xTo(x);
      yTo(y);

      const target = e.target as HTMLElement | null;
      if (target) {
        const isClickable =
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('.cursor-pointer') ||
          target.hasAttribute('onclick') ||
          target.getAttribute('role') === 'button';

        setIsHovered(!!isClickable);

        const inTablet =
          !!target.closest('#transparansi-tablet') ||
          !!target.closest('[perspective]') ||
          target.tagName === 'IFRAME';

        setIsOverTablet(inTablet);

        // Toggle native cursor hiding: hide native cursor on page, restore native cursor inside tablet
        if (inTablet) {
          document.body.classList.remove('hide-native-cursor');
        } else {
          document.body.classList.add('hide-native-cursor');
        }
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      document.body.classList.remove('hide-native-cursor');
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.body.classList.remove('hide-native-cursor');
    };
  }, [isVisible]);

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  const hidden = !isVisible || isOverTablet;

  return (
    <>
      <style>{`
        body.hide-native-cursor,
        body.hide-native-cursor *:not(#transparansi-tablet):not(#transparansi-tablet *) {
          cursor: none !important;
        }
        #transparansi-tablet,
        #transparansi-tablet * {
          cursor: auto !important;
        }
      `}</style>

      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full transition-all duration-200 ease-out pointer-events-none will-change-transform z-[9999] ${
          hidden
            ? 'opacity-0 scale-50 w-5 h-5 -mt-2.5 -ml-2.5'
            : isHovered
              ? 'w-9 h-9 -mt-[18px] -ml-[18px] opacity-100 scale-100 border-[1.5px] border-emerald-300 bg-emerald-400/25 shadow-[0_0_30px_rgba(52,211,153,0.5)] backdrop-blur-[0.5px]'
              : 'w-5 h-5 -mt-2.5 -ml-2.5 opacity-90 scale-100 border-[2px] border-emerald-800 bg-emerald-950/20 shadow-[0_0_10px_rgba(6,95,70,0.3)]'
        }`}
      />
    </>
  );
};
