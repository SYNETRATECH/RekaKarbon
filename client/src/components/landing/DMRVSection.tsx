export default function DMRVSection() {
  const layers = [
    {
      num: '01',
      emoji: '🛰️',
      title: 'Citra Satelit Multi-Spektral (Makro)',
      desc: 'Pemantauan makro berkala menggunakan sensor optik satelit untuk mengukur indeks biomassa NDVI, kadar klorofil daun, dan kelembapan tutupan kanopi secara historis.',
      tech: 'NusaCarbon API / Sentinel-2',
      color: 'var(--color-primary-container)',
    },
    {
      num: '02',
      emoji: '🚁',
      title: 'Drone Ortofoto & LiDAR Sub-Sentimeter (Mikro)',
      desc: 'Pengambilan data elevasi digital (DEM/DSM) beresolusi tinggi untuk menghitung kerapatan individu pohon dan struktur volume tegakan kayu per meter persegi.',
      tech: 'AI Tree Crown Detection',
      color: '#7c3aed',
    },
    {
      num: '03',
      emoji: '🤖',
      title: 'AI Anomaly Cross-Correlation (Integritas Cerobong)',
      desc: 'Model pembelajaran mesin yang membandingkan log sensor CEMS dengan konsumsi energi listrik gardu PLN guna memastikan korporasi tidak mematikan sensor cerobong saat beban produksi puncak.',
      tech: 'CEMS × PLN Gardu Correlation',
      color: 'var(--color-warning)',
    },
  ];

  return (
    <section id="dmrv" className="py-24 bg-surface-alt">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            Triple-Check dMRV Framework:
            <br />
            Verifikasi Tanpa Kompromi.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {layers.map((l) => (
            <div
              key={l.num}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="text-3xl">{l.emoji}</div>
                <div>
                  <div className="text-[9px] font-mono tracking-widest text-slate-400">LAPISAN</div>
                  <div className="text-sm font-mono font-bold" style={{ color: l.color }}>
                    {l.num}
                  </div>
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{l.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed flex-1 mb-4">{l.desc}</p>
              <div
                className="px-3 py-2 rounded-lg text-xs font-mono font-semibold"
                style={{
                  backgroundColor: `color-mix(in srgb, ${l.color} 15%, transparent)`,
                  color: l.color,
                }}
              >
                {l.tech}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
