import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useLoginStore } from '@/stores/login.ts';
import { genJwt } from '@/__tests__/_helpers/jwt.ts';
import type { LoginState } from '@/code/data/app/types.ts';

vi.mock('@/code/utils/logger.ts', () => ({
  logger: {
    warn: vi.fn<(msg: string) => void>(),
    error: vi.fn<(msg: string) => void>(),
    info: vi.fn<(msg: string) => void>(),
    debug: vi.fn<(msg: string) => void>(),
  },
}));

// ////////////////////////////////////////////////////////////////////////////
// Helpers.

/**
 * Verifies that login state has default (unlogged) values.
 * @param loginStore Pinia store with login state.
 */
const verifyEmptyLoginStore = (loginStore: { loginState: LoginState }) => {
  expect(loginStore.loginState.isLogged).toBe(false);
  expect(loginStore.loginState.token).toBe('');
  expect(loginStore.loginState.username).toBe('');
  expect(loginStore.loginState.email).toBe('');
  expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
  expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(0));
  expect(loginStore.loginState.permissions).toStrictEqual([]);
};

// ////////////////////////////////////////////////////////////////////////////

/** Tests useLoginStore. */
describe('useLoginStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-22T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // //////////////////////////////////////////////////////////////////////////
  // General.

  describe('general', () => {
    it('initializes with default state', () => {
      // Arrange: Create store (fresh Pinia in beforeEach).

      // Act: No action needed, checking initial state.

      // Assert: All fields are at their default values.
      const loginStore = useLoginStore();
      expect(loginStore.loginState.isLogged).toBe(false); // only to remove IDE warning about missing assertions, as IDE does not understand verifyEmptyLoginStore() has assertions
      verifyEmptyLoginStore(loginStore);
    });

    it('resetLoginState returns clean state', () => {
      // Arrange: Create store and apply a valid token to dirty the state.
      const loginStore = useLoginStore();
      loginStore.applyToken(genJwt());

      // Act: Call resetLoginState.
      const resetState = loginStore.resetLoginState();

      // Assert: Returned state has all default values.
      expect(resetState.isLogged).toBe(false);
      expect(resetState.token).toBe('');
      expect(resetState.username).toBe('');
      expect(resetState.email).toBe('');
      expect(resetState.issuedAt).toStrictEqual(new Date(0));
      expect(resetState.expiresAt).toStrictEqual(new Date(0));
      expect(resetState.permissions).toStrictEqual([]);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // applyToken - valid tokens.

  describe('applyToken', () => {
    describe('valid token', () => {
      it('accepts valid non-expired token', () => {
        // Arrange: Create a valid token.
        const loginStore = useLoginStore();
        const token = genJwt();

        // Act: Apply the token.
        const result = loginStore.applyToken(token);

        // Assert: Token was accepted.
        expect(result).toBe(true);
        expect(loginStore.loginState.isLogged).toBe(true);
        expect(loginStore.loginState.token).toBe(token);
      });

      it('extracts email from sub claim', () => {
        // Arrange: Create a token with a specific subject.
        const loginStore = useLoginStore();
        const token = genJwt([], { subject: 'user@domain.com' });

        // Act: Apply the token.
        loginStore.applyToken(token);

        // Assert: Email matches the sub claim.
        expect(loginStore.loginState.email).toBe('user@domain.com');
      });

      it('extracts username from name claim', () => {
        // Arrange: Create a token with a specific name.
        const loginStore = useLoginStore();
        const token = genJwt([], { name: 'John Doe' });

        // Act: Apply the token.
        loginStore.applyToken(token);

        // Assert: Username matches the name claim.
        expect(loginStore.loginState.username).toBe('John Doe');
      });

      it('converts iat/exp to Date objects', () => {
        // Arrange: Create a token with specific dates.
        const loginStore = useLoginStore();
        const issuedAt = new Date('2026-05-22T10:00:00Z');
        const expiresAt = new Date('2026-05-22T22:00:00Z');
        const token = genJwt([], { issuedAt, expiresAt });

        // Act: Apply the token.
        loginStore.applyToken(token);

        // Assert: Dates are correctly converted.
        expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(issuedAt.getTime()));
        expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(expiresAt.getTime()));
      });

      it('works when name claim is missing', () => {
        // Arrange: Create a token without a name claim.
        const loginStore = useLoginStore();
        const token = genJwt([], { name: null });

        // Act: Apply the token.
        loginStore.applyToken(token);

        // Assert: Username defaults to empty string.
        expect(loginStore.loginState.username).toBe('');
        expect(loginStore.loginState.isLogged).toBe(true);
      });

      it('works when perms claim is missing', () => {
        // Arrange: Create a token without permissions.
        const loginStore = useLoginStore();
        const token = genJwt([]);

        // Act: Apply the token.
        loginStore.applyToken(token);

        // Assert: Permissions defaults to empty array.
        expect(loginStore.loginState.permissions).toStrictEqual([]);
        expect(loginStore.loginState.isLogged).toBe(true);
      });
    });

    // ////////////////////////////////////////////////////////////////////////
    // applyToken - permissions.

    describe('permissions', () => {
      it('parses single permission', () => {
        // Arrange: Create a token with one permission.
        const loginStore = useLoginStore();
        const token = genJwt([{ prefix: 'role', suffix: 'admin' }]);

        // Act: Apply the token.
        loginStore.applyToken(token);

        // Assert: Permission is correctly parsed.
        expect(loginStore.loginState.permissions).toStrictEqual(['role_admin']);
      });

      it('parses multiple permissions with same prefix', () => {
        // Arrange: Create a token with two permissions under the same prefix.
        const loginStore = useLoginStore();
        const token = genJwt([
          { prefix: 'role', suffix: 'admin' },
          { prefix: 'role', suffix: 'operator' },
        ]);

        // Act: Apply the token.
        loginStore.applyToken(token);

        // Assert: Both permissions are parsed.
        expect(loginStore.loginState.permissions).toStrictEqual(['role_admin', 'role_operator']);
      });

      it('parses permissions across multiple prefixes', () => {
        // Arrange: Create a token with permissions across different prefixes.
        const loginStore = useLoginStore();
        const token = genJwt([
          { prefix: 'role', suffix: 'admin' },
          { prefix: 'user', suffix: 'edit' },
        ]);

        // Act: Apply the token.
        loginStore.applyToken(token);

        // Assert: Permissions from both prefixes are parsed.
        expect(loginStore.loginState.permissions).toStrictEqual(['role_admin', 'user_edit']);
      });

      it('parses comma-separated suffixes from JWT', () => {
        // Arrange: Create a token with multiple suffixes in a single prefix.
        const loginStore = useLoginStore();
        const token = genJwt([{ prefix: 'role', suffix: 'admin,operator' }]);

        // Act: Apply the token.
        loginStore.applyToken(token);

        // Assert: Comma-separated suffixes are split into individual permissions.
        expect(loginStore.loginState.permissions).toStrictEqual(['role_admin', 'role_operator']);
      });
    });

    // ////////////////////////////////////////////////////////////////////////
    // applyToken - invalid tokens.

    describe('invalid token', () => {
      it('rejects empty string', () => {
        // Arrange: Create a store.
        const loginStore = useLoginStore();

        // Act: Apply an empty string.
        const result = loginStore.applyToken('');

        // Assert: Token was rejected, state remains default.
        expect(result).toBe(false);
        verifyEmptyLoginStore(loginStore);
      });

      it('rejects malformed token', () => {
        // Arrange: Create a store.
        const loginStore = useLoginStore();

        // Act: jwtDecode throws for malformed tokens; state was already reset before the throw.
        let thrown = false;
        try {
          loginStore.applyToken('not-a-jwt');
        } catch {
          thrown = true;
        }

        // Assert: Error was thrown and state remains at defaults.
        expect(thrown).toBe(true);
        verifyEmptyLoginStore(loginStore);
      });

      it('rejects expired token', () => {
        // Arrange: Create a store and a token that expired 5 minutes ago.
        const loginStore = useLoginStore();
        const expiredAt = new Date('2026-05-22T11:55:00Z');
        const token = genJwt([], { expiresAt: expiredAt });

        // Act: Apply the expired token.
        const result = loginStore.applyToken(token);

        // Assert: Token was rejected.
        expect(result).toBe(false);
        expect(loginStore.loginState.isLogged).toBe(false);
      });

      it('resets previous state before applying new token', () => {
        // Arrange: Apply a valid token first.
        const loginStore = useLoginStore();
        const validToken = genJwt([{ prefix: 'role', suffix: 'admin' }]);
        loginStore.applyToken(validToken);
        expect(loginStore.loginState.isLogged).toBe(true);

        // Act: Apply an expired token.
        const expiredToken = genJwt([], { expiresAt: new Date('2026-05-22T11:55:00Z') });
        const result = loginStore.applyToken(expiredToken);

        // Assert: State was reset to defaults.
        expect(result).toBe(false);
        verifyEmptyLoginStore(loginStore);
      });
    });

    // ////////////////////////////////////////////////////////////////////////
    // applyToken - edge cases.

    describe('edge cases', () => {
      it('treats exp=0 as expired', () => {
        // Arrange: Manually create a token with exp=0 (epoch).
        const loginStore = useLoginStore();
        const token = genJwt([], { expiresAt: new Date(0) });

        // Act: Apply the token.
        const result = loginStore.applyToken(token);

        // Assert: Token is rejected because epoch is in the past.
        expect(result).toBe(false);
        expect(loginStore.loginState.isLogged).toBe(false);
      });

      it('handles token with iat=0', () => {
        // Arrange: Create a token with issuedAt at epoch.
        const loginStore = useLoginStore();
        const token = genJwt([], { issuedAt: new Date(0) });

        // Act: Apply the token.
        const result = loginStore.applyToken(token);

        // Assert: Token is accepted (expiration is still in the future).
        expect(result).toBe(true);
        expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
      });
    });
  });
});
