import { X, Check } from 'lucide-react';

export default function ProblemSolutionSection() {
  const rows = [
    {
      problem:
        'Audit Manual Berbulan-bulan: Verifikasi lapangan lambat, mahal, dan rawan manipulasi sampel.',
      solution:
        'Otomatisasi dMRV Multi-Modal: Analisis indeks NDVI satelit + Ortofoto LiDAR drone dalam hitungan menit.',
    },
    {
      problem:
        'Risiko Greenwashing & Double Counting: Data emisi dilaporkan sepihak tanpa verifikasi independen.',
      solution:
        'Audit Silang AI: Korelasi otomatis antara sensor emisi cerobong (CEMS) dengan beban daya listrik gardu PLN.',
    },
    {
      problem:
        'Risiko Reversal Hutan Terbakar: Jika hutan terbakar, kredit karbon yang dibeli pembeli hangus dan tidak sah.',
      solution:
        'Smart Contract Global Reserve 5%: Dana cadangan asuransi otomatis yang menjamin penggantian kredit jika terjadi bencana.',
    },
    {
      problem:
        'Ketimpangan Petani Lokal: Mayoritas keuntungan terserap oleh broker/perantara perizinan.',
      solution:
        'Direct-to-Community Wallet: Pembagian hasil penjualan langsung ke kas KTH & BUMDes secara on-chain.',
    },
  ];

  return (
    <section id="solusi" className="py-24 bg-surface-alt">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-500 mb-5 shadow-sm">
            ⚖️ Masalah vs Solusi
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            Mengapa RekaKarbon?
          </h2>
          <p className="text-slate-500 mt-3 text-sm max-w-xl mx-auto">
            Perbedaan kontras antara pasar karbon tradisional dengan inovasi RekaKarbon.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-error">
            <span className="w-6 h-6 bg-error-container rounded-full flex items-center justify-center text-xs text-error">
              <X size={14} strokeWidth={3} />
            </span>
            Tantangan Pasar Konvensional
          </div>
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-primary">
            <span className="w-6 h-6 bg-surface-container-highest rounded-full flex items-center justify-center text-xs text-primary">
              <Check size={14} strokeWidth={3} />
            </span>
            Terobosan Solusi RekaKarbon
          </div>
        </div>

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="p-5 border-r border-slate-100 bg-error-container/30">
                <p className="text-sm text-slate-600 leading-relaxed">{row.problem}</p>
              </div>
              <div className="p-5 bg-surface-container-low/50">
                <p className="text-sm text-primary font-medium leading-relaxed">{row.solution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
