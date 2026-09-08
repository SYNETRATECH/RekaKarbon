import { CheckCircle2, Cpu, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { MlAuditResult } from '@/types/audit';

interface LaporanAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditStep: number;
  auditResult?: MlAuditResult | null;
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
    title: 'Analisis AI & Explainable AI (XAI)',
    description: 'Pemeriksaan stoikiometri fisik, harga DJP, dan atribusi fitur anomali.',
  },
  {
    title: 'Mencatat sidik jari ke blockchain',
    description: 'Mencatat hash laporan untuk menjaga jejak integritas data.',
  },
];

export default function LaporanAuditModal({
  isOpen,
  onClose,
  auditStep,
  auditResult,
}: LaporanAuditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:p-7 max-w-xl border-slate-200 bg-white shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Pengiriman laporan emisi & AI Audit</DialogTitle>

        <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#003E29] flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-emerald-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Pengiriman Laporan Emisi</h3>
            <span className="text-[11px] text-emerald-700 font-extrabold inline-flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Validasi berkas dMRV & Explainable AI (XAI) Engine
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

        {/* Explainable AI (XAI) Diagnostic Card */}
        {auditStep >= 4 && auditResult?.xai && (
          <div className="p-4 rounded-2xl border bg-slate-900 text-white text-xs space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Analisis Explainable AI (XAI)
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  auditResult.isAnomaly
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                Skor Kepercayaan: {auditResult.trustScore}/100
              </span>
            </div>

            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              {auditResult.explanation}
            </p>

            {auditResult.xai.topAnomalyDrivers.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Faktor Utama Pendorong Anomali (Feature Attribution):
                </div>
                <div className="space-y-1.5">
                  {auditResult.xai.topAnomalyDrivers.slice(0, 3).map((driver) => (
                    <div
                      key={driver.featureName}
                      className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between text-[11px]"
                    >
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-slate-200">{driver.label}</div>
                        <div className="text-[10px] text-slate-400">
                          Input:{' '}
                          <span className="text-amber-300 font-mono">{driver.userValue}</span> vs
                          Benchmark:{' '}
                          <span className="text-emerald-400 font-mono">
                            {driver.benchmarkValue}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20 inline-block">
                          Dampak {driver.impactScore}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-emerald-950/60 border border-emerald-800/40 p-2.5 rounded-xl text-[11px] text-emerald-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Rekomendasi Kepatuhan:</span>
                <span className="text-[10px] text-emerald-300">
                  {auditResult.xai.recommendation}
                </span>
              </div>
            </div>
          </div>
        )}

        {auditStep >= 5 && (
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
            {auditStep >= 5 ? 'Tutup' : 'Proses Berlangsung...'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
