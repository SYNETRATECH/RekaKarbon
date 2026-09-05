import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface CSSTablet3DProps {
  sectionRef: React.RefObject<HTMLDivElement | null>;
  targetUrl?: string;
}

export const CSSTablet3D: React.FC<CSSTablet3DProps> = ({
  sectionRef,
  targetUrl = '/portal-transparansi',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabletRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!tabletRef.current || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });

      // Animate 3D Tablet Rotation & Scaling from gentle 16deg perspective to upright 0deg flat
      tl.fromTo(
        tabletRef.current,
        {
          rotateX: 16,
          rotateY: -2,
          rotateZ: 0.5,
          scale: 0.88,
          y: 15,
        },
        {
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          scale: 1.0,
          y: 0,
          ease: 'power1.out',
        }
      );

      // Animate dynamic 3D drop shadow underneath tablet
      if (shadowRef.current) {
        tl.fromTo(
          shadowRef.current,
          {
            opacity: 0.65,
            scaleX: 0.9,
            scaleY: 0.45,
            filter: 'blur(28px)',
          },
          {
            opacity: 0.25,
            scaleX: 0.98,
            scaleY: 0.85,
            filter: 'blur(16px)',
            ease: 'power1.out',
          },
          '<'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [sectionRef]);

  // Handle wheel events & iPad touch/mouse drag-to-scroll inside iframe
  const handleIframeLoad = () => {
    const iframeWin = iframeRef.current?.contentWindow;
    const iframeDoc = iframeWin?.document;
    if (!iframeWin || !iframeDoc) return;

    try {
      // 1. iPad Touch & Mouse Drag-to-Scroll Gesture Handler
      let isMouseDown = false;
      let startY = 0;
      let startScrollTop = 0;
      let activeScrollContainer: HTMLElement | null = null;
      let isDragging = false;

      iframeDoc.addEventListener('pointerdown', (e: PointerEvent) => {
        let target = e.target as HTMLElement | null;

        while (target && target !== iframeDoc.body && target !== iframeDoc.documentElement) {
          const isMarked = target.getAttribute('data-scrollable') === 'true';
          const style = iframeWin.getComputedStyle(target);
          const overflowY = style.overflowY;
          const isOverflow = overflowY === 'auto' || overflowY === 'scroll';
          const hasScroll = target.scrollHeight > target.clientHeight;

          if ((isMarked || isOverflow) && hasScroll) {
            isMouseDown = true;
            startY = e.clientY;
            startScrollTop = target.scrollTop;
            activeScrollContainer = target;
            isDragging = false;
            break;
          }
          target = target.parentElement;
        }
      });

      iframeDoc.addEventListener('pointermove', (e: PointerEvent) => {
        if (!isMouseDown || !activeScrollContainer) return;

        const dy = e.clientY - startY;
        if (Math.abs(dy) > 3) {
          isDragging = true;
          // Drag up moves scroll content down (real iPad touch drag experience)
          activeScrollContainer.scrollTop = startScrollTop - dy;
        }
      });

      const handlePointerUp = () => {
        if (isDragging && activeScrollContainer) {
          const preventClick = (evt: MouseEvent) => {
            evt.stopPropagation();
            evt.preventDefault();
            iframeDoc.removeEventListener('click', preventClick, true);
          };
          iframeDoc.addEventListener('click', preventClick, true);
        }
        isMouseDown = false;
        activeScrollContainer = null;
        isDragging = false;
      };

      iframeDoc.addEventListener('pointerup', handlePointerUp);
      iframeDoc.addEventListener('pointercancel', handlePointerUp);

      // 2. Wheel Scroll Forwarding & Internal Container Scroll Listener
      iframeWin.addEventListener(
        'wheel',
        (event: WheelEvent) => {
          let target = event.target as HTMLElement | null;
          let isInternalScrollable = false;

          while (
            target &&
            target !== iframeWin.document.body &&
            target !== iframeWin.document.documentElement
          ) {
            const isMarkedScrollable = target.getAttribute('data-scrollable') === 'true';
            const style = iframeWin.getComputedStyle(target);
            const overflowY = style.overflowY;
            const isOverflowScrollable = overflowY === 'auto' || overflowY === 'scroll';
            const canScrollVertically = target.scrollHeight > target.clientHeight;

            if ((isMarkedScrollable || isOverflowScrollable) && canScrollVertically) {
              const isScrollingDown = event.deltaY > 0;
              const isScrollingUp = event.deltaY < 0;

              const canScrollMoreDown =
                target.scrollTop + target.clientHeight < target.scrollHeight - 1;
              const canScrollMoreUp = target.scrollTop > 0;

              if ((isScrollingDown && canScrollMoreDown) || (isScrollingUp && canScrollMoreUp)) {
                target.scrollTop += event.deltaY;
                isInternalScrollable = true;
                break;
              } else if (isMarkedScrollable || isOverflowScrollable) {
                isInternalScrollable = true;
                break;
              }
            }
            target = target.parentElement;
          }

          if (!isInternalScrollable) {
            const lenis = (window as any).lenis;
            if (lenis) {
              const targetPos =
                typeof lenis.targetScroll === 'number' ? lenis.targetScroll : lenis.scroll;
              lenis.scrollTo(targetPos + event.deltaY * 1.5);
            } else {
              window.scrollBy({
                top: event.deltaY,
                behavior: 'auto',
              });
            }
          }
        },
        { passive: true }
      );
    } catch (err) {
      console.warn('Could not attach iframe listeners:', err);
    }
  };

  return (
    <div
      id="transparansi-tablet"
      ref={containerRef}
      className="relative w-full max-w-[1180px] mx-auto flex flex-col items-center justify-center [perspective:1400px] h-full max-h-[80vh]"
    >
      {/* 3D Dynamic Shadow Component */}
      <div
        ref={shadowRef}
        className="absolute bottom-[-12px] w-[90%] h-[110px] bg-slate-950/60 rounded-[50%] pointer-events-none z-0 transition-all duration-300"
      />

      {/* 3D Tablet Perspective Container */}
      <div
        ref={tabletRef}
        className="relative w-full aspect-[16/10] max-h-[640px] z-10 [transform-style:preserve-3d] will-change-transform"
      >
        {/* CSS iPad Pro Outer Frame */}
        <div className="relative w-full h-full bg-slate-900 border-[10px] sm:border-[14px] md:border-[16px] border-slate-950 rounded-[32px] sm:rounded-[40px] md:rounded-[44px] shadow-2xl shadow-slate-950/80 ring-1 ring-white/15 overflow-hidden flex flex-col">
          {/* Top Bezel Camera Dot */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800/80 flex items-center justify-center z-30 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-950 ring-1 ring-emerald-500/40" />
          </div>

          {/* iPad Screen Area */}
          <div className="relative w-full h-full rounded-[20px] sm:rounded-[26px] md:rounded-[28px] overflow-hidden bg-slate-950">
            {/* Scaled High-Resolution Viewport Container (140% viewport width/height scaled down to fit) */}
            <div className="w-[140%] h-[140%] scale-[0.7142857] origin-top-left">
              <iframe
                ref={iframeRef}
                onLoad={handleIframeLoad}
                src={targetUrl}
                title="Portal Transparansi RekaKarbon"
                className="w-full h-full border-none pointer-events-auto"
              />
            </div>

            {/* Subtle Ambient Glass Glare Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/4 to-white/10 pointer-events-none z-20" />
          </div>
        </div>
      </div>
    </div>
  );
};
