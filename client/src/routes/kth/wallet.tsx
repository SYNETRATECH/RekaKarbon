import { useState } from 'react';
import { useCarbonStore } from '../../store/useCarbonStore';
import { Wallet, Upload, CheckCircle2, FileImage } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function DigitalWalletHybridLogs() {
  const { kthLogs } = useCarbonStore();
  const [showNotice, setShowNotice] = useState(false);

  const handleUploadLog = () => {
    setShowNotice(true);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Halaman Dompet Digital & Log Hibrida (KTH)
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Penerimaan aliran insentif dana penanaman/pemeliharaan secara otonom dan log bukti fisik
          hibrida (Foto Geotag & Drone).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet Insentif Card */}
        <Card className="bg-slate-900 text-white rounded-3xl p-6 space-y-4 shadow-lg text-left flex flex-col justify-between border-slate-800">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#00C48C]" />
              DOMPET DIGITAL INSENTIF PENANAMAN KTH
            </span>
            <h3 className="text-3xl font-black font-mono text-white">Rp 145.000.000</h3>
            <p className="text-xs text-slate-400 font-medium">
              Aliran Dana Otomatis dari Smart Contract DEX (Pos Restorasi 62% & Pemeliharaan 15%)
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold">Status Insentif:</span>
            <Badge variant="mint" className="text-xs px-3 py-1 border-emerald-500/30">
              Tercairkan Langsung
            </Badge>
          </div>
        </Card>

        {/* Upload Log Hibrida Card */}
        <Card className="rounded-3xl border-slate-200 shadow-2xs space-y-4 text-left">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="font-black text-base text-slate-900 flex items-center gap-2">
              <FileImage className="w-4 h-4 text-[#00C48C]" />
              Log Unggahan Bukti Hibrida
            </CardTitle>
            <Button
              className="bg-primary-gradient text-white text-[10px] font-extrabold px-3 py-1.5 h-auto rounded-xl shadow-xs cursor-pointer active:scale-95 flex items-center gap-1"
              onClick={handleUploadLog}
            >
              <Upload className="w-3.5 h-3.5 text-[#00C48C]" />
              Unggah Foto / Drone
            </Button>
          </CardHeader>

          <CardContent className="space-y-3 text-xs">
            {kthLogs.map((log: any) => (
              <div
                key={log.id}
                className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900">{log.id}</span>
                    <span className="font-extrabold text-slate-900">{log.type}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                    {log.desc} · {log.date}
                  </span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNotice} onOpenChange={setShowNotice}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Log Hibrida Tercatat</span>
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Unggahan foto geotag / scan drone berhasil dicatat ke Log Hibrida Reboisasi!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowNotice(false)}
              className="w-full bg-primary-gradient text-white font-extrabold"
            >
              Tutup & Lanjutkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
