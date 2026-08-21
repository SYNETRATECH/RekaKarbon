import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqItems = [
  {
    q: 'Bagaimana RekaKarbon mencegah penipuan kredit karbon ganda (double counting)?',
    a: 'Setiap kredit karbon dicetak dalam bentuk token ERC-1155 yang terikat secara unik dengan koordinat poligon GIS spasial dan hash metadata audit yang tidak dapat diduplikasi di jaringan Verichain.',
  },
  {
    q: 'Apakah emiten bisa memborong kredit karbon untuk menaikkan harga pasar?',
    a: 'Tidak. Protokol bursa RekaKarbon dilengkapi sistem Cap Control yang membatasi volume pembelian maksimal sesuai nilai defisit emisi aktual yang tercatat di sistem pemantauan CEMS.',
  },
  {
    q: 'Apa yang terjadi jika kawasan hutan proyek konservasi mengalami kebakaran?',
    a: 'Sistem akan memicu Emergency Asset Freeze untuk token terkait. Pemilik token dapat menukarkan token beku tersebut secara langsung dengan token cadangan dari Global Reserve Pool 5% melalui fungsi Insurance Swap.',
  },
  {
    q: 'Bagaimana pembagian hasil penjualan sampai ke petani hutan?',
    a: 'Transaksi penjualan di bursa langsung mengalokasikan saldo pendapatan ke dompet digital KTH yang terdaftar dan dapat dicairkan secara akuntabel ke rekening BUMDes setempat.',
  },
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-24 bg-surface-alt">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-500 mb-5 shadow-sm">
            ❓ FAQ
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
        </div>
        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <button
                className="w-full flex items-start justify-between gap-4 p-5 text-left cursor-pointer"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className="text-sm font-semibold text-slate-800 leading-snug">{item.q}</span>
                {openIdx === i ? (
                  <ChevronUp size={16} className="text-slate-400 shrink-0 mt-0.5" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400 shrink-0 mt-0.5" />
                )}
              </button>
              {openIdx === i && (
                <div className="px-5 pb-5 pt-1 text-sm text-slate-500 leading-relaxed border-t border-slate-100">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
