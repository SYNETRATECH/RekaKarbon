import { useRef } from 'react';
import { CSSTablet3D } from './CSSTablet3D';

export default function MapTeaserSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const headerContainerRef = useRef<HTMLDivElement>(null);
  const headerTitleRef = useRef<HTMLHeadingElement>(null);
  const headerSubRef = useRef<HTMLParagraphElement>(null);

  return (
    <section
      ref={sectionRef}
      id="transparansi"
      className="relative h-[260vh] bg-surface-alt overflow-visible"
    >
      {/* Sticky Container with balanced vertical padding */}
      <div className="sticky top-0 h-[100dvh] w-full flex flex-col justify-start items-center overflow-hidden pt-4 sm:pt-6 pb-4 sm:pb-6 px-4">
        {/* Dark Backdrop Overlay */}
        <div
          ref={backdropRef}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-opacity duration-300 z-10"
        />

        <div className="w-full max-w-[1280px] mx-auto flex flex-col items-center justify-start h-full pt-6 sm:pt-10 md:pt-14 relative z-20">
          {/* Section Header */}
          <div
            ref={headerContainerRef}
            className="text-center shrink-0 mb-3 sm:mb-5 md:mb-6 z-20 transition-all duration-300 will-change-transform"
          >
            <h2
              ref={headerTitleRef}
              className="text-[clamp(1.2rem,2.2vh+0.8vw,2.5rem)] font-extrabold text-slate-900 leading-tight tracking-tight mb-1 transition-colors duration-300"
            >
              Eksplorasi Transparansi Karbon Spasial
            </h2>
            <p
              ref={headerSubRef}
              className="text-[clamp(0.72rem,1vh+0.4vw,1rem)] text-slate-500 max-w-2xl mx-auto leading-relaxed transition-colors duration-300"
            >
              Pantau kondisi kesehatan hutan konservasi secara spasial dan rekam jejak emisi
              korporasi
              <br className="hidden sm:inline" />
              secara real-time langsung melalui portal publik RekaKarbon.
            </p>
          </div>

          {/* Sticky 3D CSS Tablet Container */}
          <div className="relative w-full flex-1 flex items-center justify-center overflow-visible min-h-0 z-20">
            <CSSTablet3D
              sectionRef={sectionRef}
              backdropRef={backdropRef}
              headerContainerRef={headerContainerRef}
              headerTitleRef={headerTitleRef}
              headerSubRef={headerSubRef}
              targetUrl="/portal-transparansi"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
