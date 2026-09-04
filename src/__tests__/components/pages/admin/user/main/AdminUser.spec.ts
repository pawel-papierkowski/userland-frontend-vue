import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';

import type { TableMetaResp } from '@/code/data/features/common/type.ts';

import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import apiLogging from '@/services/api-logging.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import { TimeUtils } from '@/code/utils/TimeUtils';

import { useUserEventStore } from '@/stores/events/user-events.ts';
import { emptyUserForm } from '@/code/data/features/user/user-const.ts';
import type { UserTableFilterForm, UserTableReq } from '@/code/data/features/user/admin-user-type.ts';

import AdminUser from '@/components/pages/admin/user/main/AdminUser.vue';

// ////////////////////////////////////////////////////////////////////////////
// Mocks — must be at module level.

vi.mock('@/services/features/api-admin-users.ts', () => ({
  default: {
    loadPage: vi.fn<() => void>(),
  },
}));
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
vi.mock('@/code/stores/messages/AppMessager.ts');
vi.mock('@/code/utils/TimeUtils', () => ({
  TimeUtils: {
    cnvDate: vi.fn<() => void>(),
    zoned: vi.fn<() => void>(),
  },
}));
// Side-effect mocks — modules imported by other modules at the top level.
vi.mock('@/services/features/api-users.ts', () => ({ default: {} }));
vi.mock('@/code/stores/login/AppLoginer.ts', () => ({}));

// ////////////////////////////////////////////////////////////////////////////
// Test types

interface TestUserEntry {
  id: number;
  createdAt: string;
  username: string;
  email: string;
}

// ////////////////////////////////////////////////////////////////////////////
// Test data

const testEntries: TestUserEntry[] = [
  { id: 1, createdAt: '2024-01-15T10:00:00Z', username: 'alice', email: 'alice@test.com' },
  { id: 2, createdAt: '2024-02-20T12:00:00Z', username: 'bob', email: 'bob@test.com' },
];

const metaResp: TableMetaResp = {
  pageCount: 1,
  entryCount: 2,
  pageSize: 20,
  page: 0,
  sortBy: 'username',
  sortOrder: 'ASC',
};

const emptyMeta: TableMetaResp = {
  pageCount: 0,
  entryCount: 0,
  pageSize: 20,
  page: 0,
  sortBy: '',
  sortOrder: '',
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

let pinia: ReturnType<typeof createPinia>;
let mockLoadPage: ReturnType<typeof vi.fn>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();

  mockLoadPage = vi.mocked(backendApiAdminUser.loadPage);

  // Default: TimeUtils.cnvDate returns null (dates are null by default).
  vi.mocked(TimeUtils.cnvDate).mockReturnValue(null);
  // Default: TimeUtils.zoned acts as identity.
  vi.mocked(TimeUtils.zoned).mockImplementation((s: string | null | undefined) => String(s));
});

/**
 * Create component with mount. We stub the complex child components so their
 * internal dependencies do not interfere. TableWrapper is not stubbed because
 * it uses named slots that the stub would not render.
 */
function createComponent() {
  return mount(AdminUser, {
    global: {
      plugins: [i18n, pinia],
      stubs: {
        AdminUserFilter: true,
        AdminUserEditor: true,
        TablePage: true,
      },
    },
  });
}

/** Helper to get a stub tag name from a PascalCase component name. */
function stubTag(name: string): string {
  return (
    name
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '') + '-stub'
  );
}

/** Convenience: find a stub component by its tag name, returning a VueWrapper with vm access. */
function findStubComp(wrapper: ReturnType<typeof createComponent>, name: string): VueWrapper {
  return wrapper.findComponent(stubTag(name)) as VueWrapper;
}

/** Convenience: find a stub DOM element by its tag name, returning a DOMWrapper. */
function findStubEl(wrapper: ReturnType<typeof createComponent>, name: string) {
  return wrapper.find(stubTag(name));
}

// ////////////////////////////////////////////////////////////////////////////
// Tests

/** Tests of AdminUser page component. */
describe('AdminUser', () => {
  // //////////////////////////////////////////////////////////////////////////
  // Initial load

  describe('initial load', () => {
    it('calls loadPage on mount', () => {
      // Arrange: Create deferred promise to control response timing.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(promise);

      // Act: Mount component.
      createComponent();

      // Assert: LoadPage was called on mount.
      expect(mockLoadPage).toHaveBeenCalledTimes(1);

      // Cleanup: Resolve to avoid hanging promise.
      resolve({ data: { entries: [], tableMeta: { ...emptyMeta } } });
    });

    it('renders TablePage with entries after successful load', async () => {
      // Arrange: Mount and resolve with entries.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(promise);

      const wrapper = createComponent();

      // Act: Resolve the pending API call.
      resolve({ data: { entries: testEntries, tableMeta: { ...metaResp } } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Assert: TablePage stub is rendered.
      expect(findStubEl(wrapper, 'TablePage').exists()).toBe(true);
      expect(wrapper.html()).toContain(stubTag('TablePage'));
    });

    it('renders empty state when no entries returned', async () => {
      // Arrange: Mount and resolve with empty entries.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(promise);

      const wrapper = createComponent();

      // Act: Resolve with no entries.
      resolve({ data: { entries: [], tableMeta: { ...emptyMeta } } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Assert: TablePage stub is rendered.
      expect(wrapper.html()).toContain(stubTag('TablePage'));
    });

    it('sets isLoading to true during load and false after', async () => {
      // Arrange: Create deferred promise.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(promise);

      const wrapper = createComponent();

      // Assert: TablePage stub exists (loading state).
      expect(wrapper.html()).toContain(stubTag('TablePage'));

      // Act: Resolve.
      resolve({ data: { entries: testEntries, tableMeta: { ...metaResp } } });
      await flushPromises();
      await nextTick();

      // Assert: TablePage stub still rendered after load.
      expect(wrapper.html()).toContain(stubTag('TablePage'));
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Error handling

  describe('error handling', () => {
    it('shows error message on load failure', async () => {
      // Arrange: Mount and reject the API call.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(promise);

      createComponent();

      // Act: Reject.
      const testError = new Error('Network error');
      resolve(Promise.reject(testError));
      try {
        await flushPromises();
      } catch {
        // Expected - the rejection propagates to the catch.
      }
      await nextTick();

      // Assert: Error message was shown.
      expect(AppMessager.errorT).toHaveBeenCalledWith(
        testError,
        'admin.user.msg.errorLoadTable.title',
        'admin.user.msg.errorLoadTable.content',
      );
    });

    it('logs error on load failure', async () => {
      // Arrange: Mount and reject.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(promise);

      createComponent();

      // Act: Reject.
      const testError = new Error('Connection lost');
      resolve(Promise.reject(testError));
      try {
        await flushPromises();
      } catch {
        // Expected.
      }
      await nextTick();

      // Assert: Error was logged.
      expect(apiLogging.logError).toHaveBeenCalledWith(testError, 'User table reload failed!');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Date conversion

  describe('date conversion (convertToReq)', () => {
    it('calls loadPage with null dates when form has no dates', async () => {
      // Arrange: Mount — default form has all-null dates, cnvDate returns null.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(promise);

      createComponent();

      // Assert: The request has null date fields.
      const callArg = mockLoadPage.mock.calls[0]?.[0] as UserTableReq;
      expect(callArg.createdFromAt).toBeNull();
      expect(callArg.createdToAt).toBeNull();

      // Cleanup.
      resolve({ data: { entries: [], tableMeta: { ...emptyMeta } } });
      await flushPromises();
    });

    it('appends T00:00:00 to createdFromAt date', async () => {
      // Arrange: Mount and let initial load complete.
      const { promise: p1, resolve: r1 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p1);

      const wrapper = createComponent();
      r1({ data: { entries: [], tableMeta: { ...emptyMeta } } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Set cnvDate to simulate a date conversion for subsequent calls.
      vi.mocked(TimeUtils.cnvDate).mockReturnValue('2024-01-15');

      // Act: Emit form update on the stub to set createdFromAt, then reload.
      const filterComp = findStubComp(wrapper, 'AdminUserFilter');
      expect(filterComp.exists()).toBe(true);

      const formWithDate: UserTableFilterForm = {
        username: null,
        email: null,
        status: null,
        locked: null,
        createdFromAt: new Date('2024-01-15'),
        createdToAt: null,
        tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
      };
      await filterComp.vm.$emit('update:modelValue', formWithDate);
      await nextTick();
      mockLoadPage.mockClear();
      vi.mocked(TimeUtils.cnvDate).mockClear();

      const { promise: p2, resolve: r2 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p2);
      await filterComp.vm.$emit('reload');
      await nextTick();

      // Assert: CnvDate was called with the date, and the request has the
      // correctly formatted string.
      expect(TimeUtils.cnvDate).toHaveBeenCalledWith(formWithDate.createdFromAt);
      const callArg = mockLoadPage.mock.calls[0]?.[0] as UserTableReq;
      expect(callArg.createdFromAt).toBe('2024-01-15T00:00:00');

      // Cleanup.
      r2({ data: { entries: [], tableMeta: { ...emptyMeta } } });
      await flushPromises();
    });

    it('appends T23:59:59.999999 to createdToAt date', async () => {
      // Arrange: Mount and let initial load complete.
      const { promise: p1, resolve: r1 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p1);

      const wrapper = createComponent();
      r1({ data: { entries: [], tableMeta: { ...emptyMeta } } });
      await flushPromises();
      await nextTick();
      await nextTick();

      vi.mocked(TimeUtils.cnvDate).mockReturnValue('2024-12-31');

      // Act: Emit form update and reload.
      const filterComp = findStubComp(wrapper, 'AdminUserFilter');
      expect(filterComp.exists()).toBe(true);

      const formWithDate: UserTableFilterForm = {
        username: null,
        email: null,
        status: null,
        locked: null,
        createdFromAt: null,
        createdToAt: new Date('2024-12-31'),
        tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
      };
      await filterComp.vm.$emit('update:modelValue', formWithDate);
      await nextTick();
      mockLoadPage.mockClear();
      vi.mocked(TimeUtils.cnvDate).mockClear();

      const { promise: p2, resolve: r2 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p2);
      await filterComp.vm.$emit('reload');
      await nextTick();

      // Assert: CnvDate was called with the date, and the request has the
      // correctly formatted string.
      expect(TimeUtils.cnvDate).toHaveBeenCalledWith(formWithDate.createdToAt);
      const callArg = mockLoadPage.mock.calls[0]?.[0] as UserTableReq;
      expect(callArg.createdToAt).toBe('2024-12-31T23:59:59.999999');

      // Cleanup.
      r2({ data: { entries: [], tableMeta: { ...emptyMeta } } });
      await flushPromises();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Entry processing

  describe('entry processing', () => {
    it('calls TimeUtils.zoned on each entry createdAt', async () => {
      // Arrange: Mount and resolve with entries.
      const { promise, resolve } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(promise);

      createComponent();

      // Act: Resolve with entries.
      resolve({ data: { entries: testEntries, tableMeta: { ...metaResp } } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Assert: Each entry's createdAt was processed.
      expect(TimeUtils.zoned).toHaveBeenCalledTimes(2);
      expect(TimeUtils.zoned).toHaveBeenCalledWith(testEntries[0]!.createdAt);
      expect(TimeUtils.zoned).toHaveBeenCalledWith(testEntries[1]!.createdAt);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Pagination

  describe('pagination', () => {
    it('reloads data when currPage changes', async () => {
      // Arrange: Mount and let initial load complete.
      const { promise: p1, resolve: r1 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p1);

      const wrapper = createComponent();
      r1({ data: { entries: testEntries, tableMeta: { ...metaResp } } });
      await flushPromises();
      await nextTick();
      await nextTick();

      mockLoadPage.mockClear();

      // Act: Emit page change from TablePage stub.
      const { promise: p2, resolve: r2 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p2);

      const tablePageComp = findStubComp(wrapper, 'TablePage');
      expect(tablePageComp.exists()).toBe(true);

      await tablePageComp.vm.$emit('update:currPage', 1);
      await nextTick();

      // Assert: LoadPage was called again.
      expect(mockLoadPage).toHaveBeenCalledTimes(1);

      // Cleanup.
      r2({ data: { entries: [], tableMeta: { ...emptyMeta } } });
      await flushPromises();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Sorting

  describe('sorting', () => {
    it('reloads data when currSortBy changes', async () => {
      // Arrange: Mount and let initial load complete.
      const { promise: p1, resolve: r1 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p1);

      const wrapper = createComponent();
      r1({ data: { entries: testEntries, tableMeta: { ...metaResp } } });
      await flushPromises();
      await nextTick();
      await nextTick();

      mockLoadPage.mockClear();

      // Act: Emit sort-by change from TablePage stub.
      const { promise: p2, resolve: r2 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p2);

      const tablePageComp = findStubComp(wrapper, 'TablePage');
      await tablePageComp.vm.$emit('update:currSortBy', 'email');
      await nextTick();

      // Assert: LoadPage was called again.
      expect(mockLoadPage).toHaveBeenCalledTimes(1);

      // Cleanup.
      r2({ data: { entries: [], tableMeta: { ...emptyMeta } } });
      await flushPromises();
    });

    it('reloads data when currSortOrder changes', async () => {
      // Arrange: Mount and let initial load complete.
      const { promise: p1, resolve: r1 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p1);

      const wrapper = createComponent();
      r1({ data: { entries: testEntries, tableMeta: { ...metaResp } } });
      await flushPromises();
      await nextTick();
      await nextTick();

      mockLoadPage.mockClear();

      // Act: Emit sort-order change from TablePage stub.
      const { promise: p2, resolve: r2 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p2);

      const tablePageComp = findStubComp(wrapper, 'TablePage');
      await tablePageComp.vm.$emit('update:currSortOrder', 'DESC');
      await nextTick();

      // Assert: LoadPage was called again.
      expect(mockLoadPage).toHaveBeenCalledTimes(1);

      // Cleanup.
      r2({ data: { entries: [], tableMeta: { ...emptyMeta } } });
      await flushPromises();
    });

    it('loads data exactly once when sort column and order change together', async () => {
      // Arrange: Mount and let initial load complete. The response carries a
      // non-null sort, so the watcher guards (oldVal === null) do not suppress
      // a subsequent user-triggered sort change.
      const { promise: p1, resolve: r1 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p1);

      const wrapper = createComponent();
      r1({ data: { entries: testEntries, tableMeta: { ...metaResp } } });
      await flushPromises();
      await nextTick();
      await nextTick();

      mockLoadPage.mockClear();

      // Act: Emit sort column AND sort order from the TablePage stub in the
      // same flush, mimicking a click on a fresh column header.
      const { promise: p2, resolve: r2 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p2);

      const tablePageComp = findStubComp(wrapper, 'TablePage');
      tablePageComp.vm.$emit('update:currSortBy', 'value');
      tablePageComp.vm.$emit('update:currSortOrder', 'DESC');
      await nextTick();

      // Assert: LoadPage was called exactly once for the combined sort change.
      expect(mockLoadPage).toHaveBeenCalledTimes(1);

      // Cleanup: Echo the requested sort so the response does not change
      // currSortBy/currSortOrder again and re-trigger a reload loop.
      r2({
        data: {
          entries: testEntries,
          tableMeta: { pageCount: 1, entryCount: 2, pageSize: 20, page: 0, sortBy: 'value', sortOrder: 'DESC' },
        },
      });
      await flushPromises();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // User update trigger

  describe('user update trigger', () => {
    it('reloads table when userUpdatedTrigger fires with changed username', async () => {
      // Arrange: Mount and let initial load complete.
      const { promise: p1, resolve: r1 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p1);

      createComponent();
      r1({ data: { entries: testEntries, tableMeta: { ...metaResp } } });
      await flushPromises();
      await nextTick();
      await nextTick();

      mockLoadPage.mockClear();

      // Act: Notify user update with changed username.
      const { promise: p2, resolve: r2 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p2);

      const userEventStore = useUserEventStore();
      const diffData = { ...emptyUserForm, username: 'newName', modifiedAt: '2024-03-01' };
      userEventStore.notifyUserUpdated(diffData);
      await nextTick();

      // Assert: LoadPage was called again.
      expect(mockLoadPage).toHaveBeenCalledTimes(1);

      // Cleanup.
      r2({ data: { entries: [], tableMeta: { ...emptyMeta } } });
      await flushPromises();
    });

    it('reloads table when userUpdatedTrigger fires with changed email', async () => {
      // Arrange: Mount and let initial load complete.
      const { promise: p1, resolve: r1 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p1);

      createComponent();
      r1({ data: { entries: testEntries, tableMeta: { ...metaResp } } });
      await flushPromises();
      await nextTick();
      await nextTick();

      mockLoadPage.mockClear();

      // Act: Notify user update with changed email.
      const { promise: p2, resolve: r2 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p2);

      const userEventStore = useUserEventStore();
      const diffData = { ...emptyUserForm, email: 'new@test.com', modifiedAt: '2024-03-01' };
      userEventStore.notifyUserUpdated(diffData);
      await nextTick();

      // Assert: LoadPage was called again.
      expect(mockLoadPage).toHaveBeenCalledTimes(1);

      // Cleanup.
      r2({ data: { entries: [], tableMeta: { ...emptyMeta } } });
      await flushPromises();
    });

    it('does not reload when userUpdatedTrigger fires with no relevant changes', async () => {
      // Arrange: Mount and let initial load complete.
      const { promise: p1, resolve: r1 } = createDeferredPromise<unknown>();
      mockLoadPage.mockReturnValue(p1);

      createComponent();
      r1({ data: { entries: testEntries, tableMeta: { ...metaResp } } });
      await flushPromises();
      await nextTick();
      await nextTick();

      mockLoadPage.mockClear();

      // Act: Notify user update with only irrelevant fields changed.
      const userEventStore = useUserEventStore();
      const diffData = { ...emptyUserForm, locked: true, modifiedAt: '2024-03-01' };
      userEventStore.notifyUserUpdated(diffData);
      await nextTick();
      await nextTick();

      // Assert: LoadPage was not called.
      expect(mockLoadPage).not.toHaveBeenCalled();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Template binding

  describe('template', () => {
    it('renders AdminUserFilter stub', () => {
      const wrapper = createComponent();
      expect(findStubEl(wrapper, 'AdminUserFilter').exists()).toBe(true);
    });

    it('renders AdminUserEditor stub', () => {
      const wrapper = createComponent();
      expect(findStubEl(wrapper, 'AdminUserEditor').exists()).toBe(true);
    });

    it('renders TablePage stub', () => {
      const wrapper = createComponent();
      expect(findStubEl(wrapper, 'TablePage').exists()).toBe(true);
    });
  });
});
