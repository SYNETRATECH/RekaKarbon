import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import MapCanvas from '../MapCanvas';
import { useMapStore } from '../../store/useMapStore';
import { projectRepository, companyRepository } from '../../repositories';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface MobileMapContainerProps {
  sectionRef: React.RefObject<HTMLDivElement | null>;
  backdropRef?: React.RefObject<HTMLDivElement | null>;
  headerContainerRef?: React.RefObject<HTMLDivElement | null>;
  headerTitleRef?: React.RefObject<HTMLHeadingElement | null>;
  headerSubRef?: React.RefObject<HTMLParagraphElement | null>;
  targetUrl?: string;
}

export const MobileMapContainer: React.FC<MobileMapContainerProps> = ({
  sectionRef,
  backdropRef,
  headerContainerRef: _headerContainerRef,
  headerTitleRef,
  headerSubRef,
  targetUrl = '/portal-transparansi',
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapBoxRef = useRef<HTMLDivElement>(null);
  const [showNavControls, setShowNavControls] = useState(false);
  const isNavigatingAwayRef = useRef(false);

  // Initialize Map Store data if empty
  useEffect(() => {
    if (useMapStore.getState().projects.length === 0) {
      Promise.all([
        projectRepository.getProjects().catch(() => []),
        companyRepository.getCompanies().catch(() => []),
      ]).then(([projects, companies]) => {
        useMapStore.setState({
          projects,
          companies,
          activeCoords: projects[0]
            ? (JSON.parse(JSON.stringify(projects[0].coordinates)) as any)
            : [],
        });
      });
    }
  }, []);

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
        window.scrollBy({ top: -window.innerHeight * 1.2, behavior: 'smooth' });
        setTimeout(resetNavFlag, 1200);
      }
    } else {
      const nextTarget = document.getElementById('komitmen');
      if (nextTarget && lenis) {
        lenis.scrollTo(nextTarget, { duration: 1.2, onComplete: resetNavFlag });
      } else {
        window.scrollBy({ top: window.innerHeight * 1.2, behavior: 'smooth' });
        setTimeout(resetNavFlag, 1200);
      }
    }
  };

  // GSAP ScrollTrigger timeline matching 3D Tablet container reveal & lock logic
  useEffect(() => {
    if (!mapBoxRef.current || !sectionRef.current) return;

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

        document.body.style.overflow = 'hidden';
        lockWindowScroll();
        setShowNavControls(true);

        const navElement = document.querySelector('header') as HTMLElement | null;
        if (navElement) {
          navElement.style.transform = 'translateY(-100%)';
          navElement.style.opacity = '0';
          navElement.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        }

        if (lenis) {
          if (lenis.isStopped) {
            lenis.start();
          }
          lenis.scrollTo(targetY, {
            duration: 0.45,
            easing: (t: number) => 1 - Math.pow(1 - t, 3),
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

      // Phase 1 (0% -> 30% scroll): Bottom-up reveal + dark backdrop fade in + header text white
      tl.fromTo(
        mapBoxRef.current,
        {
          y: '100%',
          scale: 0.9,
          opacity: 0,
        },
        {
          y: '0%',
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

      // Phase 2 (30% -> 72% scroll): Hold map box upright
      tl.to(mapBoxRef.current, { y: '0%', opacity: 1, duration: 0.42 }, 0.3);

      // Phase 3 (72% -> 100% scroll): Exit map box
      tl.to(
        mapBoxRef.current,
        { y: '80%', opacity: 0, scale: 0.92, duration: 0.28, ease: 'power2.in' },
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

  return (
    <div
      id="transparansi-mobile-map"
      ref={containerRef}
      className="relative w-full max-w-lg mx-auto flex flex-col items-center justify-center h-full max-h-[calc(100dvh-180px)] px-2"
    >
      {/* Navigation Controls Above the Map Container (Icon Only) */}
      <div
        className={`flex items-center justify-center gap-3 mb-2 z-40 transition-all duration-300 ${
          showNavControls
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <button
          onClick={() => handleNavigate('up')}
          title="Ke Section Sebelumnya"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/90 hover:bg-emerald-600 text-white border border-white/20 shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          <ChevronUp size={20} />
        </button>
        <button
          onClick={() => handleNavigate('down')}
          title="Ke Section Berikutnya"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/90 hover:bg-emerald-600 text-white border border-white/20 shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Main Mobile Map Container Box */}
      <div
        ref={mapBoxRef}
        className="relative w-full h-[calc(100dvh-220px)] min-h-[380px] max-h-[580px] bg-slate-950 rounded-[28px] sm:rounded-[36px] border-2 border-white/15 shadow-2xl shadow-slate-950/90 overflow-hidden flex flex-col z-20"
      >
        {/* Leaflet Map Canvas Layer */}
        <div className="relative w-full h-full">
          <MapCanvas hideControls />

          {/* Floating Mobile Action Button: Portal Transparansi */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[450] w-[90%] max-w-xs">
            <button
              onClick={() => {
                document.body.style.overflow = '';
                const lenis = (window as any).lenis;
                if (lenis) lenis.start();
                navigate(targetUrl);
              }}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/40 border border-emerald-400/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98"
            >
              <span>Buka Portal Transparansi</span>
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
