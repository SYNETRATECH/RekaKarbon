import { Globe, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function CTASectionBottom({ onOpenPortal }: { onOpenPortal?: () => void } = {}) {
  const navigate = useNavigate();
  const handleOpenPortal = onOpenPortal || (() => navigate('/portal-transparansi'));
  const handleLogin = () => navigate('/login');

  return (
    <section className="relative overflow-hidden bg-primary-gradient text-white py-28 px-6 text-center">
      {/* Cloud overlay */}
      <img
        src="https://images.unsplash.com/photo-1768482055878-af07eeb275c8?w=1600&h=900&fit=crop&auto=format&q=75"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none select-none opacity-20 mix-blend-screen"
        style={{ zIndex: 0 }}
      />
      {/* Left bonsai tree */}
      <div
        className="absolute bottom-0 left-0 h-[85%] w-52 lg:w-64 pointer-events-none select-none opacity-40 mix-blend-screen"
        style={{
          zIndex: 1,
          WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1765810655660-c3e907524d1e?w=400&h=600&fit=crop&auto=format"
          alt=""
          className="w-full h-full object-cover object-right"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>
      {/* Right bonsai tree */}
      <div
        className="absolute bottom-0 right-0 h-[85%] w-52 lg:w-64 pointer-events-none select-none opacity-40 mix-blend-screen"
        style={{
          zIndex: 1,
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1765810655660-c3e907524d1e?w=400&h=600&fit=crop&auto=format"
          alt=""
          className="w-full h-full object-cover object-left"
        />
      </div>

      <div className="relative" style={{ zIndex: 2 }}>
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur text-[11px] text-white mb-6 shadow-sm border border-white/40">
          🚀 Bergabunglah Sekarang
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
          Siap Mewujudkan Kepatuhan Emisi
          <br />
          dan Transparansi Karbon Berkeadilan?
        </h2>
        <p className="text-sm text-white/80 mb-8 max-w-lg mx-auto leading-relaxed">
          Bergabunglah dengan ekosistem RekaKarbon. Akselerasi dekarbonisasi industri Anda atau
          daftarkan kawasan perhutanan sosial Anda hari ini.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={handleLogin}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-slate-100 transition-colors text-sm shadow-lg shadow-black/15 cursor-pointer"
          >
            Daftar / Masuk Portal
            <ArrowUpRight size={15} />
          </button>
          <button
            onClick={handleOpenPortal}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-white/70 bg-white/10 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-sm cursor-pointer"
          >
            <Globe size={14} />
            Buka Peta Transparansi
          </button>
        </div>
      </div>
    </section>
  );
}
