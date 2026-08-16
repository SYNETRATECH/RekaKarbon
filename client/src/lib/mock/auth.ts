export interface MockUser {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'emitter' | 'regulator' | 'auditor' | 'kth';
  roleTitle: string;
  agency: string;
  avatar: string;
  verichainKey: string;
  token: string;
}

export const mockUsers: Record<string, MockUser> = {
  emitter: {
    id: 'USR-EMITTER-01',
    email: 'admin@semennusantara.co.id',
    password: 'password123',
    name: 'Ir. Budi Santoso',
    role: 'emitter',
    roleTitle: 'HSE Director',
    agency: 'PT Semen Nusantara Tuban',
    avatar: 'BS',
    verichainKey: 'VCH-CORP-99412',
    token: 'mock-jwt-vch-emitter-token-99412',
  },
  regulator: {
    id: 'USR-REGULATOR-01',
    email: '198204122008011004@klhk.go.id',
    password: 'password123',
    name: 'Dr. Ir. Ahmad Fauzi',
    role: 'regulator',
    roleTitle: 'Direktur Pengawasan KLHK & DJP',
    agency: 'KLHK & Kemenkeu RI',
    avatar: 'AF',
    verichainKey: 'VCH-GOV-ID-7721',
    token: 'mock-jwt-vch-regulator-token-7721',
  },
  auditor: {
    id: 'USR-AUDITOR-01',
    email: 'auditor.rian@sucofindo.co.id',
    password: 'password123',
    name: 'Auditor LVV',
    role: 'auditor',
    roleTitle: 'Verifikator Independen',
    agency: 'PT Sucofindo / Mutu Agung',
    avatar: 'LV',
    verichainKey: 'VCH-AUDIT-44819',
    token: 'mock-jwt-vch-auditor-token-44819',
  },
  kth: {
    id: 'USR-KTH-01',
    email: 'sutrisno@kthbaluran.org',
    password: 'password123',
    name: 'Sutrisno',
    role: 'kth',
    roleTitle: 'Ketua Kelompok Tani Hutan',
    agency: 'KTH Wana Lestari Baluran',
    avatar: 'ST',
    verichainKey: 'VCH-KTH-33109',
    token: 'mock-jwt-vch-kth-token-33109',
  },
};
