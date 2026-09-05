import {
  Play,
  ArrowUpRight,
  Globe,
  TreePine,
  LayoutDashboard,
  Settings,
  Bell,
  Shield,
} from 'lucide-react';
import brandIcon from '../../assets/icon.png';

// Mockup MiniBarChart
function MiniBarChart({ active, heights }: { active?: boolean; heights: number[] }) {
  return (
    <div className="flex items-end gap-0.5 h-7">
      {heights.map((h, i) => (
        <div
          key={i}
          style={{ height: `${h}%`, width: 3, borderRadius: 2 }}
          className={active ? 'bg-white/60' : 'bg-slate-300'}
        />
      ))}
    </div>
  );
}

function DashboardMockup() {
  const cards = [
    {
      label: 'Proyek KTH',
      value: '12',
      unit: 'aktif',
      active: true,
      heights: [55, 70, 45, 85, 60, 40, 75, 55],
    },
    {
      label: 'CEMS Industri',
      value: '2.4M',
      unit: 'tCO2e',
      active: false,
      heights: [40, 60, 80, 50, 70, 45, 55, 65],
    },
    {
      label: 'Token SPE-GRK',
      value: '48.2K',
      unit: 'token',
      active: false,
      heights: [65, 45, 75, 55, 40, 70, 50, 60],
    },
    {
      label: 'Hutan Lindung',
      value: '14.250',
      unit: 'Ha',
      active: false,
      heights: [35, 55, 45, 60, 40, 50, 45, 40],
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-x-auto w-full relative">
      <div className="flex min-w-[800px]" style={{ height: 460 }}>
        {/* Sidebar */}
        <div className="w-44 bg-white border-r border-slate-100 flex flex-col py-5 px-3 shrink-0">
          <div className="flex items-center gap-2 mb-6 px-2">
            <img src={brandIcon} alt="Logo" className="w-6 h-6 object-contain rounded-md" />
            <span className="text-xs font-bold text-slate-800 tracking-tight">RekaKarbon</span>
          </div>
          <nav className="space-y-0.5 flex-1">
            {[
              { icon: LayoutDashboard, label: 'dashboard', active: true },
              { icon: Globe, label: 'peta publik', active: false },
              { icon: TreePine, label: 'proyek KTH', active: false },
              { icon: Settings, label: 'pengaturan', active: false },
            ].map(({ icon: Icon, label, active }, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${active ? 'text-slate-900 font-semibold bg-slate-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon size={13} />
                {label}
              </div>
            ))}
          </nav>
          <div className="px-2 py-2 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[8px] text-emerald-700 font-mono font-bold leading-tight">
              Besu Node Active
            </span>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col bg-surface-alt min-w-0">
          {/* Top bar */}
          <div className="flex justify-between items-center px-5 py-3.5 bg-white border-b border-slate-100 shrink-0">
            <div>
              <div className="text-sm font-bold text-slate-900">Selamat datang, Pak Admin!</div>
              <div className="text-[11px] text-slate-400">
                Ini ringkasan neraca karbon nasional hari ini.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                Chain ID 1337
              </span>
              <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100">
                <Bell size={12} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Cards row */}
          <div className="grid grid-cols-5 gap-2 p-4 shrink-0">
            {cards.map((c) => (
              <div
                key={c.label}
                className={`rounded-xl p-3 flex flex-col gap-2 ${c.active ? 'bg-primary-container' : 'bg-white border border-slate-100 shadow-sm'}`}
              >
                <div
                  className={`text-[9px] font-medium leading-tight ${c.active ? 'text-white/80' : 'text-slate-400'}`}
                >
                  {c.label}
                </div>
                <MiniBarChart active={c.active} heights={c.heights} />
                <div
                  className={`text-[11px] font-bold ${c.active ? 'text-white' : 'text-slate-700'}`}
                >
                  {c.value} {c.unit}
                </div>
              </div>
            ))}
            {/* Audit gauge widget */}
            <div className="rounded-xl border border-slate-100 shadow-sm bg-white flex flex-col items-center justify-center p-2 gap-0.5">
              <div className="text-[8px] text-slate-400 font-medium">Audit dMRV</div>
              <svg viewBox="0 0 60 34" className="w-full">
                <path
                  d="M 5 30 A 25 25 0 0 0 55 30"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M 5 30 A 25 25 0 0 0 52 6"
                  fill="none"
                  stroke="var(--color-primary-container)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M 52 6 A 25 25 0 0 0 55 30"
                  fill="none"
                  stroke="var(--color-warning)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <line
                  x1="30"
                  y1="30"
                  x2="51"
                  y2="7"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="30" cy="30" r="2" fill="var(--color-primary)" />
              </svg>
              <div className="text-[9px] font-bold text-primary-container">98.7%</div>
              <div className="text-[7px] text-slate-400">terverifikasi</div>
            </div>
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-3 gap-2 px-4 pb-4 flex-1">
            {/* tCO2e */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="text-[10px] text-slate-400 mb-1">total tCO2e terverifikasi</div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-slate-900">48.200</span>
                <span className="text-[10px] text-slate-400">tCO2e</span>
              </div>
              <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[9px] font-semibold px-1.5 py-0.5 rounded-full my-1.5 w-fit">
                ↑ 12.4% bulan ini
              </div>
              <div className="space-y-1">
                {[
                  { k: 'Kredit diterbitkan', v: '48.200 token' },
                  { k: 'Kredit dibakar', v: '12.450 token' },
                  { k: 'Cadangan 5%', v: '2.410 token' },
                ].map((row) => (
                  <div key={row.k} className="flex justify-between">
                    <span className="text-[9px] text-slate-400">{row.k}</span>
                    <span className="text-[9px] font-medium text-slate-600">{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Dana KTH */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm flex flex-col">
              <div className="text-[10px] text-slate-400 mb-1">dana KTH tersalurkan</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-extrabold text-slate-900">Rp 3,85 M</span>
              </div>
              <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[9px] font-semibold px-1.5 py-0.5 rounded-full mb-3 w-fit">
                🌳 Direct-to-BUMDes
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'TN Gunung Leuser', pct: 72, color: 'var(--color-primary)' },
                  { label: 'TN Kutai', pct: 45, color: 'var(--color-primary-container)' },
                  { label: 'Restorasi Gambut', pct: 38, color: 'var(--color-inverse-primary)' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-1.5">
                    <span className="text-[8px] text-slate-400 w-20 truncate">{row.label}</span>
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Kepatuhan */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm flex flex-col">
              <div className="text-[10px] text-slate-400 mb-1">kepatuhan regulasi</div>
              <div className="flex items-start justify-between mb-1">
                <span className="text-2xl font-extrabold text-slate-900">100%</span>
                <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Shield size={14} className="text-primary-container" />
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary-container rounded-full w-full" />
              </div>
              <div className="text-[9px] text-slate-400">UU No. 7/2021 HPP</div>
              <div className="text-[9px] text-slate-400">Perpres 98/2021</div>
              <div className="text-[9px] text-slate-400">ISO 14064-2 &amp; 14064-3</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router';

export default function HeroSection({ onOpenPortal }: { onOpenPortal?: () => void } = {}) {
  const navigate = useNavigate();
  const handleOpenPortal = onOpenPortal || (() => navigate('/portal-transparansi'));
  const handleLogin = () => navigate('/login');
  const kpis = [
    { val: '48.200+', unit: 'tCO2e', label: 'Total Kredit Karbon Terverifikasi dMRV' },
    { val: '14.250', unit: 'Ha', label: 'Kawasan Konservasi & Perhutanan Sosial Terlindungi' },
    {
      val: 'Rp 3,85 M+',
      unit: '',
      label: 'Dana Karbon Tersalurkan Langsung ke Kelompok Tani Hutan (KTH)',
    },
    { val: '100%', unit: '', label: 'Kepatuhan Regulasi UU No. 7/2021 HPP & Perpres 98/2021' },
  ];

  return (
    <section className="relative overflow-hidden bg-surface-container pt-16">
      {/* Sky photo with clouds */}
      <img
        src="https://images.unsplash.com/photo-1768482055878-af07eeb275c8?w=1600&h=900&fit=crop&auto=format&q=75"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none opacity-50 mix-blend-multiply"
        style={{ zIndex: 0 }}
      />
      {/* Fade sky photo into page background at the bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '40%',
          background:
            'linear-gradient(to top,var(--color-surface) 0%,rgba(248, 249, 255, 0.5) 50%,transparent 100%)',
          zIndex: 1,
        }}
      />

      {/* Left bonsai tree */}
      <div
        className="absolute bottom-0 left-0 pointer-events-none select-none overflow-hidden mix-blend-multiply opacity-60"
        style={{
          height: '82%',
          width: '22%',
          maxWidth: 320,
          zIndex: 2,
          WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1765810655660-c3e907524d1e?w=600&h=860&fit=crop&auto=format"
          alt=""
          className="w-full h-full object-cover object-right"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>
      {/* Right bonsai tree */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none select-none overflow-hidden mix-blend-multiply opacity-60"
        style={{
          height: '82%',
          width: '22%',
          maxWidth: 320,
          zIndex: 2,
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1765810655660-c3e907524d1e?w=600&h=860&fit=crop&auto=format"
          alt=""
          className="w-full h-full object-cover object-left"
        />
      </div>

      <div
        className="relative flex flex-col items-center text-center px-6 pt-24 pb-10"
        style={{ zIndex: 3 }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-[3.75rem] font-extrabold text-slate-900 leading-[1.08] max-w-4xl mb-5">
          Integritas Pasar Karbon Indonesia: Presisi Digital dMRV, Kepatuhan Regulasi, dan Keadilan
          Komunitas Hutan.
        </h1>

        <p className="text-sm md:text-base text-slate-600 max-w-2xl mb-8 leading-relaxed">
          Platform berbasis blockchain pertama di Indonesia yang mengintegrasikan pengawasan emisi
          cerobong industri (CEMS), audit satelit &amp; drone otomatis, serta perdagangan kredit
          karbon bergaransi asuransi permanen tanpa celah greenwashing.
        </p>

        {/* Dual CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-10">
          <button
            onClick={handleOpenPortal}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-colors text-sm shadow-lg shadow-black/20 cursor-pointer"
          >
            Eksplorasi Portal Transparansi
            <ArrowUpRight size={15} />
          </button>
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 px-6 py-3 border border-slate-300/70 bg-white/50 backdrop-blur text-slate-700 font-semibold rounded-xl hover:bg-white/70 transition-colors text-sm cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full border border-slate-400/60 flex items-center justify-center">
              <Play size={7} className="text-slate-600 ml-0.5" fill="currentColor" />
            </div>
            Masuk Sebagai Pelaku Usaha / KTH
          </button>
        </div>

        {/* KPI Strip */}
        <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="bg-white/70 backdrop-blur rounded-2xl border border-white/60 shadow-sm px-4 py-4 text-left hover:-translate-y-1 transition-transform"
            >
              <div className="flex items-baseline gap-1 mb-1 flex-wrap">
                <span className="text-xl font-extrabold text-primary">{k.val}</span>
                {k.unit && <span className="text-xs text-slate-500 font-medium">{k.unit}</span>}
              </div>
              <div className="text-[10px] text-slate-600 font-medium leading-snug">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Dashboard mockup */}
        <div className="w-full max-w-5xl relative" style={{ zIndex: 4 }}>
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
