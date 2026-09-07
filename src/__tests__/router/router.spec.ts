import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRouter, createMemoryHistory, type RouteRecordRaw, type RouteMeta } from 'vue-router';

import { AppLoginer } from '@/code/wrappers/login/AppLoginer.ts';

// ////////////////////////////////////////////////////////////////////////////
// Mocking.

vi.mock('@/code/wrappers/login/AppLoginer.ts', () => ({
  AppLoginer: {
    isLogged: vi.fn<() => boolean>(),
    hasPermission: vi.fn<(name: string) => boolean>(),
    /** Mimics real behavior: empty array always returns true. */
    hasPermissionsAny: vi.fn<(names: string[]) => boolean>((names) => names.length === 0),
    /** Mimics real behavior: empty array always returns true. */
    hasPermissionsAll: vi.fn<(names: string[]) => boolean>((names) => names.length === 0),
  },
}));

// ////////////////////////////////////////////////////////////////////////////
// Helpers.

/** Dummy component for test routes. Only the route meta matters for guard tests. */
const DummyComponent = { template: '<div />' };

/**
 * Route metadata sets matching the real router's definitions.
 * Used to verify the guard behaves correctly for each meta configuration.
 */
const meta = {
  unlogged: { layout: 'STANDARD', requiresAuth: false, permAny: [], permAll: [] },
  logged: { layout: 'STANDARD', requiresAuth: true, permAny: [], permAll: [] },
  adminLogin: { layout: 'ADMIN', requiresAuth: false, permAny: [], permAll: [] },
  admin: { layout: 'ADMIN', requiresAuth: true, permAny: ['role_operator'], permAll: [] },
  adminUser: { layout: 'ADMIN', requiresAuth: true, permAny: ['role_operator'], permAll: ['user_view'] },
};

/**
 * Minimal route definitions that mirror the real router's meta configurations.
 * Uses dummy components to avoid loading real page dependencies (Pinia stores, etc.)
 * so that tests focus solely on the navigation guard logic.
 */
const testRoutes: RouteRecordRaw[] = [
  { name: 'home', path: '/', component: DummyComponent, meta: meta.unlogged },
  { name: 'login', path: '/login', component: DummyComponent, meta: meta.unlogged },
  { name: 'registration', path: '/registration', component: DummyComponent, meta: meta.unlogged },
  { name: 'memberArea', path: '/memberArea', component: DummyComponent, meta: meta.logged },
  { name: 'user-profile', path: '/user/profile', component: DummyComponent, meta: meta.logged },
  { name: 'admin-login', path: '/admin', component: DummyComponent, meta: meta.adminLogin },
  { name: 'admin-main', path: '/admin/main', component: DummyComponent, meta: meta.admin },
  { name: 'admin-user', path: '/admin/user', component: DummyComponent, meta: meta.adminUser },
];

/**
 * Create a fresh router instance with test routes and the same beforeEach guard
 * as the real router.
 * @returns Router instance ready for navigation tests.
 */
function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: testRoutes,
  });

  // Attach the same beforeEach guard as the real router (src/router/index.ts).
  router.beforeEach((to) => {
    const isAuthenticated = AppLoginer.isLogged();

    // If the route requires auth and the user isn't logged in, redirect.
    if (to.meta.requiresAuth && !isAuthenticated) {
      if (to.meta.layout === 'ADMIN') return { name: 'admin-login' };
      return { name: 'login' };
    }

    if (isAuthenticated) {
      // Is authenticated and on login page?
      if (to.name?.toString() === 'login') {
        return { name: 'home' };
      }

      const hasPermissions = checkAccessPermissions(to.meta);
      // Is authenticated, but not authorized?
      if (!hasPermissions) {
        return { name: 'home' };
      }

      // Is on admin login page, but already authenticated? Check if user can access admin panel.
      if (to.name?.toString() === 'admin-login') {
        const targetMeta = router.resolve({ name: 'admin-main' }).meta;
        if (checkAccessPermissions(targetMeta)) {
          return { name: 'admin-main' };
        }
        return { name: 'home' };
      }
    }
  });

  return router;
}

/**
 * Check if currently logged user has access to given route.
 * Replicated from router/index.ts for use in the test guard above.
 * @param meta Route metadata containing permission requirements.
 * @returns True if user has access, otherwise false.
 */
const checkAccessPermissions = (meta: RouteMeta): boolean => {
  if (AppLoginer.hasPermission('role_admin')) return true;
  if (!AppLoginer.hasPermissionsAny(meta.permAny as string[])) return false;
  if (!AppLoginer.hasPermissionsAll(meta.permAll as string[])) return false;
  return true;
};

// ////////////////////////////////////////////////////////////////////////////

/** Tests router navigation guard (beforeEach). */
describe('router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: not logged in, no permissions (but empty-array checks pass like real code).
    vi.mocked(AppLoginer.isLogged).mockReturnValue(false);
    vi.mocked(AppLoginer.hasPermission).mockReturnValue(false);
    vi.mocked(AppLoginer.hasPermissionsAny).mockImplementation((names) => names.length === 0);
    vi.mocked(AppLoginer.hasPermissionsAll).mockImplementation((names) => names.length === 0);
  });

  // //////////////////////////////////////////////////////////////////////////
  // Not authenticated.

  describe('not authenticated', () => {
    it('redirects STANDARD requiresAuth route to login', async () => {
      // Arrange: User is not logged in (default mock).
      const router = createTestRouter();

      // Act: Navigate to member area (STANDARD layout, requiresAuth: true).
      await router.push({ name: 'memberArea' });

      // Assert: Redirected to login page.
      expect(router.currentRoute.value.name).toBe('login');
    });

    it('redirects ADMIN requiresAuth route to admin-login', async () => {
      // Arrange: User is not logged in (default mock).
      const router = createTestRouter();

      // Act: Navigate to admin main (ADMIN layout, requiresAuth: true).
      await router.push({ name: 'admin-main' });

      // Assert: Redirected to admin login page.
      expect(router.currentRoute.value.name).toBe('admin-login');
    });

    it('allows public routes without redirect', async () => {
      // Arrange: User is not logged in (default mock).
      const router = createTestRouter();

      // Act: Navigate to home (public, requiresAuth: false).
      await router.push({ name: 'home' });

      // Assert: Stayed on home page.
      expect(router.currentRoute.value.name).toBe('home');
    });

    it('allows public admin-login route without redirect', async () => {
      // Arrange: User is not logged in (default mock).
      const router = createTestRouter();

      // Act: Navigate to admin-login (public, requiresAuth: false).
      await router.push({ name: 'admin-login' });

      // Assert: Stayed on admin-login page.
      expect(router.currentRoute.value.name).toBe('admin-login');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Authenticated.

  describe('authenticated', () => {
    it('redirects away from login page to home', async () => {
      // Arrange: User is logged in, has permissions for standard routes.
      const router = createTestRouter();
      vi.mocked(AppLoginer.isLogged).mockReturnValue(true);

      // Act: Navigate to login page.
      await router.push({ name: 'login' });

      // Assert: Redirected to home page.
      expect(router.currentRoute.value.name).toBe('home');
    });

    it('redirects to home when permAny is not satisfied', async () => {
      // Arrange: User is logged in but has no role_operator permission.
      const router = createTestRouter();
      vi.mocked(AppLoginer.isLogged).mockReturnValue(true);
      vi.mocked(AppLoginer.hasPermissionsAny).mockImplementation((names) => {
        if (names.length === 0) return true; // empty = always ok
        return false; // no permissions for any non-empty list
      });

      // Act: Navigate to admin main (requires role_operator via permAny).
      await router.push({ name: 'admin-main' });

      // Assert: Redirected to home due to lack of permissions.
      expect(router.currentRoute.value.name).toBe('home');
    });

    it('redirects to home when permAll is not satisfied', async () => {
      // Arrange: User has role_operator (permAny ok) but missing user_view (permAll fails).
      const router = createTestRouter();
      vi.mocked(AppLoginer.isLogged).mockReturnValue(true);
      vi.mocked(AppLoginer.hasPermission).mockImplementation((name: string) => name === 'role_operator');
      vi.mocked(AppLoginer.hasPermissionsAny).mockReturnValue(true);
      vi.mocked(AppLoginer.hasPermissionsAll).mockImplementation((names) => {
        if (names.length === 0) return true; // empty = always ok
        return false; // no permissions for any non-empty list
      });

      // Act: Navigate to admin user (requires permAll: ['user_view']).
      await router.push({ name: 'admin-user' });

      // Assert: Redirected to home.
      expect(router.currentRoute.value.name).toBe('home');
    });

    it('redirects admin-login to admin-main when authenticated and authorized', async () => {
      // Arrange: User is logged in with admin permissions.
      const router = createTestRouter();
      vi.mocked(AppLoginer.isLogged).mockReturnValue(true);
      vi.mocked(AppLoginer.hasPermission).mockImplementation((name: string) => name === 'role_admin');

      // Act: Navigate to admin-login page.
      await router.push({ name: 'admin-login' });

      // Assert: Redirected to admin main page.
      expect(router.currentRoute.value.name).toBe('admin-main');
    });

    it('redirects admin-login directly to home when authenticated but lacks admin permissions', async () => {
      // Arrange: User is logged in but has no admin permissions (no role_operator).
      const router = createTestRouter();
      vi.mocked(AppLoginer.isLogged).mockReturnValue(true);
      vi.mocked(AppLoginer.hasPermission).mockReturnValue(false);
      vi.mocked(AppLoginer.hasPermissionsAny).mockImplementation((names) => names.length === 0);

      // Act: Navigate to admin-login page.
      await router.push({ name: 'admin-login' });

      // Assert: Redirected directly to home (not admin-main then home).
      expect(router.currentRoute.value.name).toBe('home');
    });

    it('allows access to permitted standard route', async () => {
      // Arrange: User is logged in with no special permissions (empty permAny/permAll).
      const router = createTestRouter();
      vi.mocked(AppLoginer.isLogged).mockReturnValue(true);
      vi.mocked(AppLoginer.hasPermissionsAny).mockReturnValue(true);
      vi.mocked(AppLoginer.hasPermissionsAll).mockReturnValue(true);

      // Act: Navigate to member area (requiresAuth: true, no permAny/permAll).
      await router.push({ name: 'memberArea' });

      // Assert: Navigation succeeded.
      expect(router.currentRoute.value.name).toBe('memberArea');
    });

    it('allows access to admin route with admin role', async () => {
      // Arrange: User has role_admin (bypasses all permission checks).
      const router = createTestRouter();
      vi.mocked(AppLoginer.isLogged).mockReturnValue(true);
      vi.mocked(AppLoginer.hasPermission).mockImplementation((name: string) => name === 'role_admin');

      // Act: Navigate to admin user page (requires role_operator + user_view).
      await router.push({ name: 'admin-user' });

      // Assert: Navigation succeeded.
      expect(router.currentRoute.value.name).toBe('admin-user');
    });

    it('allows standard user to access standard protected routes', async () => {
      // Arrange: User is logged in with no special permissions.
      const router = createTestRouter();
      vi.mocked(AppLoginer.isLogged).mockReturnValue(true);
      vi.mocked(AppLoginer.hasPermissionsAny).mockReturnValue(true);
      vi.mocked(AppLoginer.hasPermissionsAll).mockReturnValue(true);

      // Act: Navigate to user profile (requiresAuth: true, no permAny/permAll).
      await router.push({ name: 'user-profile' });

      // Assert: Navigation succeeded.
      expect(router.currentRoute.value.name).toBe('user-profile');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Catch-all 404 route.

  describe('catch-all route', () => {
    it('navigates to catch-all for unknown paths', async () => {
      // Arrange: User is not logged in, add catch-all route.
      const router = createTestRouter();
      router.addRoute({ path: '/:pathMatch(.*)*', component: DummyComponent, name: 'not-found', meta: meta.unlogged });

      // Act: Navigate to non-existent path.
      await router.push('/nonexistent-path');

      // Assert: Route matched the catch-all.
      expect(router.currentRoute.value.name).toBe('not-found');
    });
  });
});
