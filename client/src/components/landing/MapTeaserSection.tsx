import { useRef } from 'react';
import { CSSTablet3D } from './CSSTablet3D';

export default function MapTeaserSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={sectionRef}
      id="transparansi"
      className="relative h-[220vh] bg-surface-alt overflow-visible"
    >
      {/* Sticky Container with Navbar clearance (pt-[72px]) */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-start items-center overflow-hidden pt-[72px] pb-6 px-4">
        <div className="w-full max-w-[1280px] mx-auto flex flex-col items-center justify-start h-full pt-4 sm:pt-6">
          {/* Section Header */}
          <div className="text-center shrink-0 mb-3 sm:mb-5 z-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-2.5">
              Eksplorasi Transparansi Karbon Spasial
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Pantau kondisi kesehatan hutan konservasi secara spasial dan rekam jejak emisi
              korporasi
              <br className="hidden sm:inline" />
              secara real-time langsung melalui portal publik RekaKarbon.
            </p>
          </div>

          {/* Sticky 3D CSS Tablet Container */}
          <div className="relative w-full flex-1 flex items-center justify-center overflow-visible min-h-0">
            <CSSTablet3D sectionRef={sectionRef} targetUrl="/portal-transparansi" />
          </div>
        </div>
      </div>
    </section>
  );
}
