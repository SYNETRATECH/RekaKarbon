import { redirect } from 'react-router';

export function clientLoader() {
  return redirect('/portal/emitter');
}

export default function PortalIndexRoute() {
  return null;
}
