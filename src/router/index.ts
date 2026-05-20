import { createRouter, createWebHistory, type RouteMeta } from 'vue-router';

//import { logger } from '@/code/utils/logger.ts';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

import UserLandHome from '@/components/pages/home/UserLandHome.vue';
import UserLandTestArea from '@/components/pages/test/UserLandTestArea.vue';
import UserLandDebugArea from '@/components/pages/test/UserLandDebugArea.vue';
import UserLandMember from '@/components/pages/member/UserLandMember.vue';

import UserRegistration from '@/components/pages/user/UserRegistration.vue';
import UserProfile from '@/components/pages/user/UserProfile.vue';

import UserActivation from '@/components/pages/user/UserActivation.vue';
import UserPasswordResetLink from '@/components/pages/user/UserPasswordResetLink.vue';
import UserPasswordReset from '@/components/pages/user/UserPasswordReset.vue';
import UserEmailChange from '@/components/pages/user/UserEmailChange.vue';
import UserAccountDeletionLink from '@/components/pages/user/UserAccountDeletionLink.vue';
import UserAccountDeletion from '@/components/pages/user/UserAccountDeletion.vue';

import AdminProfile from '@/components/pages/admin/general/AdminProfile.vue';
import AdminMain from '@/components/pages/admin/general/AdminMain.vue';
import AdminUser from '@/components/pages/admin/user/AdminUser.vue';

import AppNotFound from '@/components/pages/common/AppNotFound.vue';
import UserLandLogin from '@/components/pages/common/UserLandLogin.vue';

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
    { name:'user-profile', path: '/user/profile', component: UserProfile, meta: meta4logged },
    { name:'user-activate', path: '/user/activate', component: UserActivation, meta: meta4unlogged },
    { name:'user-passwordReset-link', path: '/user/passwordResetLink', component: UserPasswordResetLink, meta: meta4unlogged },
    { name:'user-accountDel-link', path: '/user/accountDelLink', component: UserAccountDeletionLink, meta: meta4unlogged },

    // These pages are accessible only via links in email with token.
    { name:'user-passwordReset', path: '/user/passwordReset', component: UserPasswordReset, meta: meta4unlogged },
    { name:'user-emailChange', path: '/user/emailChange', component: UserEmailChange, meta: meta4unlogged },
    { name:'user-accountDel', path: '/user/accountDel', component: UserAccountDeletion, meta: meta4unlogged },

    // ADMINISTRATION PANEL PAGES

    { name:'admin-login', path: '/admin', component: UserLandLogin, meta: meta4adminLogin },
    { name:'admin-main', path: '/admin/main', component: AdminMain, meta: meta4admin },
    { name:'admin-profile', path: '/admin/profile', component: AdminProfile, meta: meta4admin },
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
