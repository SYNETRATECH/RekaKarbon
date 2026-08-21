import { useState, useEffect } from 'react';
import { ArrowRight, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router';
import brandIcon from '../../assets/icon.png';

export default function Navbar({
  page,
  setPage,
}: {
  page: 'home' | 'maps';
  setPage: (p: 'home' | 'maps') => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const solidBg = scrolled || page === 'maps';
  const linkBase = `text-[14px] font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer`;

  const linkCls = solidBg
    ? `${linkBase} text-slate-600 hover:text-slate-900 hover:bg-slate-100`
    : `${linkBase} text-slate-800 hover:text-slate-900 hover:bg-white/30`;

  const activeCls = solidBg
    ? `${linkBase} text-slate-900 font-semibold bg-slate-100/50`
    : `${linkBase} text-slate-900 font-semibold bg-white/40`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${solidBg ? 'bg-white/96 backdrop-blur-md shadow-sm border-b border-slate-200/50' : 'bg-transparent'}`}
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 h-[72px] flex items-center relative">
        {/* Left nav */}
        <nav className="flex items-center gap-1 flex-1">
          <button
            onClick={() => {
              setPage('home');
              window.scrollTo(0, 0);
            }}
            className={page === 'home' ? activeCls : linkCls}
          >
            Beranda
          </button>
          <button
            onClick={() => {
              setPage('maps');
              window.scrollTo(0, 0);
            }}
            className={page === 'maps' ? activeCls : linkCls}
          >
            Portal Transparansi
          </button>
        </nav>

        {/* Center brand mark */}
        <button
          onClick={() => {
            setPage('home');
            window.scrollTo(0, 0);
          }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
        >
          <img src={brandIcon} alt="Logo" className="w-7 h-7 object-contain rounded-md shadow-sm" />
          <span className="text-lg font-extrabold tracking-tight text-slate-800 leading-none">
            RekaKarbon
          </span>
        </button>

        {/* Right: Auth */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogIn size={14} className="opacity-70" />
            Masuk
          </button>

          <button
            onClick={() => navigate('/register')}
            className="group flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-[13px] font-bold rounded-xl hover:bg-primary-light transition-all shadow-md shadow-primary/20 cursor-pointer whitespace-nowrap"
          >
            Mulai Sekarang
            <ArrowRight
              size={14}
              className="text-tech-mint transition-transform group-hover:translate-x-0.5"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
