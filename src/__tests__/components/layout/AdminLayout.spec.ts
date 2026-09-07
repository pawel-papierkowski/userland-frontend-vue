// This test file checks AppLayout for admin panel pages. Tests all layout components, including header and footer.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import realRouter from '@/router/index.ts';
import { useLoginStore } from '@/stores/login.ts';

import AppLayout from '@/components/layout/AppLayout.vue';
import AdminHeader from '@/components/layout/admin/header/AdminHeader.vue';
import AdminFooter from '@/components/layout/admin/footer/AdminFooter.vue';
import MessageContainer from '@/components/common/messages/MessageContainer.vue';

import { genJwt } from '@/__tests__/_helpers/jwt.ts';

// ////////////////////////////////////////////////////////////////////////////
// Helpers.

/**
 * Create a wrapper for AppLayout with real router, pinia, i18n, and logger.
 * @param initialPath Route to navigate to.
 */
async function createWrapper(initialPath: string) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const router = createRouter({
    history: createMemoryHistory(),
    routes: realRouter.options.routes,
  });

  router.push(initialPath);
  await router.isReady();

  const wrapper = mount(AppLayout, {
    global: {
      plugins: [logger, pinia, router, i18n],
    },
  });

  await flushPromises();
  return { wrapper, router, pinia };
}

/**
 * Log in the user by applying a JWT to the login store and waiting for re-render.
 * @param wrapper Component wrapper.
 * @param permissions Optional permissions to encode in the token.
 */
async function loginUser(
  wrapper: ReturnType<typeof mount>,
  permissions: { prefix: string; suffix: string }[] = [],
) {
  const loginStore = useLoginStore();
  loginStore.applyToken(genJwt(permissions));
  await nextTick();
}

// ////////////////////////////////////////////////////////////////////////////

describe('AdminLayout', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // //////////////////////////////////////////////////////////////////////////
  // General.

  describe('general', () => {
    it('renders admin layout structure', async () => {
      // Arrange & Act: Mount on admin-login route.
      const { wrapper } = await createWrapper('/admin');

      // Assert: Admin layout components are present.
      expect(wrapper.findComponent(AdminHeader).exists()).toBe(true);
      expect(wrapper.findComponent(AdminFooter).exists()).toBe(true);
      expect(wrapper.findComponent(MessageContainer).exists()).toBe(true);
      expect(wrapper.find('main').exists()).toBe(true);
    });

    it('renders UserLandCookie', async () => {
      // Arrange & Act: Mount on admin route.
      const { wrapper } = await createWrapper('/admin');

      // Assert: Cookie consent banner is present.
      expect(wrapper.text()).toContain('cookie');
    });

    it('does not render standard layout', async () => {
      // Arrange & Act: Mount on admin route.
      const { wrapper } = await createWrapper('/admin');

      // Assert: No standard layout components.
      const standardHeader = wrapper.findComponent({ name: 'StandardHeader' });
      const standardFooter = wrapper.findComponent({ name: 'StandardFooter' });
      expect(standardHeader.exists()).toBe(false);
      expect(standardFooter.exists()).toBe(false);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // AdminMenu.

  describe('AdminMenu', () => {
    describe('not logged on admin-login', () => {
      it('shows no login link', async () => {
        // Arrange & Act: Mount on admin-login page without login.
        const { wrapper } = await createWrapper('/admin');

        // Assert: Login link is not shown (avoids redundancy on login page).
        expect(wrapper.find('[data-testid="header_link_login"]').exists()).toBe(false);
      });

      it('does not show options dropdown', async () => {
        // Arrange & Act: Mount on admin-login page without login.
        const { wrapper } = await createWrapper('/admin');

        // Assert: Options dropdown trigger is not present.
        expect(wrapper.find('[data-testid="header_link_options"]').exists()).toBe(false);
      });
    });

    describe('logged', () => {
      it('shows options dropdown with profile and logout', async () => {
        // Arrange: Mount on admin route and log in as admin.
        const { wrapper } = await createWrapper('/admin/main');
        await loginUser(wrapper, [{ prefix: 'role', suffix: 'admin' }]);

        // Assert: Options trigger is visible.
        const optionsTrigger = wrapper.find('[data-testid="header_link_options"]');
        expect(optionsTrigger.exists()).toBe(true);

        // Act: Open the dropdown.
        await optionsTrigger.trigger('click');
        await wrapper.vm.$nextTick();

        // Assert: Profile and logout links are visible in dropdown.
        expect(wrapper.find('[data-testid="header_link_profile"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="header_link_logout"]').exists()).toBe(true);
      });

      it('does not show login link', async () => {
        // Arrange: Mount on admin route and log in.
        const { wrapper } = await createWrapper('/admin/main');
        await loginUser(wrapper, [{ prefix: 'role', suffix: 'admin' }]);

        // Assert: Login link is not present.
        expect(wrapper.find('[data-testid="header_link_login"]').exists()).toBe(false);
      });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // AdminBar.

  describe('AdminBar', () => {
    describe('not logged', () => {
      it('shows nothing', async () => {
        // Arrange & Act: Mount on admin-login page without login.
        const { wrapper } = await createWrapper('/admin');

        // Assert: No admin bar links are present.
        expect(wrapper.find('[data-testid="header_link_main"]').exists()).toBe(false);
        expect(wrapper.find('[data-testid="header_link_users"]').exists()).toBe(false);
      });
    });

    describe('logged as admin', () => {
      it('shows main and users', async () => {
        // Arrange: Mount on admin route and log in as admin.
        const { wrapper } = await createWrapper('/admin/main');
        await loginUser(wrapper, [{ prefix: 'role', suffix: 'admin' }]);

        // Assert: Both main and users links are visible.
        expect(wrapper.find('[data-testid="header_link_main"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="header_link_users"]').exists()).toBe(true);
      });
    });

    describe('logged as operator without user_view', () => {
      it('shows main only', async () => {
        // Arrange: Mount on admin route and log in as operator without user permissions.
        const { wrapper } = await createWrapper('/admin/main');
        await loginUser(wrapper, [{ prefix: 'role', suffix: 'operator' }]);

        // Assert: Main link is visible, users link is not.
        expect(wrapper.find('[data-testid="header_link_main"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="header_link_users"]').exists()).toBe(false);
      });
    });

    describe('logged as operator with user_view', () => {
      it('shows main and users', async () => {
        // Arrange: Mount on admin route and log in as operator with user_view permission.
        const { wrapper } = await createWrapper('/admin/main');
        await loginUser(wrapper, [
          { prefix: 'role', suffix: 'operator' },
          { prefix: 'user', suffix: 'view' },
        ]);

        // Assert: Both main and users links are visible.
        expect(wrapper.find('[data-testid="header_link_main"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="header_link_users"]').exists()).toBe(true);
      });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // AdminFooter.

  describe('AdminFooter', () => {
    it('renders footer content', async () => {
      // Arrange & Act: Mount on admin route.
      const { wrapper } = await createWrapper('/admin');

      // Assert: Footer contains expected content.
      const footer = wrapper.find('footer');
      expect(footer.exists()).toBe(true);
      expect(footer.text()).toContain('Vue');
      expect(footer.text()).toContain('©');
      expect(footer.text()).toContain('Paweł Papierkowski');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // MessageContainer.

  describe('MessageContainer', () => {
    it('is rendered', async () => {
      // Arrange & Act: Mount on admin route.
      const { wrapper } = await createWrapper('/admin');

      // Assert: MessageContainer component is present.
      expect(wrapper.findComponent(MessageContainer).exists()).toBe(true);
    });
  });
});
