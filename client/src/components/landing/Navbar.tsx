import { useState, useEffect } from 'react';
import { ArrowRight, LogIn, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import brandIcon from '../../assets/icon.png';

interface NavbarProps {
  page?: 'home' | 'maps';
  setPage?: (p: 'home' | 'maps') => void;
}

export default function Navbar({ page, setPage }: NavbarProps = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const isTransparansi = location.pathname === '/portal-transparansi' || page === 'maps';

  const isHome = !isTransparansi && (location.pathname === '/' || page === 'home');

  const solidBg = scrolled || isTransparansi;
  const linkBase = `text-[14px] font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer`;

  const linkCls = solidBg
    ? `${linkBase} text-slate-600 hover:text-slate-900 hover:bg-slate-100`
    : `${linkBase} text-slate-800 hover:text-slate-900 hover:bg-white/30`;

  const activeCls = solidBg
    ? `${linkBase} text-slate-900 font-semibold bg-slate-100/50`
    : `${linkBase} text-slate-900 font-semibold bg-white/40`;

  const handleGoHome = () => {
    if (setPage) setPage('home');
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const handleGoTransparansi = () => {
    if (setPage) setPage('maps');
    navigate('/portal-transparansi');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${solidBg ? 'bg-white/96 backdrop-blur-md shadow-sm border-b border-slate-200/50' : 'bg-transparent'}`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 h-[72px] flex justify-between items-center relative w-full">
        {/* Desktop Left Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          <button onClick={handleGoHome} className={isHome ? activeCls : linkCls}>
            Beranda
          </button>
          <button onClick={handleGoTransparansi} className={isTransparansi ? activeCls : linkCls}>
            Portal Transparansi
          </button>
        </nav>

        {/* Brand Mark (Left on Mobile, Center on Desktop) */}
        <button
          onClick={handleGoHome}
          className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 shrink-0 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
        >
          <img src={brandIcon} alt="Logo" className="w-7 h-7 object-contain rounded-md shadow-sm" />
          <span className="text-lg font-extrabold tracking-tight text-slate-800 leading-none">
            RekaKarbon
          </span>
        </button>

        {/* Desktop Right Auth */}
        <div className="hidden md:flex items-center gap-4 flex-1 justify-end shrink-0">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogIn size={14} className="opacity-70" />
            Masuk
          </button>

          <button
            onClick={() => navigate('/login')}
            className="group flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-[13px] font-bold rounded-xl hover:bg-primary-light transition-all shadow-md shadow-primary/20 cursor-pointer whitespace-nowrap"
          >
            Mulai Sekarang
            <ArrowRight
              size={14}
              className="text-tech-mint transition-transform group-hover:translate-x-0.5"
            />
          </button>
        </div>

        {/* Mobile menu button (Right on Mobile, Hidden on Desktop) */}
        <button
          className="md:hidden p-2 -mr-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[72px] left-0 right-0 bg-white border-b border-slate-200 shadow-lg py-4 px-4 flex flex-col gap-2">
          <button
            onClick={handleGoHome}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium ${isHome ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            Beranda
          </button>
          <button
            onClick={handleGoTransparansi}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium ${isTransparansi ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            Portal Transparansi
          </button>

          <div className="h-px bg-slate-100 my-2 w-full" />

          <button
            onClick={() => {
              navigate('/login');
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogIn size={18} className="opacity-70" />
            Masuk
          </button>

          <button
            onClick={() => {
              navigate('/login');
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex justify-center items-center gap-1.5 px-4 py-3.5 mt-1 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-all"
          >
            Mulai Sekarang
            <ArrowRight size={16} className="text-tech-mint" />
          </button>
        </div>
      )}
    </header>
  );
}
