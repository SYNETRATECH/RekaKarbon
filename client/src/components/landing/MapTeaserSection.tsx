export default function MapTeaserSection() {
  return (
    <section id="transparansi" className="py-24 bg-surface-alt">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-500 mb-5 shadow-sm">
            🗺️ Teaser Peta Transparansi Spasial
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Eksplorasi Transparansi Karbon Terbuka
            <br />
            untuk Seluruh Rakyat Indonesia.
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Melalui portal publik RekaKarbon, siapa pun — mulai dari akademisi, jurnalis lingkungan,
            hingga investor ESG — dapat memantau kondisi kesehatan hutan konservasi secara spasial
            dan meninjau rekam jejak kepatuhan emisi korporasi nasional secara transparan.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: '🌐',
              text: 'Visualisasi poligon batas hutan konservasi interaktif (Esri Satellite Layer)',
            },
            {
              icon: '📊',
              text: 'Tampilan visual gauge NDVI kesehatan vegetasi (0.00 – 1.00) per kawasan',
            },
            { icon: '🔗', text: 'Penelusuran hash transaksi on-chain (Verichain Hash Explorer)' },
          ].map((f) => (
            <div
              key={f.text}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-3"
            >
              <span className="text-2xl shrink-0">{f.icon}</span>
              <span className="text-sm text-slate-600 leading-snug">{f.text}</span>
            </div>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-2xl shadow-xl border border-slate-200 h-72 bg-slate-800">
          <img
            src="https://images.unsplash.com/photo-1646928234724-ddfac30993e6?w=1200&h=500&fit=crop&auto=format&q=80"
            alt="Peta transparansi"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon
              points="15,20 75,10 88,55 55,82 12,65"
              fill="color-mix(in srgb, var(--color-primary-container) 12%, transparent)"
              stroke="var(--color-primary-container)"
              strokeWidth="0.4"
            />
            {[
              { x: 32, y: 55 },
              { x: 52, y: 58 },
              { x: 72, y: 52 },
              { x: 22, y: 62 },
            ].map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="1.5"
                fill="var(--color-error)"
                stroke="white"
                strokeWidth="0.3"
              />
            ))}
          </svg>
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
            <div className="bg-white/90 backdrop-blur rounded-lg p-2 shadow-sm border border-white/50">
              <div className="text-[10px] font-bold text-slate-800">
                TN Kutai (KTH Bina Mandiri)
              </div>
              <div className="text-[9px] text-primary">Status: Terlindungi (NDVI 0.81)</div>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-lg p-2 shadow-sm border border-white/50 text-right">
              <div className="text-[10px] font-bold text-slate-800">PLTU Suralaya Unit 8</div>
              <div className="text-[9px] text-error">Status: Defisit Emisi (-2.4M tCO2e)</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
