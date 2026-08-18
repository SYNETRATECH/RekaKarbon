import { useCarbonStore } from '../../store/useCarbonStore';
import { FileText, Printer, QrCode, FileSignature } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export default function AuditReportModal() {
  const { projects, activeIndex, isReportModalOpen, selectedReportStage, setIsReportModalOpen } =
    useCarbonStore();

  const activeProj = projects[activeIndex];

  if (!activeProj) return null;

  return (
    <div
      id="report-modal-wrapper"
      className={
        isReportModalOpen
          ? 'fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fade-in'
          : 'absolute -left-[9999px] -top-[9999px] w-1 h-1 overflow-hidden pointer-events-none opacity-0'
      }
    >
      <div
        id="report-modal-content"
        className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col relative animate-fade-in text-left"
      >
        {/* Modal Header */}
        <div
          id="report-modal-header"
          className="h-14 bg-slate-900 text-white px-6 flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00C48C]" />
            <span className="text-xs font-black tracking-wide uppercase">
              RAPOR DOKUMEN AUDIT SERTIFIKASI — {activeProj.name}{' '}
              {selectedReportStage ? `(${selectedReportStage.title})` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" /> Print PDF
            </button>
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-full transition-all cursor-pointer font-bold text-xs"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div
          id="report-document-body"
          className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-xs font-sans"
        >
          {/* Document Letterhead */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-md font-black text-slate-900 leading-none">
                REKAKARBON AUDIT CERTIFICATE
              </h2>
              <p className="text-[9px] text-slate-400 font-semibold mt-1">
                Platform E-Government Transparansi Karbon Indonesia
              </p>
            </div>
            <div className="text-right font-mono text-[9px] text-slate-500">
              <p className="font-bold text-slate-800">
                REF:{' '}
                {selectedReportStage
                  ? `RKR-AUDIT-2025-07-T${selectedReportStage.year}`
                  : 'RKR-AUDIT-2025-07'}
              </p>
              <p>
                Tanggal:{' '}
                {selectedReportStage
                  ? `14 Juli ${2021 + selectedReportStage.year}`
                  : '14 Juli 2025'}
              </p>
            </div>
          </div>

          {/* Section 1: Overview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
              RINGKASAN PROYEK KONSERVASI
            </span>
            <div className="grid grid-cols-2 gap-3 font-semibold text-slate-700">
              <div>
                <span className="text-slate-400 text-[9px] block font-normal">
                  Nama Kawasan Hutan
                </span>
                <span className="text-xs font-black text-slate-900">{activeProj.name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] block font-normal">
                  Provinsi / Wilayah
                </span>
                <span className="text-xs font-black text-slate-900">{activeProj.region}</span>
              </div>
              {selectedReportStage ? (
                <>
                  <div>
                    <span className="text-slate-400 text-[9px] block font-normal">
                      Tahap Progress
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {selectedReportStage.title}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block font-normal">
                      Kelompok Tani Pelaksana
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {selectedReportStage.kthName}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[9px] block font-normal">
                      Target Tahap Ini
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {selectedReportStage.milestone}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-slate-400 text-[9px] block font-normal">
                      Luas Terverifikasi GIS
                    </span>
                    <span className="text-xs font-black text-slate-900">{activeProj.area}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block font-normal">
                      Total Cadangan CO2
                    </span>
                    <span className="text-xs font-black text-slate-900 font-mono">
                      {activeProj.carbon}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 2: dMRV Remote Sensing Verification */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
              HASIL AUDIT dMRV (SATELIT & DRONE UAV)
            </span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter Audit</TableHead>
                  <TableHead>Nilai Terukur</TableHead>
                  <TableHead>Status Ambang Batas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedReportStage ? (
                  <>
                    <TableRow>
                      <TableCell>Kerapatan Kanopi Vegetasi</TableCell>
                      <TableCell className="font-mono font-bold text-emerald-700">
                        {selectedReportStage.canopyDensity}%
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[8px] ${
                            selectedReportStage.canopyDensity >= 70
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-yellow-50 text-yellow-755'
                          }`}
                        >
                          {selectedReportStage.canopyDensity >= 70
                            ? 'Sangat Rapat'
                            : selectedReportStage.canopyDensity >= 40
                              ? 'Rapat'
                              : 'Fase Tumbuh'}
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tinggi Kanopi Model (CHM)</TableCell>
                      <TableCell className="font-mono font-bold text-slate-800">
                        {selectedReportStage.year <= activeProj.currentYear
                          ? `${activeProj.canopyHeight.toFixed(2)} m`
                          : 'Dalam Pemantauan'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[8px] ${
                            selectedReportStage.year <= activeProj.currentYear
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {selectedReportStage.year <= activeProj.currentYear
                            ? 'Memenuhi (≥1.5m)'
                            : 'N/A'}
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Ground Sampling Distance (GSD) Drone</TableCell>
                      <TableCell className="font-mono font-bold text-slate-800">
                        {selectedReportStage.gsd} cm/px
                      </TableCell>
                      <TableCell>
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">
                          Resolusi Tinggi
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Sertifikasi SPE-GRK Terbit</TableCell>
                      <TableCell className="font-mono font-bold text-emerald-700">
                        +{selectedReportStage.speCreditMinted.toLocaleString('id-ID')} tCO2e
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[8px] ${
                            selectedReportStage.speStatus.includes('Terbit')
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-yellow-50 text-yellow-755'
                          }`}
                        >
                          {selectedReportStage.speStatus}
                        </span>
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <>
                    <TableRow>
                      <TableCell>Vegetation Health (NDVI)</TableCell>
                      <TableCell className="font-mono font-bold text-emerald-700">
                        {activeProj.ndvi.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">
                          Sangat Sehat
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Enhanced Vegetation Index (EVI)</TableCell>
                      <TableCell className="font-mono font-bold text-emerald-700">
                        {activeProj.evi.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">
                          Optimal
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tingkat Kelangsungan Hidup Pohon</TableCell>
                      <TableCell className="font-mono font-bold text-emerald-700">
                        {(activeProj.survivalRate * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">
                          {activeProj.reforestationStatus}
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tinggi Kanopi Model (CHM)</TableCell>
                      <TableCell className="font-mono font-bold text-slate-800">
                        {activeProj.canopyHeight.toFixed(2)} m
                      </TableCell>
                      <TableCell>
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">
                          Memenuhi (≥1.5m)
                        </span>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Section 3: Smart Contract & Finance Audit */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
              {selectedReportStage
                ? 'AUDIT BLOCKCHAIN & INSENTIF WARGA TAHAP INI'
                : 'TRANSPARANSI DANA BLOCKCHAIN (SMART CONTRACT)'}
            </span>
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2 font-mono text-[10px]">
              {selectedReportStage ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">
                      Insentif Kelompok Tani Terbayar:
                    </span>
                    <span className="font-bold text-emerald-700 font-mono">
                      Rp {selectedReportStage.farmerIncentive.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Status Penyaluran Insentif:</span>
                    <span className="font-bold text-slate-900 font-sans">
                      {selectedReportStage.incentiveStatus}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-500 font-sans font-bold">
                      Target Penanaman Pohon:
                    </span>
                    <span className="font-bold text-slate-700">
                      {selectedReportStage.targetTrees
                        ? selectedReportStage.targetTrees.toLocaleString('id-ID')
                        : '50.000'}{' '}
                      Batang
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Realisasi Penanaman:</span>
                    <span className="font-bold text-emerald-700">
                      {selectedReportStage.plantedTrees
                        ? selectedReportStage.plantedTrees.toLocaleString('id-ID')
                        : '—'}{' '}
                      Batang
                    </span>
                  </div>
                  {selectedReportStage.remainingTrees > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Sisa Penanaman:</span>
                      <span className="font-bold text-rose-600">
                        {selectedReportStage.remainingTrees.toLocaleString('id-ID')} Batang
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Total Anggaran Proyek:</span>
                    <span className="font-bold text-slate-900">
                      Rp {activeProj.totalBudget.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">
                      Dana Terpakai untuk Restorasi (62%):
                    </span>
                    <span className="font-bold text-emerald-700">
                      Rp {(activeProj.totalBudget * 0.62).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Buffer Pool Darurat (8%):</span>
                    <span className="font-bold text-slate-700">
                      Rp {(activeProj.totalBudget * 0.08).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 text-slate-850">
                    <span className="text-slate-600 font-sans font-bold">
                      Mitra Pelaksana Lapangan:
                    </span>
                    <span className="font-bold font-sans text-xs">
                      {activeProj.reforestationPartner}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Signatures, Stamps, and QR Code Section */}
          <div className="border-t border-slate-200 pt-6 grid grid-cols-3 gap-4 items-center mt-6">
            {/* Left: QR Code & Block Verification */}
            <div className="space-y-2 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="p-1 bg-white border border-slate-200 rounded-lg inline-block">
                <QrCode className="w-16 h-16 text-slate-800" />
              </div>
              <div className="text-[8px] font-mono text-slate-500 leading-tight">
                <p className="font-bold text-slate-700">VERIFIKASI ON-CHAIN</p>
                <p className="truncate w-36">
                  Block: {selectedReportStage ? `#184${selectedReportStage.year}00` : '#184920'}
                </p>
                <p className="truncate w-36">
                  Hash: 0x9f8a3b...2a{selectedReportStage ? selectedReportStage.year : 'c'}
                </p>
              </div>
            </div>

            {/* Middle: Verifications Stamps */}
            <div className="flex justify-center gap-2 relative">
              <div className="relative w-18 h-18 rounded-full border-2 border-dashed border-[#033C2E]/40 flex items-center justify-center text-center p-1 select-none transform -rotate-12 bg-white/20 backdrop-blur-xs">
                <div className="absolute inset-0.5 rounded-full border border-[#033C2E]/20"></div>
                <span className="text-[6px] font-black text-[#033C2E]/80 leading-tight uppercase tracking-wider text-center flex items-center justify-center h-full">
                  KEMENTERIAN LHK
                  <br />
                  VERIFIED
                  <br />
                  AUDIT RI
                </span>
              </div>

              <div className="relative w-18 h-18 rounded-full border-2 border-double border-emerald-600/40 flex items-center justify-center text-center p-1 select-none transform rotate-12 -ml-4 bg-white/20 backdrop-blur-xs">
                <div className="absolute inset-0.5 rounded-full border border-emerald-600/10"></div>
                <span className="text-[6px] font-black text-emerald-700/80 leading-tight uppercase tracking-wider text-center flex items-center justify-center h-full">
                  BALAI TN
                  <br />
                  {activeProj.name.replace('TN ', '')}
                  <br />
                  SEKRETARIAT
                </span>
              </div>
            </div>

            {/* Right: Signature Placeholder */}
            <div className="text-center space-y-1 relative">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                DISETUJUI OLEH
              </span>

              <div className="h-10 flex items-center justify-center relative">
                <FileSignature className="w-10 h-10 text-emerald-700 opacity-90" />
              </div>

              <div className="text-[9px] leading-tight font-semibold">
                <p className="font-bold text-slate-800">Sutrisno, S.Hut., M.Si.</p>
                <p className="text-slate-400 text-[8px] font-medium">Kepala Balai Taman Nasional</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
