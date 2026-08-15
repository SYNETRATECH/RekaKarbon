export const mockMultiSigRequests = [
  {
    id: 'MS-001',
    action: 'Pembelian 2.330 tCO2e Token DEX',
    requester: 'Admin Operasional',
    status: 'Pending',
    requiredSignatures: 2,
    currentSignatures: 1,
  },
  {
    id: 'MS-002',
    action: 'Eksekusi Burn 100 Fraksi Token',
    requester: 'Compliance Manager',
    status: 'Approved',
    requiredSignatures: 2,
    currentSignatures: 2,
  },
];

export const mockKybQueue = [
  {
    id: 'KYB-881',
    companyName: 'PT Bio Kertas Karawang',
    nib: '912030491823',
    documentStatus: 'Verified',
    webAuthnStatus: 'Pending',
    dateSubmitted: '12 Agu 2026',
  },
  {
    id: 'KYB-882',
    companyName: 'PT Smelter Alumunium Bontang',
    nib: '810293810293',
    documentStatus: 'In Review',
    webAuthnStatus: 'Disabled',
    dateSubmitted: '14 Agu 2026',
  },
];

export const mockDjpLogs = [
  {
    id: 'DJP-2026-001',
    company: 'PT Semen Nusantara Tuban',
    taxInvoiceNo: '010.000-26.00000891',
    deficit: 2330,
    totalFineIDR: 1514500000,
    status: 'Reconciled',
  },
  {
    id: 'DJP-2026-002',
    company: 'PLTU Suralaya Unit 1-8',
    taxInvoiceNo: '010.000-26.00000892',
    deficit: 12500,
    totalFineIDR: 8125000000,
    status: 'Pending e-Faktur',
  },
];
