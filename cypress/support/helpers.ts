
// ////////////////////////////////////////////////////////////////////////////
// Simulated JWT

/** Single permission encoded in a simulated JWT. Prefix and suffix are joined with underscore (e.g. 'role_admin'). */
export type LoginPerm = { prefix: string; suffix: string };

/**
 * Generate a valid JWT token for testing that passes the frontend expiration check.
 * Uses base64url encoding and a far-future expiration timestamp. Note it is a simulation, there is no real signature.
 * @param permissions Optional list of permissions to encode in token. Multiple suffixes of the same prefix
 * are comma-separated in a single claim.
 * Example: `[{ prefix: 'role', suffix: 'admin,operator' }]` will end up as `'role_admin'` and `'role_operator'`.
 * @returns JWT token as string.
 */
export function createTestJwt(permissions: LoginPerm[] = []): string {
  const encode = (obj: object): string =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const now = Math.floor(Date.now() / 1000);
  const claims: Record<string, string | number> = {
    sub: 'test@example.com',
    name: 'Test User',
    iat: now - 60,
    exp: now + 86_400 * 365, // 1 year from now
  };

  // Encode permissions as custom claims (example: 'role' claim with value 'admin' -> 'role_admin').
  for (const perm of permissions) {
    const existing = claims[perm.prefix];
    claims[perm.prefix] = typeof existing === 'string' ? `${existing},${perm.suffix}` : perm.suffix;
  }

  return [encode({ alg: 'HS256', typ: 'JWT' }), encode(claims), 'fake-signature'].join('.');
}
