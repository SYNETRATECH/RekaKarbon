import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface KthDeleteModalProps {
  deleteId: string | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export default function KthDeleteModal({ deleteId, onClose, onConfirm }: KthDeleteModalProps) {
  return (
    <Dialog open={!!deleteId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 max-w-md border-rose-200 bg-white shadow-2xl space-y-4 text-center">
        <DialogTitle className="sr-only">Konfirmasi Hapus KTH</DialogTitle>
        {deleteId && (
          <>
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
              <Button
                variant="outline"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => onConfirm(deleteId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md"
              >
                Ya, Hapus KTH
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
