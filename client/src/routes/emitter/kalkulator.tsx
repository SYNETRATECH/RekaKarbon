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
} from 'lucide-react';
import { formatCarbon } from '@/lib/formatters';

// ─── Constants & Emission Factors (DEFRA 2023 Standard) ────────────────
const EMISSION_FACTORS: Record<string, number> = {
  // Scope 1 - Combustion
  diesel_liter: 2.512,           // Solar/Diesel (kg CO₂e/L)
  gasoline_liter: 2.105,         // Bensin/Petrol (kg CO₂e/L) 
  lpg_kg: 2.939,                 // LPG (kg CO₂e/kg)
  natural_gas_m3: 2.023,         // Gas alam (kg CO₂e/m³)
  coal_kg: 2.531,                // Batu bara (kg CO₂e/kg)
  heavy_fuel_oil_liter: 3.168,   // MFO/Heavy Fuel Oil (kg CO₂e/L)
  
  // Scope 1 - Fugitive
  refrigerant_kg: 2088,          // Refrigerant R-410A (kg CO₂e/kg)
  co2_fire_ext_kg: 1.000,        // CO₂ pemadam (kg CO₂/kg)
  
  // Scope 1 - Process (Industrial Averages)
  cement_clinker_ton: 525,       // Semen clinker (kg CO₂/ton)
  lime_ton: 750,                 // Kapur (kg CO₂/ton)
  
  // Scope 1 - Agriculture (IPCC Averages)
  fertilizer_urea_kg: 0.733,     // Urea - N₂O (kg CO₂e/kg)
  rice_paddy_ha: 5110,           // Padi sawah - CH₄ (kg CO₂e/ha/season)
  livestock_cattle_head: 2070,   // Sapi potong - CH₄ (kg CO₂e/head/year)
  
  // Scope 2 (Grid Electricity)
  electricity_kwh: 0.207,        // Listrik (kg CO₂e/kWh) - Grid Average 2023
  
  // Scope 3
  flight_km: 0.244,             // Penerbangan domestik (kg CO₂e/passenger-km)
  car_km: 0.171,                // Mobil penumpang rata-rata (kg CO₂e/km)
  paper_kg: 0.895,              // Kertas & kardus (kg CO₂e/kg)
  water_m3: 0.149,              // Air suplai (kg CO₂e/m³)
  waste_landfill_ton: 588.9,    // Limbah komersial ke TPA (kg CO₂e/ton)
  waste_incineration_ton: 21.3, // Limbah pembakaran/insinerasi (kg CO₂e/ton)
  freight_tkm: 0.119,           // Truk logistik HGV rata-rata (kg CO₂e/ton-km)
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
  icon: 'factory' | 'zap' | 'truck' | 'flame' | 'droplets' | 'wind' | 'recycle' | 'trees' | 'thermometer';
  color: string;
  fields: FormField[];
}

interface SectorDef {
  id: string;
  name: string;
  description: string;
  categories: CategoryDef[];
}

const SECTORS: SectorDef[] = [
  {
    id: 'manufaktur',
    name: 'Manufaktur & Industri',
    description: 'Pabrik, pengolahan, dan produksi barang',
    categories: [
      {
        id: 'man_s1_combustion', title: 'Pembakaran Stasioner', description: 'Genset, boiler, furnace di area pabrik',
        scope: 1, icon: 'flame', color: 'bg-red-100 text-red-700',
        fields: [
          { id: 'genset_diesel', label: 'Solar Genset/Boiler', unit: 'Liter', placeholder: '500', emissionFactorKey: 'diesel_liter', scope: 1 },
          { id: 'natural_gas', label: 'Gas Alam (Furnace/Dryer)', unit: 'm³', placeholder: '1200', emissionFactorKey: 'natural_gas_m3', scope: 1 },
          { id: 'coal', label: 'Batu Bara (Boiler)', unit: 'kg', placeholder: '3000', emissionFactorKey: 'coal_kg', scope: 1 },
          { id: 'heavy_fuel', label: 'Minyak Bakar (MFO/HFO)', unit: 'Liter', placeholder: '200', emissionFactorKey: 'heavy_fuel_oil_liter', scope: 1 },
        ],
      },
      {
        id: 'man_s1_mobile', title: 'Armada & Kendaraan Operasional', description: 'Forklift, truk internal, kendaraan dinas',
        scope: 1, icon: 'truck', color: 'bg-orange-100 text-orange-700',
        fields: [
          { id: 'vehicle_diesel', label: 'Solar Kendaraan/Forklift', unit: 'Liter', placeholder: '800', emissionFactorKey: 'diesel_liter', scope: 1 },
          { id: 'vehicle_gasoline', label: 'Bensin Kendaraan Dinas', unit: 'Liter', placeholder: '300', emissionFactorKey: 'gasoline_liter', scope: 1 },
          { id: 'lpg_forklift', label: 'LPG Forklift', unit: 'kg', placeholder: '150', emissionFactorKey: 'lpg_kg', scope: 1 },
        ],
      },
      {
        id: 'man_s1_fugitive', title: 'Emisi Fugitif', description: 'Kebocoran refrigerant AC, APAR CO₂',
        scope: 1, icon: 'wind', color: 'bg-sky-100 text-sky-700',
        fields: [
          { id: 'refrigerant', label: 'Isi Ulang Refrigerant (AC/Chiller)', unit: 'kg', placeholder: '5', emissionFactorKey: 'refrigerant_kg', scope: 1 },
          { id: 'co2_extinguisher', label: 'APAR CO₂ (Pemadam)', unit: 'kg', placeholder: '10', emissionFactorKey: 'co2_fire_ext_kg', scope: 1 },
        ],
      },
      {
        id: 'man_s2', title: 'Konsumsi Listrik', description: 'Daya dari PLN atau penyedia listrik lain',
        scope: 2, icon: 'zap', color: 'bg-amber-100 text-amber-700',
        fields: [
          { id: 'electricity', label: 'Listrik PLN (Total Pabrik + Kantor)', unit: 'kWh', placeholder: '50000', emissionFactorKey: 'electricity_kwh', scope: 2 },
        ],
      },
      {
        id: 'man_s3', title: 'Rantai Pasok & Lainnya', description: 'Logistik, perjalanan dinas, limbah',
        scope: 3, icon: 'recycle', color: 'bg-blue-100 text-blue-700',
        fields: [
          { id: 'freight', label: 'Logistik Bahan Baku/Produk', unit: 'ton-km', placeholder: '20000', emissionFactorKey: 'freight_tkm', scope: 3 },
          { id: 'flight', label: 'Perjalanan Dinas (Pesawat)', unit: 'passenger-km', placeholder: '5000', emissionFactorKey: 'flight_km', scope: 3 },
          { id: 'waste', label: 'Limbah ke TPA', unit: 'ton', placeholder: '50', emissionFactorKey: 'waste_landfill_ton', scope: 3 },
          { id: 'water', label: 'Konsumsi Air PDAM', unit: 'm³', placeholder: '1000', emissionFactorKey: 'water_m3', scope: 3 },
        ],
      },
    ],
  },
  {
    id: 'pertambangan',
    name: 'Pertambangan & Energi',
    description: 'Pertambangan mineral, batu bara, minyak & gas',
    categories: [
      {
        id: 'mine_s1_heavy', title: 'Alat Berat & Genset', description: 'Excavator, dump truck, genset tambang',
        scope: 1, icon: 'factory', color: 'bg-red-100 text-red-700',
        fields: [
          { id: 'heavy_diesel', label: 'Solar Alat Berat (Excavator, Dump Truck)', unit: 'Liter', placeholder: '50000', emissionFactorKey: 'diesel_liter', scope: 1 },
          { id: 'genset_mine', label: 'Solar Genset Tambang', unit: 'Liter', placeholder: '10000', emissionFactorKey: 'diesel_liter', scope: 1 },
        ],
      },
      {
        id: 'mine_s1_fugitive', title: 'Emisi Fugitif & Proses', description: 'Debu, gas metana, peledakan',
        scope: 1, icon: 'wind', color: 'bg-sky-100 text-sky-700',
        fields: [
          { id: 'explosive', label: 'Bahan Peledak (ANFO)', unit: 'kg', placeholder: '500', emissionFactorKey: 'diesel_liter', scope: 1 },
          { id: 'refrigerant_mine', label: 'Isi Ulang Refrigerant', unit: 'kg', placeholder: '10', emissionFactorKey: 'refrigerant_kg', scope: 1 },
        ],
      },
      {
        id: 'mine_s2', title: 'Konsumsi Listrik', description: 'Daya PLN untuk processing plant',
        scope: 2, icon: 'zap', color: 'bg-amber-100 text-amber-700',
        fields: [
          { id: 'electricity_mine', label: 'Listrik PLN (Processing Plant)', unit: 'kWh', placeholder: '200000', emissionFactorKey: 'electricity_kwh', scope: 2 },
        ],
      },
      {
        id: 'mine_s3', title: 'Transportasi & Limbah', description: 'Hauling, logistik material',
        scope: 3, icon: 'truck', color: 'bg-blue-100 text-blue-700',
        fields: [
          { id: 'hauling', label: 'Transportasi Material (Hauling)', unit: 'ton-km', placeholder: '100000', emissionFactorKey: 'freight_tkm', scope: 3 },
          { id: 'waste_mine', label: 'Limbah Tambang ke TPA', unit: 'ton', placeholder: '200', emissionFactorKey: 'waste_landfill_ton', scope: 3 },
        ],
      },
    ],
  },
  {
    id: 'perbankan',
    name: 'Perbankan & Jasa Keuangan',
    description: 'Bank, asuransi, fintech, sekuritas',
    categories: [
      {
        id: 'bank_s1', title: 'Kendaraan Dinas & Refrigerant', description: 'Mobil dinas, AC gedung kantor',
        scope: 1, icon: 'flame', color: 'bg-red-100 text-red-700',
        fields: [
          { id: 'vehicle_bank', label: 'BBM Kendaraan Dinas', unit: 'Liter', placeholder: '500', emissionFactorKey: 'gasoline_liter', scope: 1 },
          { id: 'genset_bank', label: 'Solar Genset Kantor', unit: 'Liter', placeholder: '200', emissionFactorKey: 'diesel_liter', scope: 1 },
          { id: 'refrigerant_bank', label: 'Isi Ulang Refrigerant AC', unit: 'kg', placeholder: '3', emissionFactorKey: 'refrigerant_kg', scope: 1 },
        ],
      },
      {
        id: 'bank_s2', title: 'Konsumsi Listrik Gedung', description: 'AC, server, penerangan, lift',
        scope: 2, icon: 'zap', color: 'bg-amber-100 text-amber-700',
        fields: [
          { id: 'electricity_bank', label: 'Listrik PLN (Gedung Kantor + Cabang)', unit: 'kWh', placeholder: '80000', emissionFactorKey: 'electricity_kwh', scope: 2 },
        ],
      },
      {
        id: 'bank_s3', title: 'Perjalanan & Operasional Kantor', description: 'Penerbangan, komuter, kertas, air',
        scope: 3, icon: 'truck', color: 'bg-blue-100 text-blue-700',
        fields: [
          { id: 'flight_bank', label: 'Perjalanan Dinas (Pesawat)', unit: 'passenger-km', placeholder: '10000', emissionFactorKey: 'flight_km', scope: 3 },
          { id: 'commute_bank', label: 'Komuter Karyawan (Mobil)', unit: 'km', placeholder: '50000', emissionFactorKey: 'car_km', scope: 3 },
          { id: 'paper_bank', label: 'Konsumsi Kertas', unit: 'kg', placeholder: '500', emissionFactorKey: 'paper_kg', scope: 3 },
          { id: 'water_bank', label: 'Konsumsi Air PDAM', unit: 'm³', placeholder: '300', emissionFactorKey: 'water_m3', scope: 3 },
          { id: 'waste_bank', label: 'Limbah Kantor ke TPA', unit: 'ton', placeholder: '5', emissionFactorKey: 'waste_landfill_ton', scope: 3 },
        ],
      },
    ],
  },
  {
    id: 'konstruksi',
    name: 'Konstruksi & Properti',
    description: 'Kontraktor, pengembang, infrastruktur',
    categories: [
      {
        id: 'con_s1', title: 'Alat Berat & Genset Proyek', description: 'Crane, excavator, concrete mixer',
        scope: 1, icon: 'factory', color: 'bg-red-100 text-red-700',
        fields: [
          { id: 'heavy_con', label: 'Solar Alat Berat', unit: 'Liter', placeholder: '20000', emissionFactorKey: 'diesel_liter', scope: 1 },
          { id: 'genset_con', label: 'Solar Genset Proyek', unit: 'Liter', placeholder: '5000', emissionFactorKey: 'diesel_liter', scope: 1 },
          { id: 'vehicle_con', label: 'BBM Kendaraan Operasional', unit: 'Liter', placeholder: '1000', emissionFactorKey: 'diesel_liter', scope: 1 },
        ],
      },
      {
        id: 'con_s1_process', title: 'Emisi Proses Material', description: 'Semen, kapur, aspal',
        scope: 1, icon: 'thermometer', color: 'bg-orange-100 text-orange-700',
        fields: [
          { id: 'cement', label: 'Penggunaan Site-Mix Semen', unit: 'ton', placeholder: '500', emissionFactorKey: 'cement_clinker_ton', scope: 1 },
          { id: 'lime', label: 'Penggunaan Kapur', unit: 'ton', placeholder: '100', emissionFactorKey: 'lime_ton', scope: 1 },
        ],
      },
      {
        id: 'con_s2', title: 'Konsumsi Listrik', description: 'Listrik proyek & kantor',
        scope: 2, icon: 'zap', color: 'bg-amber-100 text-amber-700',
        fields: [
          { id: 'electricity_con', label: 'Listrik PLN (Proyek + Kantor)', unit: 'kWh', placeholder: '30000', emissionFactorKey: 'electricity_kwh', scope: 2 },
        ],
      },
      {
        id: 'con_s3', title: 'Transportasi & Limbah', description: 'Logistik material, limbah konstruksi',
        scope: 3, icon: 'recycle', color: 'bg-blue-100 text-blue-700',
        fields: [
          { id: 'freight_con', label: 'Transportasi Material', unit: 'ton-km', placeholder: '50000', emissionFactorKey: 'freight_tkm', scope: 3 },
          { id: 'waste_con', label: 'Limbah Konstruksi', unit: 'ton', placeholder: '100', emissionFactorKey: 'waste_landfill_ton', scope: 3 },
        ],
      },
    ],
  },
  {
    id: 'pertanian',
    name: 'Pertanian & Perkebunan',
    description: 'Sawah, kebun sawit, peternakan, perikanan',
    categories: [
      {
        id: 'agri_s1_mobile', title: 'Mesin & Kendaraan Pertanian', description: 'Traktor, pompa irigasi, kendaraan kebun',
        scope: 1, icon: 'flame', color: 'bg-red-100 text-red-700',
        fields: [
          { id: 'tractor_diesel', label: 'Solar Traktor/Mesin Pertanian', unit: 'Liter', placeholder: '2000', emissionFactorKey: 'diesel_liter', scope: 1 },
          { id: 'pump_diesel', label: 'Solar Pompa Irigasi', unit: 'Liter', placeholder: '500', emissionFactorKey: 'diesel_liter', scope: 1 },
        ],
      },
      {
        id: 'agri_s1_bio', title: 'Emisi Biologis & Pupuk', description: 'Metana sawah, N₂O pupuk, ternak',
        scope: 1, icon: 'trees', color: 'bg-green-100 text-green-700',
        fields: [
          { id: 'urea', label: 'Penggunaan Pupuk Urea', unit: 'kg', placeholder: '5000', emissionFactorKey: 'fertilizer_urea_kg', scope: 1 },
          { id: 'rice_paddy', label: 'Luas Sawah Padi (per musim)', unit: 'ha', placeholder: '20', emissionFactorKey: 'rice_paddy_ha', scope: 1 },
          { id: 'cattle', label: 'Jumlah Sapi Potong/Perah', unit: 'ekor', placeholder: '50', emissionFactorKey: 'livestock_cattle_head', scope: 1 },
        ],
      },
      {
        id: 'agri_s2', title: 'Konsumsi Listrik', description: 'Cold storage, irigasi elektrik, kantor',
        scope: 2, icon: 'zap', color: 'bg-amber-100 text-amber-700',
        fields: [
          { id: 'electricity_agri', label: 'Listrik PLN', unit: 'kWh', placeholder: '15000', emissionFactorKey: 'electricity_kwh', scope: 2 },
        ],
      },
      {
        id: 'agri_s3', title: 'Distribusi & Limbah', description: 'Logistik hasil panen, limbah organik',
        scope: 3, icon: 'truck', color: 'bg-blue-100 text-blue-700',
        fields: [
          { id: 'freight_agri', label: 'Logistik Hasil Panen', unit: 'ton-km', placeholder: '10000', emissionFactorKey: 'freight_tkm', scope: 3 },
          { id: 'waste_agri', label: 'Limbah Organik', unit: 'ton', placeholder: '30', emissionFactorKey: 'waste_landfill_ton', scope: 3 },
        ],
      },
    ],
  },
  {
    id: 'perhotelan',
    name: 'Perhotelan & Pariwisata',
    description: 'Hotel, resort, restoran, wisata',
    categories: [
      {
        id: 'hotel_s1', title: 'Genset, LPG & Refrigerant', description: 'Genset cadangan, dapur LPG, AC/Chiller',
        scope: 1, icon: 'flame', color: 'bg-red-100 text-red-700',
        fields: [
          { id: 'genset_hotel', label: 'Solar Genset', unit: 'Liter', placeholder: '500', emissionFactorKey: 'diesel_liter', scope: 1 },
          { id: 'lpg_hotel', label: 'LPG Dapur', unit: 'kg', placeholder: '300', emissionFactorKey: 'lpg_kg', scope: 1 },
          { id: 'refrigerant_hotel', label: 'Isi Ulang Refrigerant (AC/Chiller)', unit: 'kg', placeholder: '8', emissionFactorKey: 'refrigerant_kg', scope: 1 },
          { id: 'vehicle_hotel', label: 'BBM Kendaraan Shuttle', unit: 'Liter', placeholder: '200', emissionFactorKey: 'diesel_liter', scope: 1 },
        ],
      },
      {
        id: 'hotel_s2', title: 'Konsumsi Listrik', description: 'AC, laundry, lift, penerangan',
        scope: 2, icon: 'zap', color: 'bg-amber-100 text-amber-700',
        fields: [
          { id: 'electricity_hotel', label: 'Listrik PLN (Seluruh Properti)', unit: 'kWh', placeholder: '100000', emissionFactorKey: 'electricity_kwh', scope: 2 },
        ],
      },
      {
        id: 'hotel_s3', title: 'Operasional & Limbah', description: 'Laundry, limbah F&B, konsumsi air',
        scope: 3, icon: 'recycle', color: 'bg-blue-100 text-blue-700',
        fields: [
          { id: 'water_hotel', label: 'Konsumsi Air PDAM', unit: 'm³', placeholder: '3000', emissionFactorKey: 'water_m3', scope: 3 },
          { id: 'waste_hotel', label: 'Limbah F&B/Organik', unit: 'ton', placeholder: '20', emissionFactorKey: 'waste_landfill_ton', scope: 3 },
          { id: 'flight_hotel', label: 'Perjalanan Dinas (Pesawat)', unit: 'passenger-km', placeholder: '3000', emissionFactorKey: 'flight_km', scope: 3 },
        ],
      },
    ],
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

  // All field values stored as { [fieldId]: string }
  const [values, setValues] = useState<Record<string, string>>({});

  const selectedSector = useMemo(
    () => SECTORS.find((s) => s.id === selectedSectorId) ?? null,
    [selectedSectorId]
  );

  const categories = selectedSector?.categories ?? [];
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

    let s1 = 0, s2 = 0, s3 = 0;
    for (const cat of selectedSector.categories) {
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

  const handleApply = () => {
    alert(
      `Ringkasan Emisi (${selectedSector?.name}):\n\n` +
      `Scope 1: ${scope1.toFixed(4)} tCO₂e\n` +
      `Scope 2: ${scope2.toFixed(4)} tCO₂e\n` +
      `Scope 3: ${scope3.toFixed(4)} tCO₂e\n\n` +
      `TOTAL: ${total.toFixed(4)} tCO₂e\n\n` +
      `Data ini dapat digunakan sebagai referensi untuk laporan emisi Anda.`
    );
    navigate('/laporan');
  };

  // ─── Render ──────────────────────────────────────────────────────
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
            Alat bantu perhitungan estimasi emisi GRK berbasis sektor industri. Pilih sektor usaha Anda,
            lalu isi data aktivitas per kategori emisi (Scope 1, 2, 3).
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

      {/* ── Sector Selector ────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Sektor Industri</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Pilih sektor usaha perusahaan Anda untuk menampilkan form yang relevan</p>
          </div>
        </div>
        <Select value={selectedSectorId ?? ''} onValueChange={handleSectorChange}>
          <SelectTrigger className="h-12 rounded-xl text-sm font-bold max-w-lg border-slate-200">
            <SelectValue placeholder="— Pilih Sektor Industri —" />
          </SelectTrigger>
          <SelectContent>
            {SECTORS.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="flex items-center gap-2">
                  {SECTOR_ICONS[s.id]}
                  <span className="font-bold">{s.name}</span>
                  <span className="text-slate-400 text-xs ml-1">— {s.description}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeCategoryIdx === idx ? cat.color : 'bg-slate-200 text-slate-500'
                }`}>
                  {ICON_MAP[cat.icon]}
                </div>
                <div>
                  <h4 className={`text-xs font-extrabold leading-snug ${activeCategoryIdx === idx ? 'text-slate-900' : 'text-slate-600'}`}>
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
              <div className="space-y-8 max-w-xl animate-in slide-in-from-right-4 fade-in duration-300" key={activeCategory.id}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      activeCategory.scope === 1 ? 'bg-red-100 text-red-700'
                      : activeCategory.scope === 2 ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                    }`}>
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
                        {field.label} <span className="text-slate-400 font-semibold">({field.unit})</span>
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
                  <span className="text-sm font-black text-red-900 font-mono">{formatCarbon(scope1)}</span>
                </div>
                <div className="bg-amber-50 rounded-xl py-2 px-4 border border-amber-100 text-center min-w-[120px]">
                  <span className="text-[9px] font-bold text-amber-500 block uppercase">Scope 2</span>
                  <span className="text-sm font-black text-amber-900 font-mono">{formatCarbon(scope2)}</span>
                </div>
                <div className="bg-blue-50 rounded-xl py-2 px-4 border border-blue-100 text-center min-w-[120px]">
                  <span className="text-[9px] font-bold text-blue-500 block uppercase">Scope 3</span>
                  <span className="text-sm font-black text-blue-900 font-mono">{formatCarbon(scope3)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                <div className="bg-emerald-50 rounded-2xl py-3 px-5 flex items-center justify-between border border-emerald-100 w-full sm:w-auto shrink-0 gap-8">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wide">Total Emisi GRK</span>
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
                    >
                      Selanjutnya <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  ) : (
                    <Button
                      className="w-full sm:w-auto px-6 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                      onClick={handleApply}
                    >
                      <Save className="w-4 h-4 mr-1.5" /> Selesai & Simpan Data
                    </Button>
                  )}
                </div>
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
              Silakan pilih sektor usaha perusahaan Anda di atas untuk menampilkan<br />
              formulir perhitungan emisi yang sesuai.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
