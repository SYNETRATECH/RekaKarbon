import { type RouteConfig, index, route, layout } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('login', 'routes/login.tsx'),
  route('portal', 'routes/portal_alias.tsx'),

  // Shared Authenticated Portal Shell
  layout('routes/app.tsx', [
    // Shared Authenticated Routes
    route('dashboard', 'routes/dashboard.tsx'),
    route('settings', 'routes/settings.tsx'),
    route('profile', 'routes/profile.tsx'),

    // Regulator Protected Routes
    layout('routes/guards/regulator.tsx', [
      route('forest', 'routes/regulator/dashboard.tsx'),
      route('projects', 'routes/regulator/projects.tsx'),
      route('project-editor', 'routes/regulator/project-editor.tsx'),
      route('kth', 'routes/regulator/kth.tsx'),
      route('transactions', 'routes/regulator/transactions.tsx'),
      route('upload', 'routes/regulator/upload.tsx'),
    ]),

    // Auditor Protected Routes
    layout('routes/guards/auditor.tsx', [
      route('audit', 'routes/auditor/dashboard.tsx'),
      route('spatial', 'routes/auditor/spatial.tsx'),
      route('drone', 'routes/auditor/drone.tsx'),
      route('gate', 'routes/auditor/gate.tsx'),
    ]),

    // KTH Protected Routes
    layout('routes/guards/kth.tsx', [
      route('polygon', 'routes/kth/dashboard.tsx'),
      route('wallet', 'routes/kth/wallet.tsx'),
    ]),

    // Emitter Protected Routes (emitter + buyer roles)
    layout('routes/guards/emitter.tsx', [
      route('bursa', 'routes/emitter/bursa.tsx'),
      route('laporan', 'routes/emitter/laporan.tsx'),
      route('kalkulator', 'routes/emitter/kalkulator.tsx'),
      route('sertifikat', 'routes/emitter/sertifikat.tsx'),
      route('dompet', 'routes/emitter/wallet.tsx'),
    ]),
  ]),

  // Catch-all 404 page
  route('*', 'routes/$.tsx'),
] satisfies RouteConfig;
