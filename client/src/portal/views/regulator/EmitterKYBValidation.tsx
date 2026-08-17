import { useCarbonStore } from '../../../store/useCarbonStore';
import { FileCheck2, Fingerprint } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function EmitterKYBValidation() {
  const { kybQueue } = useCarbonStore();

  const handleWebAuthnTrigger = (companyName: string) => {
    alert(
      `Mengirimkan pemicu kunci keamanan biometrik (WebAuthn Passwordless Key) ke perangkat administrator ${companyName}!`
    );
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Halaman Kurasi & Validasi Registrasi Emitter (KYB)
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Peninjauan dokumen legalitas lingkungan (AMDAL, NIB) dan pemicu pembuatan kunci biometrik
          WebAuthn perusahan.
        </p>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-2xs">
        <CardHeader className="pb-4">
          <CardTitle className="font-black text-sm text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#00C48C]" />
            Antrean Registrasi Industri Baru (KYB Validation)
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {kybQueue.map((item: any) => (
            <Card
              key={item.id}
              className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-row justify-between items-center text-xs shadow-none"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900">{item.id}</span>
                  <h5 className="font-extrabold text-slate-900">{item.companyName}</h5>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">
                  NIB: {item.nib} · Diajukan: {item.dateSubmitted}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100 text-[10px] font-bold px-3 py-1 rounded-full border-none">
                  AMDAL: {item.documentStatus}
                </Badge>

                <Button
                  size="sm"
                  onClick={() => handleWebAuthnTrigger(item.companyName)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 border border-slate-800"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-[#00C48C]" />
                  Pemicu Biometrik WebAuthn
                </Button>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
