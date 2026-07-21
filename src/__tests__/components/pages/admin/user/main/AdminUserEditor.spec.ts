import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';

import AdminUserEditor from '@/components/pages/admin/user/main/AdminUserEditor.vue';
import { AppUserEventer } from '@/code/stores/events/AppUserEventer.ts';

// Mocks — must be at module level.

// Tab components have many dependencies — stub them.
vi.mock('@/components/pages/admin/user/main/AdminUserMain.vue', () => ({
  default: { name: 'AdminUserMain', template: '<div>main</div>' },
}));
vi.mock('@/components/pages/admin/user/history/AdminUserHistory.vue', () => ({
  default: { name: 'AdminUserHistory', template: '<div>history</div>' },
}));
vi.mock('@/components/pages/admin/user/permissions/AdminUserPermissions.vue', () => ({
  default: { name: 'AdminUserPermissions', template: '<div>permissions</div>' },
}));
vi.mock('@/components/pages/admin/user/config/AdminUserConfig.vue', () => ({
  default: { name: 'AdminUserConfig', template: '<div>config</div>' },
}));
vi.mock('@/components/pages/admin/user/tokens/AdminUserTokens.vue', () => ({
  default: { name: 'AdminUserTokens', template: '<div>tokens</div>' },
}));
vi.mock('@/components/pages/admin/user/jwt/AdminUserJwt.vue', () => ({
  default: { name: 'AdminUserJwt', template: '<div>jwt</div>' },
}));
vi.mock('@/code/stores/events/AppUserEventer.ts');

// ////////////////////////////////////////////////////////////////////////////
// Test data

interface TestUserEntry {
  id: number;
  createdAt: string;
  username: string;
  email: string;
}

const testUser1: TestUserEntry = {
  id: 10,
  createdAt: '2024-01-15T10:00:00Z',
  username: 'user1',
  email: 'user1@test.com',
};

// ////////////////////////////////////////////////////////////////////////////
// Helpers

let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
});

function createComponent(modelValue?: TestUserEntry | null) {
  return mount(AdminUserEditor, {
    global: { plugins: [i18n, pinia] },
    props: { modelValue: modelValue ?? null },
  });
}

// ////////////////////////////////////////////////////////////////////////////
// Tests

/** Tests of AdminUserEditor component. */
describe('AdminUserEditor', () => {
  // //////////////////////////////////////////////////////////////////////////
  // Rendering

  describe('rendering', () => {
    it('renders all 6 tab headers', () => {
      const wrapper = createComponent();

      // Assert: Six tab entries rendered.
      const tabEntries = wrapper.findAll('.tab-entry');
      expect(tabEntries).toHaveLength(6);
    });

    it('renders tab headers with correct translations', () => {
      const wrapper = createComponent();
      const tabEntries = wrapper.findAll('.tab-entry');

      // Assert: Each tab shows its translated label.
      expect(tabEntries[0]!.text()).toBe('👤 User');
      expect(tabEntries[1]!.text()).toBe('📅 History');
      expect(tabEntries[2]!.text()).toBe('🔐 Permissions');
      expect(tabEntries[3]!.text()).toBe('⚙️ Configuration');
      expect(tabEntries[4]!.text()).toBe('🔗 Tokens');
      expect(tabEntries[5]!.text()).toBe('🎫 JWT');
    });

    it('shows the AdminUserMain tab content by default', () => {
      const wrapper = createComponent();
      expect(wrapper.html()).toContain('main');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Tab switching

  describe('tab switching', () => {
    it('switches to history tab on click', async () => {
      const wrapper = createComponent();

      // Act: Click the second tab (History).
      const tabEntries = wrapper.findAll('.tab-entry');
      await tabEntries[1]!.trigger('click');

      // Assert: History content is shown.
      expect(wrapper.html()).toContain('history');
    });

    it('switches to permissions tab on click', async () => {
      const wrapper = createComponent();

      const tabEntries = wrapper.findAll('.tab-entry');
      await tabEntries[2]!.trigger('click');

      expect(wrapper.html()).toContain('permissions');
    });

    it('switches to config tab on click', async () => {
      const wrapper = createComponent();

      const tabEntries = wrapper.findAll('.tab-entry');
      await tabEntries[3]!.trigger('click');

      expect(wrapper.html()).toContain('config');
    });

    it('switches to tokens tab on click', async () => {
      const wrapper = createComponent();

      const tabEntries = wrapper.findAll('.tab-entry');
      await tabEntries[4]!.trigger('click');

      expect(wrapper.html()).toContain('tokens');
    });

    it('switches to jwt tab on click', async () => {
      const wrapper = createComponent();

      const tabEntries = wrapper.findAll('.tab-entry');
      await tabEntries[5]!.trigger('click');

      expect(wrapper.html()).toContain('jwt');
    });

    it('only one tab is active at a time', async () => {
      const wrapper = createComponent();

      // First tab (User) is active by default.
      let tabEntries = wrapper.findAll('.tab-entry');
      expect(tabEntries[0]!.classes()).toContain('active');
      expect(tabEntries[1]!.classes()).not.toContain('active');

      // Act: Click the History tab.
      await tabEntries[1]!.trigger('click');

      // Assert: History is now active, User is not.
      tabEntries = wrapper.findAll('.tab-entry');
      expect(tabEntries[0]!.classes()).not.toContain('active');
      expect(tabEntries[1]!.classes()).toContain('active');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // User selection

  describe('user selection', () => {
    it('notifies user selected when selRecord changes to a user', async () => {
      const wrapper = createComponent(null);

      // Act: Set a user.
      await wrapper.setProps({ modelValue: testUser1 });
      await nextTick();

      // Assert: Event was notified.
      expect(AppUserEventer.notifyUserSelected).toHaveBeenCalledTimes(1);
    });

    it('notifies user selected when selRecord changes to null', async () => {
      const wrapper = createComponent(testUser1);

      // Act: Deselect user.
      await wrapper.setProps({ modelValue: null });
      await nextTick();

      // Assert: Event was notified.
      expect(AppUserEventer.notifyUserSelected).toHaveBeenCalledTimes(1);
    });
  });
});
