import type { Config } from '@react-router/dev/config';

export default {
  appDirectory: 'src',
  ssr: false,
  async prerender() {
    return [
      '/',
      '/portal',
      '/portal/emitter',
      '/portal/auditor',
      '/portal/regulator',
      '/portal/kth',
    ];
  },
} satisfies Config;
