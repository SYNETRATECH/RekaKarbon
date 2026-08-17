import { redirect } from 'react-router';

const DEFAULT_TABS: Record<string, string> = {
  emitter: 'compliance',
  regulator: 'forest',
  auditor: 'audit',
  kth: 'polygon',
};

export function clientLoader({ params }: { params: Record<string, string | undefined> }) {
  const role = params.role || 'emitter';
  const defaultTab = DEFAULT_TABS[role] || 'compliance';
  return redirect(`/portal/${role}/${defaultTab}`);
}

export default function PortalRoleIndexRoute() {
  return null;
}
