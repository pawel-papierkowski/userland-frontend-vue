import { createRouter, createWebHistory, type RouteMeta } from 'vue-router';

//import { logger } from '@/code/utils/logger.ts';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

import UserLandHome from '@/components/pages/home/UserLandHome.vue';
import UserLandTestArea from '@/components/pages/test/UserLandTestArea.vue';
import UserLandDebugArea from '@/components/pages/test/UserLandDebugArea.vue';
import UserLandMember from '@/components/pages/member/UserLandMember.vue';

import UserRegistration from '@/components/pages/user/UserRegistration.vue';
import UserActivation from '@/components/pages/user/UserActivation.vue';
import UserPasswordResetStart from '@/components/pages/user/UserPasswordResetStart.vue';
import UserPasswordReset from '@/components/pages/user/UserPasswordReset.vue';
import UserEmailChangeStart from '@/components/pages/user/UserEmailChangeStart.vue';
import UserEmailChange from '@/components/pages/user/UserEmailChange.vue';
import UserAccountDeletionStart from '@/components/pages/user/UserAccountDeletionStart.vue';
import UserAccountDeletion from '@/components/pages/user/UserAccountDeletion.vue';

import AdminMain from '@/components/pages/admin/general/AdminMain.vue';
import AdminUser from '@/components/pages/admin/user/AdminUser.vue';

import AppNotFound from '@/components/pages/common/AppNotFound.vue';
import UserLandLogin from '@/components/pages/common/user/UserLandLogin.vue';
import UserLandProfile from '@/components/pages/common/user/UserLandProfile.vue';

// Defined metadata sets.
const meta4unlogged = { layout: 'STANDARD', requiresAuth: false, permissions: [] };
const meta4logged = { layout: 'STANDARD', requiresAuth: true, permissions: [] };
const meta4adminLogin = { layout: 'ADMIN', requiresAuth: false, permissions: [] }; // note this page is available for everyone
const meta4admin = { layout: 'ADMIN', requiresAuth: true, permissions: ['role_operator', 'role_admin'] };

// Define all routes for this app. Note meta is always present.
const routes = [
    // STANDARD WEBPAGES

    { name:'home', path: '/', component: UserLandHome, meta: meta4unlogged },
    { name:'testArea', path: '/testArea', component: UserLandTestArea, meta: meta4unlogged },
    { name:'debugArea', path: '/debugArea', component: UserLandDebugArea, meta: meta4unlogged },
    { name:'member', path: '/member', component: UserLandMember, meta: meta4logged },
    { name:'registration', path: '/registration', component: UserRegistration, meta: meta4unlogged },
    { name:'login', path: '/login', component: UserLandLogin, meta: meta4unlogged },

    // User-related pages.
    { name:'user-activate', path: '/user/activate', component: UserActivation, meta: meta4unlogged },
    { name:'user-profile', path: '/user/profile', component: UserLandProfile, meta: meta4logged },

    // Starting point for user actions that require additional security.
    { name:'user-passwordReset-start', path: '/user/passwordResetStart', component: UserPasswordResetStart, meta: meta4unlogged },
    { name:'user-emailChange-start', path: '/user/emailChangeStart', component: UserEmailChangeStart, meta: meta4unlogged },
    { name:'user-accountDel-start', path: '/user/accountDelStart', component: UserAccountDeletionStart, meta: meta4unlogged },

    // These pages are accessible only via email: link with token.
    { name:'user-passwordReset', path: '/user/passwordReset', component: UserPasswordReset, meta: meta4unlogged },
    { name:'user-emailChange', path: '/user/emailChange', component: UserEmailChange, meta: meta4unlogged },
    { name:'user-accountDel', path: '/user/accountDel', component: UserAccountDeletion, meta: meta4unlogged },

    // ADMINISTRATION PANEL PAGES

    { name:'admin-login', path: '/admin', component: UserLandLogin, meta: meta4adminLogin },
    { name:'admin-main', path: '/admin/main', component: AdminMain, meta: meta4admin },
    { name:'admin-profile', path: '/admin/profile', component: UserLandProfile, meta: meta4admin },
    { name:'admin-user', path: '/admin/user', component: AdminUser, meta: meta4admin },

    // Catch-all 404 route MUST be at the end
    { path: '/:pathMatch(.*)*', component: AppNotFound, meta: meta4unlogged }
  ];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
});

router.beforeEach((to) => {
  const isAuthenticated = AppLoginer.isLogged();
  //logger.debug(`isAuthenticated: ${isAuthenticated}`);

  // If the route requires auth and the user isn't logged in, redirect.
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Admin panel routes always start with 'admin-'.
    if (to.name?.toString().includes('admin-')) return { name: 'admin-login' }; // Redirects to the admin login route.
    return { name: 'login' }; // Redirects to the normal login route.
  }

  // Is authenticated, but not authorized?
  if (!checkAdminPermissions(to.meta)) {
    return { name: 'login' }; // Redirects to the normal login route.
  }

  // If no return statement is hit, the navigation proceeds normally.
});

const checkAdminPermissions = (meta: RouteMeta): boolean => {
  const permissions = meta.permissions as string[];
  if (permissions.length === 0) return true; // no permissions needed

  // You need just one of permissions on list to be allowed here.
  for (const perm of permissions) {
    if (AppLoginer.hasPermission(perm)) return true;
  }
  return false;
}

export default router;
