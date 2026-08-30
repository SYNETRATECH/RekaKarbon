import { CheckCircle2, Cpu, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LaporanAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditStep: number;
}

const AUDIT_STEPS = [
  {
    title: 'Validasi berkas unggahan',
    description: 'Memastikan berkas diterima dan dapat diproses oleh sistem.',
  },
  {
    title: 'Menyiapkan metadata laporan',
    description: 'Menyimpan tahun, sektor, total emisi, dan identitas berkas.',
  },
  {
    title: 'Mencatat sidik jari ke blockchain',
    description: 'Mencatat hash laporan untuk menjaga jejak integritas data.',
  },
];

export default function LaporanAuditModal({ isOpen, onClose, auditStep }: LaporanAuditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:p-7 max-w-xl border-slate-200 bg-white shadow-2xl space-y-6 text-left">
        <DialogTitle className="sr-only">Pengiriman laporan emisi</DialogTitle>

        <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#003E29] flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-emerald-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Pengiriman Laporan Emisi</h3>
            <span className="text-[11px] text-emerald-700 font-extrabold inline-flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Validasi berkas dan pencatatan dMRV
            </span>
          </div>
        </div>

        <div className="space-y-3.5 text-xs">
          {AUDIT_STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isComplete = auditStep > stepNumber;
            const isCurrent = auditStep === stepNumber;

            return (
              <div
                key={step.title}
                className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                  auditStep >= stepNumber
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {isComplete ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                    {stepNumber}
                  </div>
                )}
                <div>
                  <h5 className="font-extrabold text-xs">{step.title}</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {auditStep >= 4 && (
          <div className="p-4 rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-900 text-xs space-y-2">
            <div className="font-black text-sm">LAPORAN BERHASIL DIKIRIM</div>
            <p className="text-[11px] font-medium leading-relaxed">
              Laporan tersimpan dengan status Menunggu Audit. Sidik jari blockchain menjadi jejak
              integritas data, bukan bukti bahwa laporan sudah diverifikasi auditor.
            </p>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer h-10"
          >
            {auditStep >= 4 ? 'Tutup' : 'Proses Berlangsung...'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
