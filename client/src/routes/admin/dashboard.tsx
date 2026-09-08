import { useLoaderData, Link } from 'react-router';
import { adminRepository } from '../../repositories';
import type { AdminUserItem, AdminStats } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  ArrowRight,
  Sparkles,
  Building,
  TreePine,
  Factory,
  Landmark,
  Scale,
  ShoppingBag,
} from 'lucide-react';

export function meta() {
  return [
    { title: 'Dashboard Administrator | RekaKarbon' },
    { name: 'description', content: 'Ringkasan operasional dan tata kelola akun RekaKarbon' },
  ];
}

export async function clientLoader() {
  const [stats, usersResponse] = await Promise.all([
    adminRepository.getStats().catch((): AdminStats => ({
      totalUsers: 0,
      activeUsers: 0,
      suspendedUsers: 0,
      pendingVerificationUsers: 0,
      roleCounts: {},
      pendingKybCount: 0,
    })),
    adminRepository.getUsers({ limit: 5 }).catch(() => ({
      data: [] as AdminUserItem[],
      meta: { total: 0, page: 1, limit: 5, totalPages: 1 },
    })),
  ]);

  return { stats, recentUsers: usersResponse.data };
}
clientLoader.hydrate = true as const;

export default function AdminDashboardRoute() {
  const { stats, recentUsers } = useLoaderData<typeof clientLoader>();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
      case 'admin':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Superadmin</Badge>;
      case 'regulator':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Regulator KLHK</Badge>;
      case 'auditor':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Auditor</Badge>;
      case 'ministry':
        return (
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
            Kementerian ESDM
          </Badge>
        );
      case 'emitter':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">Pelaku Usaha</Badge>
        );
      case 'kth':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            KTH Kehutanan
          </Badge>
        );
      case 'buyer':
        return <Badge className="bg-teal-100 text-teal-800 border-teal-200">Pembeli Karbon</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Aktif</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Ditangguhkan</Badge>;
      case 'PENDING_VERIFICATION':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            Menunggu Verifikasi
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#00C48C]">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Dashboard Administrator
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Pusat operasional akun, penugasan peran hak akses, dan verifikasi institusi nasional
            RekaKarbon.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            asChild
            variant="outline"
            className="text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            <Link to="/admin/kyb" className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verifikasi KYB ({stats.pendingKybCount})
            </Link>
          </Button>

          <Button
            asChild
            className="bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-xs"
          >
            <Link to="/admin/users" className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              Kelola Pengguna
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Core Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="rounded-2xl border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pengguna
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{stats.totalUsers}</div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Akun terdaftar di seluruh ekosistem
            </p>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="rounded-2xl border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Akun Aktif
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">{stats.activeUsers}</div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Memiliki hak transaksi & pelaporan aktif
            </p>
          </CardContent>
        </Card>

        {/* Suspended Accounts */}
        <Card className="rounded-2xl border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ditangguhkan
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-600">{stats.suspendedUsers}</div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Akses login dibekukan karena penyelidikan
            </p>
          </CardContent>
        </Card>

        {/* Pending KYB Verification */}
        <Card className="rounded-2xl border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Antrean KYB
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600">{stats.pendingKybCount}</div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Menunggu validasi dokumen NIB / NPWP
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution Grid */}
      <Card className="rounded-2xl border-slate-200 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center justify-between">
            <span>Distribusi Entitas Berdasarkan Peran</span>
            <span className="text-xs font-normal text-slate-400">7 Klasifikasi Peran</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex flex-col items-center text-center">
              <Factory className="w-5 h-5 text-purple-600 mb-1.5" />
              <span className="text-[11px] font-bold text-slate-700">Pelaku Usaha</span>
              <span className="text-lg font-black text-purple-700 mt-1">
                {stats.roleCounts.emitter || 0}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col items-center text-center">
              <TreePine className="w-5 h-5 text-emerald-600 mb-1.5" />
              <span className="text-[11px] font-bold text-slate-700">Kelompok Tani</span>
              <span className="text-lg font-black text-emerald-700 mt-1">
                {stats.roleCounts.kth || 0}
              </span>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex flex-col items-center text-center">
              <Scale className="w-5 h-5 text-amber-600 mb-1.5" />
              <span className="text-[11px] font-bold text-slate-700">Auditor</span>
              <span className="text-lg font-black text-amber-700 mt-1">
                {stats.roleCounts.auditor || 0}
              </span>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col items-center text-center">
              <Landmark className="w-5 h-5 text-blue-600 mb-1.5" />
              <span className="text-[11px] font-bold text-slate-700">Regulator KLHK</span>
              <span className="text-lg font-black text-blue-700 mt-1">
                {stats.roleCounts.regulator || 0}
              </span>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col items-center text-center">
              <Building className="w-5 h-5 text-indigo-600 mb-1.5" />
              <span className="text-[11px] font-bold text-slate-700">Kementerian ESDM</span>
              <span className="text-lg font-black text-indigo-700 mt-1">
                {stats.roleCounts.ministry || 0}
              </span>
            </div>

            <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 flex flex-col items-center text-center">
              <ShoppingBag className="w-5 h-5 text-teal-600 mb-1.5" />
              <span className="text-[11px] font-bold text-slate-700">Pembeli Karbon</span>
              <span className="text-lg font-black text-teal-700 mt-1">
                {stats.roleCounts.buyer || 0}
              </span>
            </div>

            <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex flex-col items-center text-center">
              <ShieldCheck className="w-5 h-5 text-rose-600 mb-1.5" />
              <span className="text-[11px] font-bold text-slate-700">Superadmin</span>
              <span className="text-lg font-black text-rose-700 mt-1">
                {stats.roleCounts.superadmin || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Users Table */}
      <Card className="rounded-2xl border-slate-200 shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-sm font-extrabold text-slate-900 tracking-tight">
              Pendaftaran Akun Terkini
            </CardTitle>
            <p className="text-[11px] text-slate-400 font-medium">
              5 pengguna terakhir yang terdaftar dalam sistem
            </p>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            <Link to="/admin/users" className="flex items-center gap-1">
              Lihat Semua Pengguna
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No.</th>
                  <th className="py-3 px-4">Nama / Pengguna</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Institusi / Afiliasi</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentUsers.map((user: AdminUserItem, index: number) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-500 font-bold">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{user.fullName || '—'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{user.email}</td>
                    <td className="py-3 px-4 text-slate-600">{user.agency || '—'}</td>
                    <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                    <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
