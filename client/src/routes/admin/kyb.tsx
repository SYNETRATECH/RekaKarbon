import { useState } from 'react';
import { useLoaderData } from 'react-router';
import { adminRepository } from '../../repositories';
import type { AdminKybItem } from '../../types';
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
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Briefcase, Trees, Search } from 'lucide-react';

export function meta() {
  return [
    { title: 'Verifikasi Institusi (KYB) | RekaKarbon' },
    {
      name: 'description',
      content: 'Verifikasi legalitas badan usaha dan koperasi KTH RekaKarbon',
    },
  ];
}

export async function clientLoader() {
  const kybSubmissions = await adminRepository.getKybSubmissions().catch(() => []);
  return { initialKybList: kybSubmissions };
}
clientLoader.hydrate = true as const;

export default function AdminKybRoute() {
  const { initialKybList } = useLoaderData<typeof clientLoader>();
  const [kybList, setKybList] = useState<AdminKybItem[]>(initialKybList);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Rejection dialog state
  const [rejectingItem, setRejectingItem] = useState<AdminKybItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredKyb = kybList.filter((item) => {
    const matchesStatus = filterStatus === 'ALL' || item.verificationStatus === filterStatus;

    const matchesSearch =
      searchQuery.trim() === '' ||
      item.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.npwp && item.npwp.includes(searchQuery)) ||
      (item.registrationNumber &&
        item.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const pendingCount = kybList.filter((k) => k.verificationStatus === 'PENDING').length;
  const verifiedCount = kybList.filter((k) => k.verificationStatus === 'VERIFIED').length;
  const rejectedCount = kybList.filter((k) => k.verificationStatus === 'REJECTED').length;

  const handleApprove = async (item: AdminKybItem) => {
    if (!confirm(`Setujui verifikasi legalitas untuk entitas "${item.entityName}"?`)) return;

    try {
      const updated = await adminRepository.reviewKyb(item.id, {
        status: 'VERIFIED',
        notes: 'Disetujui oleh Administrator Platform.',
      });

      setKybList((prev) =>
        prev.map((k) =>
          k.id === item.id ? { ...k, verificationStatus: updated.verificationStatus } : k
        )
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyetujui profil KYB');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;

    try {
      const updated = await adminRepository.reviewKyb(rejectingItem.id, {
        status: 'REJECTED',
        notes: rejectReason || 'Dokumen legalitas tidak memenuhi syarat kepatuhan.',
      });

      setKybList((prev) =>
        prev.map((k) =>
          k.id === rejectingItem.id ? { ...k, verificationStatus: updated.verificationStatus } : k
        )
      );
      setRejectingItem(null);
      setRejectReason('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menolak profil KYB');
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'CORPORATE':
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Korporasi
          </Badge>
        );
      case 'KTH_COOPERATIVE':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
            <Trees className="w-3 h-3" /> Koperasi KTH
          </Badge>
        );
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Terverifikasi
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Ditolak
          </Badge>
        );
      case 'PENDING':
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Menunggu Peninjauan
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#00C48C]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Verifikasi Institusi (KYB Hub)
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Peninjauan legalitas korporasi, nomor pokok wajib pajak (NPWP), dan izin kelompok tani
            hutan (KTH).
          </p>
        </div>

        {/* Quick count summary pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            {pendingCount} Pending
          </span>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            {verifiedCount} Verified
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border-slate-200 shadow-2xs">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari entitas, email, NPWP, atau NIB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs bg-slate-50/50 border-slate-200 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500">Status Verifikasi:</span>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger
                aria-label="Filter Status Verifikasi Institusi"
                className="h-8 w-48 text-xs font-semibold bg-slate-50 border-slate-200 rounded-lg"
              >
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PENDING">Menunggu ({pendingCount})</SelectItem>
                <SelectItem value="VERIFIED">Terverifikasi ({verifiedCount})</SelectItem>
                <SelectItem value="REJECTED">Ditolak ({rejectedCount})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KYB Submissions Table */}
      <Card className="rounded-2xl border-slate-200 shadow-2xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Nama Entitas / Institusi</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Identitas Pajak & Legal</th>
                  <th className="py-3.5 px-4">Penandatangan Resmi</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Keputusan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKyb.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      Tidak ada pengajuan verifikasi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredKyb.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.entityName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{item.userEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">{getCategoryBadge(item.category)}</td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="text-slate-800 font-medium">
                          <span className="text-[10px] text-slate-400 uppercase mr-1">NPWP:</span>
                          <span className="font-mono">{item.npwp || '—'}</span>
                        </div>
                        <div className="text-slate-600 font-medium">
                          <span className="text-[10px] text-slate-400 uppercase mr-1">
                            NIB/AHU:
                          </span>
                          <span className="font-mono">{item.registrationNumber || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {item.signatoryName || item.userFullName || '—'}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(item.verificationStatus)}</td>
                      <td className="py-3.5 px-4 text-right">
                        {item.verificationStatus === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(item)}
                              className="h-7 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejectingItem(item);
                                setRejectReason('');
                              }}
                              className="h-7 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border-rose-200 px-2.5 rounded-lg cursor-pointer flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Tolak
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">
                            Telah ditinjau
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Reject KYB */}
      {rejectingItem && (
        <Dialog open={!!rejectingItem} onOpenChange={() => setRejectingItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-slate-900">
                Tolak Pengajuan Legalitas KYB
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Berikan alasan penolakan berkas untuk entitas{' '}
                <span className="font-bold text-slate-700">{rejectingItem.entityName}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <label className="block font-bold text-slate-700">
                Catatan Penolakan / Dokumen yang Perlu Direvisi:
              </label>
              <Textarea
                required
                rows={3}
                placeholder="Contoh: Nomor NIB tidak terdaftar pada OSS / Lampiran NPWP buram..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-xl border-slate-200 text-xs bg-slate-50 focus-visible:bg-white focus-visible:ring-rose-400"
              />
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingItem(null)}
                className="text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmReject}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Konfirmasi Penolakan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
