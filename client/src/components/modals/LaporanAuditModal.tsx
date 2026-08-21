import { Cpu, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LaporanAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditStep: number;
  cat2EFakturDJP: string;
  isAuditPass: boolean;
  scoreDJP: number;
  scoreBBM: number;
  scoreCEMS: number;
}

export default function LaporanAuditModal({
  isOpen,
  onClose,
  auditStep,
  cat2EFakturDJP,
  isAuditPass,
  scoreDJP,
  scoreBBM,
  scoreCEMS,
}: LaporanAuditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:p-7 max-w-xl border-slate-200 bg-white shadow-2xl space-y-6 text-left">
        <DialogTitle className="sr-only">Audit AI Cross-Variable Kepatuhan Industri</DialogTitle>

        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#003E29] flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Proses Audit AI Cross-Variable Kepatuhan Industri
              </h3>
              <span className="text-[11px] text-emerald-700 font-extrabold inline-flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                AI dMRV Engine v4.2 • Deteksi Kejujuran Pelaporan
              </span>
            </div>
          </div>
        </div>

        {/* Audit Progress Steps */}
        <div className="space-y-3.5 text-xs">
          {/* Step 1: DJP e-Faktur */}
          <div
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
              auditStep >= 1
                ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {auditStep > 1 ? (
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  ✓
                </div>
              ) : auditStep === 1 ? (
                <div className="w-6 h-6 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin shrink-0"></div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </div>
              )}
              <div>
                <h5 className="font-extrabold text-xs">Cross-Check e-Faktur Pajak DJP</h5>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  No. Faktur: {cat2EFakturDJP} • Pos Utilitas Rp 29.10 Miliar
                </p>
              </div>
            </div>
            {auditStep > 1 && (
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                MATCHED DJP
              </span>
            )}
          </div>

          {/* Step 2: Physical BBM vs Financial Cost Correlation */}
          <div
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
              auditStep >= 2
                ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {auditStep > 2 ? (
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  ✓
                </div>
              ) : auditStep === 2 ? (
                <div className="w-6 h-6 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin shrink-0"></div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </div>
              )}
              <div>
                <h5 className="font-extrabold text-xs">Analisis Korelasi Fisik BBM vs Keuangan</h5>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  BBM Mesin Stasioner (4.85M Liter) vs Biaya Solar & Batubara
                </p>
              </div>
            </div>
            {auditStep > 2 && (
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                98.4% KORELASI
              </span>
            )}
          </div>

          {/* Step 3: Satellite Telemetry CEMS Sensor Verification */}
          <div
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
              auditStep >= 3
                ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {auditStep > 3 ? (
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  ✓
                </div>
              ) : auditStep === 3 ? (
                <div className="w-6 h-6 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin shrink-0"></div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </div>
              )}
              <div>
                <h5 className="font-extrabold text-xs">
                  Validasi Sensor CEMS Cerobong & Telemetri KLHK
                </h5>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  3 Cerobong Pabrik Utama • Telemetri Real-Time NusaCarbon
                </p>
              </div>
            </div>
            {auditStep > 3 && (
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                CEMS OK
              </span>
            )}
          </div>
        </div>

        {/* Final Audit Result Box */}
        {auditStep >= 4 && (
          <div
            className={`p-4 rounded-2xl border animate-fade-in text-xs space-y-2 ${
              isAuditPass
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-between font-black text-sm">
              <span>
                {isAuditPass ? 'PASSED: DATA VALID & TERAMBUT' : 'ALERT: ANOMALI TERDETEKSI'}
              </span>
              <span className="text-xs font-mono font-extrabold">
                Skor Kepercayaan: {((scoreDJP + scoreBBM + scoreCEMS) / 3).toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] font-medium leading-relaxed">
              {isAuditPass
                ? 'Seluruh variabel laporan emisi (4.850 tCO₂e) konsisten 100% dengan transaksi e-Faktur Pajak DJP dan sensor CEMS cerobong pabrik.'
                : 'Terdapat deviasi antara konsumsi BBM dengan beban laporan. Tim auditor KLHK direkomendasikan melakukan verifikasi fisik.'}
            </p>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer h-10"
          >
            {auditStep >= 4 ? 'Tutup Hasil Audit' : 'Proses Audit Berlangsung...'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
