import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';

import { useUserEventStore } from '@/stores/events/user-events.ts';

import type { TableMetaResp } from '@/code/data/features/common/type.ts';

import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import apiLogging from '@/services/api-logging.ts';

import AdminUserJwt from '@/components/pages/admin/user/jwt/AdminUserJwt.vue';
import { AppMessager } from '@/code/wrappers/messages/AppMessager.ts';

//
// Mocks — these must be at module level.
//

vi.mock('@/services/api-common.ts', () => ({
  default: {
    create: vi.fn<() => void>(),
  },
}));
vi.mock('@/services/api-logging.ts', () => ({
  default: {
    logError: vi.fn<() => void>(),
  },
}));
vi.mock('@/code/wrappers/messages/AppMessager.ts');
// api-admin-users.ts calls backendApi.create('/admin') at module level — mock to prevent side effects.
vi.mock('@/services/features/api-admin-users.ts', () => ({
  default: {
    loadJwtPage: vi.fn<() => void>(),
  },
}));

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

const emptyMeta: TableMetaResp = {
  pageCount: 0,
  entryCount: 0,
  pageSize: 10,
  page: 0,
  sortBy: '',
  sortOrder: '',
};

const fullMeta: TableMetaResp = {
  pageCount: 1,
  entryCount: 2,
  pageSize: 10,
  page: 0,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
};

// ////////////////////////////////////////////////////////////////////////////
// Helpers

/** Create a deferred promise for controlling async flow. */
function createDeferredPromise<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** Wait for all pending microtasks to complete. */
function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ////////////////////////////////////////////////////////////////////////////
// Mocks setup

let mockLoadJwtPage: ReturnType<typeof vi.fn>;
let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();
  mockLoadJwtPage = vi.mocked(backendApiAdminUser.loadJwtPage);
});

/** Create mounted component. */
function createComponent(modelValue?: TestUserEntry | null, isActive = true) {
  return mount(AdminUserJwt, {
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue: modelValue ?? null,
      isActive,
    },
  });
}

// ////////////////////////////////////////////////////////////////////////////
// Tests

/** Tests of AdminUserJwt component. */
describe('AdminUserJwt', () => {
  // //////////////////////////////////////////////////////////////////////////
  // No user selected

  describe('no user selected', () => {
    it('renders filter slot', () => {
      // Arrange & Act: Mount with no user.
      const wrapper = createComponent();

      // Assert: AdminUserJwtFilter is rendered via the filter slot.
      const formFilter = wrapper.find('[data-testid="form-user-filter"]');
      expect(formFilter.exists()).toBe(true);
    });

    it('does not call loadJwtPage on mount', () => {
      // Arrange & Act: Mount with no user.
      createComponent();

      // Assert: No API call made when no user is selected.
      expect(mockLoadJwtPage).not.toHaveBeenCalled();
    });

    it('shows emptyNoUserText', () => {
      // Arrange & Act: Mount with no user.
      const wrapper = createComponent();

      // Assert: Empty message says "no user".
      const emptyEl = wrapper.find('.table-empty');
      expect(emptyEl.exists()).toBe(true);
      expect(emptyEl.text()).toBe('No JWTs to show.');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // User selected — data loading

  describe('user selected', () => {
    it('calls loadJwtPage with correct params on mount', async () => {
      // Arrange: Mount with user, resolve data.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadJwtPage.mockReturnValue(promise);

      createComponent(testUser1);

      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();

      // Assert: API called with converted request.
      expect(mockLoadJwtPage).toHaveBeenCalledTimes(1);
      const callArg = mockLoadJwtPage.mock.calls[0]?.[0];
      expect(callArg).toMatchObject({
        userId: testUser1.id,
        createdFromAt: null,
        createdToAt: null,
        tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
      });
    });

    it('renders table rows when data is loaded', async () => {
      // Arrange: Fetch resolves with entries.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadJwtPage.mockReturnValue(promise);

      const wrapper = createComponent(testUser1);

      const testEntries = [
        {
          id: 1,
          createdAt: '2024-06-15T12:00:00Z',
          expiresAt: '2025-06-15T12:00:00Z',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        {
          id: 2,
          createdAt: '2024-07-20T08:30:00Z',
          expiresAt: '2025-07-20T08:30:00Z',
          token: 'eyJraWQiOiIxIjw...',
        },
      ];

      resolve({ data: { entries: testEntries, tableMeta: fullMeta } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Assert: Table rows are rendered.
      const rows = wrapper.findAll('.table-row');
      expect(rows).toHaveLength(2);

      // Assert: No empty message.
      expect(wrapper.find('.table-empty').exists()).toBe(false);
    });

    it('shows emptyText when data is empty with user selected', async () => {
      // Arrange: Fetch resolves with empty entries.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadJwtPage.mockReturnValue(promise);

      const wrapper = createComponent(testUser1);

      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Assert: Shows empty text (not no-user text).
      const tableEmpty = wrapper.find('.table-empty');
      expect(tableEmpty.exists()).toBe(true);
      expect(tableEmpty.text()).toBe('⚠️ No JWTs to show. Check filter settings. ⚠️');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // User change

  describe('user change', () => {
    it('refetches data when user changes', async () => {
      // Arrange: Mount with first user, let fetch complete.
      const { promise: promise1, resolve: resolve1 } = createDeferredPromise<unknown>();
      mockLoadJwtPage.mockReturnValue(promise1);

      const wrapper = createComponent(testUser1);

      resolve1({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();

      expect(mockLoadJwtPage).toHaveBeenCalledTimes(1);
      vi.clearAllMocks();

      // Act: Change user.
      const { promise: promise2, resolve: resolve2 } = createDeferredPromise<unknown>();
      mockLoadJwtPage.mockReturnValue(promise2);

      const testUser2: TestUserEntry = {
        id: 20,
        createdAt: '2024-02-20T12:00:00Z',
        username: 'user2',
        email: 'user2@test.com',
      };
      await wrapper.setProps({ modelValue: testUser2 });
      await nextTick();

      resolve2({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();

      // Assert: New fetch with new userId.
      expect(mockLoadJwtPage).toHaveBeenCalledTimes(1);
      const callArg = mockLoadJwtPage.mock.calls[0]?.[0];
      expect(callArg).toMatchObject({ userId: testUser2.id });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Deferred reload (user table reload / tab activation)

  describe('deferred reload', () => {
    it('do not load data when user is selected but tab is inactive', async () => {
      // Arrange & Act: Mount with a user selected on an inactive tab.
      createComponent(testUser1, false);

      // Assert: No fetch is made for an inactive tab.
      expect(mockLoadJwtPage).not.toHaveBeenCalled();
    });

    it('load data for the selected user when the tab is active', async () => {
      // Arrange & Act: Mount with a user selected on the active tab.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadJwtPage.mockReturnValue(promise);

      createComponent(testUser1, true);
      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();

      // Assert: Data was loaded.
      expect(mockLoadJwtPage).toHaveBeenCalledTimes(1);
    });

    it('reload immediately when user table is reloaded and tab is active', async () => {
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadJwtPage.mockReturnValue(promise);

      // Arrange & Act: Mount with a user selected on an active tab.
      const wrapper = createComponent(testUser1);

      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();

      // Assert: Reload of subtable was called (tab is active).
      expect(mockLoadJwtPage).toHaveBeenCalledTimes(1);
      vi.clearAllMocks();

      // Act: Notify main user table was reloaded.
      const userEventStore = useUserEventStore();
      userEventStore.notifyUsersReload();
      await nextTick();

      // Assert: Reload of subtable was called (tab is active).
      expect(mockLoadJwtPage).toHaveBeenCalledTimes(1);

      // Act: Deactivate and reactivate the tab.
      await wrapper.setProps({ isActive: false });
      const { promise: promise2, resolve: resolve2 } = createDeferredPromise<unknown>();
      mockLoadJwtPage.mockReturnValue(promise2);
      await wrapper.setProps({ isActive: true });
      await nextTick();

      // Assert: Data is NOT reloaded again on reactivation of tab.
      expect(mockLoadJwtPage).toHaveBeenCalledTimes(1);

      // Cleanup.
      resolve2({ data: { entries: [], tableMeta: emptyMeta } });
    });

    it('do not reload immediately when user table is reloaded and tab is inactive', async () => {
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadJwtPage.mockReturnValue(promise);

      // Arrange & Act: Mount with a user selected on an inactive tab.
      const wrapper = createComponent(testUser1, false);

      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();

      // Assert: Reload of subtable was NOT called yet (tab is not active).
      expect(mockLoadJwtPage).not.toHaveBeenCalled();
      vi.clearAllMocks();

      // Act: Notify main user table was reloaded.
      const userEventStore = useUserEventStore();
      userEventStore.notifyUsersReload();
      await nextTick();

      // Assert: Reload of subtable was NOT called yet (deferred until tab activation).
      expect(mockLoadJwtPage).not.toHaveBeenCalled();

      // Act: Deactivate and reactivate the tab.
      await wrapper.setProps({ isActive: false });
      const { promise: promise2, resolve: resolve2 } = createDeferredPromise<unknown>();
      mockLoadJwtPage.mockReturnValue(promise2);
      await wrapper.setProps({ isActive: true });
      await nextTick();

      // Assert: Data is reloaded on reactivation after a main user table reload.
      expect(mockLoadJwtPage).toHaveBeenCalledTimes(1);

      // Cleanup.
      resolve2({ data: { entries: [], tableMeta: emptyMeta } });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Error handling

  describe('error handling', () => {
    it('shows error message on fetch failure', async () => {
      // Arrange: Mount with user, fetch rejects.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadJwtPage.mockReturnValue(promise);

      createComponent(testUser1);

      // Act: Reject fetch.
      const testError = new Error('Network error');
      resolve(Promise.reject(testError));
      try {
        await flushPromises();
      } catch {
        // Expected.
      }
      await nextTick();

      // Assert: Error message was shown.
      expect(AppMessager.errorT).toHaveBeenCalledWith(
        testError,
        'admin.user.msg.errorLoadTable.title',
        'admin.user.msg.errorLoadTable.content',
      );
    });

    it('logs error on fetch failure', async () => {
      // Arrange: Mount with user, fetch rejects.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadJwtPage.mockReturnValue(promise);

      createComponent(testUser1);

      // Act: Reject fetch.
      const testError = new Error('Connection lost');
      resolve(Promise.reject(testError));
      try {
        await flushPromises();
      } catch {
        // Expected.
      }
      await nextTick();

      // Assert: Error was logged.
      expect(apiLogging.logError).toHaveBeenCalledWith(testError, 'User tab table reload failed!');
    });
  });
});
