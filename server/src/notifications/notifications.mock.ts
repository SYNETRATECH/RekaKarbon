import type { SystemNotification } from '../types/notification';

export const MOCK_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'f1a2b3c4-0080-4000-8000-000000000001',
    title: 'Defisit Kuota Emisi PTBAE-PU',
    message:
      'PT Semen Nusantara Tuban mencatat defisit 2.330 tCO2e (118.6% dari kuota). Pembekuan alokasi aktif jika offset belum ditebus.',
    type: 'cap_breach',
    priority: 'critical',
    isRead: false,
    actionUrl: '/emitter/compliance',
    createdAt: '2026-02-14T09:30:00.000Z',
  },
  {
    id: 'f1a2b3c4-0080-4000-8000-000000000002',
    title: 'Divergensi dMRV Terdeteksi',
    message:
      'Sensor CEMS Kiln vs konsumsi batubara PT Pembangkit Kalimantan divergen (Skor Anomali: 0.89). Butuh verifikasi auditor.',
    type: 'dmrv_anomaly',
    priority: 'high',
    isRead: false,
    actionUrl: '/audit',
    createdAt: '2026-02-14T08:15:00.000Z',
  },
  {
    id: 'f1a2b3c4-0080-4000-8000-000000000003',
    title: 'Multi-Sig Treasury Menunggu Persetujuan',
    message:
      'Permintaan pencairan insentif KTH Mangrove Tuban Mandiri Rp 450.000.000 membutuhkan 1 tanda tangan verifikator lagi.',
    type: 'multisig_action',
    priority: 'medium',
    isRead: true,
    actionUrl: '/governance',
    createdAt: '2026-02-12T14:00:00.000Z',
  },
];
