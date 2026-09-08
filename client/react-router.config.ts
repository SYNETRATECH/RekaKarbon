import type { Config } from '@react-router/dev/config';

export default {
  appDirectory: 'src',
  ssr: false,
  async prerender() {
    return [
      '/',
      '/dashboard',
      '/portal',
      '/bursa',
      '/laporan',
      '/sertifikat',
      '/forest',
      '/projects',
      '/kth',
      '/transactions',
      '/upload',
      '/audit',
      '/spatial',
      '/drone',
      '/gate',
      '/polygon',
      '/wallet',
      '/settings',
      '/admin/dashboard',
      '/admin/users',
      '/admin/kyb',
    ];
  },
} satisfies Config;
