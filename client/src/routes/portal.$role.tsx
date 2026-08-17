import { Outlet, useParams } from 'react-router';
import PortalLayout from '../portal/layouts/PortalLayout';

export default function PortalRoleRoute() {
  const { role } = useParams();

  // Validate role or render PortalLayout
  return <PortalLayout />;
}
