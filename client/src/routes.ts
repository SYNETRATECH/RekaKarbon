import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('portal', 'routes/portal._index.tsx'),
  route('portal/:role', 'routes/portal.$role.tsx', [
    index('routes/portal.$role._index.tsx'),
    route(':tab', 'routes/portal.$role.$tab.tsx'),
  ]),
  route('*', 'routes/$.tsx'),
] satisfies RouteConfig;
