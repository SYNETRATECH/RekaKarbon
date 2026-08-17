import { useState } from 'react';
import { useCarbonStore } from '../../../store/useCarbonStore';
import { ShieldCheck, Cpu, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';

export default function AuthorizationGate() {
  const { certificationPreview, conservationAreas, authorizeMintOffsetCredit } = useCarbonStore();

  const preview = certificationPreview;
  const projectList = conservationAreas || [];

  const [selectedProjectName, setSelectedProjectName] = useState(preview?.project ?? '');
  const [currentProjectData, setCurrentProjectData] = useState(
    projectList.find((p: any) => p.name === preview?.project) || projectList[0] || null
  );
  const [auditDate, setAuditDate] = useState(preview?.auditDate ?? '');
  const [verifierName, setVerifierName] = useState(preview?.verifier ?? '');
  const [confidenceScore] = useState(preview?.confidenceScore ?? 90);
  const [auditNotes, setAuditNotes] = useState(
    'Kawasan konservasi telah melalui pemindaian satelit Sentinel-2 dMRV dan ground-truth fotogrametri drone CHM. Seluruh parameter kerapatan biomasa dan kanopi vegetasi lolos ambang batas kelayakan SPE-GRK KLHK.'
  );

  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<{ success: boolean; txHash: string } | null>(null);

  const handleAuthorize = async () => {
    setIsMinting(true);
    const res = await authorizeMintOffsetCredit({
      project: selectedProjectName,
      verifier: verifierName,
      auditDate,
      confidenceScore,
      notes: auditNotes,
    });
    setIsMinting(false);
    setMintResult(res);
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-0 space-y-6 animate-fade-in text-left pr-1 pb-8">
      {/* Toast / Modal Result Notification */}
      {mintResult && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white p-5 rounded-3xl shadow-2xl border border-emerald-500/50 flex items-start gap-4 z-50 animate-bounce max-w-md">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-xs">
            <h5 className="font-black text-sm text-emerald-400">
              Minting SPE-GRK Berhasil Disahkan!
            </h5>
            <p className="text-[11px] text-slate-300">
              Transaksi smart contract telah dikonfirmasi pada Hyperledger Besu ledger.
            </p>
            <p className="font-mono text-[10px] text-emerald-300 pt-1">
              TxHash: {mintResult.txHash}
            </p>
            <button
              onClick={() => setMintResult(null)}
              className="text-[10px] font-bold text-slate-400 hover:text-white underline pt-1 cursor-pointer"
            >
              Tutup Notifikasi
            </button>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div>
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block mb-1">
          LVV — VERIFICATION SETTLEMENT
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Gerbang Otorisasi & Konsensus
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Pengesahan hasil audit dan pemicu minting token SPE-GRK pada ledger Hyperledger Besu
        </p>
      </div>

      {/* TWO-COLUMN MAIN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: FORM HASIL VERIFIKASI (8 of 12 cols) */}
        <Card className="lg:col-span-8 rounded-3xl p-6 border-slate-200 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-100">
            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">
              FORM HASIL VERIFIKASI
            </span>
            <h4 className="text-base font-black text-slate-900 mt-0.5">Ringkasan Laporan Audit</h4>
          </div>

          <div className="space-y-4">
            {/* Row 1: Proyek & Tanggal Audit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  PROYEK KONSERVASI
                </label>
                <Select
                  value={selectedProjectName}
                  onValueChange={(val) => {
                    setSelectedProjectName(val);
                    const found = projectList.find((p: any) => p.name === val);
                    if (found) {
                      setCurrentProjectData(found);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Proyek Konservasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectList.map((p: any) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  TANGGAL AUDIT
                </label>
                <DatePicker value={auditDate} onChange={(newDate) => setAuditDate(newDate)} />
              </div>
            </div>

            {/* Row 2: Nama Verifikator & Skor Kepastian */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  NAMA VERIFIKATOR LEGAL
                </label>
                <Input
                  type="text"
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                  placeholder="Nama Lengkap & Gelar Verifikator"
                  className="w-full px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50/70"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  SKOR KEPASTIAN (CONFIDENCE SCORE)
                </label>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{confidenceScore}%</span>
                  <Badge variant="mint" className="text-[11px]">
                    Sangat Tinggi
                  </Badge>
                </div>
              </div>
            </div>

            {/* Row 3: Catatan Lapangan & Temuan Audit */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                CATATAN LAPANGAN & TEMUAN AUDIT
              </label>
              <Textarea
                rows={4}
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="Tuliskan ringkasan hasil uji kepatuhan metodologi dMRV dan verifikasi on-site..."
              />
            </div>
          </div>

          {/* Hyperledger Besu Info Banner */}
          <Alert variant="mint">
            <Cpu className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <AlertTitle className="text-slate-900">
                Hyperledger Besu — Fungsi MintOffsetCredit
              </AlertTitle>
              <AlertDescription className="text-slate-600">
                Tombol otorisasi di bawah akan mengubah status proyek menjadi{' '}
                <span className="font-bold text-emerald-800">ACTIVE/Verified</span> secara permanen
                (immutable) dan memicu pencetakan token kompensasi SPE-GRK ke bursa karbon.
              </AlertDescription>
            </div>
          </Alert>
        </Card>

        {/* RIGHT COLUMN: PRATINJAU RINGKASAN SERTIFIKASI (4 of 12 cols) */}
        <Card className="lg:col-span-4 rounded-3xl p-6 border-slate-200 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-100">
            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block">
              PRATINJAU
            </span>
            <h4 className="text-base font-black text-slate-900 mt-0.5">Ringkasan Sertifikasi</h4>
          </div>

          {/* Summary Key-Value List mapped to chosen project */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Proyek</span>
              <span className="font-black text-slate-900 text-right">
                {currentProjectData?.name || selectedProjectName}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Lokasi</span>
              <span className="font-black text-slate-900 text-right">
                {currentProjectData?.location || preview.location}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Luas Area</span>
              <span className="font-black text-slate-900">
                {currentProjectData
                  ? `${currentProjectData.areaHectares.toLocaleString('id-ID')} ha`
                  : preview.areaHectares}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Kredit SPE-GRK</span>
              <span className="font-black text-emerald-700">
                {currentProjectData
                  ? `${currentProjectData.carbonCredit.toLocaleString('id-ID')} tCO2e`
                  : preview.carbonCreditSPE}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400 font-medium">NDVI</span>
              <span className="font-mono font-black text-slate-900">
                {currentProjectData?.ndvi ?? preview.ndvi}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400 font-medium">EVI</span>
              <span className="font-mono font-black text-slate-900">
                {currentProjectData?.evi ?? preview.evi}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Verifikator</span>
              <span className="font-black text-slate-900 text-right">{verifierName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400 font-medium">Confidence Score</span>
              <span className="font-black text-emerald-600">{confidenceScore}%</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-medium">Tanggal Audit</span>
              <span className="font-mono font-bold text-slate-700">{auditDate}</span>
            </div>
          </div>

          {/* Confidence Score Bar Block */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-extrabold">Tingkat Kepastian</span>
              <span className="font-black text-emerald-700">Sangat Tinggi</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00C48C] rounded-full transition-all duration-500"
                style={{ width: `${confidenceScore}%` }}
              ></div>
            </div>
          </div>

          {/* Big Authorize Button */}
          <Button
            onClick={handleAuthorize}
            disabled={isMinting}
            className="w-full bg-[#033C2E] hover:bg-[#022a20] text-white font-black text-xs py-4 px-6 rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-5 h-5 text-[#00C48C]" />
            {isMinting ? 'Memvalidasi Smart Contract...' : 'Setujui & Sahkan Status Terverifikasi'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
