import { useCarbonStore } from '../../../store/useCarbonStore';
import { Users, Lock, ShieldCheck, CheckCircle2, UserCheck, Key } from 'lucide-react';

export default function InternalGovernance() {
  const { subRole, setSubRole, multiSigRequests } = useCarbonStore();

  const rbacRoles = [
    { key: 'hse_director', label: 'HSE Director', desc: 'Hak akses penuh, Otorisasi Multi-Sig, & Eksekusi Pembakaran Token.' },
    { key: 'compliance_manager', label: 'Compliance Manager', desc: 'Membaca neraca emisi, Mengajukan transaksi DEX, & Laporan audit.' },
    { key: 'op_admin', label: 'Admin Operasional', desc: 'Input data utilitas CEMS & Membuat draft pembelian token.' },
    { key: 'viewer', label: 'Viewer / Auditor Internal', desc: 'Akses membaca (Read-Only) data transparansi.' }
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Halaman Tata Kelola Akun Internal</h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">Pengaturan Matriks Izin Akses Bertingkat (RBAC) & Gerbang Persetujuan Ganda Multi-Signature (Multi-Sig).</p>
      </div>

      {/* RBAC Role Selector Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#00C48C]" />
          Matriks Izin Akses (Role-Based Access Control / RBAC)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {rbacRoles.map((role) => (
            <div 
              key={role.key}
              onClick={() => setSubRole(role.key)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-1.5 ${
                subRole === role.key 
                  ? 'border-slate-800 bg-slate-50 shadow-xs' 
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex justify-between items-center">
                <h5 className="font-extrabold text-xs text-slate-900">{role.label}</h5>
                {subRole === role.key && <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />}
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{role.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Sig Approval Vault */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#00C48C]" />
              Gerbang Persetujuan Multi-Signature (Multi-Sig)
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Mewajibkan persetujuan kriptografis ganda dari HSE Director untuk transaksi berisiko tinggi.</p>
          </div>
          <span className="bg-slate-100 text-slate-800 text-[10px] font-black px-3 py-1 rounded-full border border-slate-200">
            Skema 2 dari 2 Tanda Tangan
          </span>
        </div>

        <div className="space-y-3">
          {multiSigRequests.map((req) => (
            <div key={req.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-900">{req.id}</span>
                  <span className="font-bold text-xs text-slate-700">{req.action}</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Pemohon: {req.requester} · Tanda Tangan: {req.currentSignatures}/{req.requiredSignatures}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${
                  req.status === 'Approved' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                }`}>
                  {req.status}
                </span>

                {req.status === 'Pending' && subRole === 'hse_director' && (
                  <button 
                    onClick={() => alert(`Multi-Sig disetujui secara kriptografis oleh HSE Director!`)}
                    className="bg-primary-gradient text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xs cursor-pointer active:scale-95"
                  >
                    Tanda Tangan (Approve)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
