import { useCarbonStore } from '../store/useCarbonStore';
import {
  Globe,
  FileText,
  Printer,
  FileSpreadsheet,
  Eye,
  ShieldCheck,
  Download,
  QrCode,
  Lock,
} from 'lucide-react';
import droneFootageVideo from '../assets/drone_footage.mp4';

export default function Modals() {
  const {
    projects,
    companies,
    activeIndex,
    selectedStage,
    isReportModalOpen,
    selectedReportStage,
    selectedTx,
    lightboxImage,
    isVerichainExplorerOpen,
    searchedTxData,
    isPublicReportOpen,
    setSelectedStage,
    setIsReportModalOpen,
    setSelectedReportStage,
    setSelectedTx,
    setLightboxImage,
    setIsVerichainExplorerOpen,
    setIsPublicReportOpen,
  } = useCarbonStore();

  const activeProj = projects[activeIndex];

  const handleDownloadCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent +=
      'Kategori,Nama Entitas/Proyek,Wilayah/Sektor,Volume/Kapasitas,Stok/Defisit,Status,Detail Penebus/Partner,TxHash/Sertifikat\n';

    projects.forEach((p) => {
      const buyers = p.tokenBuyers
        ? p.tokenBuyers.map((b: any) => `${b.companyName} (${b.tCO2e} tCO2e)`).join('; ')
        : 'Belum ada';
      csvContent += `Proyek Kehutanan,"${p.name}","${p.region}","${p.area}","${p.carbon}","${p.reforestationStatus}","${buyers}","${p.tokenBuyers?.[0]?.speCertificateId || '-'}"\n`;
    });

    companies.forEach((c) => {
      csvContent += `Industri Emisi,"${c.name}","${c.sector}","Emisi ${c.actualEmission} tCO2e","Defisit ${c.carbonDeficit} tCO2e","${c.complianceRating}","Partner: ${c.recommendedPartner}","Deadline: ${c.paymentDeadline}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `RekaKarbon_Public_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const reportPayload = {
      title: 'RekaKarbon National Carbon Transparency Report',
      generatedAt: new Date().toISOString(),
      verifiedBy: 'Verichain On-Chain dMRV & KLHK',
      projects: projects,
      companies: companies,
    };
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `RekaKarbon_Public_Audit_Report_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <>
      {/* 1. DRONE AUDIT PUBLIC VERIFICATION MODAL */}
      {selectedStage && (
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
                  Data dMRV ini divalidasi silang secara on-chain pada ledger terdistribusi
                  Hyperledger Besu RekaKarbon.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. OFFICIAL AUDIT REPORT DOCUMENT MODAL */}
      {activeProj && (
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
                        <span className="text-xs font-black text-slate-900">
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
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-600 text-[9px] uppercase font-bold">
                      <tr>
                        <th className="p-2.5 border-b">Parameter Audit</th>
                        <th className="p-2.5 border-b">Nilai Terukur</th>
                        <th className="p-2.5 border-b">Status Ambang Batas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10px] font-medium">
                      {selectedReportStage ? (
                        <>
                          <tr>
                            <td className="p-2.5">Kerapatan Kanopi Vegetasi</td>
                            <td className="p-2.5 font-mono font-bold text-emerald-700">
                              {selectedReportStage.canopyDensity}%
                            </td>
                            <td className="p-2.5">
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
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2.5">Tinggi Kanopi Model (CHM)</td>
                            <td className="p-2.5 font-mono font-bold text-slate-800">
                              {selectedReportStage.year <= activeProj.currentYear
                                ? `${activeProj.canopyHeight.toFixed(2)} m`
                                : 'Dalam Pemantauan'}
                            </td>
                            <td className="p-2.5">
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
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2.5">Ground Sampling Distance (GSD) Drone</td>
                            <td className="p-2.5 font-mono font-bold text-slate-800">
                              {selectedReportStage.gsd} cm/px
                            </td>
                            <td className="p-2.5">
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">
                                Resolusi Tinggi
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2.5">Sertifikasi SPE-GRK Terbit</td>
                            <td className="p-2.5 font-mono font-bold text-emerald-700">
                              +{selectedReportStage.speCreditMinted.toLocaleString('id-ID')} tCO2e
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`font-bold px-1.5 py-0.5 rounded text-[8px] ${
                                  selectedReportStage.speStatus.includes('Terbit')
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-yellow-50 text-yellow-755'
                                }`}
                              >
                                {selectedReportStage.speStatus}
                              </span>
                            </td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr>
                            <td className="p-2.5">Vegetation Health (NDVI)</td>
                            <td className="p-2.5 font-mono font-bold text-emerald-700">
                              {activeProj.ndvi.toFixed(2)}
                            </td>
                            <td className="p-2.5">
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">
                                Sangat Sehat
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2.5">Enhanced Vegetation Index (EVI)</td>
                            <td className="p-2.5 font-mono font-bold text-emerald-700">
                              {activeProj.evi.toFixed(2)}
                            </td>
                            <td className="p-2.5">
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">
                                Optimal
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2.5">Tingkat Kelangsungan Hidup Pohon</td>
                            <td className="p-2.5 font-mono font-bold text-emerald-700">
                              {(activeProj.survivalRate * 100).toFixed(1)}%
                            </td>
                            <td className="p-2.5">
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">
                                {activeProj.reforestationStatus}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2.5">Tinggi Kanopi Model (CHM)</td>
                            <td className="p-2.5 font-mono font-bold text-slate-800">
                              {activeProj.canopyHeight.toFixed(2)} m
                            </td>
                            <td className="p-2.5">
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">
                                Memenuhi (≥1.5m)
                              </span>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
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
                        <span className="text-slate-500 font-sans">
                          Status Penyaluran Insentif:
                        </span>
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
          </div>
        </div>
      )}

      {/* 3. BUKTI PENCAIRAN BLOCKCHAIN & NOTA DIGITAL MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col relative animate-fade-in text-left font-sans">
            {/* Modal Header */}
            <div className="h-14 bg-slate-900 text-white px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black tracking-wide uppercase font-mono">
                  BUKTI ALIRAN DANA BLOCKCHAIN:{' '}
                  {selectedTx.tx.txHash
                    ? `${selectedTx.tx.txHash.substring(0, 10)}...${selectedTx.tx.txHash.substring(selectedTx.tx.txHash.length - 6)}`
                    : `0x${selectedTx.index}f8d2...`}
                </span>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full transition-all cursor-pointer font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-850 text-xs">
              {/* Header Info Banner */}
              <div className="bg-slate-950 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">
                    NILAI PENCAIRAN TERVERIFIKASI
                  </span>
                  <h3 className="text-xl font-black font-mono text-white tracking-tight">
                    Rp {selectedTx.tx.amount.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[9px] text-slate-300 font-medium">
                    Kategori: {selectedTx.tx.category} · Tanggal: {selectedTx.tx.date}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <span className="bg-emerald-500/20 text-[#00C48C] border border-emerald-400/30 text-[9px] font-bold px-2.5 py-1 rounded-full inline-block">
                    ● Terverifikasi On-Chain
                  </span>
                  <p className="font-mono text-[9px] text-[#00C48C]">
                    Besu Block {selectedTx.tx.blockNumber || '#184920'}
                  </p>
                </div>
              </div>

              {/* Vendor & Description Detail */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Penerima Dana / Vendor
                    </span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedTx.tx.vendor || 'Kelompok Tani Hutan (KTH)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Kawasan Proyek
                    </span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedTx.project.name} ({selectedTx.project.region})
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-200/50 pt-2 mt-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Deskripsi Transaksi
                  </span>
                  <p className="text-slate-700 font-medium mt-0.5">{selectedTx.tx.desc}</p>
                </div>
              </div>

              {/* Itemized Invoice Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  RINCIAN BARANG & RINCIAN FAKTUR
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-600 text-[9px] uppercase font-bold">
                      <tr>
                        <th className="p-2.5 border-b">Nama Barang / Deskripsi Jasa</th>
                        <th className="p-2.5 border-b text-center">Volume</th>
                        <th className="p-2.5 border-b text-right">Harga Satuan</th>
                        <th className="p-2.5 border-b text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10px]">
                      {selectedTx.tx.items ? (
                        selectedTx.tx.items.map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-800">{item.name}</td>
                            <td className="p-2.5 text-center font-mono font-semibold text-slate-605">
                              {item.qty}
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-600">
                              Rp {item.price.toLocaleString('id-ID')}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-800">
                              Rp {item.total.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-800">{selectedTx.tx.desc}</td>
                          <td className="p-2.5 text-center font-mono font-semibold text-slate-605">
                            1 Paket
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            Rp {selectedTx.tx.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-800">
                            Rp {selectedTx.tx.amount.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td
                          colSpan={3}
                          className="p-2.5 text-right uppercase text-[9px] text-slate-500"
                        >
                          Total Transaksi:
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-slate-900 text-xs">
                          Rp {selectedTx.tx.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Multi-Photo Proof & Receipt Gallery */}
              {selectedTx.tx.proofImages && selectedTx.tx.proofImages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      GALERI BUKTI FISIK LAPANGAN & NOTA
                    </span>
                    <span
                      className="text-[9px] font-semibold"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {selectedTx.tx.proofImages.length} Foto Terverifikasi On-Chain
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {selectedTx.tx.proofImages.map((imgUrl: string, i: number) => (
                      <div
                        key={i}
                        onClick={() => setLightboxImage(imgUrl)}
                        className="relative h-28 rounded-xl overflow-hidden border border-slate-200 shadow-xs group cursor-pointer"
                      >
                        <img
                          src={imgUrl}
                          alt={`Bukti ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                          <Eye className="w-3.5 h-3.5" /> Perbesar
                        </div>
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-mono">
                          Bukti #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. LIGHTBOX FULLSCREEN IMAGE PREVIEW */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center p-6 cursor-pointer animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={lightboxImage}
              alt="Bukti High-Res"
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain border border-white/20"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="mt-4 bg-white/20 hover:bg-white/30 text-white px-5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
            >
              ✕ Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

      {/* 5. VERICHAIN EXPLORER SEARCH MODAL */}
      {isVerichainExplorerOpen && searchedTxData && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in text-left">
            {/* Modal Header */}
            <div className="h-16 bg-slate-900 text-white px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-gradient flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-[#00C48C]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white leading-none">
                    Verichain On-Chain Explorer
                  </h3>
                  <span className="text-[9px] text-emerald-400 font-mono block mt-1">
                    Status: Terverifikasi di Blockchain Ledger
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsVerichainExplorerOpen(false)}
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-all cursor-pointer font-bold text-xs"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* On-Chain Hash Badge */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    TRANSACTION HASH (TX)
                  </span>
                  <span className="bg-emerald-100 text-emerald-900 text-[8px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-emerald-700" />
                    Immutable Proof
                  </span>
                </div>
                <p className="font-mono text-xs font-bold text-slate-800 break-all bg-white p-2.5 rounded-xl border border-slate-200">
                  {searchedTxData.item.txHash || '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d'}
                </p>
                <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-1">
                  <span>Block Height: {searchedTxData.item.blockNumber || '#184410'}</span>
                  <span>
                    Tanggal:{' '}
                    {searchedTxData.item.purchaseDate || searchedTxData.item.date || '14 Jul 2025'}
                  </span>
                </div>
              </div>

              {/* Transaction / Buyer Details */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  DETAIL ENTITAS & AKSI OFFSETER
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">
                      Nama Entitas Penebus
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-xs">
                      {searchedTxData.item.companyName ||
                        searchedTxData.item.vendor ||
                        'PT Penebus Karbon Terverifikasi'}
                    </h4>
                    <span className="text-[9px] text-slate-500 block">
                      {searchedTxData.item.sector || searchedTxData.item.category}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">
                      Volume & Nilai Transaksi
                    </span>
                    <p className="font-mono font-black text-emerald-700 text-xs">
                      {searchedTxData.item.tCO2e
                        ? `${searchedTxData.item.tCO2e.toLocaleString('id-ID')} tCO2e`
                        : '12.500 tCO2e'}
                    </p>
                    <span className="font-mono text-[10px] text-slate-600 font-bold block">
                      Rp{' '}
                      {(
                        searchedTxData.item.amountIDR ||
                        searchedTxData.item.amount ||
                        3250000000
                      ).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-slate-500">
                      Proyek Kehutanan Penerima Alokasi:
                    </span>
                    <span className="font-extrabold text-slate-800">
                      {searchedTxData.project
                        ? searchedTxData.project.name
                        : 'TN Baluran (Jawa Timur)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-slate-500">ID Sertifikat SPE-GRK:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {searchedTxData.item.speCertificateId || 'SPE-BALURAN-2025-001'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-slate-500">
                      Auditor Lembaga Independen:
                    </span>
                    <span className="font-bold text-slate-800">
                      {searchedTxData.item.auditor || 'Sucofindo / KLHK Verichain System'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cryptographic QR Code Verification Badge */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
                    Sertifikat Digital Terautentikasi
                  </div>
                  <p className="text-[9px] text-emerald-800 font-medium leading-relaxed">
                    Data transaksi ini terdaftar permanen dalam Verichain Ledger RekaKarbon dan
                    tidak dapat diubah oleh pihak manapun.
                  </p>
                </div>
                <div className="w-14 h-14 bg-white p-1 rounded-xl border border-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
                  <QrCode className="w-12 h-12 text-slate-800" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsVerichainExplorerOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Tutup Explorer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. PUBLIC TRANSPARENCY REPORT PRINT & DOWNLOAD MODAL */}
      {isPublicReportOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl max-h-[92vh] flex flex-col animate-fade-in text-left">
            {/* Action Bar Header */}
            <div className="h-16 bg-slate-900 text-white px-6 flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#00C48C]" />
                <div>
                  <h3 className="font-extrabold text-sm text-white leading-none">
                    Pratinjau Laporan Transparansi Publik
                  </h3>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    Dokumen Cetak & Audit Karbon Resmi (UU No. 7/2021 HPP)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak / PDF
                </button>

                <button
                  onClick={handleDownloadCSV}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-slate-700"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  CSV Data
                </button>

                <button
                  onClick={handleDownloadJSON}
                  className="bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  JSON
                </button>

                <button
                  onClick={() => setIsPublicReportOpen(false)}
                  className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-all cursor-pointer font-bold text-xs"
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            {/* Printable Report Document Canvas */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-900 bg-white font-sans text-xs print:p-0 print:overflow-visible">
              {/* Document Official Header */}
              <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-black tracking-widest text-[#00C48C] uppercase block">
                    REKAKARBON VERICHAIN PLATFORM
                  </span>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                    Laporan Transparansi Karbon & Kepatuhan Industri Nasional
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Diuji berdasarkan Regulasi Pajak Karbon UU No. 7 Tahun 2021 HPP & Sistem dMRV
                    NusaCarbon
                  </p>
                </div>
                <div className="text-right shrink-0 font-mono text-[10px] space-y-1">
                  <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold block">
                    VERIFIED PUBLIC AUDIT
                  </span>
                  <p className="text-slate-400">
                    Tanggal:{' '}
                    {new Date().toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-slate-400">Status: Mainnet Live</p>
                </div>
              </div>

              {/* Section 1: Executive Overview */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                  1. Ringkasan Eksekutif Serapan & Emisi Karbon
                </h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block">
                      Total Proyek Kehutanan
                    </span>
                    <span className="text-sm font-black text-emerald-800">
                      {projects.length} Kawasan
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block">
                      Cadangan Karbon Hutan
                    </span>
                    <span className="text-sm font-black text-emerald-800">79.71M tCO2e</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block">
                      Industri Terpantau CEMS
                    </span>
                    <span className="text-sm font-black text-slate-800">
                      {companies.length} Pabrik
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block">
                      Total Defisit Emisi
                    </span>
                    <span className="text-sm font-black text-rose-600">6.47M tCO2e</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Proyek Kehutanan & Detail Pembeli Token */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                  2. Transparansi Proyek Kehutanan & Pembeli Token Karbon
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead className="bg-slate-100 font-bold uppercase text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Nama Kawasan Hutan</th>
                        <th className="p-3">Wilayah</th>
                        <th className="p-3">Luas Area</th>
                        <th className="p-3">Stok Karbon</th>
                        <th className="p-3">Kelangsungan Hidup</th>
                        <th className="p-3">Daftar Penebus / Pembeli Token</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {projects.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 font-extrabold text-slate-900">{p.name}</td>
                          <td className="p-3 text-slate-500">{p.region}</td>
                          <td className="p-3 font-mono">{p.area}</td>
                          <td className="p-3 font-mono font-bold text-emerald-800">{p.carbon}</td>
                          <td className="p-3">
                            <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold text-[9px]">
                              {(p.survivalRate * 100).toFixed(1)}% ({p.reforestationStatus})
                            </span>
                          </td>
                          <td className="p-3">
                            {p.tokenBuyers && p.tokenBuyers.length > 0 ? (
                              <div className="space-y-1">
                                {p.tokenBuyers.map((tb: any) => (
                                  <div key={tb.id} className="font-mono text-[9px] text-slate-800">
                                    <span className="font-bold text-slate-900">
                                      {tb.companyName}
                                    </span>{' '}
                                    ({tb.tCO2e.toLocaleString('id-ID')} tCO2e)
                                    <span className="text-slate-400 block text-[8px]">
                                      SPE: {tb.speCertificateId}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Belum ada transaksi</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Monitoring Emisi Industri */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                  3. Status Kepatuhan Industri & Defisit Karbon Korporat
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead className="bg-slate-100 font-bold uppercase text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Nama Perusahaan / Industri</th>
                        <th className="p-3">Sektor</th>
                        <th className="p-3">Emisi Aktual</th>
                        <th className="p-3">Batas Kuota</th>
                        <th className="p-3">Defisit Karbon</th>
                        <th className="p-3">Estimasi Denda UU HPP</th>
                        <th className="p-3">Status Kepatuhan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {companies.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="p-3 font-extrabold text-slate-900">{c.name}</td>
                          <td className="p-3 text-slate-500">{c.sector}</td>
                          <td className="p-3 font-mono text-slate-800">
                            {c.actualEmission.toLocaleString('id-ID')} t
                          </td>
                          <td className="p-3 font-mono text-slate-500">
                            {c.emissionCap.toLocaleString('id-ID')} t
                          </td>
                          <td className="p-3 font-mono font-bold text-rose-600">
                            {c.carbonDeficit.toLocaleString('id-ID')} t
                          </td>
                          <td className="p-3 font-mono font-black text-rose-700">
                            Rp {c.offsetCostIDR.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded font-extrabold text-[8px] ${
                                c.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {c.complianceRating}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Document Official Footer & Digital Signature */}
              <div className="border-t border-slate-200 pt-6 flex items-center justify-between text-[9px] text-slate-500">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 p-1 rounded-lg border border-slate-300 flex items-center justify-center shrink-0">
                    <QrCode className="w-10 h-10 text-slate-800" />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-800">
                      Autentikasi Digital On-Chain RekaKarbon
                    </p>
                    <p className="text-slate-400">Verichain Protocol ID: VCH-2025-NAT-09128</p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <p className="font-bold text-slate-800">
                    Direktorat Pengendalian Kerusakan Lingkungan
                  </p>
                  <p className="text-slate-400">
                    Kementerian Lingkungan Hidup dan Kehutanan (KLHK)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
