import { type RouteConfig, index, route, layout } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('login', 'routes/login.tsx'),
  route('portal', 'routes/portal_alias.tsx'),

  // Shared Authenticated Portal Layout
  layout('routes/app.tsx', [
    route('dashboard', 'routes/dashboard.tsx'),

    // Emitter Routes
    route('bursa', 'routes/emitter/bursa.tsx'),
    route('laporan', 'routes/emitter/laporan.tsx'),
    route('sertifikat', 'routes/emitter/sertifikat.tsx'),

    // Regulator Routes
    route('forest', 'routes/regulator/forest.tsx'),
    route('projects', 'routes/regulator/projects.tsx'),
    route('project-editor', 'routes/regulator/project-editor.tsx'),
    route('kth', 'routes/regulator/kth.tsx'),
    route('transactions', 'routes/regulator/transactions.tsx'),
    route('upload', 'routes/regulator/upload.tsx'),

    // Auditor Routes
    route('audit', 'routes/auditor/audit.tsx'),
    route('spatial', 'routes/auditor/spatial.tsx'),
    route('drone', 'routes/auditor/drone.tsx'),
    route('gate', 'routes/auditor/gate.tsx'),

    // KTH Routes
    route('polygon', 'routes/kth/polygon.tsx'),
    route('wallet', 'routes/kth/wallet.tsx'),

    // Settings
    route('settings', 'routes/settings.tsx'),
  ]),

  // Catch-all 404 page
  route('*', 'routes/$.tsx'),
] satisfies RouteConfig;
