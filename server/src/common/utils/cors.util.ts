/**
 * CORS Origin Validator for RekaKarbon Server
 *
 * Provides origin verification supporting:
 * 1. Missing origins (curl, mobile apps, server-to-server)
 * 2. Exact match against allowedOrigins
 * 3. Wildcard pattern matching (e.g. 'https://*.rekakarbon.id', 'http://192.168.*:*')
 * 4. Automatic RFC 1918 private LAN subnets & loopback in development mode
 */

const PRIVATE_LAN_REGEXES: RegExp[] = [
  // Loopback (localhost, 127.0.0.1)
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  // RFC 1918 Class C (192.168.0.0/16)
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  // RFC 1918 Class A (10.0.0.0/8)
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  // RFC 1918 Class B (172.16.0.0/12 -> 172.16.x.x - 172.31.x.x)
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  // mDNS local network domains (*.local, *.lan)
  /^https?:\/\/[a-zA-Z0-9-]+\.(local|lan)(:\d+)?$/,
];

export function isAllowedOrigin(
  origin: string | undefined,
  allowedOrigins: string[],
  isDev: boolean = process.env.NODE_ENV !== 'production',
): boolean {
  // 1. Allow requests with no origin header (mobile apps, server-to-server, curl)
  if (!origin) {
    return true;
  }

  // 2. Universal wildcard allowed
  if (allowedOrigins.includes('*')) {
    return true;
  }

  // 3. Exact origin match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // 4. Wildcard pattern matching (e.g. 'https://*.rekakarbon.id')
  const matchesWildcard = allowedOrigins.some((pattern) => {
    if (!pattern.includes('*')) return false;
    const regexPattern =
      '^' +
      pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') +
      '$';
    return new RegExp(regexPattern).test(origin);
  });
  if (matchesWildcard) {
    return true;
  }

  // 5. Automatic private network / LAN allowance in development mode
  if (isDev) {
    const isPrivateLan = PRIVATE_LAN_REGEXES.some((regex) =>
      regex.test(origin),
    );
    if (isPrivateLan) {
      return true;
    }
  }

  return false;
}
