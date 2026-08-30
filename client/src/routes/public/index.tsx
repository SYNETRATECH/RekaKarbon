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
  return (
    <div className="font-sans text-slate-800 antialiased relative min-h-screen">
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
