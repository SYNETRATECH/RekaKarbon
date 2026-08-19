import type { AnomalySummary, AiAnomalyLog, EnergyCorrelationItem } from '../../types';

export const mockAnomalySummary: AnomalySummary = {
  emitenTerdeteksiAnomali: 12,
  totalEmitenAktif: 47,
  rataDeviasiEmisi: 43.2,
  descDeviasi: 'Under-reporting terdeteksi',
  eFakturTidakCocok: 8,
  descEFaktur: 'Data utilitas energi divergen',
};

export const mockAiAnomalyLogs: AiAnomalyLog[] = [
  {
    id: 'd4e5f6a7-0004-4000-8000-000000000001',
    company: 'PT Semen Nusantara Jaya',
    sector: 'Industri Semen',
    anomalyScore: 0.94,
    deltaElectricity: 38.2,
    deltaCoal: 41.5,
    deltaGas: 12.1,
    eFakturMatch: false,
    priority: 'critical',
    reportedEmission: 80,
    estimatedEmission: 420,
    desc: 'Deviasi ekstrem konsumsi batu bara kiln vs emisi cerobong CEMS yang dilaporkan rendah.',
    auditStatus: 'pending',
  },
  {
    id: 'd4e5f6a7-0004-4000-8000-000000000002',
    company: 'PT Pembangkit Kalimantan',
    sector: 'Energi & Utilitas',
    anomalyScore: 0.89,
    deltaElectricity: 22.7,
    deltaCoal: 35.9,
    deltaGas: 28.4,
    eFakturMatch: false,
    priority: 'critical',
    reportedEmission: 0,
    estimatedEmission: 430,
    desc: 'Divergensi signifikan antara data e-Faktur pengadaan bahan bakar thermal dan sensor SO2.',
    auditStatus: 'pending',
  },
  {
    id: 'd4e5f6a7-0004-4000-8000-000000000003',
    company: 'PT Petrokimia Selatan',
    sector: 'Petrokimia',
    anomalyScore: 0.85,
    deltaElectricity: 18.4,
    deltaCoal: 9.2,
    deltaGas: 44.6,
    eFakturMatch: true,
    priority: 'high',
    reportedEmission: 0,
    estimatedEmission: 120,
    desc: 'Lonjakan konsumsi gas alam sintesis tidak sebanding dengan laporan output emisi berkala.',
    auditStatus: 'pending',
  },
  {
    id: 'd4e5f6a7-0004-4000-8000-000000000004',
    company: 'PT Baja Timur Indonesia',
    sector: 'Industri Baja',
    anomalyScore: 0.81,
    deltaElectricity: 29.8,
    deltaCoal: 52.3,
    deltaGas: 6.7,
    eFakturMatch: false,
    priority: 'high',
    reportedEmission: 0,
    estimatedEmission: 240,
    desc: 'Anomali peleburan Electric Arc Furnace (EAF) terdeteksi oleh algoritma Isolation Forest.',
    auditStatus: 'pending',
  },
  {
    id: 'd4e5f6a7-0004-4000-8000-000000000005',
    company: 'PT Palm Agro Resources',
    sector: 'Perkebunan & Agro',
    anomalyScore: 0.76,
    deltaElectricity: 11.2,
    deltaCoal: 4.8,
    deltaGas: 31.9,
    eFakturMatch: true,
    priority: 'medium',
    reportedEmission: 20,
    estimatedEmission: 150,
    desc: 'Penggunaan biogas generator limbah cair POME belum terkalibrasi penuh pada ledger dMRV.',
    auditStatus: 'pending',
  },
];

export const mockEnergyCorrelationData: EnergyCorrelationItem[] = [
  { name: 'Semen Nusantara', reported: 80, estimated: 420 },
  { name: 'PLTU Kalimantan', reported: 0, estimated: 430 },
  { name: 'Petrokimia Selatan', reported: 0, estimated: 120 },
  { name: 'Baja Timur', reported: 0, estimated: 240 },
  { name: 'Palm Agro', reported: 20, estimated: 150 },
];

export const mockSpatialSummary = {
  totalAreaTerverifikasi: '286.7k ha',
  subArea: '3 kawasan aktif',
  totalKreditKarbon: '601.2k',
  subKredit: 'tCO2e tervalidasi',
  blokadeAwan: '1 Area',
  subAwan: 'Butuh ground-truth drone',
};

export const mockConservationAreas = [
  {
    id: 'a1b2c3d4-0010-4000-8000-000000000001',
    name: 'Hutan Konservasi Baluran',
    location: 'Banyuwangi, Jawa Timur',
    areaHectares: 25000,
    ndvi: 0.78,
    evi: 0.62,
    carbonCredit: 48750,
    cloudCover: '12%',
    status: 'verified', // 'verified' | 'drone_required' | 'pending'
    statusLabel: 'Terverifikasi',
    coordinates: [
      [-7.83, 114.38],
      [-7.83, 114.45],
      [-7.9, 114.45],
      [-7.9, 114.38],
    ],
  },
  {
    id: 'a1b2c3d4-0010-4000-8000-000000000002',
    name: 'Restorasi Gambut Katingan',
    location: 'Katingan, Kalimantan Tengah',
    areaHectares: 142000,
    ndvi: 0.71,
    evi: 0.54,
    carbonCredit: 284300,
    cloudCover: '67%',
    status: 'drone_required',
    statusLabel: 'Drone Required',
    coordinates: [
      [-2.45, 113.12],
      [-2.45, 113.35],
      [-2.75, 113.35],
      [-2.75, 113.12],
    ],
  },
  {
    id: 'a1b2c3d4-0010-4000-8000-000000000003',
    name: 'Hutan Lindung Leuser',
    location: 'Aceh, Sumatera',
    areaHectares: 88500,
    ndvi: 0.83,
    evi: 0.69,
    carbonCredit: 193700,
    cloudCover: '8%',
    status: 'verified',
    statusLabel: 'Terverifikasi',
    coordinates: [
      [3.5, 97.45],
      [3.5, 97.75],
      [3.2, 97.75],
      [3.2, 97.45],
    ],
  },
  {
    id: 'a1b2c3d4-0010-4000-8000-000000000004',
    name: 'Mangrove Pesisir Berau',
    location: 'Berau, Kalimantan Timur',
    areaHectares: 31200,
    ndvi: 0.65,
    evi: 0.48,
    carbonCredit: 74500,
    cloudCover: '29%',
    status: 'pending',
    statusLabel: 'Pending',
    coordinates: [
      [2.15, 117.7],
      [2.15, 117.95],
      [1.9, 117.95],
      [1.9, 117.7],
    ],
  },
];

export const mockDroneArchive = {
  areaName: 'Restorasi Gambut Katingan',
  location: 'Katingan, Kalimantan Tengah',
  cloudCover: '67% awan',
  layers: [
    { id: 'orto', title: 'Ortofoto', status: 'Tersedia', statusType: 'ready', icon: 'camera' },
    {
      id: 'canopy',
      title: 'Canopy Height',
      status: 'Proses...',
      statusType: 'processing',
      icon: 'layers',
    },
    { id: 'dsm', title: 'DSM/DEM', status: 'Antrian', statusType: 'queued', icon: 'activity' },
  ],
};

export const mockDroneSchedules = {
  period: '2025–2030',
  year1: {
    title: 'Tahun Pertama',
    subTitle: '4× / tahun (Triwulanan)',
    badge: '4× / tahun',
    slots: [
      { month: 'Jan', status: 'done', label: '✓ Selesai' },
      { month: 'Apr', status: 'done', label: '✓ Selesai' },
      { month: 'Jul', status: 'scheduled', label: '• Terjadwal' },
      { month: 'Okt', status: 'upcoming', label: '○ Mendatang' },
    ],
  },
  year2: {
    title: 'Tahun Kedua',
    subTitle: '3× / tahun (Caturwulanan)',
    badge: '3× / tahun',
    slots: [
      { month: 'Jan', status: 'upcoming', label: '○ Mendatang' },
      { month: 'Mei', status: 'upcoming', label: '○ Mendatang' },
      { month: 'Sep', status: 'upcoming', label: '○ Mendatang' },
    ],
  },
  year3to5: {
    title: 'Tahun Ketiga–Kelima',
    subTitle: '1× / tahun',
    badge: '1× / tahun',
    slots: [{ month: 'Jun', status: 'upcoming', label: '○ Mendatang' }],
  },
};

export const mockCertificationPreview = {
  project: 'Hutan Konservasi Baluran',
  location: 'Banyuwangi, Jawa Timur',
  areaHectares: 25000,
  carbonCreditSPE: 48750,
  ndvi: 0.78,
  evi: 0.62,
  verifier: 'Dr. Andika Putra Wijaya, SH',
  confidenceScore: 94,
  confidenceLevel: 'Sangat Tinggi',
  auditDate: '2025-07-17',
};

export const mockDroneScans = [
  {
    id: 'd1e2f3a4-0011-4000-8000-000000000001',
    location: 'TN Baluran Sector A',
    avgHeightMeters: 1.85,
    status: 'passed',
    date: '2026-08-10',
  },
  {
    id: 'd1e2f3a4-0011-4000-8000-000000000002',
    location: 'TN Gunung Leuser Zone B',
    avgHeightMeters: 2.1,
    status: 'passed',
    date: '2026-08-12',
  },
];

export const mockKthPolygons = [
  {
    id: 'e1f2a3b4-0012-4000-8000-000000000001',
    name: 'Petak Hutan Tani Baluran Timur',
    areaHectares: 120,
    estimatedCO2e: 4500,
    status: 'Active dMRV',
  },
];

export const mockKthLogs = [
  {
    id: 'f1a2b3c4-0013-4000-8000-000000000001',
    date: '2026-08-01',
    type: 'Foto Geotag',
    desc: 'Penanaman 500 bibit mangrove zona pesisir',
    verified: true,
  },
  {
    id: 'f1a2b3c4-0013-4000-8000-000000000002',
    date: '2026-08-10',
    type: 'Scan Drone Triwulanan',
    desc: 'Pemindaian CHM kanopi pohon tahun I',
    verified: true,
  },
];
