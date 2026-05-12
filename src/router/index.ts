import { createRouter, createWebHistory } from 'vue-router';

import UserLandHome from '@/components/pages/home/UserLandHome.vue';
import UserLandTestArea from '@/components/pages/test/UserLandTestArea.vue';
import UserLandMember from '@/components/pages/member/UserLandMember.vue';

import UserRegistration from '@/components/pages/user/registration/UserRegistration.vue';
import UserLogin from '@/components/pages/user/login/UserLogin.vue';
import UserProfile from '@/components/pages/user/profile/UserProfile.vue';

import UserActivate from '@/components/pages/user/activate/UserActivate.vue';
import UserPasswordReset from '@/components/pages/user/passwordReset/UserPasswordReset.vue';
import UserEmailChange from '@/components/pages/user/emailChange/UserEmailChange.vue';
import UserAccountDeletion from '@/components/pages/user/accountDeletion/UserAccountDeletion.vue';

import AdminLogin from '@/components/pages/admin/general/AdminLogin.vue';
import AdminMain from '@/components/pages/admin/general/AdminMain.vue';
import AdminUser from '@/components/pages/admin/user/AdminUser.vue';

import AppNotFound from '@/components/pages/errors/AppNotFound.vue';

const meta4logged = { layout: 'STANDARD', requiresAuth: true, permissions: ['ROLE_OPERATOR', 'ROLE_ADMIN'] };
const meta4admin = { layout: 'ADMIN', requiresAuth: true };

// Define all routes for this app.
const routes = [
    // STANDARD WEBPAGES
    { name:'home', path: '/', component: UserLandHome },
    { name:'testArea', path: '/testArea', component: UserLandTestArea },
    { name:'member', path: '/member', component: UserLandMember, meta: meta4logged },

    // User-related pages.

    { name:'user-registration', path: '/user/registration', component: UserRegistration },
    { name:'user-login', path: '/user/login', component: UserLogin },
    { name:'user-profile', path: '/user/profile', component: UserProfile, meta: meta4logged },

    { name:'user-activate', path: '/user/activate', component: UserActivate },
    { name:'user-passwordReset', path: '/user/passwordReset', component: UserPasswordReset },
    { name:'user-emailChange', path: '/user/emailChange', component: UserEmailChange },
    { name:'user-accountDeletion', path: '/user/accountDeletion', component: UserAccountDeletion },

    // ADMINISTRATION PANEL PAGES
    { name:'admin-login', path: '/admin/login', component: AdminLogin, meta: { layout: 'ADMIN' } }, // note this page is available for everyone
    { name:'admin-main', path: '/admin/main', component: AdminMain, meta: meta4admin },
    { name:'admin-user', path: '/admin/user', component: AdminUser, meta: meta4admin },

    // Catch-all 404 route MUST be at the end
    { path: '/:pathMatch(.*)*', component: AppNotFound }
  ];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
});

router.beforeEach((to) => {
  const isAuthenticated = false; //checkAuthToken(); // TODO

  // If the route requires auth and the user isn't logged in, redirect.
  if (to.meta.requiresAuth && !isAuthenticated) {
    if (to.name?.toString().includes('admin')) return { name: 'admin-login' }; // Redirects to the admin login route.
    return { name: 'user-login' }; // Redirects to the normal login route.
  }

  // TODO verify permissions if needed
  //if (!checkAdminPermissions()) {
  //  return { name: 'user-login' }; // Redirects to the normal login route.
  //}

  // If no return statement is hit, the navigation proceeds normally.
});

export default router;
