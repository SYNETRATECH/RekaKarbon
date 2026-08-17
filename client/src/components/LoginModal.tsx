import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useCarbonStore } from '../store/useCarbonStore';
import {
  TreePine,
  Building2,
  CheckSquare,
  Mail,
  Lock,
  Key,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import brandIcon from '../assets/icon.png';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function LoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, loginAsRole, loginWithCredentials } =
    useCarbonStore();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<'emitter' | 'regulator' | 'auditor' | 'kth'>(
    'emitter'
  );

  // Dummy form states
  const [identityInput, setIdentityInput] = useState('admin@semennusantara.co.id');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [verichainKeyInput, setVerichainKeyInput] = useState('VCH-KEY-99412-2025');

  const handleRoleSelect = (roleKey: 'emitter' | 'regulator' | 'auditor' | 'kth') => {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await loginWithCredentials({
      role: selectedRole,
      email: identityInput,
      password: passwordInput,
    });
    setIsLoginModalOpen(false);
    navigate(`/portal/${selectedRole}`);
  };

  const handleBypassLogin = async () => {
    await loginAsRole(selectedRole);
    setIsLoginModalOpen(false);
    navigate(`/portal/${selectedRole}`);
  };

  return (
    <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
      <DialogContent className="p-0 max-w-xl border-slate-200 overflow-hidden text-left gap-0">
        {/* Header Bar */}
        <DialogHeader className="h-16 bg-slate-900 text-white px-6 flex flex-row items-center justify-between shrink-0 space-y-0">
          <div className="flex items-center gap-3">
            <img
              src={brandIcon}
              alt="RekaKarbon Logo"
              className="w-8 h-8 rounded-xl shadow-xs object-contain"
            />
            <div>
              <DialogTitle className="font-extrabold text-sm text-white leading-none">
                REKAKARBON PORTAL
              </DialogTitle>
              <span className="text-[9px] text-[#00C48C] font-extrabold block mt-0.5">
                Otentikasi Terenkripsi Verichain
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Content */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Auth Mode Toggle Switcher (Login vs Sign In / Register) */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
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

          {/* Role Selection Label */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
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
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    selectedRole === 'emitter'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight">
                  Pelaku Usaha
                </h5>
                <Badge variant="secondary" className="text-[8px] px-1.5 py-0">
                  Emitter / Industri
                </Badge>
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
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    selectedRole === 'regulator'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight">
                  Regulator
                </h5>
                <Badge variant="secondary" className="text-[8px] px-1.5 py-0">
                  KLHK & DJP
                </Badge>
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
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    selectedRole === 'auditor'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </div>
                <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight">
                  Auditor LVV
                </h5>
                <Badge variant="secondary" className="text-[8px] px-1.5 py-0">
                  Independen
                </Badge>
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
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    selectedRole === 'kth'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <TreePine className="w-4 h-4" />
                </div>
                <h5 className="font-extrabold text-[11px] text-slate-900 leading-tight">
                  Kelompok Tani
                </h5>
                <Badge variant="secondary" className="text-[8px] px-1.5 py-0">
                  KTH Proyek
                </Badge>
              </div>
            </div>
          </div>

          {/* Form Input Section */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              2. KREDENSIAL {authMode === 'login' ? 'MASUK' : 'PENDAFTARAN'} (
              {selectedRole.toUpperCase()})
            </span>

            {/* Email / ID Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">
                {selectedRole === 'regulator'
                  ? 'NIP / Email Resmi Dinas'
                  : selectedRole === 'emitter'
                    ? 'Email Corporate / NIB Industri'
                    : 'ID Lisensi Auditor / Email'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 z-10">
                  <Mail className="w-4 h-4 text-[#00C48C]" />
                </span>
                <Input
                  type="text"
                  value={identityInput}
                  onChange={(e) => setIdentityInput(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">
                Kata Sandi / Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 z-10">
                  <Lock className="w-4 h-4 text-[#00C48C]" />
                </span>
                <Input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Security Key */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">
                Verichain Security Key / Token Otoritas
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 z-10">
                  <Key className="w-4 h-4 text-[#00C48C]" />
                </span>
                <Input
                  type="text"
                  value={verichainKeyInput}
                  onChange={(e) => setVerichainKeyInput(e.target.value)}
                  className="pl-10 font-mono font-bold text-emerald-800"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <Button
                type="submit"
                className="w-full bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
                {authMode === 'login'
                  ? `Masuk Portal (${selectedRole.toUpperCase()})`
                  : `Daftar Akun (${selectedRole.toUpperCase()})`}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleBypassLogin}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-5 rounded-xl border border-slate-800 shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <span>⚡ Bypass Login (Langsung Masuk Page {selectedRole.toUpperCase()})</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#00C48C]" />
              </Button>
            </div>
          </form>

          {/* Footer note */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium">
              Otentikasi aman terhubung ke KLHK SIMPONI & NusaCarbon Verichain API.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
