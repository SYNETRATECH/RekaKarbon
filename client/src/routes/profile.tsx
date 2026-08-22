import { useCarbonStore } from '../store/useCarbonStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Shield, Building, Key, Wallet, Mail } from 'lucide-react';
import { Link } from 'react-router';

export function meta() {
  return [
    { title: 'Profil Pengguna | RekaKarbon' },
    { name: 'description', content: 'Profil Pengguna Platform RekaKarbon' },
  ];
}

export default function ProfileRoute() {
  const { userRole, userProfile } = useCarbonStore();

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'superadmin':
      case 'admin':
        return (
          <Badge className="bg-rose-100 text-rose-900 border-rose-200">Super Administrator</Badge>
        );
      case 'regulator':
        return <Badge className="bg-blue-100 text-blue-900 border-blue-200">Regulator KLHK</Badge>;
      case 'auditor':
        return (
          <Badge className="bg-amber-100 text-amber-900 border-amber-200">Auditor Independen</Badge>
        );
      case 'kth':
        return (
          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-200">
            Kelompok Tani Hutan (KTH)
          </Badge>
        );
      case 'buyer':
        return (
          <Badge className="bg-teal-100 text-teal-900 border-teal-200">
            Pembeli Karbon Terdaftar
          </Badge>
        );
      default:
        return (
          <Badge className="bg-purple-100 text-purple-900 border-purple-200">
            Pelaku Usaha (Emitter)
          </Badge>
        );
    }
  };

  const mockAddress = {
    superadmin: '0x1a2B...F9A0',
    admin: '0x1a2B...F9A0',
    regulator: '0x8114...1945',
    auditor: '0x9942...2026',
    kth: '0x7120...0024',
    buyer: '0x0D1E...7C8D',
    emitter: '0x003e...Bud1',
  }[userRole || 'emitter'];

  return (
    <div className="space-y-8 animate-fade-in text-left max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Profil Akun Saya</h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Informasi otentikasi identitas, wewenang peran, dan alamat dompet blockchain yang aktif.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="rounded-3xl border-slate-200 shadow-2xs md:col-span-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-[#033C2E] text-white font-black text-2xl flex items-center justify-center shadow-md mb-4 border border-emerald-500/20">
            {userProfile?.avatar || 'TK'}
          </div>
          <h3 className="text-lg font-black text-slate-900 leading-snug">{userProfile?.name}</h3>
          <p className="text-xs text-slate-500 font-bold mt-1">{userProfile?.roleTitle}</p>
          <div className="mt-4">{getRoleBadge(userRole)}</div>
        </Card>

        {/* Details Card */}
        <Card className="rounded-3xl border-slate-200 shadow-2xs md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Detail Informasi Organisasi & Kredensial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  Nama Instansi / Perusahaan
                </span>
                <div className="flex items-center gap-2 text-slate-900 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{userProfile?.agency || '-'}</span>
                </div>
              </div>
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  Alamat Email
                </span>
                <div className="flex items-center gap-2 text-slate-900 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {userProfile?.name.toLowerCase().replace(/\s+/g, '')}@rekakarbon.go.id
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  Wewenang Akses
                </span>
                <div className="flex items-center gap-2 text-slate-900 mt-0.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Akses Penuh Portal {userRole === 'regulator' ? 'KLHK' : 'Verichain'}</span>
                </div>
              </div>
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  Alamat Wallet Verichain
                </span>
                <div className="flex items-center gap-2 text-slate-900 mt-0.5 font-mono">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" />
                  <span>{mockAddress}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <Key className="w-4 h-4 text-slate-400" />
                <span>Kunci Kriptografi Tersimpan Aktif</span>
              </div>
              <Button
                asChild
                className="bg-primary-gradient text-white rounded-xl text-[10px] font-bold h-auto py-2"
              >
                <Link to="/settings">Ubah Pengaturan Akun</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
