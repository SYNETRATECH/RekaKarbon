import { authRepository } from '../../repositories';

/**
 * Reusable Authorization Helper for React Router Layout Guards
 * Inspects the authenticated user's role and throws 401 or 403 HTTP Responses if unauthorized.
 */
export async function requireRole(allowedRoles: string[], resourceName: string) {
  const user = await authRepository.getCurrentUser().catch(() => null);

  if (!user || !user.role) {
    throw new Response('Sesi login telah berakhir', {
      status: 401,
      statusText: 'Unauthorized',
    });
  }

  const role = typeof user.role === 'string' ? user.role.toLowerCase() : '';

  if (!allowedRoles.includes(role)) {
    throw new Response(
      `Akun Anda (${user.role}) tidak memiliki wewenang untuk mengakses halaman ${resourceName}.`,
      {
        status: 403,
        statusText: 'Forbidden',
      }
    );
  }

  return { user };
}
