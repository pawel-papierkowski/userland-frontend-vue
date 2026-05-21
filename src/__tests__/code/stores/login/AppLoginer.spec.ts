import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import backendApiUser from '@/services/features/api-users.ts';

import { useLoginStore } from '@/stores/login.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

vi.mock('@/services/features/api-users.ts', () => ({
  default: {
    logout: vi.fn<typeof backendApiUser.logout>(() => Promise.resolve()), // Return a resolved promise
  }
}));

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

  //

  describe('logs in', () => {
    it('not at all', () => {
      const loginStore = useLoginStore();
      vi.setSystemTime(new Date('2026-05-20T12:00:00Z'));

      // No arrange or act: this is default state of login store.

      // Assert: AppLoginer returns correct results (user is not logged in).
      expect(AppLoginer.isLogged()).toBe(false);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(false);
      expect(loginStore.loginState.token).toBe('');
      expect(loginStore.loginState.email).toBe('');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.permissions).toStrictEqual([]);
    });


    it('as standard user', () => {
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      const loginStore = useLoginStore();

      // Arrange: create valid token for user without any permissions.
      const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXdlbC5wYXBpZXJrb3dza2lAZ21haWwuY29tIiwiaWF0IjoxNzc5MTA4NTkyLCJleHAiOjE3NzkxMzAxOTJ9.DyOcEQBYyYyiiZgrPNB5mq49tfhoUBjUuA8izA6_b7Y';

      // Act: log in user using given token.
      AppLoginer.login(token);

      // Assert: AppLoginer returns correct results.
      expect(AppLoginer.isLogged()).toBe(true);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(true);
      expect(loginStore.loginState.token).toBe(token);
      expect(loginStore.loginState.email).toBe('pawel.papierkowski@gmail.com');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(1779108592000));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(1779130192000));
      expect(loginStore.loginState.permissions).toStrictEqual([]);
    });

    it('as user with many permissions', () => {
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      const loginStore = useLoginStore();

      // Arrange: create valid token for user with many permissions.
      const token = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4sb3BlcmF0b3IiLCJ1c2VyIjoiZWRpdCIsInN1YiI6InBhd2VsLnBhcGllcmtvd3NraUBnbWFpbC5jb20iLCJpYXQiOjE3NzkxMDk1NDgsImV4cCI6MTc3OTEzMTE0OH0.bhyXaanaGw1-8DT2hTp4n_buXGlQc4ssFXkFdLyq77w';

      // Act: log in user using given token.
      AppLoginer.login(token);

      // Assert: AppLoginer returns correct results.
      expect(AppLoginer.isLogged()).toBe(true);
      expect(AppLoginer.hasPermission('role_operator')).toBe(true);

      // Assert: verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(true);
      expect(loginStore.loginState.token).toBe(token);
      expect(loginStore.loginState.email).toBe('pawel.papierkowski@gmail.com');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(1779109548000));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(1779131148000));
      expect(loginStore.loginState.permissions).toStrictEqual(['role_admin', 'role_operator', 'user_edit']);
    });

    it('with expired token', () => {
      vi.setSystemTime(new Date('2026-05-20T12:00:00Z'));
      const loginStore = useLoginStore();

      // Arrange: create valid token for user without any permissions.
      const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXdlbC5wYXBpZXJrb3dza2lAZ21haWwuY29tIiwiaWF0IjoxNzc5MTA4NTkyLCJleHAiOjE3NzkxMzAxOTJ9.DyOcEQBYyYyiiZgrPNB5mq49tfhoUBjUuA8izA6_b7Y';

      // Act: log in user using given token.
      AppLoginer.login(token);

      // Assert: AppLoginer returns correct results (not logged in as token is expired, therefore rejected).
      expect(AppLoginer.isLogged()).toBe(false);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(false);
      expect(loginStore.loginState.token).toBe('');
      expect(loginStore.loginState.email).toBe('');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.permissions).toStrictEqual([]);
    });

    it('with invalid token', () => {
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      const loginStore = useLoginStore();

      // Arrange: create invalid token.
      const token = '';

      // Act: log in user using given token.
      AppLoginer.login(token);

      // Assert: AppLoginer returns correct results (not logged in as token was completely invalid).
      expect(AppLoginer.isLogged()).toBe(false);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(false);
      expect(loginStore.loginState.token).toBe('');
      expect(loginStore.loginState.email).toBe('');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.permissions).toStrictEqual([]);
    });
  });

  //

  describe('logs out', () => {
    it('normally', async () => {
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      const loginStore = useLoginStore();

      // Arrange: set loginStore to logged in state.
      loginStore.loginState.isLogged = true;
      loginStore.loginState.token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXdlbC5wYXBpZXJrb3dza2lAZ21haWwuY29tIiwiaWF0IjoxNzc5MTA4NTkyLCJleHAiOjE3NzkxMzAxOTJ9.DyOcEQBYyYyiiZgrPNB5mq49tfhoUBjUuA8izA6_b7Y';
      loginStore.loginState.email = 'pawel.papierkowski@gmail.com';
      loginStore.loginState.issuedAt = new Date(1779108592000);
      loginStore.loginState.expiresAt = new Date(1779130192000);
      loginStore.loginState.permissions = [];

      // Act: log out user.
      await AppLoginer.logout();

      // Assert: logout endpoint was called.
      expect(backendApiUser.logout).toHaveBeenCalled();

      // Assert: AppLoginer returns correct results (not logged in anymore).
      expect(AppLoginer.isLogged()).toBe(false);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(false);
      expect(loginStore.loginState.token).toBe('');
      expect(loginStore.loginState.email).toBe('');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.permissions).toStrictEqual([]);
    });

    it('when already not logged in', async () => {
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      const loginStore = useLoginStore();

      // No arrange - we are not logged in by default.

      // Act: log out user.
      await AppLoginer.logout();

      // Assert: logout endpoint was NOT called.
      expect(backendApiUser.logout).not.toHaveBeenCalled();

      // Assert: AppLoginer returns correct results (still not logged in).
      expect(AppLoginer.isLogged()).toBe(false);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(false);
      expect(loginStore.loginState.token).toBe('');
      expect(loginStore.loginState.email).toBe('');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.permissions).toStrictEqual([]);
    });
  });
});
