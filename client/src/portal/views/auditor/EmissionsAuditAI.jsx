import { useCarbonStore } from '../../../store/useCarbonStore';
import { Activity, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function EmissionsAuditAI() {
  const { aiAnomalyLogs } = useCarbonStore();

  const handleVerify = (companyName) => {
    alert(`Status Laporan Emisi ${companyName} diubah menjadi 'Verified' pada Smart Contract Verichain!`);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Halaman Verifikasi Laporan Emisi (Emissions Audit)</h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">Saringan AI algoritma Isolation Forest untuk mendeteksi indikasi greenwashing serta persetujuan status audit on-chain.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00C48C]" />
          Saringan AI Deteksi Anomali (Isolation Forest Model)
        </h3>

        <div className="space-y-3">
          {aiAnomalyLogs.map((log) => (
            <div key={log.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900">{log.id}</span>
                  <h5 className="font-extrabold text-slate-900">{log.company}</h5>
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                    log.riskScore > 50 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    Risk Score: {log.riskScore}/100
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 font-medium">{log.desc}</p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleVerify(log.company)}
                  className="bg-primary-gradient text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl shadow-xs cursor-pointer active:scale-95 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C]" />
                  Setujui Status Audit (Verified)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
