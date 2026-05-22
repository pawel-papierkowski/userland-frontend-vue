/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import backendApiUser from '@/services/features/api-users.ts';

import { useMessageStore } from '@/stores/messages.ts';
import { useLoginStore } from '@/stores/login.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';

vi.mock('@/services/features/api-users.ts', () => ({
  default: {
    logout: vi.fn<typeof backendApiUser.logout>(() => Promise.resolve()), // Return a resolved promise
    prolong: vi.fn<typeof backendApiUser.prolong>(() => Promise.resolve()), // Return a resolved promise
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
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));

      // No arrange or act: this is default state of login store.

      // Assert: AppLoginer returns correct results (user is not logged in).
      expect(AppLoginer.isLogged()).toBe(false);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(false);
      expect(loginStore.loginState.token).toBe('');
      expect(loginStore.loginState.name).toBe('');
      expect(loginStore.loginState.email).toBe('');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.permissions).toStrictEqual([]);
    });


    it('as standard user', () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const loginStore = useLoginStore();

      // Arrange: create valid token for user without any permissions.
      const token = 'eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiUGF3ZcWCIFBhcGllcmtvd3NraSIsInN1YiI6InBhd2VsLnBhcGllcmtvd3NraUBnbWFpbC5jb20iLCJpYXQiOjE3Nzk0NjQxNzUsImV4cCI6MTc3OTQ4NTc3NX0.9uyhVSXHMlsayiljRynygCI03uKCWd0pl4kbYS7l-4A';

      // Act: log in user using given token.
      AppLoginer.login(token);

      // Assert: AppLoginer returns correct results.
      expect(AppLoginer.isLogged()).toBe(true);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(true);
      expect(loginStore.loginState.token).toBe(token);
      expect(loginStore.loginState.name).toBe('Paweł Papierkowski');
      expect(loginStore.loginState.email).toBe('pawel.papierkowski@gmail.com');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(1779464175000));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(1779485775000));
      expect(loginStore.loginState.permissions).toStrictEqual([]);
    });

    it('as user with many permissions', () => {
      vi.setSystemTime(new Date('2026-05-22T18:30:00Z'));
      const loginStore = useLoginStore();

      // Arrange: create valid token for user with many permissions.
      const token = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4sb3BlcmF0b3IiLCJuYW1lIjoiUGF3ZcWCIFBhcGllcmtvd3NraSIsInVzZXIiOiJlZGl0Iiwic3ViIjoicGF3ZWwucGFwaWVya293c2tpQGdtYWlsLmNvbSIsImlhdCI6MTc3OTQ2NDkxOCwiZXhwIjoxNzc5NDg2NTE4fQ.tSJ_l785hoinpYkzezJtLRx2ldBb0XQ6DKvKGZvLdw0';

      // Act: log in user using given token.
      AppLoginer.login(token);

      // Assert: AppLoginer returns correct results.
      expect(AppLoginer.isLogged()).toBe(true);
      expect(AppLoginer.hasPermission('role_operator')).toBe(true);

      // Assert: verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(true);
      expect(loginStore.loginState.token).toBe(token);
      expect(loginStore.loginState.name).toBe('Paweł Papierkowski');
      expect(loginStore.loginState.email).toBe('pawel.papierkowski@gmail.com');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(1779464918000));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(1779486518000));
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
      expect(loginStore.loginState.name).toBe('');
      expect(loginStore.loginState.email).toBe('');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.permissions).toStrictEqual([]);
    });

    it('with invalid token', () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
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
      expect(loginStore.loginState.name).toBe('');
      expect(loginStore.loginState.email).toBe('');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.permissions).toStrictEqual([]);
    });
  });

  //

  describe('logs out', () => {
    it('normally', async () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const loginStore = useLoginStore();
      const messageStore = useMessageStore();

      // Arrange: mock successful API response.
      vi.mocked(backendApiUser.logout).mockResolvedValue({ data: {} } as any);

      // Arrange: set loginStore to logged in state.
      loginStore.loginState.isLogged = true;
      loginStore.loginState.token = 'eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiUGF3ZcWCIFBhcGllcmtvd3NraSIsInN1YiI6InBhd2VsLnBhcGllcmtvd3NraUBnbWFpbC5jb20iLCJpYXQiOjE3Nzk0NjQxNzUsImV4cCI6MTc3OTQ4NTc3NX0.9uyhVSXHMlsayiljRynygCI03uKCWd0pl4kbYS7l-4A';
      loginStore.loginState.name = 'Paweł Papierkowski';
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
      expect(loginStore.loginState.name).toBe('');
      expect(loginStore.loginState.email).toBe('');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.permissions).toStrictEqual([]);

      // Assert: verify info message is present in store.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0].level).toBe(EnMessageLevel.Info);
      expect(messageStore.messages[0].title).toBe("User logged out successfully");
      expect(messageStore.messages[0].content).toBe("");
    });

    it('when already not logged in', async () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const loginStore = useLoginStore();
      const messageStore = useMessageStore();

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
      expect(loginStore.loginState.name).toBe('');
      expect(loginStore.loginState.email).toBe('');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.permissions).toStrictEqual([]);

      // Assert: verify no message is present in store.
      expect(messageStore.messages).toHaveLength(0);
    });

    it('when endpoint returns failure', async () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const loginStore = useLoginStore();
      const messageStore = useMessageStore();

      // Arrange: mock API returning 500 error.
      const errorResponse = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {}
        }
      };
      vi.mocked(backendApiUser.logout).mockRejectedValue(errorResponse);

      // Arrange: set loginStore to logged in state.
      loginStore.loginState.isLogged = true;
      loginStore.loginState.token = 'eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiUGF3ZcWCIFBhcGllcmtvd3NraSIsInN1YiI6InBhd2VsLnBhcGllcmtvd3NraUBnbWFpbC5jb20iLCJpYXQiOjE3Nzk0NjQxNzUsImV4cCI6MTc3OTQ4NTc3NX0.9uyhVSXHMlsayiljRynygCI03uKCWd0pl4kbYS7l-4A';
      loginStore.loginState.name = 'Paweł Papierkowski';
      loginStore.loginState.email = 'pawel.papierkowski@gmail.com';
      loginStore.loginState.issuedAt = new Date(1779464175000);
      loginStore.loginState.expiresAt = new Date(1779485775000);
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
      expect(loginStore.loginState.name).toBe('');
      expect(loginStore.loginState.email).toBe('');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(0));
      expect(loginStore.loginState.permissions).toStrictEqual([]);

      // Assert: verify info message is present in store.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0].level).toBe(EnMessageLevel.Info);
      expect(messageStore.messages[0].title).toBe("User logged out successfully");
      expect(messageStore.messages[0].content).toBe("");
    });
  });

  //

  describe('prolongs user session', () => {
    it('successfully', async () => {
      vi.setSystemTime(new Date('2026-05-22T17:50:00Z'));
      const loginStore = useLoginStore();
      const messageStore = useMessageStore();

      const newToken = 'eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiUGF3ZcWCIFBhcGllcmtvd3NraSIsInN1YiI6InBhd2VsLnBhcGllcmtvd3NraUBnbWFpbC5jb20iLCJpYXQiOjE3Nzk0NjQ2NjUsImV4cCI6MTc3OTQ4NjI2NX0.J4sUKkMC1jQ6m_qhM0JngzTnED2N-SZ8KAD1CfJYcXw';
      // Arrange: mock successful API response.
      vi.mocked(backendApiUser.prolong).mockResolvedValue({ data: {
        "jwtToken": newToken
      } } as any);

      // Arrange: set loginStore to logged in state.
      loginStore.loginState.isLogged = true;
      loginStore.loginState.token = 'eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiUGF3ZcWCIFBhcGllcmtvd3NraSIsInN1YiI6InBhd2VsLnBhcGllcmtvd3NraUBnbWFpbC5jb20iLCJpYXQiOjE3Nzk0NjQxNzUsImV4cCI6MTc3OTQ4NTc3NX0.9uyhVSXHMlsayiljRynygCI03uKCWd0pl4kbYS7l-4A';
      loginStore.loginState.name = 'Paweł Papierkowski';
      loginStore.loginState.email = 'pawel.papierkowski@gmail.com';
      loginStore.loginState.issuedAt = new Date(1779464175000);
      loginStore.loginState.expiresAt = new Date(1779485775000);
      loginStore.loginState.permissions = [];

      // Act: prolong user session.
      await AppLoginer.prolong();

      // Assert: prolong endpoint was called.
      expect(backendApiUser.prolong).toHaveBeenCalled();

      // Assert: AppLoginer returns correct results (still logged in, but time of expiration updated).
      expect(AppLoginer.isLogged()).toBe(true);
      expect(AppLoginer.hasPermission('role_operator')).toBe(false);

      // Assert: verify content of login store.
      expect(loginStore.loginState.isLogged).toBe(true);
      expect(loginStore.loginState.token).toBe(newToken);
      expect(loginStore.loginState.name).toBe('Paweł Papierkowski');
      expect(loginStore.loginState.email).toBe('pawel.papierkowski@gmail.com');
      expect(loginStore.loginState.issuedAt).toStrictEqual(new Date(1779464665000)); // different issued and expired
      expect(loginStore.loginState.expiresAt).toStrictEqual(new Date(1779486265000));
      expect(loginStore.loginState.permissions).toStrictEqual([]);

      // Assert: verify info message is present in store.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0].level).toBe(EnMessageLevel.Info);
      expect(messageStore.messages[0].title).toBe("User session prolonged successfully");
      expect(messageStore.messages[0].content).toBe("");
    });

    it('unsuccessfully', async () => {
    });
  });
});
