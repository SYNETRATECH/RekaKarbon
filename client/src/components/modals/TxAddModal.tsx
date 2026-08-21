import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TxAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    kthGroup: string;
    companyName: string;
    amount: number;
    speCredits: number;
    speCertificateId: string;
    bankName: string;
    accountNumber: string;
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function TxAddModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
}: TxAddModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 max-w-xl border-slate-200 bg-white shadow-2xl space-y-4 text-left">
        <DialogTitle className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
          Pencatatan Transaksi Insentif Karbon Manual (Regulator)
        </DialogTitle>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Penerima Insentif (KTH)</label>
              <Input
                type="text"
                required
                value={formData.kthGroup}
                onChange={(e) => setFormData({ ...formData, kthGroup: e.target.value })}
                placeholder="Contoh: KTH Wana Lestari Baluran"
                className="rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">
                Entitas Penebus (Pembeli)
              </label>
              <Input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Contoh: PT Semen Nusantara Tuban"
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Nilai Insentif (IDR)</label>
              <Input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Volume SPE-GRK (tCO₂e)</label>
              <Input
                type="number"
                required
                value={formData.speCredits}
                onChange={(e) => setFormData({ ...formData, speCredits: Number(e.target.value) })}
                className="rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">No. Sertifikat SPE-GRK</label>
            <Input
              type="text"
              required
              value={formData.speCertificateId}
              onChange={(e) => setFormData({ ...formData, speCertificateId: e.target.value })}
              className="rounded-xl text-xs font-mono"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-primary-gradient text-white rounded-xl text-xs font-extrabold shadow-md"
            >
              Simpan & Catat On-Chain
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
