import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router';
import { useCarbonStore } from '../store/useCarbonStore';
import { Mail, Lock, ShieldCheck, ArrowLeft, UserCheck, UserPlus, Eye, EyeOff } from 'lucide-react';
import brandIcon from '../assets/icon.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function meta() {
  return [
    { title: 'Masuk Portal - RekaKarbon' },
    { name: 'description', content: 'Otentikasi aman RekaKarbon Portal' },
  ];
}

export default function LoginRoute() {
  const { loginWithCredentials } = useCarbonStore();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await loginWithCredentials({
        email: emailInput,
        identity: emailInput,
        password: passwordInput,
      });
      setIsLoading(false);
      navigate('/dashboard');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(
        err?.message || 'Gagal melakukan otentikasi. Silakan periksa kembali kredensial Anda.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans relative overflow-hidden text-left">
      {/* Subtle Background Accent Blurs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="h-20 px-6 md:px-12 flex items-center justify-between z-10 border-b border-slate-200/60 bg-white/70 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={brandIcon}
            alt="RekaKarbon Logo"
            className="w-9 h-9 rounded-xl shadow-xs object-contain group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <h1 className="font-extrabold text-primary-gradient text-base leading-none tracking-tight">
              REKAKARBON
            </h1>
            <span className="text-[9px] text-[#00C48C] font-bold tracking-wider uppercase mt-0.5">
              Transparency Portal
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Kembali ke Beranda</span>
        </Link>
      </header>

      {/* Center Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl space-y-6 animate-fade-in">
          {/* Header Title */}
          <div className="space-y-1.5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 mx-auto flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-[#033C2E]" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {authMode === 'login' ? 'Masuk ke Portal' : 'Pendaftaran Akun Baru'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Otentikasi aman terenkripsi Verichain & KLHK SIMPONI
            </p>
          </div>

          {/* Mode Switcher (Sign In vs Sign Up) */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200/60">
            <Button
              variant={authMode === 'login' ? 'default' : 'ghost'}
              className={`flex-1 py-2 text-xs font-black rounded-xl cursor-pointer ${
                authMode === 'login'
                  ? 'bg-primary-gradient text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setAuthMode('login')}
            >
              <UserCheck className="w-4 h-4 text-[#00C48C]" />
              Masuk (Sign In)
            </Button>
            <Button
              variant={authMode === 'register' ? 'default' : 'ghost'}
              className={`flex-1 py-2 text-xs font-black rounded-xl cursor-pointer ${
                authMode === 'register'
                  ? 'bg-primary-gradient text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setAuthMode('register')}
            >
              <UserPlus className="w-4 h-4 text-[#00C48C]" />
              Daftar Baru (Sign Up)
            </Button>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Corporate ID */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Email Pengguna / NIP Resmi / ID Instansi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 z-10">
                  <Mail className="w-4 h-4 text-[#00C48C]" />
                </span>
                <Input
                  type="email"
                  placeholder="nama@instansi.go.id / admin@perusahaan.co.id"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="pl-10 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 z-10">
                  <Lock className="w-4 h-4 text-[#00C48C]" />
                </span>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="pl-10 pr-10 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-500 hover:text-slate-700" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
                <span>
                  {isLoading
                    ? 'Memproses Otentikasi...'
                    : authMode === 'login'
                      ? 'Masuk Portal RekaKarbon'
                      : 'Kirim Pendaftaran Akun'}
                </span>
              </Button>
            </div>
          </form>

          {/* Footer Info */}
          <div className="text-center pt-4 border-t border-slate-100 space-y-1">
            <p className="text-[10px] text-slate-400 font-medium">
              Hak Cipta © 2026 RekaKarbon Platform. Seluruh Hak Dilindungi.
            </p>
          </div>
        </div>
      </main>

      {/* Footer System Bar */}
      <footer className="h-14 px-6 md:px-12 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/60 bg-white/50 backdrop-blur-xs">
        <span>Sistem Terverifikasi Verichain On-Chain dMRV</span>
        <span className="flex items-center gap-1.5 font-semibold text-slate-600">
          <span className="w-2 h-2 bg-[#00C48C] rounded-full animate-pulse"></span>
          Mainnet Node Active
        </span>
      </footer>
    </div>
  );
}
