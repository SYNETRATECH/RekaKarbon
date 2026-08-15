import { useCarbonStore } from '../../../store/useCarbonStore';
import { ShieldCheck, FileCheck2, Fingerprint, CheckCircle2 } from 'lucide-react';

export default function EmitterKYBValidation() {
  const { kybQueue } = useCarbonStore();

  const handleWebAuthnTrigger = (companyName) => {
    alert(`Mengirimkan pemicu kunci keamanan biometrik (WebAuthn Passwordless Key) ke perangkat administrator ${companyName}!`);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Halaman Kurasi & Validasi Registrasi Emitter (KYB)</h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">Peninjauan dokumen legalitas lingkungan (AMDAL, NIB) dan pemicu pembuatan kunci biometrik WebAuthn perusahan.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-[#00C48C]" />
          Antrean Registrasi Industri Baru (KYB Validation)
        </h3>

        <div className="space-y-3">
          {kybQueue.map((item) => (
            <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900">{item.id}</span>
                  <h5 className="font-extrabold text-slate-900">{item.companyName}</h5>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">NIB: {item.nib} · Diajukan: {item.dateSubmitted}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-3 py-1 rounded-full">
                  AMDAL: {item.documentStatus}
                </span>

                <button 
                  onClick={() => handleWebAuthnTrigger(item.companyName)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 border border-slate-800"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-[#00C48C]" />
                  Pemicu Biometrik WebAuthn
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
