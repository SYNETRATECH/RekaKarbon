import { useState, FormEvent } from 'react';
import { useLoaderData } from 'react-router';
import { adminRepository, authRepository } from '../../repositories';
import type { AdminUserItem, UserRole, UserAccountStatus } from '../../types';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  CheckCircle2,
  Ban,
  KeyRound,
  RotateCcw,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export function meta() {
  return [
    { title: 'Manajemen Pengguna | RekaKarbon' },
    { name: 'description', content: 'Manajemen Akun dan Hak Akses Pengguna RekaKarbon' },
  ];
}

export async function clientLoader() {
  const [usersResponse, rolesResponse, currentUser] = await Promise.all([
    adminRepository.getUsers({ limit: 50 }).catch(() => ({ data: [] })),
    adminRepository.getRoles().catch(() => []),
    authRepository.getCurrentUser().catch(() => null),
  ]);
  return {
    initialUsers: usersResponse.data,
    roleDefinitions: rolesResponse,
    currentUserId: currentUser?.id ?? null,
    currentUserEmail: currentUser?.email ?? null,
  };
}
clientLoader.hydrate = true as const;

export default function AdminUsersRoute() {
  const { initialUsers, roleDefinitions, currentUserId, currentUserEmail } =
    useLoaderData<typeof clientLoader>();
  const { toast } = useToast();

  // Local state for interactive operations
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUserItem | null>(null);
  const [newRoleSelection, setNewRoleSelection] = useState<UserRole>('emitter');
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);

  // New user form state
  const [createEmail, setCreateEmail] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPassword, setCreatePassword] = useState('RekaKarbon#2026');
  const [createRole, setCreateRole] = useState<UserRole>('emitter');
  const [createAgency, setCreateAgency] = useState('');
  const [createWallet, setCreateWallet] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.agency && user.agency.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      selectedRoleFilter === 'ALL' || user.role.toLowerCase() === selectedRoleFilter.toLowerCase();

    const matchesStatus = selectedStatusFilter === 'ALL' || user.status === selectedStatusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    const found = roleDefinitions.find((r) => r.code.toLowerCase() === role.toLowerCase());
    if (found) {
      return (
        <Badge
          className={`${found.badgeStyle.bg} ${found.badgeStyle.text} ${found.badgeStyle.border}`}
        >
          {found.label}
        </Badge>
      );
    }
    return <Badge variant="outline">{role}</Badge>;
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

  const handleToggleStatus = async (user: AdminUserItem) => {
    const isSelf =
      (currentUserId && user.id === currentUserId) ||
      (currentUserEmail && user.email.toLowerCase() === currentUserEmail.toLowerCase());
    if (isSelf) {
      toast({
        variant: 'destructive',
        title: 'Operasi Ditolak',
        description: 'Anda tidak dapat menangguhkan akun Anda sendiri.',
      });
      return;
    }

    const nextStatus: UserAccountStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const updated = await adminRepository.updateUserStatus(user.id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: updated.status } : u))
      );
      toast({
        title: 'Status Akun Diperbarui',
        description: `Status akun ${user.email} berhasil diubah menjadi ${updated.status}.`,
      });
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Gagal Memperbarui Status',
        description: err instanceof Error ? err.message : 'Gagal memperbarui status pengguna',
      });
    }
  };

  const handleSaveRole = async () => {
    if (!selectedUserForRole || isSavingRole) return;

    if (selectedUserForRole.role === newRoleSelection) {
      setSelectedUserForRole(null);
      return;
    }

    setIsSavingRole(true);
    setRoleChangeError(null);
    try {
      const updated = await adminRepository.updateUserRole(
        selectedUserForRole.id,
        newRoleSelection
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUserForRole.id ? { ...u, role: updated.role } : u))
      );
      toast({
        title: 'Peran Berhasil Diperbarui',
        description: `Peran untuk ${selectedUserForRole.email} berhasil diubah menjadi ${newRoleSelection.toUpperCase()}. Sesi aktif akan mewajibkan login kembali.`,
      });
      setSelectedUserForRole(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memperbarui peran pengguna';
      setRoleChangeError(message);
      toast({
        variant: 'destructive',
        title: 'Gagal Memperbarui Peran',
        description: message,
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleResetPassword = async (user: AdminUserItem) => {
    if (!confirm(`Konfirmasi reset kata sandi untuk akun ${user.email}?`)) return;
    try {
      const res = await adminRepository.resetPassword(user.id);
      setResetPasswordResult({
        email: user.email,
        temporaryPassword: res.temporaryPassword,
      });
      toast({
        title: 'Kata Sandi Direset',
        description: `Kata sandi sementara untuk ${user.email} berhasil diterbitkan.`,
      });
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Gagal Reset Kata Sandi',
        description: err instanceof Error ? err.message : 'Gagal mereset kata sandi',
      });
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const created = await adminRepository.createUser({
        email: createEmail,
        fullName: createName,
        password: createPassword,
        role: createRole,
        agency: createAgency || undefined,
        walletAddress: createWallet || undefined,
      });

      setUsers((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setCreateEmail('');
      setCreateName('');
      setCreateAgency('');
      setCreateWallet('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal membuat pengguna');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#00C48C]">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Manajemen Pengguna & Hak Akses
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Kelola data akun, penugasan hak akses peran, serta aktivasi status akun di seluruh
            platform.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Pengguna Baru
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border-slate-200 shadow-2xs">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Field */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari nama, email, atau instansi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs bg-slate-50/50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
              <span>Peran:</span>
              <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
                <SelectTrigger
                  aria-label="Filter Peran Pengguna"
                  className="h-8 w-44 text-xs font-semibold bg-slate-50 border-slate-200 rounded-lg"
                >
                  <SelectValue placeholder="Semua Peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Peran</SelectItem>
                  {roleDefinitions.map((role) => (
                    <SelectItem key={role.code} value={role.code}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
              <span>Status:</span>
              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                <SelectTrigger
                  aria-label="Filter Status Akun Pengguna"
                  className="h-8 w-44 text-xs font-semibold bg-slate-50 border-slate-200 rounded-lg"
                >
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="SUSPENDED">Ditangguhkan</SelectItem>
                  <SelectItem value="PENDING_VERIFICATION">Menunggu Verifikasi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchQuery || selectedRoleFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRoleFilter('ALL');
                  setSelectedStatusFilter('ALL');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 h-8"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Data Table */}
      <Card className="rounded-2xl border-slate-200 shadow-2xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No.</th>
                  <th className="py-3.5 px-4">Pengguna</th>
                  <th className="py-3.5 px-4">Instansi / Afiliasi</th>
                  <th className="py-3.5 px-4">Peran Sistem</th>
                  <th className="py-3.5 px-4">Status Akun</th>
                  <th className="py-3.5 px-4">Alamat Wallet</th>
                  <th className="py-3.5 px-4 text-right">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada pengguna yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => {
                    const isSelf = Boolean(
                      (currentUserId && user.id === currentUserId) ||
                      (currentUserEmail &&
                        user.email.toLowerCase() === currentUserEmail.toLowerCase())
                    );

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono text-slate-500 font-bold">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{user.fullName || '—'}</span>
                            {isSelf && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 font-bold px-1.5 py-0"
                              >
                                Akun Anda
                              </Badge>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">{user.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {user.agency || '—'}
                        </td>
                        <td className="py-3.5 px-4">{getRoleBadge(user.role)}</td>
                        <td className="py-3.5 px-4">{getStatusBadge(user.status)}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {user.walletAddress
                            ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Role edit button */}
                            {isSelf ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="h-7 text-[11px] font-bold text-slate-400 border-slate-200 px-2 rounded-lg cursor-not-allowed opacity-60"
                                title="Administrator tidak dapat mengubah peran akun sendiri"
                              >
                                <Shield className="w-3 h-3 mr-1 text-slate-400" />
                                Peran
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUserForRole(user);
                                  setNewRoleSelection(user.role);
                                  setRoleChangeError(null);
                                }}
                                className="h-7 text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2 rounded-lg cursor-pointer"
                                title="Ubah Hak Akses Peran"
                              >
                                <Shield className="w-3 h-3 mr-1 text-slate-500" />
                                Peran
                              </Button>
                            )}

                            {/* Toggle Active/Suspend */}
                            {isSelf ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="h-7 text-[11px] font-bold text-slate-400 border-slate-200 px-2 rounded-lg cursor-not-allowed opacity-60"
                                title="Administrator tidak dapat menangguhkan akun sendiri"
                              >
                                <Ban className="w-3 h-3 mr-1 text-slate-400" />
                                Suspend
                              </Button>
                            ) : user.status === 'ACTIVE' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(user)}
                                className="h-7 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border-rose-200 px-2 rounded-lg cursor-pointer"
                                title="Tangguhkan Akun"
                              >
                                <Ban className="w-3 h-3 mr-1" />
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(user)}
                                className="h-7 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 border-emerald-200 px-2 rounded-lg cursor-pointer"
                                title="Aktifkan Kembali Akun"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Aktifkan
                              </Button>
                            )}

                            {/* Password Reset */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetPassword(user)}
                              className="h-7 text-[11px] font-bold text-slate-500 hover:text-slate-900 px-2 rounded-lg cursor-pointer"
                              title="Reset Kata Sandi"
                            >
                              <KeyRound className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Change Role */}
      {selectedUserForRole && (
        <Dialog
          open={!!selectedUserForRole}
          onOpenChange={() => {
            if (!isSavingRole) {
              setSelectedUserForRole(null);
              setRoleChangeError(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-slate-900">
                Ubah Peran Hak Akses
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Tetapkan peran baru untuk pengguna{' '}
                <span className="font-bold text-slate-700">{selectedUserForRole.email}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {roleChangeError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {roleChangeError}
                </div>
              )}

              {/* Role comparison */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Peran Saat Ini
                  </span>
                  {getRoleBadge(selectedUserForRole.role)}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Peran Baru
                  </span>
                  {getRoleBadge(newRoleSelection)}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Pilih Peran Sistem Baru
                </label>
                <Select
                  value={newRoleSelection}
                  onValueChange={(val) => setNewRoleSelection(val as UserRole)}
                  disabled={isSavingRole}
                >
                  <SelectTrigger
                    aria-label="Pilih Peran Sistem Pengguna"
                    className="w-full text-xs font-bold bg-slate-50 border-slate-200 rounded-xl"
                  >
                    <SelectValue placeholder="Pilih Peran Sistem" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleDefinitions.map((role) => (
                      <SelectItem key={role.code} value={role.code}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(() => {
                  const selectedDef = roleDefinitions.find((r) => r.code === newRoleSelection);
                  return selectedDef ? (
                    <p className="text-[11px] text-slate-500 italic mt-1.5 px-1 leading-relaxed">
                      {selectedDef.description}
                    </p>
                  ) : null;
                })()}
              </div>

              {/* Forced re-login notice */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Peringatan Keamanan:</strong> Perubahan peran akan segera membatalkan
                  token sesi aktif pengguna ini di server. Pengguna diwajibkan untuk masuk kembali
                  (re-login) agar izin akses baru diterapkan.
                </p>
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isSavingRole}
                onClick={() => {
                  setSelectedUserForRole(null);
                  setRoleChangeError(null);
                }}
                className="text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={isSavingRole || newRoleSelection === selectedUserForRole.role}
                onClick={handleSaveRole}
                className="bg-primary-gradient text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSavingRole && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Create User */}
      {isCreateModalOpen && (
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-slate-900">
                Daftarkan Pengguna Baru
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Inisiasi akun pengguna baru secara manual dengan hak akses terverifikasi.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateUser} className="space-y-3 py-2 text-xs">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Resmi *</label>
                <Input
                  type="email"
                  required
                  placeholder="nama@instansi.co.id"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <Input
                  required
                  placeholder="Dr. Ir. Nama Pejabat / Pengurus"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Awal *</label>
                <Input
                  type="text"
                  required
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <label className="block font-bold text-slate-700 mb-1">Peran Akses *</label>
              <Select value={createRole} onValueChange={(val) => setCreateRole(val as UserRole)}>
                <SelectTrigger
                  aria-label="Peran Akses Pengguna Baru"
                  className="w-full text-xs font-bold bg-slate-50 border-slate-200 rounded-xl"
                >
                  <SelectValue placeholder="Pilih Peran Akses" />
                </SelectTrigger>
                <SelectContent>
                  {roleDefinitions.map((role) => (
                    <SelectItem key={role.code} value={role.code}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Instansi / Entitas
                </label>
                <Input
                  placeholder="PT Semen Nusantara / KTH Tuban / Sucofindo"
                  value={createAgency}
                  onChange={(e) => setCreateAgency(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Wallet EVM (Opsional)
                </label>
                <Input
                  placeholder="0x..."
                  value={createWallet}
                  onChange={(e) => setCreateWallet(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs font-bold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary-gradient text-white text-xs font-bold"
                >
                  Simpan Akun
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Password Reset Result */}
      {resetPasswordResult && (
        <Dialog open={!!resetPasswordResult} onOpenChange={() => setResetPasswordResult(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-slate-900">
                Kata Sandi Sementara Diterbitkan
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Berikan kata sandi sementara ini kepada pemilik akun{' '}
                <span className="font-bold text-slate-700">{resetPasswordResult.email}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Kata Sandi Sementara:
              </span>
              <div className="text-base font-mono font-black text-emerald-600 select-all">
                {resetPasswordResult.temporaryPassword}
              </div>
            </div>

            <DialogFooter>
              <Button
                size="sm"
                onClick={() => setResetPasswordResult(null)}
                className="bg-slate-900 text-white text-xs font-bold w-full"
              >
                Selesai
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
