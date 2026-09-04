import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { AxiosResponse } from 'axios';

import backendApiUser from '@/services/features/api-users.ts';

import { useMessageStore } from '@/stores/messages/messages.ts';
import { useLoginStore } from '@/stores/login.ts';
import { AppLoginer } from '@/code/wrappers/login/AppLoginer.ts';

import { EnMessageLevel } from '@/code/wrappers/messages/types.ts';
import { locstJwt } from '@/code/data/app/storage.ts';
import type { LoginState } from '@/code/data/app/types.ts';

vi.mock('@/services/features/api-users.ts', () => ({
  default: {
    logout: vi.fn<typeof backendApiUser.logout>(() => Promise.resolve({} as AxiosResponse<unknown>)), // Return a resolved promise
    prolong: vi.fn<typeof backendApiUser.prolong>(() => Promise.resolve({} as AxiosResponse<unknown>)), // Return a resolved promise
  },
}));

//

/**
 * Options for creating test JWT token.
 */
interface JwtTokenOptions {
  /** When token was issued. Default: current system time (fake time). */
  issuedAt?: Date;
  /** When token expires. Default: 6 hours after token was issued. */
  expiresAt?: Date;
}

/**
 * Create a JWT token for tests.
 * Permissions are encoded the same way as on backend: field 'perm' as map where key is prefix and value is string with suffixes separated by comma.
 * Example: permission 'role_admin' is stored as field 'role' with value 'admin', 'user_edit' is stored as field 'user' with value 'edit', and so on.
 * Note: signature is a dummy, as tests do not verify it.
 * @param permissions List of permissions to encode in token. Example: ['role_admin', 'user_view', 'user_edit'].
 * @param options Optional custom dates.
 * @returns JWT token.
 */
const createTestToken = (permissions: string[], options: JwtTokenOptions = {}): string => {
  const issuedAt = options.issuedAt ?? new Date();
  const expiresAt = options.expiresAt ?? new Date(issuedAt.getTime() + 6 * 60 * 60 * 1000);

  // Group permissions by their prefix, e.g. 'role_admin' and 'role_operator' are stored as role: 'admin,operator'.
  const permissionFields: Record<string, string[]> = {};
  for (const permission of permissions) {
    const separatorIndex = permission.indexOf('_');
    const prefix = permission.slice(0, separatorIndex);
    const suffix = permission.slice(separatorIndex + 1);

    if (!permissionFields[prefix]) permissionFields[prefix] = [];
    permissionFields[prefix].push(suffix);
  }

  const perms: Record<string, string> = {};
  for (const [prefix, suffixes] of Object.entries(permissionFields)) {
    perms[prefix] = suffixes.join(',');
  }

  const payload: Record<string, string | number | Record<string, string>> = {
    // Standard claims.
    iat: Math.floor(issuedAt.getTime() / 1000),
    exp: Math.floor(expiresAt.getTime() / 1000),
    sub: 'pawel.papierkowski@gmail.com',
    // Custom claims.
    name: 'Paweł Papierkowski',
    perms: perms,
  };

  // Base64Url encode JSON and put it together with a dummy signature (tests do not verify it).
  const encode = (value: unknown): string => {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  };

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.dummy-signature`;
};

/**
 * Verifies that login state is unlogged.
 * @param loginStore Pinia storage with login state.
 */
const verifyEmptyLoginStore = (loginStore: { loginState: LoginState }) => {
  // If you are unlogged, login state is always same.
  expect(loginStore.loginState.isLogged).toBe(false);
  expect(loginStore.loginState.token).toBe('');
  expect(loginStore.loginState.username).toBe('');
  expect(loginStore.loginState.email).toBe('');
  expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
  expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(0));
  expect(loginStore.loginState.permissions).toStrictEqual([]);
};

// ////////////////////////////////////////////////////////////////////////////

/** Tests AppLoginer class. */
describe('AppLoginer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // //////////////////////////////////////////////////////////////////////////
  // Logging in.

  describe('logs in', () => {
    it('not at all', () => {
      const loginStore = useLoginStore();
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));

      // No arrange or act: this is default state of login store.

      // Assert: AppLoginer returns correct results (user is not logged in).
      expect(AppLoginer.isLogged()).toBe(false);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: Verify content of login store.
      verifyEmptyLoginStore(loginStore);
    });

    it('as standard user', () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const loginStore = useLoginStore();

      // Arrange: Create valid token for user without any permissions.
      const token = createTestToken([]);

      // Act: Log in user using given token.
      AppLoginer.login(token);

      // Assert: AppLoginer returns correct results.
      expect(AppLoginer.isLogged()).toBe(true);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: Verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(true);
      expect(loginStore.loginState.token).toBe(token);
      expect(loginStore.loginState.username).toBe('Paweł Papierkowski');
      expect(loginStore.loginState.email).toBe('pawel.papierkowski@gmail.com');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date('2026-05-22T17:50:00Z'));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date('2026-05-22T23:50:00Z'));
      expect(loginStore.loginState.permissions).toStrictEqual([]);
    });

    it('as user with many permissions', () => {
      vi.setSystemTime(new Date('2026-05-22T18:30:00Z'));
      const loginStore = useLoginStore();

      // Arrange: Create valid token for user with many permissions.
      const token = createTestToken(['role_admin', 'role_operator', 'user_edit']);

      // Act: Log in user using given token.
      AppLoginer.login(token);

      // Assert: AppLoginer returns correct results.
      expect(AppLoginer.isLogged()).toBe(true);
      expect(AppLoginer.hasPermission('role_operator')).toBe(true);

      // Assert: Verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(true);
      expect(loginStore.loginState.token).toBe(token);
      expect(loginStore.loginState.username).toBe('Paweł Papierkowski');
      expect(loginStore.loginState.email).toBe('pawel.papierkowski@gmail.com');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date('2026-05-22T18:30:00Z'));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date('2026-05-23T00:30:00Z'));
      expect(loginStore.loginState.permissions).toStrictEqual(['role_admin', 'role_operator', 'user_edit']);
    });

    it('with expired token', () => {
      vi.setSystemTime(new Date('2026-05-20T12:00:00Z'));
      const loginStore = useLoginStore();

      // Arrange: Create already expired token (expiration in the past).
      const token = createTestToken([], {
        issuedAt: new Date('2026-05-20T11:00:00Z'),
        expiresAt: new Date('2026-05-20T11:05:00Z'),
      });

      // Act: Log in user using given token.
      AppLoginer.login(token);

      // Assert: AppLoginer returns correct results (not logged in as token is expired, therefore rejected).
      expect(AppLoginer.isLogged()).toBe(false);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: Verify content of login store.
      verifyEmptyLoginStore(loginStore);
    });

    it('with invalid token', () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const loginStore = useLoginStore();

      // Arrange: Create invalid token.
      const token = '';

      // Act: Log in user using given token.
      AppLoginer.login(token);

      // Assert: AppLoginer returns correct results (not logged in as token was completely invalid).
      expect(AppLoginer.isLogged()).toBe(false);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: Verify content of login store.
      verifyEmptyLoginStore(loginStore);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Logging out.

  describe('logs out', () => {
    it('normally', async () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const loginStore = useLoginStore();
      const messageStore = useMessageStore();

      // Arrange: Mock successful API response.
      vi.mocked(backendApiUser.logout).mockResolvedValue({ data: {} } as AxiosResponse);

      // Arrange: Set loginStore to logged in state.
      loginStore.loginState.isLogged = true;
      loginStore.loginState.token = createTestToken([]);
      loginStore.loginState.username = 'Paweł Papierkowski';
      loginStore.loginState.email = 'pawel.papierkowski@gmail.com';
      loginStore.loginState.issuedAt = new Date(1779108592000);
      loginStore.loginState.expiresAt = new Date(1779130192000);
      loginStore.loginState.permissions = [];

      // Act: Log out user.
      await AppLoginer.logout();

      // Assert: Logout endpoint was called.
      expect(backendApiUser.logout).toHaveBeenCalled();

      // Assert: AppLoginer returns correct results (not logged in anymore).
      expect(AppLoginer.isLogged()).toBe(false);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: Verify content of login store.
      verifyEmptyLoginStore(loginStore);

      // Assert: Verify info message is present in store.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Info);
      expect(messageStore.messages[0]?.title).toBe('User logged out successfully');
      expect(messageStore.messages[0]?.content).toBe('');
    });

    it('when already not logged in', async () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const loginStore = useLoginStore();
      const messageStore = useMessageStore();

      // No arrange - we are not logged in by default.

      // Act: Log out user.
      await AppLoginer.logout();

      // Assert: Logout endpoint was NOT called.
      expect(backendApiUser.logout).not.toHaveBeenCalled();

      // Assert: AppLoginer returns correct results (still not logged in).
      expect(AppLoginer.isLogged()).toBe(false);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: Verify content of login store.
      verifyEmptyLoginStore(loginStore);

      // Assert: Verify no message is present in store.
      expect(messageStore.messages).toHaveLength(0);
    });

    it('when endpoint returns failure', async () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const loginStore = useLoginStore();
      const messageStore = useMessageStore();

      // Arrange: Mock API returning 500 error.
      const errorResponse = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
        },
      };
      vi.mocked(backendApiUser.logout).mockRejectedValue(errorResponse);

      // Arrange: Set loginStore to logged in state.
      loginStore.loginState.isLogged = true;
      loginStore.loginState.token = createTestToken([]);
      loginStore.loginState.username = 'Paweł Papierkowski';
      loginStore.loginState.email = 'pawel.papierkowski@gmail.com';
      loginStore.loginState.issuedAt = new Date(1779464175000);
      loginStore.loginState.expiresAt = new Date(1779485775000);
      loginStore.loginState.permissions = [];

      // Act: Log out user.
      await AppLoginer.logout();

      // Assert: Logout endpoint was called.
      expect(backendApiUser.logout).toHaveBeenCalled();

      // Assert: AppLoginer returns correct results (not logged in anymore).
      expect(AppLoginer.isLogged()).toBe(false);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: Verify content of login store.
      verifyEmptyLoginStore(loginStore);

      // Assert: Verify info message is present in store.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Info);
      expect(messageStore.messages[0]?.title).toBe('User logged out successfully');
      expect(messageStore.messages[0]?.content).toBe('');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Prolongation.

  describe('session prolongation', () => {
    it('successfully', async () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const loginStore = useLoginStore();
      const messageStore = useMessageStore();

      // Arrange: Mock successful API response. New token, different from the current one.
      const newToken = createTestToken([]);
      vi.mocked(backendApiUser.prolong).mockResolvedValue({
        data: {
          jwtToken: newToken,
        },
      } as AxiosResponse);

      // Arrange: Set loginStore to logged in state (with token issued few minutes earlier).
      loginStore.loginState.isLogged = true;
      loginStore.loginState.token = createTestToken([], {
        issuedAt: new Date('2026-05-22T17:40:00Z'),
      });
      loginStore.loginState.username = 'Paweł Papierkowski';
      loginStore.loginState.email = 'pawel.papierkowski@gmail.com';
      loginStore.loginState.issuedAt = new Date(1779464175000);
      loginStore.loginState.expiresAt = new Date(1779485775000);
      loginStore.loginState.permissions = [];

      // Act: Prolong user session.
      await AppLoginer.prolong();

      // Assert: Prolong endpoint was called.
      expect(backendApiUser.prolong).toHaveBeenCalled();

      // Assert: AppLoginer returns correct results (still logged in, but time of expiration updated).
      expect(AppLoginer.isLogged()).toBe(true);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: Verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(true);
      expect(loginStore.loginState.token).toBe(newToken);
      expect(loginStore.loginState.username).toBe('Paweł Papierkowski');
      expect(loginStore.loginState.email).toBe('pawel.papierkowski@gmail.com');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date('2026-05-22T17:50:00Z')); // different issued and expired
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date('2026-05-22T23:50:00Z'));
      expect(loginStore.loginState.permissions).toStrictEqual([]);

      // Assert: Verify info message is present in store.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Info);
      expect(messageStore.messages[0]?.title).toBe('User session prolonged successfully');
      expect(messageStore.messages[0]?.content).toBe('');
    });

    it('unsuccessfully', async () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const loginStore = useLoginStore();
      const messageStore = useMessageStore();

      // Arrange: Mock API returning 500 error.
      const errorResponse = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
        },
      };
      vi.mocked(backendApiUser.prolong).mockRejectedValue(errorResponse);

      const oldToken = createTestToken([]);

      // Arrange: Set loginStore to logged in state.
      loginStore.loginState.isLogged = true;
      loginStore.loginState.token = oldToken;
      loginStore.loginState.username = 'Paweł Papierkowski';
      loginStore.loginState.email = 'pawel.papierkowski@gmail.com';
      loginStore.loginState.issuedAt = new Date(1779464175000);
      loginStore.loginState.expiresAt = new Date(1779485775000);
      loginStore.loginState.permissions = [];

      // Act: Prolong user session.
      await AppLoginer.prolong();

      // Assert: Prolong endpoint was called.
      expect(backendApiUser.prolong).toHaveBeenCalled();

      // Assert: AppLoginer returns correct results (still logged in, but time of expiration updated).
      expect(AppLoginer.isLogged()).toBe(true);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: Verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(true);
      expect(loginStore.loginState.token).toBe(oldToken);
      expect(loginStore.loginState.username).toBe('Paweł Papierkowski');
      expect(loginStore.loginState.email).toBe('pawel.papierkowski@gmail.com');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(1779464175000)); // same issued and expired
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(1779485775000));
      expect(loginStore.loginState.permissions).toStrictEqual([]);

      // Assert: Verify no message is present in store. In other words, prolong fails silently.
      expect(messageStore.messages).toHaveLength(0);
    });

    //

    it('should NOT prolong when not logged in', () => {
      expect(AppLoginer.shouldProlong()).toBe(false);
    });

    it('should NOT prolong when expiration is far away', () => {
      vi.setSystemTime(new Date('2026-05-22T10:00:00Z'));
      const loginStore = useLoginStore();
      loginStore.loginState.isLogged = true;
      loginStore.loginState.expiresAt = new Date('2026-05-22T11:00:00Z');

      expect(AppLoginer.shouldProlong()).toBe(false);
    });

    it('should prolong when expiration is close (less than 5 min)', () => {
      vi.setSystemTime(new Date('2026-05-22T10:58:00Z'));
      const loginStore = useLoginStore();
      loginStore.loginState.isLogged = true;
      loginStore.loginState.expiresAt = new Date('2026-05-22T11:00:00Z');

      expect(AppLoginer.shouldProlong()).toBe(true);
    });

    it('should NOT prolong when already expired', () => {
      vi.setSystemTime(new Date('2026-05-22T11:01:00Z'));
      const loginStore = useLoginStore();
      loginStore.loginState.isLogged = true;
      loginStore.loginState.expiresAt = new Date('2026-05-22T11:00:00Z');

      expect(AppLoginer.shouldProlong()).toBe(false);
    });

    it('should handle concurrent prolong requests with a single promise', async () => {
      const newToken = createTestToken([]);

      // Delay the mock response to ensure concurrency
      vi.mocked(backendApiUser.prolong).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: { jwtToken: newToken } } as AxiosResponse), 100);
          }),
      );

      const loginStore = useLoginStore();
      loginStore.loginState.isLogged = true;

      // Start two prolongations simultaneously
      const p1 = AppLoginer.prolongSilently();
      const p2 = AppLoginer.prolongSilently();

      // Fast forward time
      vi.advanceTimersByTime(200);

      const [r1, r2] = await Promise.all([p1, p2]);

      expect(r1).toBe(r2); // Should be the same result object
      expect(backendApiUser.prolong).toHaveBeenCalledTimes(1); // Should only call API once
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Session expiration.

  describe('expireSession', () => {
    it('clears login state and shows warning when logged in', () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const loginStore = useLoginStore();
      const messageStore = useMessageStore();

      // Arrange: Set loginStore to logged in state and seed localStorage.
      loginStore.loginState.isLogged = true;
      loginStore.loginState.token = createTestToken([]);
      loginStore.loginState.username = 'Paweł Papierkowski';
      loginStore.loginState.email = 'pawel.papierkowski@gmail.com';
      loginStore.loginState.issuedAt = new Date(1779464175000);
      loginStore.loginState.expiresAt = new Date(1779485775000);
      loginStore.loginState.permissions = [];
      localStorage.setItem(locstJwt, 'some-jwt');

      // Act: Expire the session.
      AppLoginer.expireSession();

      // Assert: AppLoginer returns correct results (not logged in anymore).
      expect(AppLoginer.isLogged()).toBe(false);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: Verify content of login store.
      verifyEmptyLoginStore(loginStore);

      // Assert: JWT was removed from localStorage.
      expect(localStorage.getItem(locstJwt)).toBeNull();

      // Assert: Warning message is present in store.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Warning);
      expect(messageStore.messages[0]?.title).toBe('Session expired');
    });

    it('is no-op when already not logged in', () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const messageStore = useMessageStore();

      // No arrange — we are not logged in by default.

      // Act: Expire the session.
      AppLoginer.expireSession();

      // Assert: Still not logged in.
      expect(AppLoginer.isLogged()).toBe(false);

      // Assert: No message was added.
      expect(messageStore.messages).toHaveLength(0);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Permissions.

  describe('permissions', () => {
    // ////////////////////////////////////////////////////////////////////////
    // hasPermission.

    describe('hasPermission', () => {
      it('returns false when not logged in', () => {
        vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));

        // No arrange or act: user is not logged in by default.

        // Assert: hasPermission returns false for any permission.
        expect(AppLoginer.hasPermission('role_operator')).toBe(false);
      });

      it('returns false for logged user without permissions', () => {
        vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));

        // Arrange: Create valid token for user without any permissions.
        const token = createTestToken([]);

        // Act: Log in user using given token.
        AppLoginer.login(token);

        // Assert: hasPermission returns false for any permission.
        expect(AppLoginer.hasPermission('role_operator')).toBe(false);
        expect(AppLoginer.hasPermission('user_edit')).toBe(false);
      });

      it('returns true when user has the permission', () => {
        vi.setSystemTime(new Date('2026-05-22T18:30:00Z'));

        // Arrange: Create valid token for user with many permissions.
        const token = createTestToken(['role_admin', 'role_operator', 'user_edit']);

        // Act: Log in user using given token.
        AppLoginer.login(token);

        // Assert: hasPermission returns true for owned permission.
        expect(AppLoginer.hasPermission('role_operator')).toBe(true);
      });

      it('returns false when user does not have the permission', () => {
        vi.setSystemTime(new Date('2026-05-22T18:30:00Z'));

        // Arrange: Create valid token for user with many permissions.
        const token = createTestToken(['role_admin', 'role_operator', 'user_edit']);

        // Act: Log in user using given token.
        AppLoginer.login(token);

        // Assert: hasPermission returns false for unowned permission.
        expect(AppLoginer.hasPermission('user_delete')).toBe(false);
      });
    });

    // ////////////////////////////////////////////////////////////////////////
    // hasPermissionsAny.

    describe('hasPermissionsAny', () => {
      it('returns true for empty permission list even when not logged in', () => {
        vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));

        // No arrange or act: user is not logged in by default.

        // Assert: Empty list is treated as success.
        expect(AppLoginer.hasPermissionsAny([])).toBe(true);
      });

      it('returns false when not logged in and permissions are requested', () => {
        vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));

        // No arrange or act: user is not logged in by default.

        // Assert: hasPermissionsAny returns false.
        expect(AppLoginer.hasPermissionsAny(['role_operator', 'user_edit'])).toBe(false);
      });

      it('returns true when user has at least one of the given permissions', () => {
        vi.setSystemTime(new Date('2026-05-22T18:30:00Z'));

        // Arrange: Create valid token for user with many permissions.
        const token = createTestToken(['role_admin', 'role_operator', 'user_edit']);

        // Act: Log in user using given token.
        AppLoginer.login(token);

        // Assert: hasPermissionsAny returns true (user owns role_admin).
        expect(AppLoginer.hasPermissionsAny(['role_admin', 'user_delete'])).toBe(true);
      });

      it('returns false when user has none of the given permissions', () => {
        vi.setSystemTime(new Date('2026-05-22T18:30:00Z'));

        // Arrange: Create valid token for user with many permissions.
        const token = createTestToken(['role_admin', 'role_operator', 'user_edit']);

        // Act: Log in user using given token.
        AppLoginer.login(token);

        // Assert: hasPermissionsAny returns false.
        expect(AppLoginer.hasPermissionsAny(['user_delete', 'user_view'])).toBe(false);
      });
    });

    // ////////////////////////////////////////////////////////////////////////
    // hasPermissionsAll.

    describe('hasPermissionsAll', () => {
      it('returns true for empty permission list even when not logged in', () => {
        vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));

        // No arrange or act: user is not logged in by default.

        // Assert: Empty list is treated as success.
        expect(AppLoginer.hasPermissionsAll([])).toBe(true);
      });

      it('returns false when not logged in and permissions are requested', () => {
        vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));

        // No arrange or act: user is not logged in by default.

        // Assert: hasPermissionsAll returns false.
        expect(AppLoginer.hasPermissionsAll(['role_admin', 'user_edit'])).toBe(false);
      });

      it('returns true when user has all of the given permissions', () => {
        vi.setSystemTime(new Date('2026-05-22T18:30:00Z'));

        // Arrange: Create valid token for user with many permissions.
        const token = createTestToken(['role_admin', 'role_operator', 'user_edit']);

        // Act: Log in user using given token.
        AppLoginer.login(token);

        // Assert: hasPermissionsAll returns true (user owns both permissions).
        expect(AppLoginer.hasPermissionsAll(['role_admin', 'role_operator'])).toBe(true);
      });

      it('returns false when user is missing at least one of the given permissions', () => {
        vi.setSystemTime(new Date('2026-05-22T18:30:00Z'));

        // Arrange: Create valid token for user with many permissions.
        const token = createTestToken(['role_admin', 'role_operator', 'user_edit']);

        // Act: Log in user using given token.
        AppLoginer.login(token);

        // Assert: hasPermissionsAll returns false (user does not own user_delete).
        expect(AppLoginer.hasPermissionsAll(['role_admin', 'user_delete'])).toBe(false);
      });
    });
  });
});
