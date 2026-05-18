import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useLoginStore } from '@/stores/login.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

/** Tests AppLoginer class. */
describe('AppLoginer', () => {
  beforeEach(() => {
    // Crucial for testing code that uses Pinia stores outside components.
    setActivePinia(createPinia());
  });

  it('starts as not logged in', () => {
    const loginStore = useLoginStore();
    
    // No arrange or act: this is default state of login store.

    // Assert: AppLoginer returns correct results.
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


  it('logs in standard user', () => {
    const loginStore = useLoginStore();

    // Arrange: create valid token for user without any permissions.
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXdlbC5wYXBpZXJrb3dza2lAZ21haWwuY29tIiwiaWF0IjoxNzc5MTA4NTkyLCJleHAiOjE3NzkxMzAxOTJ9.DyOcEQBYyYyiiZgrPNB5mq49tfhoUBjUuA8izA6_b7Y';

    // Act: log in user.
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

  it('logs in user with many permissions', () => {
    const loginStore = useLoginStore();

    // Arrange: create valid token for user with many permissions.
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4sb3BlcmF0b3IiLCJ1c2VyIjoiZWRpdCIsInN1YiI6InBhd2VsLnBhcGllcmtvd3NraUBnbWFpbC5jb20iLCJpYXQiOjE3NzkxMDk1NDgsImV4cCI6MTc3OTEzMTE0OH0.bhyXaanaGw1-8DT2hTp4n_buXGlQc4ssFXkFdLyq77w';

    // Act: log in user.
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

  it('has invalid token', () => {
    const loginStore = useLoginStore();

    // Arrange: create invalid token.
    const token = '';

    // Act: log in user.
    AppLoginer.login(token);

    // Assert: AppLoginer returns correct results.
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

  //

  it('logged out', () => {
    const loginStore = useLoginStore();

    // Arrange: set loginStore to logged in state.
    loginStore.loginState.isLogged = true;
    loginStore.loginState.token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXdlbC5wYXBpZXJrb3dza2lAZ21haWwuY29tIiwiaWF0IjoxNzc5MTA4NTkyLCJleHAiOjE3NzkxMzAxOTJ9.DyOcEQBYyYyiiZgrPNB5mq49tfhoUBjUuA8izA6_b7Y';
    loginStore.loginState.email = 'pawel.papierkowski@gmail.com';
    loginStore.loginState.issuedAt = new Date(1779108592000);
    loginStore.loginState.expiresAt = new Date(1779130192000);
    loginStore.loginState.permissions = [];

    // Act: log out user.
    AppLoginer.logout();

    // Assert: AppLoginer returns correct results.
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
