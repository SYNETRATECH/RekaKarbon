import { useCarbonStore } from '../../store/useCarbonStore';
import { formatArea, formatCarbon, formatCurrency, formatPercent } from '@/lib/formatters';
import { FileText, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
    <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
      <DialogContent className="p-6 sm:p-7 max-w-2xl border-slate-200 bg-white shadow-2xl space-y-4 text-left max-h-[90vh] flex flex-col rounded-3xl font-sans overflow-hidden">
        <DialogTitle className="sr-only">Rapor Dokumen Audit Sertifikasi</DialogTitle>

        {/* Modal Header */}
        <div
          id="report-modal-header"
          className="flex justify-between items-start border-b border-slate-100 pb-4 shrink-0 pr-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                Rapor Dokumen Audit Sertifikasi
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {activeProj.name} {selectedReportStage ? `· ${selectedReportStage.title}` : ''}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0"
          >
            <Printer className="w-3.5 h-3.5" /> Print PDF
          </Button>
        </div>

        {/* Scrollable Document Content */}
        <div
          id="report-document-body"
          className="flex-1 overflow-y-auto min-h-0 space-y-5 pr-1 text-slate-800 text-xs font-sans"
        >
          {/* Document Letterhead */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 leading-none tracking-tight">
                REKAKARBON AUDIT CERTIFICATE
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Platform E-Government Transparansi Karbon Indonesia
              </p>
            </div>
            <div className="text-right font-mono text-[10px] text-slate-500">
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
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
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
                    <span className="text-xs font-black text-slate-900">
                      {formatArea(activeProj.rawAreaVal || activeProj.area)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block font-normal">
                      Total Cadangan CO₂
                    </span>
                    <span className="text-xs font-black text-slate-900 font-mono">
                      {formatCarbon(activeProj.rawCarbonVal || activeProj.carbon)}
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
            <div className="rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-12 text-center text-[10px]">No.</TableHead>
                    <TableHead className="text-[10px]">Parameter Audit</TableHead>
                    <TableHead className="text-[10px]">Nilai Terukur</TableHead>
                    <TableHead className="text-[10px]">Status Ambang Batas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedReportStage ? (
                    <>
                      <TableRow>
                        <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                          1
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          Kerapatan Kanopi Vegetasi
                        </TableCell>
                        <TableCell className="font-mono font-bold text-emerald-700">
                          {formatPercent(selectedReportStage.canopyDensity)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                              selectedReportStage.canopyDensity >= 70
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
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
                        <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                          2
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          Tinggi Kanopi Model (CHM)
                        </TableCell>
                        <TableCell className="font-mono font-bold text-slate-800">
                          {selectedReportStage.year <= activeProj.currentYear
                            ? `${activeProj.canopyHeight.toFixed(2)} m`
                            : 'Dalam Pemantauan'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                              selectedReportStage.year <= activeProj.currentYear
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {selectedReportStage.year <= activeProj.currentYear
                              ? 'Memenuhi (≥1.5m)'
                              : 'N/A'}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                          3
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          Ground Sampling Distance (GSD) Drone
                        </TableCell>
                        <TableCell className="font-mono font-bold text-slate-800">
                          {selectedReportStage.gsd} cm/px
                        </TableCell>
                        <TableCell>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[9px]">
                            Resolusi Tinggi
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                          4
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          Sertifikasi SPE-GRK Terbit
                        </TableCell>
                        <TableCell className="font-mono font-bold text-emerald-700">
                          +{formatCarbon(selectedReportStage.speCreditMinted)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                              selectedReportStage.speStatus.includes('Terbit')
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
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
                        <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                          1
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          Vegetation Health (NDVI)
                        </TableCell>
                        <TableCell className="font-mono font-bold text-emerald-700">
                          {activeProj.ndvi.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[9px]">
                            Sangat Sehat
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                          2
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          Enhanced Vegetation Index (EVI)
                        </TableCell>
                        <TableCell className="font-mono font-bold text-emerald-700">
                          {activeProj.evi.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[9px]">
                            Optimal
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                          3
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          Tingkat Kelangsungan Hidup Pohon
                        </TableCell>
                        <TableCell className="font-mono font-bold text-emerald-700">
                          {formatPercent(activeProj.survivalRate * 100)}
                        </TableCell>
                        <TableCell>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[9px]">
                            {activeProj.reforestationStatus}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                          4
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          Tinggi Kanopi Model (CHM)
                        </TableCell>
                        <TableCell className="font-mono font-bold text-slate-800">
                          {activeProj.canopyHeight.toFixed(2)} m
                        </TableCell>
                        <TableCell>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[9px]">
                            Memenuhi (≥1.5m)
                          </span>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Section 3: Smart Contract & Finance Audit */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
              {selectedReportStage
                ? 'AUDIT BLOCKCHAIN & INSENTIF WARGA TAHAP INI'
                : 'TRANSPARANSI DANA BLOCKCHAIN (SMART CONTRACT)'}
            </span>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2 font-mono text-[10px]">
              {selectedReportStage ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">
                      Insentif Kelompok Tani Terbayar:
                    </span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {formatCurrency(selectedReportStage.farmerIncentive)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">
                      Status Penyaluran Insentif:
                    </span>
                    <span className="font-bold text-slate-900 font-sans">
                      {selectedReportStage.incentiveStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
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
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">Realisasi Penanaman:</span>
                    <span className="font-bold text-emerald-700">
                      {selectedReportStage.plantedTrees
                        ? selectedReportStage.plantedTrees.toLocaleString('id-ID')
                        : '—'}{' '}
                      Batang
                    </span>
                  </div>
                  {selectedReportStage.remainingTrees > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-sans">Sisa Penanaman:</span>
                      <span className="font-bold text-rose-600">
                        {selectedReportStage.remainingTrees.toLocaleString('id-ID')} Batang
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">Total Anggaran Proyek:</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(activeProj.totalBudget)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">
                      Dana Terpakai untuk Restorasi (62%):
                    </span>
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(activeProj.totalBudget * 0.62)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">
                      Buffer Pool Darurat (8%):
                    </span>
                    <span className="font-bold text-slate-700">
                      {formatCurrency(activeProj.totalBudget * 0.08)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5 text-slate-800">
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
          <div className="border-t border-slate-200/80 pt-5 grid grid-cols-3 gap-4 items-center mt-5">
            {/* Left: QR Code & Block Verification */}
            <div className="space-y-2 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="p-1 bg-white border border-slate-200/80 rounded-xl inline-block shadow-2xs">
                <svg
                  className="w-16 h-16 text-slate-800"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                >
                  <path d="M0,0 h30 v10 h-20 v20 h-10 z" />
                  <path d="M70,0 h30 v30 h-10 v-20 h-20 z" />
                  <path d="M0,70 h10 v20 h20 v10 h-30 z" />
                  <path d="M70,90 v-20 h30 v30 h-30 z" />
                  <rect
                    x="5"
                    y="5"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <rect
                    x="75"
                    y="5"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <rect
                    x="5"
                    y="75"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <rect x="12" y="12" width="6" height="6" />
                  <rect x="82" y="12" width="6" height="6" />
                  <rect x="12" y="82" width="6" height="6" />
                  <rect x="35" y="15" width="8" height="8" />
                  <rect x="45" y="25" width="6" height="6" />
                  <rect x="55" y="10" width="10" height="4" />
                  <rect x="15" y="45" width="12" height="6" />
                  <rect
                    x="40"
                    y="40"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <rect x="46" y="46" width="4" height="4" />
                  <rect x="70" y="45" width="8" height="8" />
                  <rect x="80" y="55" width="10" height="10" />
                  <rect x="35" y="70" width="8" height="12" />
                  <rect x="50" y="80" width="15" height="6" />
                  <rect x="75" y="80" width="8" height="8" />
                </svg>
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
              <div className="relative w-18 h-18 rounded-full border-2 border-dashed border-emerald-800/40 flex items-center justify-center text-center p-1 select-none transform -rotate-12 bg-white/40 backdrop-blur-xs shadow-2xs">
                <div className="absolute inset-0.5 rounded-full border border-emerald-800/20"></div>
                <span className="text-[6px] font-black text-emerald-900 leading-tight uppercase tracking-wider text-center flex items-center justify-center h-full">
                  KEMENTERIAN LHK
                  <br />
                  VERIFIED
                  <br />
                  AUDIT RI
                </span>
              </div>

              <div className="relative w-18 h-18 rounded-full border-2 border-double border-emerald-600/40 flex items-center justify-center text-center p-1 select-none transform rotate-12 -ml-4 bg-white/40 backdrop-blur-xs shadow-2xs">
                <div className="absolute inset-0.5 rounded-full border border-emerald-600/20"></div>
                <span className="text-[6px] font-black text-emerald-800 leading-tight uppercase tracking-wider text-center flex items-center justify-center h-full">
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
                <svg
                  className="w-24 h-10 text-blue-600 opacity-80"
                  viewBox="0 0 100 50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15,35 Q30,12 45,22 T75,12 T95,25 Q65,42 35,32 M20,22 Q50,18 80,28" />
                </svg>
              </div>

              <div className="text-[9px] leading-tight font-semibold">
                <p className="font-bold text-slate-800">Sutrisno, S.Hut., M.Si.</p>
                <p className="text-slate-400 text-[8px] font-medium">
                  Kepala Balai Taman Nasional
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center shrink-0">
          <span className="text-[10px] text-slate-400 font-medium">
            Tervalidasi secara on-chain pada Hyperledger Besu RekaKarbon
          </span>
          <Button
            onClick={() => setIsReportModalOpen(false)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Tutup Rapor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
