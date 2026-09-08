import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronUp, ChevronDown } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface CSSTablet3DProps {
  sectionRef: React.RefObject<HTMLDivElement | null>;
  backdropRef?: React.RefObject<HTMLDivElement | null>;
  headerContainerRef?: React.RefObject<HTMLDivElement | null>;
  headerTitleRef?: React.RefObject<HTMLHeadingElement | null>;
  headerSubRef?: React.RefObject<HTMLParagraphElement | null>;
  targetUrl?: string;
}

export const CSSTablet3D: React.FC<CSSTablet3DProps> = ({
  sectionRef,
  backdropRef,
  headerTitleRef,
  headerSubRef,
  targetUrl = '/portal-transparansi',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabletRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showNavControls, setShowNavControls] = useState(false);

  const isNavigatingAwayRef = useRef(false);

  const handleNavigate = (direction: 'up' | 'down') => {
    isNavigatingAwayRef.current = true;
    const lenis = (window as any).lenis;
    if (lenis) {
      lenis.start();
    }
    document.body.style.overflow = '';
    setShowNavControls(false);

    const navElement = document.querySelector('header') as HTMLElement | null;
    if (navElement) {
      navElement.style.transform = 'translateY(0%)';
      navElement.style.opacity = '1';
      navElement.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    }

    const resetNavFlag = () => {
      isNavigatingAwayRef.current = false;
    };

    if (direction === 'up') {
      const prevTarget = document.getElementById('ekosistem');
      if (prevTarget && lenis) {
        lenis.scrollTo(prevTarget, { duration: 1.2, onComplete: resetNavFlag });
      } else {
        window.scrollBy({ top: -window.innerHeight * 1.5, behavior: 'smooth' });
        setTimeout(resetNavFlag, 1200);
      }
    } else {
      const nextTarget = document.getElementById('komitmen');
      if (nextTarget && lenis) {
        lenis.scrollTo(nextTarget, { duration: 1.2, onComplete: resetNavFlag });
      } else {
        window.scrollBy({ top: window.innerHeight * 1.5, behavior: 'smooth' });
        setTimeout(resetNavFlag, 1200);
      }
    }
  };

  const handlePointerEnter = () => {
    if (tabletRef.current) {
      gsap.to(tabletRef.current, {
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scale: 1.0,
        y: '0%',
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  };

  const handlePointerLeave = () => {
    // Refresh ScrollTrigger scrub state to smoothly restore scroll-based rotation
    ScrollTrigger.update();
  };

  // Bulletproof Parent DOM Wheel Trap: Stop 100% of wheel events over tablet container from reaching parent Lenis / window scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleParentWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    container.addEventListener('wheel', handleParentWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleParentWheel);
  }, []);

  useEffect(() => {
    if (!tabletRef.current || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          end: 'bottom bottom',
          scrub: 1.2,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            if (self.isActive) {
              snapToSweetSpot();
            } else {
              unlockScroll();
            }
          },
          onUpdate: (self) => {
            if (self.isActive && document.body.style.overflow !== 'hidden') {
              snapToSweetSpot();
            }
          },
          onLeave: () => {
            isNavigatingAwayRef.current = false;
            unlockScroll();
          },
          onLeaveBack: () => {
            isNavigatingAwayRef.current = false;
            unlockScroll();
          },
        },
      });

      const preventWindowScroll = (e: Event) => {
        // Allow wheel events if target is inside tablet container/iframe so internal map scrolling works
        const target = e.target as HTMLElement | null;
        if (containerRef.current && containerRef.current.contains(target)) {
          return;
        }
        e.preventDefault();
      };

      function lockWindowScroll() {
        window.addEventListener('wheel', preventWindowScroll, { passive: false });
        window.addEventListener('touchmove', preventWindowScroll, { passive: false });
      }

      function unlockWindowScroll() {
        window.removeEventListener('wheel', preventWindowScroll);
        window.removeEventListener('touchmove', preventWindowScroll);
      }

      function snapToSweetSpot() {
        if (isNavigatingAwayRef.current) return;
        if (!sectionRef.current) return;
        const section = sectionRef.current;
        const targetY = section.offsetTop + (section.offsetHeight - window.innerHeight) * 0.45;
        const lenis = (window as any).lenis;

        // 1. Lock body overflow, global window wheel, & show nav controls immediately on Frame 1
        document.body.style.overflow = 'hidden';
        lockWindowScroll();
        setShowNavControls(true);

        // 2. Instantly lift top fixed navbar
        const navElement = document.querySelector('header') as HTMLElement | null;
        if (navElement) {
          navElement.style.transform = 'translateY(-100%)';
          navElement.style.opacity = '0';
          navElement.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        }

        // 3. Smooth GSAP Spring Glide (0.45s) to sweet spot (progress 0.45)
        if (lenis) {
          if (lenis.isStopped) {
            lenis.start();
          }
          lenis.scrollTo(targetY, {
            duration: 0.45,
            easing: (t: number) => 1 - Math.pow(1 - t, 3), // cubic ease-out
            onComplete: () => {
              lenis.stop();
              ScrollTrigger.update();
            },
          });
        } else {
          window.scrollTo({ top: targetY, behavior: 'smooth' });
          setTimeout(() => {
            ScrollTrigger.update();
          }, 450);
        }
      }

      function unlockScroll() {
        const lenis = (window as any).lenis;
        if (lenis && lenis.isStopped) {
          lenis.start();
        }
        unlockWindowScroll();
        document.body.style.overflow = '';
        setShowNavControls(false);

        const navElement = document.querySelector('header') as HTMLElement | null;
        if (navElement) {
          navElement.style.transform = 'translateY(0%)';
          navElement.style.opacity = '1';
          navElement.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        }
      }

      // Phase 1 (0% -> 30% scroll): Bottom-up reveal + dark backdrop fade in + header text lightens to white
      tl.fromTo(
        tabletRef.current,
        {
          y: '100%',
          rotateX: 18,
          scale: 0.85,
          opacity: 0,
        },
        {
          y: '0%',
          rotateX: 0,
          scale: 1.0,
          opacity: 1,
          duration: 0.3,
          ease: 'power2.out',
        },
        0
      );

      if (backdropRef?.current) {
        tl.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' },
          0
        );
      }

      if (headerTitleRef?.current) {
        tl.fromTo(
          headerTitleRef.current,
          { color: '#0f172a' },
          { color: '#ffffff', duration: 0.3, ease: 'power2.out' },
          0
        );
      }

      if (headerSubRef?.current) {
        tl.fromTo(
          headerSubRef.current,
          { color: '#64748b' },
          { color: '#cbd5e1', duration: 0.3, ease: 'power2.out' },
          0
        );
      }

      // Phase 2 (30% -> 72% scroll): Fullscreen Focus Zone (hold tablet upright at y: '0%', opacity: 1)
      tl.to(tabletRef.current, { y: '0%', opacity: 1, duration: 0.42 }, 0.3);

      // Phase 3 (72% -> 100% scroll): Slide fixed navbar back DOWN into view + exit tablet
      tl.to(
        tabletRef.current,
        { y: '80%', opacity: 0, scale: 0.9, duration: 0.28, ease: 'power2.in' },
        0.72
      );

      if (backdropRef?.current) {
        tl.to(backdropRef.current, { opacity: 0, duration: 0.28, ease: 'power2.in' }, 0.72);
      }

      if (headerTitleRef?.current) {
        tl.to(
          headerTitleRef.current,
          { color: '#0f172a', duration: 0.28, ease: 'power2.in' },
          0.72
        );
      }

      if (headerSubRef?.current) {
        tl.to(headerSubRef.current, { color: '#64748b', duration: 0.28, ease: 'power2.in' }, 0.72);
      }
    }, containerRef);

    return () => ctx.revert();
  }, [sectionRef, backdropRef, headerTitleRef, headerSubRef]);

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

      // 2. Wheel Scroll Isolation & Internal Container Scroll Listener (Native iPad Device Isolation)
      iframeWin.addEventListener(
        'wheel',
        (event: WheelEvent) => {
          let target = event.target as HTMLElement | null;

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
              }
              break;
            }
            target = target.parentElement;
          }

          // Always stop propagation and prevent default so mouse wheel inside tablet iframe 100% NEVER leaks to parent page scroll
          event.preventDefault();
          event.stopPropagation();
        },
        { passive: false }
      );
    } catch (err) {
      console.warn('Could not attach iframe listeners:', err);
    }
  };

  return (
    <div
      id="transparansi-tablet"
      ref={containerRef}
      className="relative w-full max-w-[min(1180px,calc((100dvh-210px)*1.6))] mx-auto flex flex-col items-center justify-center [perspective:1400px] h-full max-h-[calc(100dvh-210px)]"
    >
      {/* 3D Tablet Perspective Container */}
      <div
        ref={tabletRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className="relative w-full aspect-[16/10] max-w-[min(1180px,calc((100dvh-210px)*1.6))] max-h-[calc(100dvh-210px)] z-10 [transform-style:preserve-3d] will-change-transform group cursor-pointer"
      >
        {/* Hardware Side Navigation Controls (Attached to right outer edge of physical tablet frame) */}
        <div
          className={`absolute -right-14 md:-right-16 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50 transition-all duration-300 ${
            showNavControls
              ? 'opacity-100 translate-x-0 pointer-events-auto'
              : 'opacity-0 -translate-x-4 pointer-events-none'
          }`}
        >
          <button
            onClick={() => handleNavigate('up')}
            title="Kembali Ke Section Sebelumnya"
            className="group/btn relative flex items-center justify-center w-11 h-11 rounded-full bg-slate-900/90 hover:bg-primary text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 cursor-pointer"
          >
            <ChevronUp
              size={20}
              className="transition-transform group-hover/btn:-translate-y-0.5"
            />
            <span className="absolute left-14 whitespace-nowrap bg-slate-900/95 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none shadow-lg border border-white/10">
              Kembali Ke Section Sebelumnya
            </span>
          </button>

          <button
            onClick={() => handleNavigate('down')}
            title="Lanjut Ke Section Berikutnya"
            className="group/btn relative flex items-center justify-center w-11 h-11 rounded-full bg-slate-900/90 hover:bg-primary text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 cursor-pointer"
          >
            <ChevronDown
              size={20}
              className="transition-transform group-hover/btn:translate-y-0.5"
            />
            <span className="absolute left-14 whitespace-nowrap bg-slate-900/95 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none shadow-lg border border-white/10">
              Lanjut Ke Section Berikutnya
            </span>
          </button>
        </div>

        {/* CSS iPad Pro Outer Frame */}
        <div className="relative w-full h-full bg-slate-900 border-[10px] sm:border-[14px] md:border-[16px] border-slate-950 rounded-[32px] sm:rounded-[40px] md:rounded-[44px] shadow-2xl shadow-slate-950/80 ring-1 ring-white/15 overflow-hidden flex flex-col">
          {/* Top-Left Bezel Camera Dot (Mockup camera on top bezel, shifted left to avoid blocking logo) */}
          <div className="absolute top-2 left-8 sm:left-12 w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800/80 flex items-center justify-center z-30 shadow-inner">
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
