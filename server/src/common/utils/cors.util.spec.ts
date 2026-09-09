import { isAllowedOrigin } from './cors.util';

describe('isAllowedOrigin', () => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://app.rekakarbon.id',
    'https://*.rekakarbon.id',
    'https://rekakarbon.farrelad.com',
    'https://*.farrelad.com',
  ];

  it('allows requests with missing or undefined origin (curl, mobile, server-to-server)', () => {
    expect(isAllowedOrigin(undefined, allowedOrigins, false)).toBe(true);
    expect(isAllowedOrigin('', allowedOrigins, false)).toBe(true);
  });

  it('allows universal wildcard when configured in allowedOrigins', () => {
    expect(isAllowedOrigin('http://evil.com', ['*'], false)).toBe(true);
  });

  it('allows exact matches in production and development', () => {
    expect(
      isAllowedOrigin('http://localhost:5173', allowedOrigins, false),
    ).toBe(true);
    expect(
      isAllowedOrigin('https://app.rekakarbon.id', allowedOrigins, false),
    ).toBe(true);
    expect(
      isAllowedOrigin('https://rekakarbon.farrelad.com', allowedOrigins, false),
    ).toBe(true);
  });

  it('matches wildcard domain patterns', () => {
    expect(
      isAllowedOrigin('https://preview.rekakarbon.id', allowedOrigins, false),
    ).toBe(true);
    expect(
      isAllowedOrigin('https://admin.rekakarbon.id', allowedOrigins, false),
    ).toBe(true);
    expect(
      isAllowedOrigin('https://api.farrelad.com', allowedOrigins, false),
    ).toBe(true);
    expect(
      isAllowedOrigin('https://staging.farrelad.com', allowedOrigins, false),
    ).toBe(true);
    expect(
      isAllowedOrigin('https://otherdomain.com', allowedOrigins, false),
    ).toBe(false);
  });

  it('handles trailing slashes gracefully on incoming origin or configured patterns', () => {
    // Incoming origin with trailing slash
    expect(
      isAllowedOrigin(
        'https://rekakarbon.farrelad.com/',
        allowedOrigins,
        false,
      ),
    ).toBe(true);
    expect(
      isAllowedOrigin('https://app.rekakarbon.id/', allowedOrigins, false),
    ).toBe(true);

    // Configured allowed origin containing trailing slash
    const originsWithTrailingSlash = [
      'https://rekakarbon.farrelad.com/',
      'https://*.farrelad.com/',
    ];
    expect(
      isAllowedOrigin(
        'https://rekakarbon.farrelad.com',
        originsWithTrailingSlash,
        false,
      ),
    ).toBe(true);
    expect(
      isAllowedOrigin(
        'https://api.farrelad.com',
        originsWithTrailingSlash,
        false,
      ),
    ).toBe(true);
  });

  describe('Development Mode (isDev = true)', () => {
    it('automatically allows local network Wi-Fi IP (192.168.x.x)', () => {
      expect(
        isAllowedOrigin('http://192.168.58.209:5173', allowedOrigins, true),
      ).toBe(true);
      expect(
        isAllowedOrigin('http://192.168.1.100:3000', allowedOrigins, true),
      ).toBe(true);
      expect(
        isAllowedOrigin('http://192.168.0.1:8080', allowedOrigins, true),
      ).toBe(true);
    });

    it('automatically allows RFC 1918 Class A (10.x.x.x)', () => {
      expect(
        isAllowedOrigin('http://10.0.0.15:5173', allowedOrigins, true),
      ).toBe(true);
      expect(
        isAllowedOrigin('http://10.100.200.1:3000', allowedOrigins, true),
      ).toBe(true);
    });

    it('automatically allows RFC 1918 Class B (172.16-31.x.x)', () => {
      expect(
        isAllowedOrigin('http://172.16.0.5:5173', allowedOrigins, true),
      ).toBe(true);
      expect(
        isAllowedOrigin('http://172.31.255.254:5173', allowedOrigins, true),
      ).toBe(true);
      // 172.32 is not in RFC 1918 private range
      expect(
        isAllowedOrigin('http://172.32.0.1:5173', allowedOrigins, true),
      ).toBe(false);
    });

    it('automatically allows loopback with any port in dev', () => {
      expect(
        isAllowedOrigin('http://127.0.0.1:8080', allowedOrigins, true),
      ).toBe(true);
      expect(
        isAllowedOrigin('http://localhost:4173', allowedOrigins, true),
      ).toBe(true);
    });

    it('rejects arbitrary public domains even in dev', () => {
      expect(
        isAllowedOrigin('http://malicious-site.com', allowedOrigins, true),
      ).toBe(false);
      expect(
        isAllowedOrigin('https://phishing.com', allowedOrigins, true),
      ).toBe(false);
    });
  });

  describe('Production Mode (isDev = false)', () => {
    it('does NOT automatically allow LAN IPs if not in allowedOrigins list', () => {
      expect(
        isAllowedOrigin('http://192.168.58.209:5173', allowedOrigins, false),
      ).toBe(false);
      expect(
        isAllowedOrigin('http://10.0.0.15:5173', allowedOrigins, false),
      ).toBe(false);
    });

    it('allows LAN IP in production if explicitly listed in allowedOrigins', () => {
      const prodOrigins = [...allowedOrigins, 'http://192.168.58.209:5173'];
      expect(
        isAllowedOrigin('http://192.168.58.209:5173', prodOrigins, false),
      ).toBe(true);
    });
  });
});
