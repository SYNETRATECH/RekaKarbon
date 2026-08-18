import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RegulationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    documentTitle: string;
    category: string;
    categoryLabel: string;
    agencyIssuer: string;
    targetEntityName: string;
    signatoryPerson: string;
    fileName: string;
    fileSize: string;
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function RegulationUploadModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
}: RegulationUploadModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 max-w-lg border-slate-200 bg-white shadow-2xl space-y-4 text-left">
        <DialogTitle className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
          Upload & Publikasi Dokumen Regulasi Baru
        </DialogTitle>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Judul Dokumen / Nomor Surat
            </label>
            <Input
              type="text"
              required
              value={formData.documentTitle}
              onChange={(e) => setFormData({ ...formData, documentTitle: e.target.value })}
              placeholder="Contoh: SK Penetapan Kuota PTBAE-PU 2026 No. SK.04/KLHK/2026"
              className="w-full p-2.5 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Kategori Dokumen</label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sk_ptbae">SK Kuota PTBAE-PU</SelectItem>
                  <SelectItem value="spe_grk">Sertifikat SPE-GRK</SelectItem>
                  <SelectItem value="stp_djp">Surat Tagihan Pajak DJP</SelectItem>
                  <SelectItem value="kth_sk">SK Pengesahan KTH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Instansi Penerbit</label>
              <Select
                value={formData.agencyIssuer}
                onValueChange={(val) => setFormData({ ...formData, agencyIssuer: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Instansi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KLHK & DJP">KLHK & DJP Kemenkeu</SelectItem>
                  <SelectItem value="KLHK">Kementerian LHK RI</SelectItem>
                  <SelectItem value="DJP">Direktorat Jenderal Pajak</SelectItem>
                  <SelectItem value="Dishut Prov">Dinas Kehutanan Provinsi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Entitas / Perusahaan Sasaran
            </label>
            <Input
              type="text"
              required
              value={formData.targetEntityName}
              onChange={(e) => setFormData({ ...formData, targetEntityName: e.target.value })}
              placeholder="Contoh: PT Semen Nusantara Tuban"
              className="w-full p-2.5 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Nama Berkas (PDF)</label>
            <Input
              type="text"
              required
              value={formData.fileName}
              onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
              placeholder="Contoh: SK_KLHK_PTBAE_2026_SEMEN_NUSANTARA.pdf"
              className="w-full p-2.5 rounded-xl border-slate-200 bg-slate-50 focus:bg-white font-mono"
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
              className="px-4 py-2.5 rounded-xl bg-primary-gradient text-white font-extrabold shadow-md hover:opacity-95"
            >
              Publikasikan Dokumen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
