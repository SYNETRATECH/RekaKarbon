import { useCarbonStore } from '../../../store/useCarbonStore';
import { FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function TaxSystemIntegration() {
  const { djpLogs } = useCarbonStore();

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Halaman Integrasi Sistem Pajak Karbon
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Rekonsiliasi pelaporan denda emisi dengan nomor e-Faktur Pajak resmi DJP (Direktorat
          Jenderal Pajak Kementerian Keuangan).
        </p>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="font-black text-sm text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#00C48C]" />
            Log Sync Rekonsiliasi API e-Faktur DJP
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert('Sinkronisasi ulang data e-Faktur DJP berhasil!')}
            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-slate-200 rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-[#00C48C]" />
            Sync DJP Now
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {djpLogs.map((log) => (
            <Card
              key={log.id}
              className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-row justify-between items-center text-xs shadow-none"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900">{log.id}</span>
                  <h5 className="font-extrabold text-slate-900">{log.company}</h5>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">
                  No. e-Faktur: {log.taxInvoiceNo} · Defisit: {log.deficit} tCO2e
                </span>
              </div>

              <div className="text-right space-y-1">
                <span className="font-mono font-black text-rose-600 block">
                  Rp {log.totalFineIDR.toLocaleString('id-ID')}
                </span>
                <Badge
                  variant={log.status === 'Reconciled' ? 'default' : 'secondary'}
                  className={`text-[9px] font-extrabold px-2.5 py-0.5 ${
                    log.status === 'Reconciled'
                      ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-100'
                      : 'bg-amber-100 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  {log.status}
                </Badge>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
