import { useState } from 'react';
import { Flame, ShieldCheck, Download, CheckCircle2, Key, Lock } from 'lucide-react';

export default function BurningChamberVault() {
  const [burnFractions, setBurnFractions] = useState(10);
  const [isBurnSuccess, setIsBurnSuccess] = useState(false);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Halaman Brankas & Offset Karbon (Burning Chamber)</h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">Eksekusi pembakaran token (*token burning*) langsung ke smart contract VeriToken.sol & unduh Soulbound Token (SBT) Kriptografi Pasca-Kuantum (ML-DSA-87).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Wallet & Burning Chamber Interactive Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5 text-left">
          <div className="flex items-center gap-2 text-rose-600">
            <Flame className="w-5 h-5 animate-pulse text-rose-500" />
            <h4 className="font-black text-base text-slate-900">Modul Burning Chamber (VeriToken.sol)</h4>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1 font-mono">
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">SALDO TOKEN BRANKAS</span>
            <h3 className="text-2xl font-black">23.300 <span className="text-xs text-slate-400 font-sans font-bold">Fraksi Token</span></h3>
            <p className="text-[10px] text-slate-400 font-sans font-semibold">Setara 2.330 tCO2e Kredit Karbon SPE-GRK</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 flex justify-between">
              <span>Jumlah Pembakaran Token Fraksional:</span>
              <span className="font-mono text-emerald-700 font-extrabold">{burnFractions} Fraksi</span>
            </label>
            <input 
              type="range" 
              min="10" 
              max="23300" 
              step="10"
              value={burnFractions}
              onChange={(e) => setBurnFractions(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Panggilan Smart Contract:</span>
                <span className="font-bold text-slate-900">burn({burnFractions})</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Pengurangan Defisit Emisi:</span>
                <span className="font-bold text-emerald-600">-{(burnFractions / 10).toFixed(1)} ton CO2e</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              setIsBurnSuccess(true);
              setTimeout(() => setIsBurnSuccess(false), 4000);
            }}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <Flame className="w-4 h-4 text-white" />
            Eksekusi Pembakaran Token ({burnFractions} Fraksi)
          </button>

          {isBurnSuccess && (
            <div className="bg-emerald-50 border border-slate-200 text-emerald-900 text-xs font-bold p-3 rounded-xl flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />
              Fungsi burn() berhasil! SBT Pasca-Kuantum telah dicetak di PQC Vault.
            </div>
          )}
        </div>

        {/* Kubah Sertifikat Pasca-Kuantum (PQC SBT Vault) Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5 text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 mb-4">
              <ShieldCheck className="w-5 h-5 text-[#00C48C]" />
              <h4 className="font-black text-base text-slate-900">Kubah Sertifikat Pasca-Kuantum (PQC SBT Vault)</h4>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
              Soulbound Token (SBT) diterbitkan secara permanen di Verichain Ledger dan dilindungi enkripsi **ML-DSA-87 (Module-Lattice-Based Digital Signature Algorithm)** untuk kebutuhan audit fiskal pasca-kuantum.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block">ALGORITMA KRIPTOGRAFI</span>
                  <span className="font-black text-slate-900">PQC ML-DSA-87 / FIPS 204</span>
                </div>
                <span className="bg-emerald-100 text-emerald-900 text-[9px] font-black px-2.5 py-1 rounded-full">Quantum Safe</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[9px] text-slate-400 font-bold block">SBT CERTIFICATE HASH</span>
                <span className="font-black text-emerald-800 text-[10px] break-all">0xPQC9912a7f82b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => alert("Mengunduh Sertifikat Offsetting SBT PQC Enkripsi ML-DSA-87...")}
            className="w-full bg-primary-gradient hover:opacity-95 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4 text-[#00C48C]" />
            Unduh Sertifikat PQC SBT ML-DSA-87 (PDF/JSON)
          </button>
        </div>

      </div>
    </div>
  );
}
