import { type RouteConfig, index, route, layout } from '@react-router/dev/routes';

export default [
  index('routes/public/index.tsx'),
  route('login', 'routes/public/login.tsx'),
  route('portal-transparansi', 'routes/public/portal-transparansi.tsx'),
  route('portal', 'routes/public/portal-transparansi.tsx', { id: 'routes/public/portal' }),
  route('verifikasi-sertifikat', 'routes/public/certificate-verification.tsx'),
  route('regulator', 'routes/regulator/reports.tsx', { id: 'routes/public/regulator' }),
  route('regulator/reports', 'routes/regulator/reports.tsx', {
    id: 'routes/public/regulator-reports',
  }),

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
      route('regulator/bursa', 'routes/regulator/bursa.tsx'),
      route('auditor-assignments', 'routes/regulator/auditor-assignments.tsx'),
    ]),

    // Auditor Protected Routes
    layout('routes/guards/auditor.tsx', [
      route('audit', 'routes/auditor/emission-reports.tsx', { id: 'routes/auditor/audit' }),
      route('spatial', 'routes/auditor/spatial.tsx'),
      route('drone', 'routes/auditor/drone.tsx'),
      route('gate', 'routes/auditor/gate.tsx'),
      route('audit/ptbae', 'routes/auditor/ptbae.tsx'),
      route('audit/emission-reports', 'routes/auditor/emission-reports.tsx', {
        id: 'routes/auditor/emission-reports',
      }),
      route('audit/forest-projects', 'routes/auditor/forest-projects.tsx'),
    ]),

    // KTH Protected Routes
    layout('routes/guards/kth.tsx', [
      route('polygon', 'routes/kth/dashboard.tsx'),
      route('wallet', 'routes/kth/wallet.tsx'),
      route('kth/bursa', 'routes/kth/bursa.tsx'),
    ]),

    // Emitter Protected Routes (emitter + buyer roles)
    layout('routes/guards/emitter.tsx', [
      route('bursa', 'routes/emitter/bursa.tsx'),
      route('laporan', 'routes/emitter/laporan.tsx'),
      route('pengajuan-ptbae', 'routes/emitter/ptbae.tsx'),
      route('kalkulator', 'routes/emitter/kalkulator.tsx'),
      route('sertifikat', 'routes/emitter/sertifikat.tsx'),
      route('dompet', 'routes/emitter/wallet.tsx'),
    ]),

    // Ministry PTBAE-PU Protected Routes
    layout('routes/guards/ministry.tsx', [
      route('ministry/applications', 'routes/ministry/applications.tsx'),
    ]),

    // Admin Protected Routes (superadmin + admin roles)
    layout('routes/guards/admin.tsx', [
      route('admin/dashboard', 'routes/admin/dashboard.tsx'),
      route('admin/users', 'routes/admin/users.tsx'),
      route('admin/kyb', 'routes/admin/kyb.tsx'),
    ]),
  ]),

  // Catch-all 404 page
  route('*', 'routes/$.tsx'),
] satisfies RouteConfig;
