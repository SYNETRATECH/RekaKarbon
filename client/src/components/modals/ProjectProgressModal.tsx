import { ShieldCheck, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ProjectProgressModalProps {
  project: any | null;
  onClose: () => void;
  getProjectProgressData: (project: any) => any;
}

export default function ProjectProgressModal({
  project,
  onClose,
  getProjectProgressData,
}: ProjectProgressModalProps) {
  if (!project) return null;

  const progData = getProjectProgressData(project);

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 max-w-4xl border-slate-200 bg-white shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        <DialogTitle className="sr-only">
          Progress Proyek Konservasi & Transparansi Dana
        </DialogTitle>

        {/* Modal Header (Fixed Sticky at Top) */}
        <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100 shrink-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-[#003E29] uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                {project.categoryLabel}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#00C48C]" />
                dMRV Verified
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1.5">{project.projectName}</h3>
            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {project.location} • Penanggung Jawab:{' '}
              <span className="text-slate-800 font-extrabold">{project.assignedKTH}</span>
            </p>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 text-xs">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-2xl">
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase block">
                Realisasi Serapan
              </span>
              <p className="text-lg font-black text-slate-900 mt-1">
                {project.actualSequestrationTCO2e.toLocaleString('id-ID')}{' '}
                <span className="text-xs text-slate-500 font-bold">tCO₂e</span>
              </p>
              <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                Target: {project.targetSequestrationTCO2e.toLocaleString('id-ID')} tCO₂e
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                Luas Hutan GIS
              </span>
              <p className="text-lg font-black text-slate-900 mt-1">
                {project.areaHectares.toLocaleString('id-ID')}{' '}
                <span className="text-xs text-slate-500 font-bold">Hektar</span>
              </p>
              <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                Kerapatan: {project.canopyDensity}%
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                Total Anggaran Proyek
              </span>
              <p className="text-lg font-black text-slate-900 mt-1">
                Rp {(project.totalBudgetIDR / 1000000000).toFixed(2)}{' '}
                <span className="text-xs text-slate-500 font-bold">Miliar</span>
              </p>
              <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                Real: Rp {(project.disbursedBudgetIDR / 1000000000).toFixed(2)}B
              </span>
            </div>

            <div className="bg-emerald-100/60 border border-emerald-200 p-3.5 rounded-2xl">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">
                Tingkat Kelangsungan Hidup
              </span>
              <p className="text-lg font-black text-emerald-900 mt-1">
                {(project.survivalRatePercent || 94.2).toFixed(1)}%
              </p>
              <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                Status: {project.reforestationStatus || 'Sangat Baik'}
              </span>
            </div>
          </div>

          {/* Allocation Details */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              RINCIAN DANA PROYEK LINGKUNGAN (97%)
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-[10px]">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold block">1. Restorasi (62%)</span>
                <span className="font-mono font-black text-emerald-800">
                  Rp {(progData.posRestorasi / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold block">2. Pemeliharaan (15%)</span>
                <span className="font-mono font-black text-emerald-800">
                  Rp {(progData.posPemeliharaan / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold block">3. dMRV Drone (10%)</span>
                <span className="font-mono font-black text-emerald-800">
                  Rp {(progData.posMonitoring / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold block">4. Buffer Pool (8%)</span>
                <span className="font-mono font-black text-amber-700">
                  Rp {(progData.posBufferPool / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold block">5. Nusa API (5%)</span>
                <span className="font-mono font-black text-emerald-800">
                  Rp {(progData.posNusaApi / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
