import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Leaf,
  ArrowRight,
  ArrowLeft,
  Save,
  Calculator,
  Factory,
  Zap,
  Truck,
  Building2,
  Flame,
  Droplets,
  Wind,
  Thermometer,
  Recycle,
  Trees,
  Tractor,
  HardHat,
  Hotel,
  Landmark,
  BarChart3,
  CheckCircle2,
  Download,
  Loader2,
  Filter,
  Plane,
} from 'lucide-react';
import { formatCarbon } from '@/lib/formatters';
import { reportRepository } from '../../repositories';
import { generateEmissionReportPDF } from '@/lib/generateEmissionReportPDF';
import { useToast } from '@/hooks/use-toast';
import type { CalculationData, CalculatorReportSubmission } from '@/types';

// ─── Constants & Emission Factors (DEFRA 2023 Standard) ────────────────
const EMISSION_FACTORS: Record<string, number> = {
  // Scope 1 - Combustion
  diesel_liter: 2.512, // Solar/Diesel (kg CO₂e/L)
  gasoline_liter: 2.105, // Bensin/Petrol (kg CO₂e/L)
  lpg_kg: 2.939, // LPG (kg CO₂e/kg)
  natural_gas_m3: 2.023, // Gas alam (kg CO₂e/m³)
  coal_kg: 2.531, // Batu bara (kg CO₂e/kg)
  heavy_fuel_oil_liter: 3.168, // MFO/Heavy Fuel Oil (kg CO₂e/L)

  // Scope 1 - Fugitive
  refrigerant_kg: 2088, // Refrigerant R-410A (kg CO₂e/kg)
  co2_fire_ext_kg: 1.0, // CO₂ pemadam (kg CO₂/kg)

  // Scope 1 - Process (Industrial Averages)
  cement_clinker_ton: 525, // Semen clinker (kg CO₂/ton)
  lime_ton: 750, // Kapur (kg CO₂/ton)

  // Scope 1 - Agriculture (IPCC Averages)
  fertilizer_urea_kg: 0.733, // Urea - N₂O (kg CO₂e/kg)
  rice_paddy_ha: 5110, // Padi sawah - CH₄ (kg CO₂e/ha/season)
  livestock_cattle_head: 2070, // Sapi potong - CH₄ (kg CO₂e/head/year)

  // Scope 2 (Grid Electricity)
  electricity_kwh: 0.207, // Listrik (kg CO₂e/kWh) - Grid Average 2023

  // Scope 3
  flight_km: 0.244, // Penerbangan domestik (kg CO₂e/passenger-km)
  car_km: 0.171, // Mobil penumpang rata-rata (kg CO₂e/km)
  paper_kg: 0.895, // Kertas & kardus (kg CO₂e/kg)
  water_m3: 0.149, // Air suplai (kg CO₂e/m³)
  waste_landfill_ton: 588.9, // Limbah komersial ke TPA (kg CO₂e/ton)
  waste_incineration_ton: 21.3, // Limbah pembakaran/insinerasi (kg CO₂e/ton)
  freight_tkm: 0.119, // Truk logistik HGV rata-rata (kg CO₂e/ton-km)

  // Direct Input (Financed Emissions)
  direct_tco2e: 1000, // 1 tCO2e = 1000 kg CO2e
};

// ─── Sector Definitions with Dynamic Form Fields ─────────────────────
interface FormField {
  id: string;
  label: string;
  unit: string;
  placeholder: string;
  emissionFactorKey: string;
  scope: 1 | 2 | 3;
}

interface CategoryDef {
  id: string;
  title: string;
  description: string;
  scope: 1 | 2 | 3;
  icon:
    | 'factory'
    | 'zap'
    | 'truck'
    | 'flame'
    | 'droplets'
    | 'wind'
    | 'recycle'
    | 'trees'
    | 'thermometer'
    | 'landmark'
    | 'plane';
  color: string;
  fields: FormField[];
}

export const UNIVERSAL_CATEGORIES: CategoryDef[] = [
  {
    id: 's1_stationary',
    title: 'Scope 1: Pembakaran Stasioner',
    description: 'Genset, boiler, kompor, oven gas',
    scope: 1,
    icon: 'flame',
    color: 'bg-red-100 text-red-700',
    fields: [
      {
        id: 'genset_diesel',
        label: 'Solar Genset/Boiler',
        unit: 'Liter',
        placeholder: '500',
        emissionFactorKey: 'diesel_liter',
        scope: 1,
      },
      {
        id: 'natural_gas',
        label: 'Gas Alam',
        unit: 'm³',
        placeholder: '1200',
        emissionFactorKey: 'natural_gas_m3',
        scope: 1,
      },
      {
        id: 'coal',
        label: 'Batu Bara',
        unit: 'kg',
        placeholder: '3000',
        emissionFactorKey: 'coal_kg',
        scope: 1,
      },
      {
        id: 'lpg',
        label: 'LPG',
        unit: 'kg',
        placeholder: '300',
        emissionFactorKey: 'lpg_kg',
        scope: 1,
      },
    ],
  },
  {
    id: 's1_mobile',
    title: 'Scope 1: Pembakaran Bergerak',
    description: 'Mobil operasional, motor, alat berat',
    scope: 1,
    icon: 'truck',
    color: 'bg-orange-100 text-orange-700',
    fields: [
      {
        id: 'vehicle_diesel',
        label: 'Solar Kendaraan',
        unit: 'Liter',
        placeholder: '800',
        emissionFactorKey: 'diesel_liter',
        scope: 1,
      },
      {
        id: 'vehicle_gasoline',
        label: 'Bensin/Petrol',
        unit: 'Liter',
        placeholder: '300',
        emissionFactorKey: 'gasoline_liter',
        scope: 1,
      },
    ],
  },
  {
    id: 's2_electricity',
    title: 'Scope 2: Konsumsi Listrik',
    description: 'Penggunaan listrik PLN',
    scope: 2,
    icon: 'zap',
    color: 'bg-amber-100 text-amber-700',
    fields: [
      {
        id: 'electricity',
        label: 'Listrik PLN',
        unit: 'kWh',
        placeholder: '50000',
        emissionFactorKey: 'electricity_kwh',
        scope: 2,
      },
    ],
  },
  {
    id: 's3_business_travel',
    title: 'Scope 3: Perjalanan Dinas',
    description: 'Business travel, tiket penerbangan',
    scope: 3,
    icon: 'plane',
    color: 'bg-blue-100 text-blue-700',
    fields: [
      {
        id: 'flight',
        label: 'Penerbangan Domestik',
        unit: 'passenger-km',
        placeholder: '5000',
        emissionFactorKey: 'flight_km',
        scope: 3,
      },
      {
        id: 'car_travel',
        label: 'Perjalanan Darat (Mobil)',
        unit: 'km',
        placeholder: '1000',
        emissionFactorKey: 'car_km',
        scope: 3,
      },
    ],
  },
  {
    id: 's3_financed',
    title: 'Scope 3: Emisi yang Dibiayai',
    description: 'Financed emissions (investasi, portofolio)',
    scope: 3,
    icon: 'landmark',
    color: 'bg-purple-100 text-purple-700',
    fields: [
      {
        id: 'financed_emissions',
        label: 'Estimasi Emisi Portofolio',
        unit: 'tCO₂e',
        placeholder: '500',
        emissionFactorKey: 'direct_tco2e',
        scope: 3,
      },
    ],
  },
];

interface SectorDef {
  id: string;
  name: string;
  description: string;
  thresholdTCO2e: number;
}

const SECTORS: SectorDef[] = [
  {
    id: 'manufaktur',
    name: 'Manufaktur & Industri',
    description: 'Pabrik, pengolahan, dan produksi barang',
    thresholdTCO2e: 50000,
  },
  {
    id: 'pertambangan',
    name: 'Pertambangan & Energi',
    description: 'Pertambangan mineral, batu bara, minyak & gas',
    thresholdTCO2e: 100000,
  },
  {
    id: 'perbankan',
    name: 'Perbankan & Jasa Keuangan',
    description: 'Bank, asuransi, fintech, sekuritas',
    thresholdTCO2e: 5000,
  },
  {
    id: 'konstruksi',
    name: 'Konstruksi & Properti',
    description: 'Kontraktor, pengembang, infrastruktur',
    thresholdTCO2e: 25000,
  },
  {
    id: 'pertanian',
    name: 'Pertanian & Perkebunan',
    description: 'Sawah, kebun sawit, peternakan, perikanan',
    thresholdTCO2e: 15000,
  },
  {
    id: 'perhotelan',
    name: 'Perhotelan & Pariwisata',
    description: 'Hotel, resort, restoran, wisata',
    thresholdTCO2e: 10000,
  },
];

// ─── Icon Mapper ─────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  factory: <Factory className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
  truck: <Truck className="w-4 h-4" />,
  flame: <Flame className="w-4 h-4" />,
  droplets: <Droplets className="w-4 h-4" />,
  wind: <Wind className="w-4 h-4" />,
  recycle: <Recycle className="w-4 h-4" />,
  trees: <Trees className="w-4 h-4" />,
  thermometer: <Thermometer className="w-4 h-4" />,
  landmark: <Landmark className="w-4 h-4" />,
  plane: <Plane className="w-4 h-4" />,
};

const SECTOR_ICONS: Record<string, React.ReactNode> = {
  manufaktur: <Factory className="w-4 h-4" />,
  pertambangan: <HardHat className="w-4 h-4" />,
  perbankan: <Landmark className="w-4 h-4" />,
  konstruksi: <Building2 className="w-4 h-4" />,
  pertanian: <Tractor className="w-4 h-4" />,
  perhotelan: <Hotel className="w-4 h-4" />,
};

// ─── Meta ────────────────────────────────────────────────────────────
export function meta() {
  return [
    { title: 'Kalkulator Hijau BI | RekaKarbon' },
    { name: 'description', content: 'Kalkulator Emisi Karbon berbasis Sektor Industri' },
  ];
}

// ─── Page Component ──────────────────────────────────────────────────
export default function KalkulatorHijauPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sectorFromUrl = searchParams.get('sector');
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(sectorFromUrl);
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});

  const [selectedYear, setSelectedYear] = useState(2026);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generatedPdfData, setGeneratedPdfData] = useState<CalculatorReportSubmission | null>(null);
  const { toast } = useToast();

  const selectedSector = useMemo(
    () => SECTORS.find((s) => s.id === selectedSectorId) ?? null,
    [selectedSectorId]
  );

  const categories = UNIVERSAL_CATEGORIES;
  const activeCategory = categories[activeCategoryIdx] ?? null;

  // Reset form when sector changes
  const handleSectorChange = (sectorId: string) => {
    setSelectedSectorId(sectorId);
    setActiveCategoryIdx(0);
    setValues({});
  };

  const handleValueChange = (fieldId: string, val: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  // Calculate emissions per scope + total
  const { scope1, scope2, scope3, total } = useMemo(() => {
    if (!selectedSector) return { scope1: 0, scope2: 0, scope3: 0, total: 0 };

    let s1 = 0,
      s2 = 0,
      s3 = 0;
    for (const cat of UNIVERSAL_CATEGORIES) {
      for (const field of cat.fields) {
        const raw = Number(values[field.id] || 0);
        const factor = EMISSION_FACTORS[field.emissionFactorKey] ?? 0;
        const emission = (raw * factor) / 1000; // convert kg to ton (tCO₂e)
        if (field.scope === 1) s1 += emission;
        else if (field.scope === 2) s2 += emission;
        else s3 += emission;
      }
    }
    return { scope1: s1, scope2: s2, scope3: s3, total: s1 + s2 + s3 };
  }, [selectedSector, values]);

  const handleNext = () => {
    if (activeCategoryIdx < categories.length - 1) setActiveCategoryIdx(activeCategoryIdx + 1);
  };

  const handleApply = async () => {
    if (!selectedSectorId) return;

    setIsSubmitting(true);

    try {
      // Kumpulkan data kalkulasi
      const calculationData: CalculationData = {
        scope1,
        scope2,
        scope3,
        entries: Object.entries(values).map(([id, val]) => ({
          id,
          value: Number(val),
        })),
      };

      // 1. Submit ke backend
      const res = await reportRepository.submitCalculatorReport(
        selectedYear,
        selectedSectorId,
        total,
        calculationData
      );

      // 2. Animasi "Convert to PDF" selama 3 detik
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitSuccess(true);
        setGeneratedPdfData(res);
      }, 3000);
    } catch (error: unknown) {
      console.error(error);
      setIsSubmitting(false);
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan Laporan',
        description: error instanceof Error ? error.message : 'Gagal menyimpan laporan kalkulator.',
      });
    }
  };

  const handleDownloadPDF = () => {
    try {
      generateEmissionReportPDF({
        year: selectedYear,
        sectorName: selectedSector?.name || '-',
        reportTitle: `Laporan Emisi ${selectedSector?.name || ''} Tahun ${selectedYear}`.trim(),
        reportMethod: 'CALCULATOR',
        reportStatus: 'submitted',
        total,
        scope1,
        scope2,
        scope3,
        merkleRoot: generatedPdfData?.merkleRoot || '-',
        txHash: generatedPdfData?.txHash,
        blockchainReportId: generatedPdfData?.blockchainReportId,
        thresholdTCO2e: selectedSector?.thresholdTCO2e,
        fieldValues: values,
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast({
        variant: 'destructive',
        title: 'Gagal Mengunduh PDF',
        description: 'Terjadi kesalahan saat membuat PDF.',
      });
    }
  };

  // ─── Render ──────────────────────────────────────────────────────
  if (submitSuccess && generatedPdfData) {
    return (
      <div className="space-y-8 animate-fade-in text-center py-12 max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Laporan Emisi Berhasil Dibuat</h2>
          <p className="text-sm text-slate-500 mb-8 max-w-md">
            Data kalkulator hijau Anda telah dikonversi menjadi laporan emisi dan diamankan di
            jaringan blockchain (dMRV).
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 w-full text-left space-y-4 mb-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Tahun Kepatuhan</span>
              <span className="text-sm font-black text-slate-900">{selectedYear}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Emisi</span>
              <span className="text-lg font-black text-emerald-700 font-mono">
                {formatCarbon(total)} tCO₂e
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Sidik Jari Merkle Root
              </span>
              <span className="text-xs font-mono text-slate-700 break-all bg-slate-200/50 p-2 rounded-lg border border-slate-200">
                {generatedPdfData.merkleRoot}
              </span>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <Button
              onClick={() => navigate('/laporan')}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold"
            >
              Kembali ke Beranda
            </Button>
            <Button
              onClick={handleDownloadPDF}
              className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF Laporan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left pb-12">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-emerald-600" />
            Kalkulator Hijau Bank Indonesia
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1 max-w-3xl">
            Alat bantu perhitungan estimasi emisi GRK berbasis sektor industri. Pilih sektor usaha
            Anda, lalu isi data aktivitas per kategori emisi (Scope 1, 2, 3).
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/laporan')}
          className="self-start md:self-auto rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 h-9 font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali ke Laporan
        </Button>
      </div>

      {/* ── Year Selector & Sector Selector ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Year Selector */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Tahun Kepatuhan</h3>
              <p className="text-[10px] text-slate-500 font-semibold">
                Pilih tahun laporan emisi ini
              </p>
            </div>
          </div>
          <Select
            value={String(selectedYear)}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="h-12 rounded-xl text-sm font-bold w-full border-slate-200">
              <SelectValue placeholder="— Pilih Tahun —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">FY 2026 (Aktif)</SelectItem>
              <SelectItem value="2025">FY 2025 (Arsip)</SelectItem>
              <SelectItem value="2024">FY 2024 (Arsip)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sector Selector */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Sektor Industri</h3>
              <p className="text-[10px] text-slate-500 font-semibold">
                Menyesuaikan form kategori emisi
              </p>
            </div>
          </div>
          <Select value={selectedSectorId ?? ''} onValueChange={handleSectorChange}>
            <SelectTrigger className="h-12 rounded-xl text-sm font-bold w-full border-slate-200">
              <SelectValue placeholder="— Pilih Sektor Industri —" />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    {SECTOR_ICONS[s.id]}
                    <span className="font-bold">{s.name}</span>
                    <span className="text-slate-400 text-xs ml-1 hidden sm:inline">
                      — {s.description}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Main Form (only shown when sector selected) ────────── */}
      {selectedSector && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col md:flex-row">
          {/* LEFT PANEL: Category Navigation */}
          <div className="md:w-72 bg-slate-50/80 border-r border-slate-200 p-4 space-y-2 shrink-0">
            {categories.map((cat, idx) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryIdx(idx)}
                className={`w-full p-4 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-3 border ${
                  activeCategoryIdx === idx
                    ? 'bg-white border-emerald-500 shadow-sm'
                    : 'border-transparent text-slate-500 hover:bg-slate-100/70'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    activeCategoryIdx === idx ? cat.color : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {ICON_MAP[cat.icon]}
                </div>
                <div>
                  <h4
                    className={`text-xs font-extrabold leading-snug ${activeCategoryIdx === idx ? 'text-slate-900' : 'text-slate-600'}`}
                  >
                    {cat.title}
                  </h4>
                  <span className="text-[10px] font-semibold block mt-0.5 opacity-80">
                    Scope {cat.scope} — {cat.description}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* RIGHT PANEL: Form Details */}
          <div className="flex-1 p-6 md:p-10 bg-white min-h-[400px] flex flex-col justify-between">
            {activeCategory && (
              <div
                className="space-y-8 max-w-xl animate-in slide-in-from-right-4 fade-in duration-300"
                key={activeCategory.id}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        activeCategory.scope === 1
                          ? 'bg-red-100 text-red-700'
                          : activeCategory.scope === 2
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      Scope {activeCategory.scope}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">{activeCategory.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{activeCategory.description}</p>
                </div>

                <div className="space-y-5">
                  {activeCategory.fields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {field.label}{' '}
                        <span className="text-slate-400 font-semibold">({field.unit})</span>
                      </label>
                      <Input
                        type="number"
                        value={values[field.id] ?? ''}
                        onChange={(e) => handleValueChange(field.id, e.target.value)}
                        className="rounded-xl border-slate-200 h-11 w-full max-w-sm font-mono text-sm"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Summary & Actions ───────────────────────────── */}
            <div className="mt-12 flex flex-col gap-4 border-t border-slate-100 pt-6">
              {/* Scope breakdown */}
              <div className="flex flex-wrap gap-3">
                <div className="bg-red-50 rounded-xl py-2 px-4 border border-red-100 text-center min-w-[120px]">
                  <span className="text-[9px] font-bold text-red-500 block uppercase">Scope 1</span>
                  <span className="text-sm font-black text-red-900 font-mono">
                    {formatCarbon(scope1)}
                  </span>
                </div>
                <div className="bg-amber-50 rounded-xl py-2 px-4 border border-amber-100 text-center min-w-[120px]">
                  <span className="text-[9px] font-bold text-amber-500 block uppercase">
                    Scope 2
                  </span>
                  <span className="text-sm font-black text-amber-900 font-mono">
                    {formatCarbon(scope2)}
                  </span>
                </div>
                <div className="bg-blue-50 rounded-xl py-2 px-4 border border-blue-100 text-center min-w-[120px]">
                  <span className="text-[9px] font-bold text-blue-500 block uppercase">
                    Scope 3
                  </span>
                  <span className="text-sm font-black text-blue-900 font-mono">
                    {formatCarbon(scope3)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                <div className="bg-emerald-50 rounded-2xl py-3 px-5 flex items-center justify-between border border-emerald-100 w-full sm:w-auto shrink-0 gap-8">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wide">
                      Total Emisi GRK
                    </span>
                    <span className="text-2xl font-black text-emerald-950 mt-0.5 block font-mono">
                      {formatCarbon(total)}
                    </span>
                  </div>
                  <Leaf className="w-8 h-8 text-emerald-200" />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {activeCategoryIdx < categories.length - 1 ? (
                    <Button
                      className="w-full sm:w-auto px-6 rounded-xl h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md"
                      onClick={handleNext}
                      disabled={isSubmitting}
                    >
                      Selanjutnya <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  ) : (
                    <Button
                      className="w-full sm:w-auto px-6 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                      onClick={handleApply}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Mengonversi form ke
                          PDF...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1.5" /> Selesai & Simpan Data
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              {/* Progress bar vs threshold */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Batas Maksimal Sektor {selectedSector.name}
                  </span>
                  <span className="text-xs font-black text-slate-700 font-mono">
                    {formatCarbon(selectedSector.thresholdTCO2e)} tCO₂e
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${total > selectedSector.thresholdTCO2e ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{
                      width: `${Math.min((total / selectedSector.thresholdTCO2e) * 100, 100)}%`,
                    }}
                  />
                </div>
                {total > selectedSector.thresholdTCO2e && (
                  <p className="text-[10px] font-bold text-red-600 mt-1.5 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Emisi melebihi batas (threshold) sektor!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state if no sector selected */}
      {!selectedSector && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-slate-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-600">Pilih Sektor Industri</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Silakan pilih sektor usaha perusahaan Anda di atas untuk menampilkan
              <br />
              formulir perhitungan emisi yang sesuai.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
