// This test file checks AppLayout for standard pages. Tests all layout components, including header and footer.
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
import StandardHeader from '@/components/layout/standard/header/StandardHeader.vue';
import StandardFooter from '@/components/layout/standard/footer/StandardFooter.vue';
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

describe('StandardLayout', () => {
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
    it('renders standard layout structure', async () => {
      // Arrange & Act: Mount on standard route.
      const { wrapper } = await createWrapper('/');

      // Assert: Standard layout components are present.
      expect(wrapper.findComponent(StandardHeader).exists()).toBe(true);
      expect(wrapper.findComponent(StandardFooter).exists()).toBe(true);
      expect(wrapper.findComponent(MessageContainer).exists()).toBe(true);
      expect(wrapper.find('main').exists()).toBe(true);
    });

    it('renders UserLandCookie', async () => {
      // Arrange & Act: Mount on standard route.
      const { wrapper } = await createWrapper('/');

      // Assert: Cookie consent banner is present.
      expect(wrapper.text()).toContain('cookie');
    });

    it('does not render admin layout', async () => {
      // Arrange & Act: Mount on standard route.
      const { wrapper } = await createWrapper('/');

      // Assert: No admin layout components.
      const adminHeader = wrapper.findComponent({ name: 'AdminHeader' });
      const adminFooter = wrapper.findComponent({ name: 'AdminFooter' });
      expect(adminHeader.exists()).toBe(false);
      expect(adminFooter.exists()).toBe(false);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // StandardMenu.

  describe('StandardMenu', () => {
    describe('not logged', () => {
      it('shows login and registration links', async () => {
        // Arrange & Act: Mount without login.
        const { wrapper } = await createWrapper('/');

        // Assert: Login and registration links are visible.
        expect(wrapper.find('[data-testid="header_link_login"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="header_link_registration"]').exists()).toBe(true);
      });

      it('does not show options dropdown', async () => {
        // Arrange & Act: Mount without login.
        const { wrapper } = await createWrapper('/');

        // Assert: Options dropdown trigger is not present.
        expect(wrapper.find('[data-testid="header_link_options"]').exists()).toBe(false);
      });
    });

    describe('logged', () => {
      it('shows options dropdown with profile and logout', async () => {
        // Arrange: Mount and log in.
        const { wrapper } = await createWrapper('/');
        await loginUser(wrapper);

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

      it('does not show login and registration', async () => {
        // Arrange: Mount and log in.
        const { wrapper } = await createWrapper('/');
        await loginUser(wrapper);

        // Assert: Login and registration links are not present.
        expect(wrapper.find('[data-testid="header_link_login"]').exists()).toBe(false);
        expect(wrapper.find('[data-testid="header_link_registration"]').exists()).toBe(false);
      });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // StandardBar.

  describe('StandardBar', () => {
    describe('not logged', () => {
      it('shows home, test, debug links', async () => {
        // Arrange & Act: Mount without login.
        const { wrapper } = await createWrapper('/');

        // Assert: Always-visible links are present.
        expect(wrapper.find('[data-testid="header_link_home"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="header_link_test"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="header_link_debug"]').exists()).toBe(true);
      });

      it('does not show member link', async () => {
        // Arrange & Act: Mount without login.
        const { wrapper } = await createWrapper('/');

        // Assert: Member link is not present.
        expect(wrapper.find('[data-testid="header_link_member"]').exists()).toBe(false);
      });
    });

    describe('logged', () => {
      it('shows member link', async () => {
        // Arrange: Mount and log in.
        const { wrapper } = await createWrapper('/');
        await loginUser(wrapper);

        // Assert: Member link is visible.
        expect(wrapper.find('[data-testid="header_link_member"]').exists()).toBe(true);
      });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // StandardFooter.

  describe('StandardFooter', () => {
    it('renders footer content', async () => {
      // Arrange & Act: Mount on standard route.
      const { wrapper } = await createWrapper('/');

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
      // Arrange & Act: Mount on standard route.
      const { wrapper } = await createWrapper('/');

      // Assert: MessageContainer component is present.
      expect(wrapper.findComponent(MessageContainer).exists()).toBe(true);
    });
  });
});
