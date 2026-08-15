export const mockAiAnomalyLogs = [
  {
    id: 'ANM-901',
    company: 'PT Tekstil Maju Bandung',
    riskScore: 12,
    flag: 'Normal',
    desc: 'Korelasi utilitas listrik CEMS & kapasitas produksi konsisten.',
  },
  {
    id: 'ANM-902',
    company: 'PLTU Suralaya Unit 1-8',
    riskScore: 84,
    flag: 'Anomali Terdeteksi',
    desc: 'Penurunan emisi cerobong 30% tidak sesuai tren pembelian batu bara.',
  },
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
