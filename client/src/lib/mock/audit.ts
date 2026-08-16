export const mockAnomalySummary = {
  emitenTerdeteksiAnomali: 12,
  totalEmitenAktif: 47,
  rataDeviasiEmisi: '+43.2%',
  descDeviasi: 'Under-reporting terdeteksi',
  eFakturTidakCocok: 8,
  descEFaktur: 'Data utilitas energi divergen',
};

export const mockAiAnomalyLogs = [
  {
    id: 'IND-001',
    company: 'PT Semen Nusantara Jaya',
    sector: 'Industri Semen',
    anomalyScore: 0.94,
    deltaElectricity: '+38.2%',
    deltaCoal: '+41.5%',
    deltaGas: '+12.1%',
    eFakturMatch: false,
    priority: 'KRITIS',
    reportedEmission: 80,
    estimatedEmission: 420,
    desc: 'Deviasi ekstrem konsumsi batu bara kiln vs emisi cerobong CEMS yang dilaporkan rendah.',
    auditStatus: 'Pending',
  },
  {
    id: 'IND-002',
    company: 'PT Pembangkit Kalimantan',
    sector: 'Energi & Utilitas',
    anomalyScore: 0.89,
    deltaElectricity: '+22.7%',
    deltaCoal: '+35.9%',
    deltaGas: '+28.4%',
    eFakturMatch: false,
    priority: 'KRITIS',
    reportedEmission: 0,
    estimatedEmission: 430,
    desc: 'Divergensi signifikan antara data e-Faktur pengadaan bahan bakar thermal dan sensor SO2.',
    auditStatus: 'Pending',
  },
  {
    id: 'IND-003',
    company: 'PT Petrokimia Selatan',
    sector: 'Petrokimia',
    anomalyScore: 0.85,
    deltaElectricity: '+18.4%',
    deltaCoal: '+9.2%',
    deltaGas: '+44.6%',
    eFakturMatch: true,
    priority: 'TINGGI',
    reportedEmission: 0,
    estimatedEmission: 120,
    desc: 'Lonjakan konsumsi gas alam sintesis tidak sebanding dengan laporan output emisi berkala.',
    auditStatus: 'Pending',
  },
  {
    id: 'IND-004',
    company: 'PT Baja Timur Indonesia',
    sector: 'Industri Baja',
    anomalyScore: 0.81,
    deltaElectricity: '+29.8%',
    deltaCoal: '+52.3%',
    deltaGas: '+6.7%',
    eFakturMatch: false,
    priority: 'TINGGI',
    reportedEmission: 0,
    estimatedEmission: 240,
    desc: 'Anomali peleburan Electric Arc Furnace (EAF) terdeteksi oleh algoritma Isolation Forest.',
    auditStatus: 'Pending',
  },
  {
    id: 'IND-005',
    company: 'PT Palm Agro Resources',
    sector: 'Perkebunan & Agro',
    anomalyScore: 0.76,
    deltaElectricity: '+11.2%',
    deltaCoal: '+4.8%',
    deltaGas: '+31.9%',
    eFakturMatch: true,
    priority: 'SEDANG',
    reportedEmission: 20,
    estimatedEmission: 150,
    desc: 'Penggunaan biogas generator limbah cair POME belum terkalibrasi penuh pada ledger dMRV.',
    auditStatus: 'Pending',
  },
];

export const mockEnergyCorrelationData = [
  { name: 'Semen Nusantara', reported: 80, estimated: 420 },
  { name: 'PLTU Kalimantan', reported: 0, estimated: 430 },
  { name: 'Petrokimia Selatan', reported: 0, estimated: 120 },
  { name: 'Baja Timur', reported: 0, estimated: 240 },
  { name: 'Palm Agro', reported: 20, estimated: 150 },
];

export const mockDroneScans = [
  {
    id: 'CHM-BL-01',
    location: 'TN Baluran Sector A',
    avgHeightMeters: 1.85,
    status: 'Lolos Kriterium (>= 1.5m)',
    date: '10 Agu 2026',
  },
  {
    id: 'CHM-GL-02',
    location: 'TN Gunung Leuser Zone B',
    avgHeightMeters: 2.1,
    status: 'Lolos Kriterium (>= 1.5m)',
    date: '12 Agu 2026',
  },
];

export const mockKthPolygons = [
  {
    id: 'POL-01',
    name: 'Petak Hutan Tani Baluran Timur',
    areaHectares: 120,
    estimatedCO2e: 4500,
    status: 'Active dMRV',
  },
];

export const mockKthLogs = [
  {
    id: 'LOG-101',
    date: '01 Agu 2026',
    type: 'Foto Geotag',
    desc: 'Penanaman 500 bibit mangrove zona pesisir',
    verified: true,
  },
  {
    id: 'LOG-102',
    date: '10 Agu 2026',
    type: 'Scan Drone Triwulanan',
    desc: 'Pemindaian CHM kanopi pohon tahun I',
    verified: true,
  },
];
