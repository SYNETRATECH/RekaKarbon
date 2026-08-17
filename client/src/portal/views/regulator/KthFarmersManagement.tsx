import { useState, FormEvent } from 'react';
import { useCarbonStore } from '../../../store/useCarbonStore';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  Search,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { INITIAL_KTH_GROUPS } from '../../../lib/mock/regulator';
import { formatCurrency } from '../../../lib/formatters';

export default function KthFarmersManagement() {
  const { kthGroups, addKTHGroup, updateKTHGroup, deleteKTHGroup } = useCarbonStore();
  const groups = kthGroups?.length > 0 ? kthGroups : INITIAL_KTH_GROUPS;

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKTH, setEditingKTH] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    groupName: '',
    leaderName: '',
    memberCount: 30,
    location: '',
    registrationNumber: '',
    totalIncentiveReceivedIDR: 'Rp 0 Juta',
    walletAddress: '0x8f2a948571029485710294857102948571029485',
  });

  const openCreateModal = () => {
    setEditingKTH(null);
    setFormData({
      groupName: '',
      leaderName: '',
      memberCount: 30,
      location: '',
      registrationNumber: `SK.LHK-${Math.floor(1000 + Math.random() * 9000)}/KTH/2026`,
      totalIncentiveReceivedIDR: 'Rp 250 Juta',
      walletAddress:
        '0x' +
        Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (kth: any) => {
    setEditingKTH(kth);
    setFormData({
      groupName: kth.groupName,
      leaderName: kth.leaderName,
      memberCount: kth.memberCount,
      location: kth.location,
      registrationNumber: kth.registrationNumber,
      totalIncentiveReceivedIDR: kth.totalIncentiveReceivedIDR,
      walletAddress: kth.walletAddress,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingKTH) {
      updateKTHGroup(editingKTH.id, formData as any);
    } else {
      const newKTH = {
        id: `KTH-00${groups.length + 1}`,
        ...formData,
        kybStatus: 'verified',
      };
      addKTHGroup(newKTH);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteKTHGroup(id);
    setDeleteConfirmId(null);
  };

  const filteredGroups = groups.filter(
    (g: any) =>
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
          <span className="text-[9px] font-black text-[#003E29] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md border border-slate-200">
            FARMERS COMMUNITY & KYB MANAGEMENT
          </span>
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
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama KTH, ketua pengurus, atau lokasi..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <span className="text-xs font-extrabold text-slate-400">
          Total KTH Terdaftar: {filteredGroups.length}
        </span>
      </div>

      {/* KTH GROUPS TABLE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-wider border-y border-slate-200">
                <th className="py-3 px-4">Kode KTH</th>
                <th className="py-3 px-4">Nama Kelompok Tani Hutan</th>
                <th className="py-3 px-4">Ketua Pengurus & Anggota</th>
                <th className="py-3 px-4">Wilayah Operasional</th>
                <th className="py-3 px-4">No. Registrasi SK KLHK</th>
                <th className="py-3 px-4">Total Insentif Diterima</th>
                <th className="py-3 px-4">Status KYB</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredGroups.map((kth: any) => (
                <tr key={kth.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-black text-slate-900">{kth.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-900 block">{kth.groupName}</span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-slate-300" />
                          {kth.walletAddress.substring(0, 10)}...{kth.walletAddress.substring(34)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-slate-900 block">{kth.leaderName}</span>
                    <span className="text-[10px] font-bold text-slate-400 block">
                      {kth.memberCount} Anggota Terdaftar
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-semibold">{kth.location}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-800">
                    {kth.registrationNumber}
                  </td>
                  <td className="py-3.5 px-4 font-black text-emerald-700">
                    {formatCurrency(kth.totalIncentiveReceivedIDR)}
                  </td>
                  <td className="py-3.5 px-4">
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
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-slide-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingKTH ? 'Edit Data Kelompok Tani Hutan (KTH)' : 'Pendaftaran KTH Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  Nama Kelompok Tani Hutan (KTH)
                </label>
                <input
                  type="text"
                  required
                  value={formData.groupName}
                  onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                  placeholder="Contoh: KTH Wana Lestari Baluran"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Nama Ketua Pengurus</label>
                  <input
                    type="text"
                    required
                    value={formData.leaderName}
                    onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                    placeholder="Contoh: Sutrisno"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Jumlah Anggota</label>
                  <input
                    type="number"
                    required
                    value={formData.memberCount}
                    onChange={(e) =>
                      setFormData({ ...formData, memberCount: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Wilayah Operasional</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Contoh: Situbondo, Jawa Timur"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  Nomor Registrasi SK KLHK
                </label>
                <input
                  type="text"
                  required
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-primary-gradient text-white font-extrabold shadow-md hover:opacity-95"
                >
                  Simpan KTH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Konfirmasi Hapus / Nonaktifkan KTH
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Apakah Anda yakin ingin menghapus data KTH ini? Dompet insentif dan verifikasi KYB
              kelompok tani akan di-nonaktifkan.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-900/10"
              >
                Ya, Hapus KTH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
