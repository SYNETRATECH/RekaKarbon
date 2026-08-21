import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 pt-14 pb-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Leaf size={17} className="text-primary-container" />
              <div>
                <div className="text-white font-bold text-sm">RekaKarbon</div>
                <div className="text-[9px] text-slate-500 font-mono">Verichain Platform</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Platform dMRV &amp; Kepatuhan Karbon Terpadu Indonesia. Menjaga integritas iklim
              melalui teknologi terdesentralisasi dan keadilan sosial.
            </p>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 tracking-widest mb-4 uppercase">
              Ekosistem
            </div>
            <ul className="space-y-2.5">
              {[
                'Portal Transparansi',
                'Bursa Karbon',
                'Brankas Offset',
                'Audit AI dMRV',
                'Dompet KTH',
              ].map((l) => (
                <li
                  key={l}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 tracking-widest mb-4 uppercase">
              Regulasi
            </div>
            <ul className="space-y-2.5">
              {[
                'UU HPP No. 7/2021',
                'Perpres 98/2021',
                'Panduan Metodologi dMRV',
                'Standar ISO 14064',
              ].map((l) => (
                <li
                  key={l}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-slate-500 tracking-widest mb-4 uppercase">
              Keamanan &amp; Node
            </div>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                Mainnet Besu Node Active
              </span>
            </div>
            <ul className="space-y-2">
              {[
                'Zero-Gas Network',
                'SHA-256 Verichain Signer',
                'Chain ID 1337',
                'Permissioned EVM',
              ].map((l) => (
                <li key={l} className="text-xs text-slate-400">
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          © 2026 RekaKarbon Platform. Hak Cipta Dilindungi Undang-Undang. Verichain dMRV Protocol.
        </div>
      </div>
    </footer>
  );
}
