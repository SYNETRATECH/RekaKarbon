import { useState } from 'react';
import { Building2, TreePine, FlaskConical, Factory, Check } from 'lucide-react';

const ekosistemTabs = [
  {
    id: 'regulator',
    label: 'Regulator',
    icon: Building2,
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    role: 'Kementerian LHK / DJP / Pemerintah',
    desc: 'Mengalokasikan kuota emisi nasional, mengawasi kepatuhan pajak, dan menjaga kedaulatan hutan Indonesia.',
    features: [
      'Alokasi kuota emisi resmi PTBAE-PU',
      'Dashboard neraca emisi industri nasional secara real-time',
      'Emergency Asset Freeze untuk membekukan aset bermasalah secara on-chain',
      'Integrasi pencatatan penerimaan kas negara & audit kepatuhan perpajakan',
    ],
  },
  {
    id: 'kth',
    label: 'KTH & Komunitas',
    icon: TreePine,
    color: 'var(--color-primary)',
    bg: 'var(--color-surface-container-low)',
    border: 'var(--color-outline-variant)',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',
    role: 'Kelompok Tani Hutan & Masyarakat Adat',
    desc: 'Menjaga kawasan hutan konservasi, restorasi mangrove, dan agroforestry untuk mencetak kredit karbon terverifikasi.',
    features: [
      'Pemetaan batas spasial poligon GIS WGS84 (Drag & Drop Coordinates)',
      'Unggah berkas SK Perhutanan Sosial & log penanaman pohon',
      'Dompet karbon (Carbon Wallet) untuk menerima pendapatan penjualan kredit SPE-GRK',
      'Pencairan hasil penjualan langsung ke rekening BUMDes tanpa potongan perantara',
    ],
  },
  {
    id: 'auditor',
    label: 'Auditor & dMRV',
    icon: FlaskConical,
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#e9d5ff',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    role: 'Auditor Independen & AI dMRV Engine',
    desc: 'Memverifikasi pertumbuhan biomassa dan membuktikan keabsahan pengurangan emisi (Additionality).',
    features: [
      'Analisis tutupan kanopi & indeks vegetasi satelit NusaCarbon API / Sentinel-2',
      'Inspeksi ortofoto drone dan segmentasi tajuk pohon otomatis (AI Tree Crown Detection)',
      'Cross-correlation AI Engine untuk mendeteksi manipulasi pelaporan emisi pabrik',
      'Verification Gate untuk menandatangani otorisasi pencetakan token (minting)',
    ],
  },
  {
    id: 'emiten',
    label: 'Emiten Korporasi',
    icon: Factory,
    color: 'var(--color-warning)',
    bg: '#fff7ed',
    border: '#fed7aa',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15f?w=800&q=80',
    role: 'Industri Beremisi Tinggi: Semen, PLTU, Pulp & Kertas',
    desc: 'Memenuhi batas emisi tahunan dan menghindari sanksi denda pajak karbon sesuai UU No. 7/2021 HPP.',
    features: [
      'Kalkulator neraca emisi CEMS vs kuota batas atas',
      'Proyeksi denda pajak karbon berjalan berdasarkan tarif UU HPP (Rp 650.000 / ton defisit)',
      'Pembelian kredit SPE-GRK di Bursa Karbon dengan proteksi Cap-Control',
      'Brankas Burning Chamber (10 fraksi = 1 tCO2e) & penerbitan Sertifikat Kepatuhan resmi A4',
    ],
  },
];

export default function EcosystemSection() {
  const [activeTab, setActiveTab] = useState('regulator');
  const tab = ekosistemTabs.find((t) => t.id === activeTab)!;
  const Icon = tab.icon;

  return (
    <section id="ekosistem" className="py-24 relative overflow-hidden bg-white">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply blur-3xl opacity-50 animate-pulse" />
        <div
          className="absolute bottom-1/4 right-0 w-80 h-80 bg-emerald-100 rounded-full mix-blend-multiply blur-3xl opacity-50"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-slate-200/60 shadow-sm text-xs font-semibold text-slate-500 mb-5 tracking-wide uppercase">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            4 Pilar Terintegrasi
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Setiap Peran,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tech-mint">
              Satu Platform.
            </span>
          </h2>
        </div>

        {/* Premium Segmented Control Tabs */}
        <div className="flex justify-center mb-12 overflow-x-auto pb-4">
          <div className="inline-flex bg-slate-100/80 backdrop-blur-md rounded-2xl p-1.5 gap-2 shadow-inner border border-slate-200/50 min-w-max">
            {ekosistemTabs.map((t) => {
              const TIcon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer z-10 ${
                    isActive
                      ? 'text-slate-900 shadow-md'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/60 -z-10 animate-fade-in" />
                  )}
                  <TIcon
                    size={16}
                    className={`transition-colors duration-300 ${isActive ? '' : 'opacity-60'}`}
                    style={{ color: isActive ? t.color : undefined }}
                  />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Card with Smooth Transitions */}
        <div
          key={tab.id}
          className="animate-fade-in relative rounded-[2rem] border overflow-hidden shadow-2xl bg-white/80 backdrop-blur-xl transition-colors duration-500"
          style={{ borderColor: tab.border }}
        >
          {/* Decorative colored tint background for the whole card */}
          <div
            className="absolute inset-0 opacity-30 transition-colors duration-500"
            style={{ backgroundColor: tab.bg }}
          />

          <div className="grid lg:grid-cols-12 relative z-10">
            {/* Left Content */}
            <div className="p-8 md:p-12 lg:col-span-7 flex flex-col justify-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border bg-white"
                style={{ borderColor: tab.border }}
              >
                <Icon size={28} style={{ color: tab.color }} />
              </div>
              <div
                className="text-[11px] font-mono tracking-widest mb-2 font-bold uppercase"
                style={{ color: tab.color }}
              >
                {tab.role}
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
                {tab.label}
              </h3>
              <p className="text-slate-600 text-base md:text-lg mb-8 leading-relaxed max-w-xl">
                {tab.desc}
              </p>

              <div className="space-y-4">
                {tab.features.map((f, i) => (
                  <div
                    key={i}
                    className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-slate-200/50 cursor-default"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm bg-white"
                      style={{ border: `1px solid ${tab.border}` }}
                    >
                      <Check size={12} style={{ color: tab.color }} />
                    </div>
                    <span className="text-sm md:text-base font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Image Orb */}
            <div
              className="flex items-center justify-center p-10 lg:p-16 lg:col-span-5 border-t lg:border-t-0 lg:border-l relative overflow-hidden bg-slate-50/50"
              style={{ borderColor: tab.border }}
            >
              {/* Animated Glow Blobs */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[64px] opacity-50 animate-pulse"
                  style={{ backgroundColor: tab.color, animationDuration: '4s' }}
                />
                <div
                  className="absolute top-1/4 right-1/4 w-40 h-40 rounded-full blur-[48px] opacity-40"
                  style={{ backgroundColor: tab.color }}
                />
              </div>

              {/* Image Circular Frame */}
              <div
                className="relative w-56 h-56 md:w-72 md:h-72 rounded-full flex items-center justify-center shadow-2xl overflow-hidden group border-8"
                style={{ borderColor: `color-mix(in srgb, ${tab.color} 20%, white)` }}
              >
                <img
                  src={tab.image}
                  alt={tab.label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                {/* Subtle color tint overlay over the image to match theme */}
                <div
                  className="absolute inset-0 opacity-20 mix-blend-overlay transition-colors duration-500 pointer-events-none"
                  style={{ backgroundColor: tab.color }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
