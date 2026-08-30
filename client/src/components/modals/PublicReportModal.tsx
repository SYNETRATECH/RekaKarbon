import { FileText, Printer, FileSpreadsheet, Download, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatArea, formatCarbon, formatScale } from '@/lib/formatters';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import type { Project, Company } from '../../types';

interface PublicReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  companies: Company[];
}

export default function PublicReportModal({
  isOpen,
  onClose,
  projects,
  companies,
}: PublicReportModalProps) {
  const totalCarbonStock = projects.reduce(
    (acc, p) => acc + (p.rawCarbonVal || (typeof p.carbon === 'number' ? p.carbon : 0)),
    0
  );
  const totalDeficit = companies.reduce(
    (acc, c) => acc + (typeof c.carbonDeficit === 'number' ? c.carbonDeficit : 0),
    0
  );
  const handleDownloadCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent +=
      'Kategori,Nama Entitas/Proyek,Wilayah/Sektor,Volume/Kapasitas,Stok/Defisit,Status,Detail Penebus/Partner,TxHash/Sertifikat\n';

    projects.forEach((p) => {
      const buyers = p.tokenBuyers
        ? p.tokenBuyers.map((b) => `${b.companyName} (${b.tCO2e} tCO₂e)`).join('; ')
        : 'Belum ada';
      csvContent += `Proyek Kehutanan,"${p.name}","${p.region}","${formatArea(p.rawAreaVal || p.area)}","${formatCarbon(p.rawCarbonVal || p.carbon)}","${p.reforestationStatus}","${buyers}","${p.tokenBuyers?.[0]?.speCertificateId || '-'}"\n`;
    });

    companies.forEach((c) => {
      csvContent += `Industri Emisi,"${c.name}","${c.sector}","Emisi ${c.actualEmission} tCO₂e","Defisit ${c.carbonDeficit} tCO₂e","${c.complianceRating}","Partner: ${c.recommendedPartner}","Deadline: ${c.paymentDeadline}"\n`;
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 max-w-4xl overflow-hidden border-slate-200 bg-white shadow-2xl gap-0">
        <DialogTitle className="sr-only">Pratinjau Laporan Transparansi Publik</DialogTitle>
        <div className="flex flex-col max-h-[92vh]">
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
            <div className="flex items-center gap-2 pr-6">
              <Button
                size="sm"
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 h-8"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak / PDF
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadCSV}
                className="bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border-slate-700 h-8"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                CSV Data
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadJSON}
                className="bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border-slate-700 h-8"
              >
                <Download className="w-3.5 h-3.5" />
                JSON
              </Button>
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
                  <span className="text-sm font-black text-emerald-800">
                    {formatScale(totalCarbonStock, 'tCO₂e')}
                  </span>
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
                  <span className="text-sm font-black text-rose-600">
                    {formatScale(totalDeficit, 'tCO₂e')}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Proyek Kehutanan & Detail Pembeli Token */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                2. Transparansi Proyek Kehutanan & Pembeli Token Karbon
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">No.</TableHead>
                    <TableHead>Nama Kawasan Hutan</TableHead>
                    <TableHead>Wilayah</TableHead>
                    <TableHead>Luas Area</TableHead>
                    <TableHead>Stok Karbon</TableHead>
                    <TableHead>Kelangsungan Hidup</TableHead>
                    <TableHead>Daftar Penebus / Pembeli Token</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p, index) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-center font-mono font-bold text-slate-500 text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-extrabold text-slate-900">{p.name}</TableCell>
                      <TableCell className="text-slate-500">{p.region}</TableCell>
                      <TableCell className="font-mono">
                        {formatArea(p.rawAreaVal || p.area)}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-emerald-800">
                        {formatCarbon(p.rawCarbonVal || p.carbon)}
                      </TableCell>
                      <TableCell>
                        <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold text-[9px]">
                          {(p.survivalRate * 100).toFixed(1)}% ({p.reforestationStatus})
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.tokenBuyers && p.tokenBuyers.length > 0 ? (
                          <div className="space-y-1">
                            {p.tokenBuyers.map((tb) => (
                              <div key={tb.id} className="font-mono text-[9px] text-slate-800">
                                <span className="font-bold text-slate-900">{tb.companyName}</span> (
                                {tb.tCO2e.toLocaleString('id-ID')} tCO₂e)
                                <span className="text-slate-400 block text-[8px]">
                                  SPE: {tb.speCertificateId}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum ada transaksi</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Section 3: Monitoring Emisi Industri */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                3. Status Kepatuhan Industri & Defisit Karbon Korporat
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Perusahaan / Industri</TableHead>
                    <TableHead>Sektor</TableHead>
                    <TableHead>Emisi Aktual</TableHead>
                    <TableHead>Batas Kuota</TableHead>
                    <TableHead>Defisit Karbon</TableHead>
                    <TableHead>Estimasi Denda UU HPP</TableHead>
                    <TableHead>Status Kepatuhan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-extrabold text-slate-900">{c.name}</TableCell>
                      <TableCell className="text-slate-500">{c.sector}</TableCell>
                      <TableCell className="font-mono text-slate-800">
                        {c.actualEmission.toLocaleString('id-ID')} t
                      </TableCell>
                      <TableCell className="font-mono text-slate-500">
                        {c.emissionCap.toLocaleString('id-ID')} t
                      </TableCell>
                      <TableCell className="font-mono font-bold text-rose-600">
                        +{c.carbonDeficit.toLocaleString('id-ID')} t
                      </TableCell>
                      <TableCell className="font-mono font-bold text-slate-900">
                        Rp {c.offsetCostIDR.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded font-extrabold text-[9px] ${
                            c.carbonDeficit > 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {c.carbonDeficit > 0 ? 'Defisit Kuota' : 'Patuh / Surplus'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                <p className="text-slate-400">Kementerian Lingkungan Hidup dan Kehutanan (KLHK)</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
