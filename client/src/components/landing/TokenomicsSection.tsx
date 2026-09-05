export default function TokenomicsSection() {
  const tokens = [
    {
      id: 'Token ID 1',
      name: 'PTBAE-PU',
      sub: 'Batas Atas Emisi',
      desc: 'Kuota legal dari pemerintah sebagai plafon toleransi emisi industri per tahun.',
      tag: 'Regulasi Pemerintah',
      color: 'var(--color-primary-container)',
    },
    {
      id: 'Token ID ≥ 2',
      name: 'SPE-GRK',
      sub: 'Sertifikat Pengurangan Emisi',
      desc: 'Kredit karbon terverifikasi proyek KTH. 1 Token = 1 tCO2e yang telah diaudit dMRV secara penuh.',
      tag: '1 Token = 1 tCO2e',
      color: 'var(--color-primary)',
    },
    {
      id: 'Token ID 0',
      name: 'GLOBAL_RESERVE',
      sub: 'Inovasi Asuransi 5%',
      desc: 'Setiap 1.000 SPE-GRK dicetak → 950 unit ke pengelola hutan, 50 unit (5%) otomatis ke Global Reserve Pool. Jika hutan terbakar, token dapat ditukar 1:1 melalui Insurance Swap.',
      tag: 'Insurance Swap',
      color: 'var(--color-warning)',
    },
  ];

  return (
    <section id="tokenomik" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            Token Cerdas dengan Mekanisme
            <br />
            Asuransi Permanen.
          </h2>
          <p className="text-slate-500 mt-3 text-sm max-w-xl mx-auto leading-relaxed">
            Arsitektur token ERC-1155 multi-aset untuk pencatatan kuota emisi resmi, sertifikat
            pengurangan emisi terverifikasi, dan alokasi dana cadangan asuransi.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-6">
          {tokens.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col overflow-hidden"
            >
              <div className="h-2" style={{ backgroundColor: t.color }} />
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {t.id}
                  </span>
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${t.color} 15%, transparent)`,
                      color: t.color,
                    }}
                  >
                    {t.tag}
                  </span>
                </div>
                <div className="text-xl font-extrabold text-slate-900 mb-0.5">{t.name}</div>
                <div className="text-xs text-slate-400 mb-3">{t.sub}</div>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Burning Chamber */}
        <div className="rounded-2xl overflow-hidden shadow-sm bg-slate-900">
          <div className="p-8">
            <div className="text-[10px] font-mono tracking-widest text-slate-400 mb-3">
              🛒 BURSA KARBON &amp; PROTOKOL BURNING CHAMBER
            </div>
            <div className="grid lg:grid-cols-2 gap-6 items-start">
              <div>
                <h3 className="text-2xl font-extrabold text-white mb-2">
                  Bursa Karbon Anti-Spekulasi (Cap Control)
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Pasar fraksional yang membatasi pembelian emiten hanya sebesar jumlah defisit
                  emisi aktif mereka. Spekulan tidak dapat memborong pasokan kredit masyarakat.
                </p>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Konversi Fraksi', val: '10 Fraksi Token = 1.0 tCO2e Emisi Tertutupi' },
                  { label: 'Sertifikat', val: 'TxHash On-Chain + QR-Code verifikasi (A4)' },
                  { label: 'Mekanisme Bakar', val: 'Irreversible Burn-to-Retire' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-slate-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <span className="text-[10px] text-slate-400 shrink-0">{s.label}</span>
                    <span className="text-[10px] font-mono text-primary-container font-bold text-right">
                      {s.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
