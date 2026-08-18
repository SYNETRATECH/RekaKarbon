import { useCarbonStore } from '../../store/useCarbonStore';
import { Globe, FileText } from 'lucide-react';
import droneFootageVideo from '../../assets/drone_footage.mp4';

export default function DroneAuditModal() {
  const { selectedStage, setSelectedStage, setSelectedReportStage } = useCarbonStore();

  if (!selectedStage) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-fade-in text-left">
        {/* Modal Header */}
        <div className="h-14 bg-slate-50 border-b border-slate-200/60 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Globe
              className="w-4 h-4 text-emerald-600 animate-spin"
              style={{ animationDuration: '6s' }}
            />
            <span className="text-xs font-black text-slate-800 tracking-wide uppercase">
              dMRV Public Audit: {selectedStage.project.name}
            </span>
          </div>
          <button
            onClick={() => setSelectedStage(null)}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/70 rounded-full transition-all cursor-pointer font-bold text-xs"
          >
            ✕ Close
          </button>
        </div>

        {/* Modal Body Columns */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left Column: Drone flight video */}
          <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center min-h-[250px]">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              src={droneFootageVideo}
            />
            <div className="absolute top-4 left-4 text-[9px] bg-black/60 text-emerald-400 px-2.5 py-1 rounded font-mono uppercase tracking-widest z-10 border border-emerald-900">
              dMRV SCAN - LIVE FEED
            </div>
            <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow shadow-emerald-400 animate-bounce top-1/2"></div>
          </div>

          {/* Right Column: Public Audit Variables details */}
          <div className="w-full md:w-80 border-l border-slate-200/60 flex flex-col justify-between bg-slate-50 overflow-y-auto p-5 space-y-5">
            <div className="space-y-4 text-left">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  AUDIT TINGKAT KELANGSUNGAN HIDUP
                </span>
                <h3 className="font-extrabold text-slate-800 text-sm mt-0.5">
                  {selectedStage.stage.title}
                </h3>
              </div>

              {/* Progress Indicator */}
              <div className="bg-white border border-slate-200/60 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Kerapatan Kanopi</span>
                  <span className="font-black text-emerald-700 font-mono">
                    {selectedStage.stage.canopyDensity > 0
                      ? `${selectedStage.stage.canopyDensity}%`
                      : 'N/A'}
                  </span>
                </div>

                {selectedStage.stage.canopyDensity > 0 ? (
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${selectedStage.stage.canopyDensity}%` }}
                    ></div>
                  </div>
                ) : (
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex items-center justify-center">
                    <span className="text-[9px] text-slate-400 font-bold">In Preparation</span>
                  </div>
                )}
                <p className="text-[9px] text-slate-450 leading-normal">
                  Persentase tutupan kanopi vegetasi di zona koordinat proyek.
                </p>
              </div>

              {/* Statistik Pohon Tahap Ini */}
              <div className="bg-white border border-slate-200/60 p-4 rounded-2xl space-y-2 text-left">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">
                  STATISTIK POHON TAHAP INI
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Pohon Ditanam</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedStage.stage.plantedTrees
                      ? selectedStage.stage.plantedTrees.toLocaleString('id-ID')
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
                  <span className="font-semibold text-slate-500">Sisa Belum Ditanam</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {selectedStage.stage.remainingTrees
                      ? selectedStage.stage.remainingTrees.toLocaleString('id-ID')
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Remote Sensing dMRV Metrics */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  METRIK DETEKSI UDARA (dMRV)
                </span>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-white border border-slate-200/50 p-2.5 rounded-xl">
                    <span className="text-[8px] text-slate-400 font-semibold block">
                      Tinggi Kanopi
                    </span>
                    <span className="font-mono font-black text-slate-800 mt-0.5 block">
                      {selectedStage.stage.year <= selectedStage.project.currentYear
                        ? `${selectedStage.project.canopyHeight.toFixed(2)}m`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200/50 p-2.5 rounded-xl">
                    <span className="text-[8px] text-slate-400 font-semibold block">
                      Resolusi Drone
                    </span>
                    <span className="font-mono font-black text-slate-800 mt-0.5 block">
                      {selectedStage.stage.gsd} cm/px
                    </span>
                  </div>
                </div>
              </div>

              {/* Blockchain Smart Contract Payouts */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                  AUDIT BLOCKCHAIN & INSENTIF WARGA
                </span>

                <div className="bg-white border border-slate-200/60 p-3.5 rounded-2xl space-y-3 font-sans">
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none">
                      Kelompok Tani Penerima
                    </span>
                    <span className="font-extrabold text-slate-700 text-xs mt-1 block leading-tight">
                      {selectedStage.stage.kthName}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                    <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none">
                      Insentif Terbayar
                    </span>
                    <div className="text-right">
                      <span className="font-mono font-black text-emerald-800 text-xs block leading-none">
                        Rp {selectedStage.stage.farmerIncentive.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[8px] bg-[#E6F9F4] text-emerald-800 border border-emerald-100 font-bold px-1.5 py-0.2 rounded mt-1 inline-block">
                        {selectedStage.stage.incentiveStatus}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                    <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none">
                      Sertifikasi SPE-GRK
                    </span>
                    <div className="text-right">
                      <span className="font-mono font-black text-slate-800 text-xs block leading-none">
                        +{selectedStage.stage.speCreditMinted.toLocaleString('id-ID')} tCO2e
                      </span>
                      <span className="text-[8px] bg-slate-105 text-slate-600 border border-slate-200 font-bold px-1.5 py-0.2 rounded mt-1 inline-block">
                        {selectedStage.stage.speStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Button to open report for specific stage and trigger print directly */}
              <button
                onClick={() => {
                  setSelectedReportStage(selectedStage.stage);
                  setTimeout(() => {
                    window.print();
                  }, 150);
                }}
                className="w-full bg-primary-gradient hover:opacity-95 text-white text-[10px] font-bold py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 mt-4"
              >
                <FileText className="w-3.5 h-3.5 text-[#00C48C]" />
                <span>Lihat Rapor Audit Sertifikasi</span>
              </button>
            </div>

            <div className="text-[9px] text-slate-400 leading-normal border-t border-slate-200 pt-3 text-left">
              Data dMRV ini divalidasi silang secara on-chain pada ledger terdistribusi Hyperledger
              Besu RekaKarbon.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
