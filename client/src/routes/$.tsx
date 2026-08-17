import { Link } from 'react-router';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import brandIcon from '../assets/icon.png';

export function meta() {
  return [
    { title: '404 - Halaman Tidak Ditemukan | RekaKarbon' },
    { name: 'description', content: 'Halaman yang Anda cari tidak ditemukan.' },
  ];
}

export default function NotFoundRoute() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden font-sans">
      {/* Subtle Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -top-20 -left-20"></div>
      <div className="absolute w-[400px] h-[400px] bg-[#00C48C]/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20"></div>

      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-slate-700/60 shadow-2xl space-y-6 z-10 text-left">
        {/* Brand Badge */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-700/60">
          <img src={brandIcon} alt="RekaKarbon Logo" className="w-8 h-8 object-contain" />
          <div>
            <h2 className="font-black text-sm text-white leading-none">REKAKARBON</h2>
            <span className="text-[9px] text-[#00C48C] font-extrabold block mt-0.5 uppercase tracking-wider">
              Verification Platform
            </span>
          </div>
        </div>

        {/* 404 Status Icon */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full text-rose-400 text-xs font-bold">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>ERROR 404 — NOT FOUND</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Maaf, halaman atau rute URL yang Anda tuju tidak terdaftar di sistem RekaKarbon. Silakan
            kembali ke Beranda atau Portal.
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="flex-1 bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Home className="w-4 h-4 text-[#00C48C]" />
            Kembali ke Beranda
          </Link>
          <button
            onClick={() => window.history.back()}
            className="bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-bold text-xs py-3 px-4 rounded-xl border border-slate-600 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Mundur
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-500 mt-8 z-10 font-medium">
        RekaKarbon Verichain Architecture · React Router v7
      </p>
    </div>
  );
}
