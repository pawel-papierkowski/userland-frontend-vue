// ////////////////////////////////////////////////////////////////////////////
// Simulated JWT

/** Single permission encoded in a simulated JWT. */
export type JwtPerm = { prefix: string; suffix: string };

/** Options for customizing a generated JWT token. */
export interface JwtOptions {
  /** Token expiration date. Default: 1 day from now. */
  expiresAt?: Date;
  /** Token issuance date. Default: current time minus 60 seconds. */
  issuedAt?: Date;
  /** Subject claim (typically email). Default: 'test@example.com'. */
  subject?: string;
  /**
   * Custom name claim (user display name). Default: 'Test User'.
   * Set to null to omit the name claim entirely from the token.
   */
  name?: string | null;
}

/**
 * Generate a valid JWT token.
 * Uses base64url encoding and a far-future expiration timestamp. Note: it is a simulation; there is no real signature.
 * @param permissions Optional list of permissions to encode in token. Multiple suffixes of the same prefix
 * are comma-separated in a single claim.
 * Example: `[{ prefix: 'role', suffix: 'admin,operator' }]` will end up as `'role_admin'` and `'role_operator'`.
 * @param options Optional token claim overrides.
 * @returns JWT token as string.
 */
export function genJwt(permissions: JwtPerm[] = [], options: JwtOptions = {}): string {
  const encode = (obj: object): string =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const perms: Record<string, string> = {};
  // Encode permissions as custom claims (example: 'role' claim with value 'admin' -> 'role_admin').
  for (const perm of permissions) {
    const existing = perms[perm.prefix];
    perms[perm.prefix] = typeof existing === 'string' ? `${existing},${perm.suffix}` : perm.suffix;
  }

  const now = Math.floor(Date.now() / 1000);
  const claims: Record<string, string | number | Record<string, string>> = {
    iat: options.issuedAt ? Math.floor(options.issuedAt.getTime() / 1000) : now - 60,
    exp: options.expiresAt ? Math.floor(options.expiresAt.getTime() / 1000) : now + 60 * 60 * 24,
    sub: options.subject ?? 'test@example.com',
    perms: perms,
  };
  // Only include name claim if not explicitly omitted (null).
  if (options.name !== null) {
    claims.name = options.name ?? 'Test User';
  }

  return [encode({ alg: 'HS256', typ: 'JWT' }), encode(claims), 'fake-signature'].join('.');
}
