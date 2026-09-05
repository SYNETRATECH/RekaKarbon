import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '../../components/landing/Navbar';
import HeroSection from '../../components/landing/HeroSection';
import ComplianceStripSection from '../../components/landing/ComplianceStripSection';
import ProblemSolutionSection from '../../components/landing/ProblemSolutionSection';
import EcosystemSection from '../../components/landing/EcosystemSection';
import DMRVSection from '../../components/landing/DMRVSection';
import TokenomicsSection from '../../components/landing/TokenomicsSection';
import MapTeaserSection from '../../components/landing/MapTeaserSection';
import CommitmentSection from '../../components/landing/CommitmentSection';
import FAQSection from '../../components/landing/FAQSection';
import CTASectionBottom from '../../components/landing/CTASectionBottom';
import Footer from '../../components/landing/Footer';
import { SmoothCursor } from '../../components/landing/SmoothCursor';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function meta() {
  return [
    { title: 'RekaKarbon - Platform Verifikasi Emisi & Konservasi' },
    {
      name: 'description',
      content: 'Infrastruktur Kepatuhan Karbon Nasional & dMRV Terakreditasi',
    },
  ];
}

export default function LandingPageRoute() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize Lenis Smooth Scroll only on Landing Page
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    (window as any).lenis = lenis;

    // Synchronize Lenis scroll position with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateLenis);
      delete (window as any).lenis;
      lenis.destroy();
    };
  }, []);

  return (
    <div className="font-sans text-slate-800 antialiased relative min-h-screen">
      {/* GSAP Smooth Custom Cursor (landing page only, hides on tablet hover) */}
      <SmoothCursor />

      <Navbar />
      <main>
        <HeroSection />
        <ComplianceStripSection />
        <ProblemSolutionSection />
        <EcosystemSection />
        <DMRVSection />
        <TokenomicsSection />
        <MapTeaserSection />
        <CommitmentSection />
        <FAQSection />
        <CTASectionBottom />
        <Footer />
      </main>
    </div>
  );
}
