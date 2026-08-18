import { useState } from 'react';
import { Send, CheckCircle2, ShieldCheck, Map as MapIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function QuotaSpatialMonitoring() {
  const [selectedEmitter, setSelectedEmitter] = useState('PT Semen Nusantara Tuban');
  const [issueQuotaAmount, setIssueQuotaAmount] = useState(12500);
  const [isIssued, setIsIssued] = useState(false);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Halaman Alokasi Kuota & Monitoring Nasional
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Otoritas Regulator KLHK & Kemenkeu untuk penerbitan kuota PTBAE-PU dan pemantauan
          kepatuhan emisi nasional secara geografis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fitur 1: Issue Quota PTBAE-PU Form Card */}
        <Card className="rounded-3xl border-slate-200 shadow-2xs space-y-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-slate-900 font-black text-base">
              <Send className="w-5 h-5 text-[#00C48C]" />
              Penerbitan Kuota Emisi (Issue Quota PTBAE-PU)
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Pilih Industri Terdaftar:</label>
                <Select value={selectedEmitter} onValueChange={setSelectedEmitter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Industri Terdaftar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PT Semen Nusantara Tuban">
                      PT Semen Nusantara Tuban (Semen & Industri)
                    </SelectItem>
                    <SelectItem value="PLTU Suralaya Unit 1-8">
                      PLTU Suralaya Unit 1-8 (Energi Listrik)
                    </SelectItem>
                    <SelectItem value="PT Bio Kertas Karawang">
                      PT Bio Kertas Karawang (Kertas & Pulp)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Alokasi Token PTBAE-PU (tCO2e / Tahun FY 2025):
                </label>
                <Input
                  type="number"
                  value={issueQuotaAmount}
                  onChange={(e) => setIssueQuotaAmount(Number(e.target.value))}
                  className="p-2.5 rounded-xl border-slate-200 font-mono font-black text-slate-900 text-xs focus:ring-emerald-600/20"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10.5px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pencetakan On-Chain:</span>
                  <span className="font-bold text-slate-900">
                    mintPTBAEToken({issueQuotaAmount})
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Otoritas Penandatangan:</span>
                  <span className="font-bold text-emerald-700">KLHK & DJP Master Private Key</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                setIsIssued(true);
                setTimeout(() => setIsIssued(false), 4000);
              }}
              className="w-full bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 text-[#00C48C]" />
              Terbitkan & Transfer Kuota PTBAE-PU
            </Button>

            {isIssued && (
              <div className="bg-emerald-50 border border-slate-200 text-emerald-900 text-xs font-bold p-3 rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />
                Kuota PTBAE-PU sebanyak {issueQuotaAmount.toLocaleString('id-ID')} tCO2e berhasil
                diterbitkan ke {selectedEmitter}!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fitur 2: Peta Pengawasan Spasial Nasional Summary Card */}
        <Card className="rounded-3xl border-slate-200 shadow-2xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-slate-900 font-black text-base">
              <MapIcon className="w-5 h-5 text-emerald-600" />
              Peta Pengawasan Spasial Nasional
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 flex flex-col justify-between flex-1">
            <div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Integrasi Spasial GIS NusaCarbon API memetakan titik koordinat geografis cerobong
                industri nasional dan status batas kuota secara real-time.
              </p>

              <div className="my-4 space-y-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between">
                  <span className="text-slate-500 font-semibold">Total Industri Terdaftar:</span>
                  <span className="font-black text-slate-900">7 Perusahaan</span>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-slate-200 flex justify-between text-rose-800">
                  <span className="font-bold">Industri Tertunggak (Tidak Patuh):</span>
                  <span className="font-mono font-black">2 Industri</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 p-3 rounded-xl border border-slate-200 text-[10px] text-emerald-900 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
              Terhubung ke Satellite & Sensors CEMS Live GIS Stream
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
