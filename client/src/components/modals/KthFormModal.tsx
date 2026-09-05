import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { KTHGroupFormData, KTHGroupItem } from '../../types';

interface KthFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingKTH: KTHGroupItem | null;
  formData: KTHGroupFormData;
  setFormData: Dispatch<SetStateAction<KTHGroupFormData>>;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
}

export default function KthFormModal({
  isOpen,
  onClose,
  editingKTH,
  formData,
  setFormData,
  onSubmit,
  isSubmitting = false,
}: KthFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 max-w-lg border-slate-200 bg-white shadow-2xl space-y-4 text-left">
        <DialogTitle className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
          {editingKTH ? 'Edit Data Kelompok Tani Hutan (KTH)' : 'Pendaftaran KTH Baru'}
        </DialogTitle>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Nama Kelompok Tani Hutan (KTH)
            </label>
            <Input
              type="text"
              required
              value={formData.groupName}
              onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
              placeholder="Contoh: KTH Wana Lestari Baluran"
              className="rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Nama Ketua Pengurus</label>
              <Input
                type="text"
                required
                value={formData.leaderName}
                onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                placeholder="Contoh: Sutrisno"
                className="rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Jumlah Anggota</label>
              <Input
                type="number"
                required
                value={formData.memberCount}
                onChange={(e) => setFormData({ ...formData, memberCount: Number(e.target.value) })}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Wilayah Operasional</label>
            <Input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Contoh: Situbondo, Jawa Timur"
              className="rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Nomor Registrasi SK KLHK</label>
            <Input
              type="text"
              required
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              className="rounded-xl text-xs font-mono"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-primary-gradient text-white font-extrabold shadow-md hover:opacity-95"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan KTH'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
