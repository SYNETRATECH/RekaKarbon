import { useState } from 'react';
import { useCarbonStore } from '../store/useCarbonStore';
import { 
  TreePine, 
  Building2, 
  CheckSquare, 
  Lock, 
  Mail, 
  Key, 
  ShieldCheck, 
  ArrowRight, 
  X,
  UserCheck,
  UserPlus
} from 'lucide-react';
import brandIcon from '../assets/icon.png';

export default function LoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, loginAsRole } = useCarbonStore();
  
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState('corporate'); // 'dinas' | 'corporate' | 'auditor'
  
  // Dummy form states
  const [identityInput, setIdentityInput] = useState('admin@semennusantara.co.id');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [verichainKeyInput, setVerichainKeyInput] = useState('VCH-KEY-99412-2025');

  if (!isLoginModalOpen) return null;

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    if (roleKey === 'emitter') {
      setIdentityInput('admin@semennusantara.co.id');
      setVerichainKeyInput('VCH-CORP-99412');
    } else if (roleKey === 'regulator') {
      setIdentityInput('198204122008011004@klhk.go.id');
      setVerichainKeyInput('VCH-GOV-ID-7721');
    } else if (roleKey === 'auditor') {
      setIdentityInput('auditor.rian@sucofindo.co.id');
      setVerichainKeyInput('VCH-AUDIT-44819');
    } else if (roleKey === 'kth') {
      setIdentityInput('sutrisno@kthbaluran.org');
      setVerichainKeyInput('VCH-KTH-33109');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loginAsRole(selectedRole);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-xl flex flex-col relative animate-fade-in text-left">
        
        {/* Header Bar */}
        <div className="h-16 bg-slate-900 text-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img src={brandIcon} alt="RekaKarbon Logo" className="w-8 h-8 rounded-xl shadow-xs object-contain" />
            <div>
              <h3 className="font-extrabold text-sm text-white leading-none">REKAKARBON PORTAL</h3>
              <span className="text-[9px] text-[#00C48C] font-extrabold block mt-0.5">Otentikasi Terenkripsi Verichain</span>
            </div>
          </div>
          <button 
            onClick={() => setIsLoginModalOpen(false)}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-all cursor-pointer font-bold text-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[85vh]">
          
          {/* Auth Mode Toggle Switcher (Login vs Sign In / Register) */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-primary-gradient text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4 text-[#00C48C]" />
              Masuk (Sign In)
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'register'
                  ? 'bg-primary-gradient text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4 text-[#00C48C]" />
              Daftar Baru (Sign Up)
            </button>
          </div>

          {/* Role Selection Label */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
              1. PILIH HAK AKSES PERAN (ROLE)
            </span>

            {/* 4 Role Choice Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* Role 1: Pelaku Usaha (Emitter) */}
              <div 
                onClick={() => handleRoleSelect('emitter')}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer space-y-1 text-center flex flex-col items-center justify-center ${
                  selectedRole === 'emitter'
                    ? 'border-slate-800 bg-slate-50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedRole === 'emitter' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight">Pelaku Usaha</h5>
                <span className="text-[8px] font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.2 rounded-full">Emitter / Industri</span>
              </div>

              {/* Role 2: Regulator */}
              <div 
                onClick={() => handleRoleSelect('regulator')}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer space-y-1 text-center flex flex-col items-center justify-center ${
                  selectedRole === 'regulator'
                    ? 'border-slate-800 bg-slate-50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedRole === 'regulator' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight">Regulator</h5>
                <span className="text-[8px] font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.2 rounded-full">KLHK & DJP</span>
              </div>

              {/* Role 3: Auditor */}
              <div 
                onClick={() => handleRoleSelect('auditor')}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer space-y-1 text-center flex flex-col items-center justify-center ${
                  selectedRole === 'auditor'
                    ? 'border-slate-800 bg-slate-50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedRole === 'auditor' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <CheckSquare className="w-4 h-4" />
                </div>
                <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight">Auditor LVV</h5>
                <span className="text-[8px] font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.2 rounded-full">Independen</span>
              </div>

              {/* Role 4: KTH */}
              <div 
                onClick={() => handleRoleSelect('kth')}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer space-y-1 text-center flex flex-col items-center justify-center ${
                  selectedRole === 'kth'
                    ? 'border-slate-800 bg-slate-50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedRole === 'kth' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <TreePine className="w-4 h-4" />
                </div>
                <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight">Kelompok Tani</h5>
                <span className="text-[8px] font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.2 rounded-full">KTH Proyek</span>
              </div>

            </div>
          </div>

          {/* Form Input Section */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
              2. KREDENSIAL {authMode === 'login' ? 'MASUK' : 'PENDAFTARAN'} ({selectedRole.toUpperCase()})
            </span>

            {/* Email / ID Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">
                {selectedRole === 'dinas' ? 'NIP / Email Resmi Dinas' : selectedRole === 'corporate' ? 'Email Corporate / NIB Industri' : 'ID Lisensi Auditor / Email'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4 text-[#00C48C]" />
                </span>
                <input 
                  type="text" 
                  value={identityInput}
                  onChange={(e) => setIdentityInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[var(--color-primary)] transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Kata Sandi / Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4 text-[#00C48C]" />
                </span>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[var(--color-primary)] transition-all"
                  required
                />
              </div>
            </div>

            {/* Security Key */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Verichain Security Key / Token Otoritas</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Key className="w-4 h-4 text-[#00C48C]" />
                </span>
                <input 
                  type="text" 
                  value={verichainKeyInput}
                  onChange={(e) => setVerichainKeyInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-emerald-800 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[var(--color-primary)] transition-all"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              {/* Primary Submit Button */}
              <button
                type="submit"
                className="w-full bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
                {authMode === 'login' ? `Masuk Portal (${selectedRole.toUpperCase()})` : `Daftar Akun (${selectedRole.toUpperCase()})`}
              </button>

              {/* ONE-CLICK BYPASS LOGIN BUTTON FOR INSTANT TESTING */}
              <button
                type="button"
                onClick={() => loginAsRole(selectedRole)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-800 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <span>⚡ Bypass Login (Langsung Masuk Page {selectedRole.toUpperCase()})</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00C48C]" />
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400">
              Otentikasi aman terhubung ke **KLHK SIMPONI & NusaCarbon Verichain API**.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
