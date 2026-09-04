import { createRouter, createWebHistory, type RouteMeta } from 'vue-router';

//import { logger } from '@/code/utils/logger.ts';

import { AppLoginer } from '@/code/wrappers/login/AppLoginer.ts';

// Certain pages are loaded eagerly.
import UserLandHome from '@/components/pages/home/UserLandHome.vue';
import UserLandLogin from '@/components/pages/common/user/UserLandLogin.vue';
import UserRegistration from '@/components/pages/user/UserRegistration.vue';

// Rest is loaded lazily.

// Defined metadata sets.
// standard pages
const meta4unlogged = { layout: 'STANDARD', requiresAuth: false, permAny: [], permAll: [] };
const meta4logged = { layout: 'STANDARD', requiresAuth: true, permAny: [], permAll: [] };
// admin panel
const meta4adminLogin = { layout: 'ADMIN', requiresAuth: false, permAny: [], permAll: [] }; // note this page is available for everyone to make login possible
const meta4admin = { layout: 'ADMIN', requiresAuth: true, permAny: ['role_operator'], permAll: [] }; // note individual pages may require additional permissions
// admin panel: individual features
const meta4adminUser = { layout: 'ADMIN', requiresAuth: true, permAny: ['role_operator'], permAll: ['user_view'] };

// Define all routes for this app. Notes:
// - Most of pages are lazily loaded.
// - Meta is always present.
const routes = [
  // STANDARD WEBPAGES

  { name: 'home', path: '/', component: UserLandHome, meta: meta4unlogged },
  {
    name: 'testArea',
    path: '/testArea',
    component: () => import('@/components/pages/test/UserLandTestArea.vue'),
    meta: meta4unlogged,
  },
  {
    name: 'debugArea',
    path: '/debugArea',
    component: () => import('@/components/pages/test/UserLandDebugArea.vue'),
    meta: meta4unlogged,
  },
  {
    name: 'memberArea',
    path: '/memberArea',
    component: () => import('@/components/pages/member/UserLandMember.vue'),
    meta: meta4logged,
  },
  { name: 'registration', path: '/registration', component: UserRegistration, meta: meta4unlogged },
  { name: 'login', path: '/login', component: UserLandLogin, meta: meta4unlogged },

  // User-related pages.
  {
    name: 'user-activate',
    path: '/user/activate',
    component: () => import('@/components/pages/user/UserActivation.vue'),
    meta: meta4unlogged,
  },
  {
    name: 'user-profile',
    path: '/user/profile',
    component: () => import('@/components/pages/common/user/UserLandProfile.vue'),
    meta: meta4logged,
  },

  // Starting point for user actions that require additional security.
  {
    name: 'user-passwordReset-start',
    path: '/user/passwordResetStart',
    component: () => import('@/components/pages/user/UserPasswordResetStart.vue'),
    meta: meta4unlogged,
  },
  {
    name: 'user-emailChange-start',
    path: '/user/emailChangeStart',
    component: () => import('@/components/pages/user/UserEmailChangeStart.vue'),
    meta: meta4unlogged,
  },
  {
    name: 'user-accountDel-start',
    path: '/user/accountDelStart',
    component: () => import('@/components/pages/user/UserAccountDeletionStart.vue'),
    meta: meta4unlogged,
  },

  // These pages are accessible only via email: link with token.
  {
    name: 'user-passwordReset',
    path: '/user/passwordReset',
    component: () => import('@/components/pages/user/UserPasswordReset.vue'),
    meta: meta4unlogged,
  },
  {
    name: 'user-emailChange',
    path: '/user/emailChange',
    component: () => import('@/components/pages/user/UserEmailChange.vue'),
    meta: meta4unlogged,
  },
  {
    name: 'user-accountDel',
    path: '/user/accountDel',
    component: () => import('@/components/pages/user/UserAccountDeletion.vue'),
    meta: meta4unlogged,
  },

  // ADMINISTRATION PANEL PAGES

  { name: 'admin-login', path: '/admin', component: UserLandLogin, meta: meta4adminLogin },
  {
    name: 'admin-main',
    path: '/admin/main',
    component: () => import('@/components/pages/admin/general/AdminMain.vue'),
    meta: meta4admin,
  },
  {
    name: 'admin-profile',
    path: '/admin/profile',
    component: () => import('@/components/pages/common/user/UserLandProfile.vue'),
    meta: meta4admin,
  },
  {
    name: 'admin-user',
    path: '/admin/user',
    component: () => import('@/components/pages/admin/user/main/AdminUser.vue'),
    meta: meta4adminUser,
  },

  // Catch-all 404 route MUST be at the end
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/components/pages/common/AppNotFound.vue'),
    meta: meta4unlogged,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
});

router.beforeEach((to) => {
  const isAuthenticated = AppLoginer.isLogged();

  // If the route requires auth and the user isn't logged in, redirect.
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Admin panel routes always start with 'admin-'.
    if (to.name?.toString().includes('admin-')) return { name: 'admin-login' }; // Redirects to the admin login route.
    return { name: 'login' }; // Redirects to the normal login route.
  }

  if (isAuthenticated) {
    // Is authenicated and on login page?
    if (to.name?.toString() === 'login') {
      return { name: 'home' }; // Redirects to home page.
    }

    const hasPermissions = checkAccessPermissions(to.meta);
    // Is authenticated, but not authorized?
    if (!hasPermissions) {
      return { name: 'home' }; // Redirects to the normal login route.
    }

    // Is on admin login page, but already authenticated AND authorized?
    if (hasPermissions && to.name?.toString() === 'admin-login') {
      return { name: 'admin-main' }; // Redirects to main page of administration panel.
    }
  }

  // If no return statement is hit, the navigation proceeds normally.
});

// ////////////////////////////////////////////////////////////////////////////

/**
 * Check if currently logged user has access to given route.
 * @param meta Metadata about route.
 * @returns True if given user has access, otherwise false.
 */
const checkAccessPermissions = (meta: RouteMeta): boolean => {
  if (AppLoginer.hasPermission('role_admin')) return true; // admin role has unrestricted access anywhere

  if (!AppLoginer.hasPermissionsAny(meta.permAny as string[])) return false;
  if (!AppLoginer.hasPermissionsAll(meta.permAll as string[])) return false;
  return true;
};

export default router;
