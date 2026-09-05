import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLoaderData } from 'react-router';
import KthFormModal from '../../components/modals/KthFormModal';
import KthDeleteModal from '../../components/modals/KthDeleteModal';
import { Users, UserPlus, Edit2, Trash2, CheckCircle2, Clock, Search, Wallet } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

import { regulatorRepository } from '../../repositories';
import { RouteSkeletonLoader } from '../../components/ui/RouteSkeletonLoader';
import type { CreateKTHGroupInput, KTHGroupFormData, KTHGroupItem } from '../../types';

export async function clientLoader() {
  const kthGroups = await regulatorRepository.getKTHGroups().catch(() => []);
  return { kthGroups };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <RouteSkeletonLoader label="Kelompok Tani Hutan" rows={3} />;
}

export function meta() {
  return [
    { title: 'Manajemen Kelompok Tani Hutan (KTH) | RekaKarbon' },
    { name: 'description', content: 'Manajemen Kelompok Tani Hutan RekaKarbon' },
  ];
}

export default function KthFarmersManagement() {
  const { kthGroups: initialGroups } = useLoaderData<typeof clientLoader>();
  const [groups, setGroups] = useState<KTHGroupItem[]>(initialGroups);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKTH, setEditingKTH] = useState<KTHGroupItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<KTHGroupFormData>({
    groupName: '',
    leaderName: '',
    memberCount: 30,
    location: '',
    registrationNumber: '',
    totalIncentiveReceivedIDR: 0,
    walletAddress: '0x8f2a948571029485710294857102948571029485',
  });

  const openCreateModal = () => {
    setEditingKTH(null);
    setFormData({
      groupName: '',
      leaderName: '',
      memberCount: 30,
      location: '',
      registrationNumber: '',
      totalIncentiveReceivedIDR: 0,
      walletAddress: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (kth: KTHGroupItem) => {
    setEditingKTH(kth);
    setFormData({
      groupName: kth.groupName,
      leaderName: kth.leaderName,
      memberCount: kth.memberCount,
      location: kth.location,
      registrationNumber: kth.registrationNumber || '',
      totalIncentiveReceivedIDR: kth.totalIncentiveReceivedIDR,
      walletAddress: kth.walletAddress || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!formData.groupName.trim() || !formData.leaderName.trim()) {
      setActionError('Nama KTH dan nama ketua pengurus wajib diisi.');
      return;
    }
    if (formData.memberCount < 1) {
      setActionError('Jumlah anggota minimal 1 orang.');
      return;
    }
    if (!formData.location.trim() || !formData.registrationNumber.trim()) {
      setActionError('Wilayah operasional dan nomor registrasi SK KLHK wajib diisi.');
      return;
    }

    if (editingKTH) {
      setGroups((prev) => prev.map((k) => (k.id === editingKTH.id ? { ...k, ...formData } : k)));
      setActionSuccess('Perubahan KTH diperbarui pada tampilan ini.');
      setIsModalOpen(false);
    } else {
      const input: CreateKTHGroupInput = {
        groupName: formData.groupName.trim(),
        leaderName: formData.leaderName.trim(),
        memberCount: formData.memberCount,
        location: formData.location.trim(),
        registrationNumber: formData.registrationNumber.trim(),
        ...(formData.walletAddress.trim() ? { walletAddress: formData.walletAddress.trim() } : {}),
      };

      setIsSaving(true);
      try {
        const created = await regulatorRepository.createKTHGroup(input);
        setGroups((prev) => [created, ...prev]);
        setActionSuccess(`KTH '${created.groupName}' berhasil disimpan ke database.`);
        setIsModalOpen(false);
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'KTH gagal disimpan.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDelete = (id: string) => {
    setGroups((prev) => prev.filter((k) => k.id !== id));
    setDeleteConfirmId(null);
  };

  const filteredGroups = groups.filter(
    (g: KTHGroupItem) =>
      !searchTerm ||
      g.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.leaderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Manajemen Kelompok Tani Hutan (KTH)
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Pendaftaran dan kurasi data Kelompok Tani Hutan (KTH / Petani) terdaftar (CRUD),
            verifikasi dokumen KYB, serta alokasi dompet insentif.
          </p>
        </div>

        {/* Action Button: Add New KTH */}
        <button
          onClick={openCreateModal}
          className="bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-3 px-5 rounded-xl shadow-md shadow-emerald-950/10 flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto active:scale-98"
        >
          <UserPlus className="w-4 h-4 text-[#00C48C]" />
          Daftarkan KTH Baru
        </button>
      </div>

      {/* SEARCH BAR & SUMMARY */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama KTH, ketua pengurus, atau lokasi..."
            className="pl-10 pr-4 h-9 text-xs rounded-xl"
          />
        </div>
        <span className="text-xs font-extrabold text-slate-400">
          Total KTH Terdaftar: {filteredGroups.length}
        </span>
      </div>

      {/* KTH GROUPS TABLE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">No.</TableHead>
              <TableHead>Kode KTH</TableHead>
              <TableHead>Nama Kelompok Tani Hutan</TableHead>
              <TableHead>Ketua Pengurus & Anggota</TableHead>
              <TableHead>Wilayah Operasional</TableHead>
              <TableHead>No. Registrasi SK KLHK</TableHead>
              <TableHead>Total Insentif Diterima</TableHead>
              <TableHead>Status KYB</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.map((kth: KTHGroupItem, index: number) => (
              <TableRow key={kth.id}>
                <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                  {index + 1}
                </TableCell>
                <TableCell className="font-mono font-black text-slate-900">{kth.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-slate-900 block">{kth.groupName}</span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-slate-300" />
                        {kth.walletAddress
                          ? `${kth.walletAddress.substring(0, 10)}...${kth.walletAddress.substring(34)}`
                          : 'Dompet belum ditautkan'}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-extrabold text-slate-900 block">{kth.leaderName}</span>
                  <span className="text-[10px] font-bold text-slate-400 block">
                    {kth.memberCount} Anggota Terdaftar
                  </span>
                </TableCell>
                <TableCell className="text-slate-600 font-semibold">{kth.location}</TableCell>
                <TableCell className="font-mono text-[11px] font-bold text-slate-800">
                  {kth.registrationNumber || 'Belum tersedia'}
                </TableCell>
                <TableCell className="font-black text-emerald-700">
                  {formatCurrency(kth.totalIncentiveReceivedIDR)}
                </TableCell>
                <TableCell>
                  {kth.kybStatus === 'verified' ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Terverifikasi KYB
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Menunggu Dokumen
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <button
                    onClick={() => openEditModal(kth)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    title="Edit KTH"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(kth.id)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                    title="Hapus KTH"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {actionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
          {actionSuccess}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <KthFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingKTH={editingKTH}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleFormSubmit}
        isSubmitting={isSaving}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <KthDeleteModal
        deleteId={deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
