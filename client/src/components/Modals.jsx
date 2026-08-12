import { useCarbonStore } from '../store/useCarbonStore';
import { Globe, FileText, Printer, CheckCircle2, FileSpreadsheet, Eye, ShieldAlert } from 'lucide-react';
import droneFootageVideo from '../assets/drone_footage.mp4';

export default function Modals() {
  const {
    projects,
    activeIndex,
    selectedStage,
    isReportModalOpen,
    selectedTx,
    lightboxImage,
    setSelectedStage,
    setIsReportModalOpen,
    setSelectedTx,
    setLightboxImage
  } = useCarbonStore();

  const activeProj = projects[activeIndex];

  return (
    <>
      {/* 1. DRONE AUDIT PUBLIC VERIFICATION MODAL */}
      {selectedStage && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-fade-in text-left">
            
            {/* Modal Header */}
            <div className="h-14 bg-slate-50 border-b border-slate-200/60 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
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
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">AUDIT TINGKAT KELANGSUNGAN HIDUP</span>
                    <h3 className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedStage.stage.title}</h3>
                  </div>

                  {/* Progress Indicator */}
                  <div className="bg-white border border-slate-200/60 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-500">Kerapatan Kanopi</span>
                      <span className="font-black text-emerald-700 font-mono">
                        {selectedStage.stage.canopyDensity > 0 ? `${selectedStage.stage.canopyDensity}%` : 'N/A'}
                      </span>
                    </div>
                    
                    {selectedStage.stage.canopyDensity > 0 ? (
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${selectedStage.stage.canopyDensity}%` }}></div>
                      </div>
                    ) : (
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex items-center justify-center">
                        <span className="text-[9px] text-slate-400 font-bold">Dalam Persiapan</span>
                      </div>
                    )}
                    <p className="text-[9px] text-slate-450 leading-normal">
                      Persentase tutupan kanopi vegetasi di zona koordinat proyek.
                    </p>
                  </div>

                  {/* Statistik Pohon Tahap Ini */}
                  <div className="bg-white border border-slate-200/60 p-4 rounded-2xl space-y-2 text-left">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">STATISTIK POHON TAHAP INI</span>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-500">Pohon Ditanam</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {selectedStage.stage.plantedTrees ? selectedStage.stage.plantedTrees.toLocaleString('id-ID') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
                      <span className="font-semibold text-slate-500">Sisa Belum Ditanam</span>
                      <span className="font-bold text-rose-600 font-mono">
                        {selectedStage.stage.remainingTrees ? selectedStage.stage.remainingTrees.toLocaleString('id-ID') : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Remote Sensing dMRV Metrics */}
                  <div className="space-y-2.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">METRIK DETEKSI UDARA (dMRV)</span>
                    
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-white border border-slate-200/50 p-2.5 rounded-xl">
                        <span className="text-[8px] text-slate-400 font-semibold block">Tinggi Kanopi</span>
                        <span className="font-mono font-black text-slate-800 mt-0.5 block">
                          {selectedStage.stage.year <= selectedStage.project.currentYear ? `${selectedStage.project.canopyHeight.toFixed(2)}m` : 'N/A'}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200/50 p-2.5 rounded-xl">
                        <span className="text-[8px] text-slate-400 font-semibold block">Resolusi Drone</span>
                        <span className="font-mono font-black text-slate-800 mt-0.5 block">{selectedStage.stage.gsd} cm/px</span>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Smart Contract Payouts */}
                  <div className="space-y-2.5 pt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">AUDIT BLOCKCHAIN & INSENTIF WARGA</span>
                    
                    <div className="bg-white border border-slate-200/60 p-3.5 rounded-2xl space-y-3 font-sans">
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none">Kelompok Tani Penerima</span>
                        <span className="font-extrabold text-slate-700 text-xs mt-1 block leading-tight">{selectedStage.stage.kthName}</span>
                      </div>
                      
                      <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none">Insentif Terbayar</span>
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
                        <span className="text-[8px] text-slate-400 font-bold uppercase block leading-none">Sertifikasi SPE-GRK</span>
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

                </div>

                <div className="text-[9px] text-slate-400 leading-normal border-t border-slate-200 pt-3 text-left">
                  Data dMRV ini divalidasi silang secara on-chain pada ledger terdistribusi Hyperledger Besu RekaKarbon.
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 2. OFFICIAL AUDIT REPORT DOCUMENT MODAL */}
      {isReportModalOpen && activeProj && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col relative animate-fade-in text-left">
            
            {/* Modal Header */}
            <div className="h-14 bg-slate-900 text-white px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00C48C]" />
                <span className="text-xs font-black tracking-wide uppercase">
                  RAPOR DOKUMEN AUDIT SERTIFIKASI — {activeProj.name}
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
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-xs font-sans">
              
              {/* Document Letterhead */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-md font-black text-slate-900 leading-none">REKAKARBON AUDIT CERTIFICATE</h2>
                  <p className="text-[9px] text-slate-400 font-semibold mt-1">Platform E-Government Transparansi Karbon Indonesia</p>
                </div>
                <div className="text-right font-mono text-[9px] text-slate-500">
                  <p className="font-bold text-slate-800">REF: RKR-AUDIT-2025-07</p>
                  <p>Tanggal: 14 Juli 2025</p>
                </div>
              </div>

              {/* Section 1: Overview */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">RINGKASAN PROYEK KONSERVASI</span>
                <div className="grid grid-cols-2 gap-3 font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[9px] block font-normal">Nama Kawasan Hutan</span>
                    <span className="text-xs font-black text-slate-900">{activeProj.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block font-normal">Provinsi / Wilayah</span>
                    <span className="text-xs font-black text-slate-900">{activeProj.region}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block font-normal">Luas Terverifikasi GIS</span>
                    <span className="text-xs font-black text-slate-900">{activeProj.area}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[9px] block font-normal">Total Cadangan CO2</span>
                    <span className="text-xs font-black text-slate-900">{activeProj.carbon}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: dMRV Remote Sensing Verification */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">HASIL AUDIT dMRV (SATELIT & DRONE UAV)</span>
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
                      <tr>
                        <td className="p-2.5">Vegetation Health (NDVI)</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">{activeProj.ndvi.toFixed(2)}</td>
                        <td className="p-2.5"><span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">Sangat Sehat</span></td>
                      </tr>
                      <tr>
                        <td className="p-2.5">Enhanced Vegetation Index (EVI)</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">{activeProj.evi.toFixed(2)}</td>
                        <td className="p-2.5"><span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">Optimal</span></td>
                      </tr>
                      <tr>
                        <td className="p-2.5">Tingkat Kelangsungan Hidup Pohon</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">{(activeProj.survivalRate * 100).toFixed(1)}%</td>
                        <td className="p-2.5"><span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">{activeProj.reforestationStatus}</span></td>
                      </tr>
                      <tr>
                        <td className="p-2.5">Tinggi Kanopi Model (CHM)</td>
                        <td className="p-2.5 font-mono font-bold text-slate-800">{activeProj.canopyHeight.toFixed(2)} m</td>
                        <td className="p-2.5"><span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[8px]">Memenuhi (≥1.5m)</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Smart Contract & Finance Audit */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">TRANSPARANSI DANA BLOCKCHAIN (SMART CONTRACT)</span>
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Total Anggaran Proyek:</span>
                    <span className="font-bold text-slate-900">Rp {activeProj.totalBudget.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Dana Terpakai untuk Restorasi (62%):</span>
                    <span className="font-bold text-emerald-700">Rp {(activeProj.totalBudget * 0.62).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Buffer Pool Darurat (8%):</span>
                    <span className="font-bold text-slate-700">Rp {(activeProj.totalBudget * 0.08).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 text-slate-850">
                    <span className="text-slate-600 font-sans font-bold">Mitra Pelaksana Lapangan:</span>
                    <span className="font-bold font-sans text-xs">{activeProj.reforestationPartner}</span>
                  </div>
                </div>
              </div>

              {/* Verification Stamp Footer */}
              <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[9px] text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-slate-800">STATUS VERIFIKASI SAKSI DIGITAL</p>
                    <p>Verified on Hyperledger Besu Ledger ID: 0x9f8...3b2a</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-700">Audit Kementerian LHK & Dinas Kehutanan</p>
                  <p className="text-[9px] text-emerald-700 font-bold">Sertifikat SPE-GRK Terbit & Sah</p>
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
                  BUKTI ALIRAN DANA BLOCKCHAIN: {selectedTx.tx.txHash ? `${selectedTx.tx.txHash.substring(0, 10)}...${selectedTx.tx.txHash.substring(selectedTx.tx.txHash.length - 6)}` : `0x${selectedTx.index}f8d2...`}
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
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">NILAI PENCAIRAN TERVERIFIKASI</span>
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
                  <p className="font-mono text-[9px] text-[#00C48C]">Besu Block {selectedTx.tx.blockNumber || '#184920'}</p>
                </div>
              </div>

              {/* Vendor & Description Detail */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Penerima Dana / Vendor</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">{selectedTx.tx.vendor || 'Kelompok Tani Hutan (KTH)'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Kawasan Proyek</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">{selectedTx.project.name} ({selectedTx.project.region})</span>
                  </div>
                </div>
                <div className="border-t border-slate-200/50 pt-2 mt-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Deskripsi Transaksi</span>
                  <p className="text-slate-700 font-medium mt-0.5">{selectedTx.tx.desc}</p>
                </div>
              </div>

              {/* Itemized Invoice Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">RINCIAN BARANG & RINCIAN FAKTUR</span>
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
                        selectedTx.tx.items.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-800">{item.name}</td>
                            <td className="p-2.5 text-center font-mono font-semibold text-slate-605">{item.qty}</td>
                            <td className="p-2.5 text-right font-mono text-slate-600">Rp {item.price.toLocaleString('id-ID')}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-800">Rp {item.total.toLocaleString('id-ID')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-800">{selectedTx.tx.desc}</td>
                          <td className="p-2.5 text-center font-mono font-semibold text-slate-605">1 Paket</td>
                          <td className="p-2.5 text-right font-mono text-slate-600">Rp {selectedTx.tx.amount.toLocaleString('id-ID')}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-800">Rp {selectedTx.tx.amount.toLocaleString('id-ID')}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan="3" className="p-2.5 text-right uppercase text-[9px] text-slate-500">Total Transaksi:</td>
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
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">GALERI BUKTI FISIK LAPANGAN & NOTA</span>
                    <span className="text-[9px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                      {selectedTx.tx.proofImages.length} Foto Terverifikasi On-Chain
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {selectedTx.tx.proofImages.map((imgUrl, i) => (
                      <div 
                        key={i} 
                        onClick={() => setLightboxImage(imgUrl)}
                        className="relative h-28 rounded-xl overflow-hidden border border-slate-200 shadow-xs group cursor-pointer"
                      >
                        <img src={imgUrl} alt={`Bukti ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                          <Eye className="w-3.5 h-3.5" /> Perbesar
                        </div>
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-mono">Bukti #{i+1}</span>
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
            <img src={lightboxImage} alt="Bukti High-Res" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain border border-white/20" />
            <button 
              onClick={() => setLightboxImage(null)}
              className="mt-4 bg-white/20 hover:bg-white/30 text-white px-5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
            >
              ✕ Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </>
  );
}
