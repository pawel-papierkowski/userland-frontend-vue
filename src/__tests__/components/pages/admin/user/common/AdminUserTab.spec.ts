/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import type { ColumnData, TableMetaReq, TableMetaResp } from '@/code/data/features/common/type.ts';
import { EnColumnKind } from '@/code/data/features/common/const.ts';

import AdminUserTab from '@/components/pages/admin/user/common/AdminUserTab.vue';
import backendApi from '@/services/api-common.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';

// Mock API and message modules.
vi.mock('@/services/api-common.ts', () => ({
  default: {
    create: vi.fn<() => void>(),
    logError: vi.fn<() => void>(),
  },
}));
vi.mock('@/code/stores/messages/AppMessager.ts');
// api-users.ts calls backendApi.create() at module level, so mock it to prevent side effects.
vi.mock('@/services/features/api-users.ts', () => ({ default: {} }));
// AppLoginer imports api-users.ts at module level, so mock to prevent side effects.
vi.mock('@/code/stores/login/AppLoginer.ts', () => ({}));

// ////////////////////////////////////////////////////////////////////////////
// Test types

interface TestUserEntry {
  id: number;
  createdAt: string;
  username: string;
  email: string;
}

interface TestEntry {
  id: number;
  name: string;
  value: string;
  [key: string]: any;
}

interface TestFormFilter {
  filterParam: string | null;
  tableMeta: TableMetaReq | null;
}

// ////////////////////////////////////////////////////////////////////////////
// Test data

const testColumns: ColumnData[] = [
  {
    name: 'id',
    defSort: '',
    translation: 'test.table.column.id',
    visible: false,
    editable: false,
    kind: EnColumnKind.Data,
  },
  {
    name: 'name',
    defSort: 'ASC',
    translation: 'test.table.column.name',
    visible: true,
    editable: false,
    kind: EnColumnKind.Data,
  },
  {
    name: 'value',
    defSort: 'ASC',
    translation: 'test.table.column.value',
    visible: true,
    editable: false,
    kind: EnColumnKind.Data,
  },
];

const testUser1: TestUserEntry = {
  id: 10,
  createdAt: '2024-01-15T10:00:00Z',
  username: 'user1',
  email: 'user1@test.com',
};
const testUser2: TestUserEntry = {
  id: 20,
  createdAt: '2024-02-20T12:00:00Z',
  username: 'user2',
  email: 'user2@test.com',
};

const defaultFormFilter: TestFormFilter = {
  filterParam: null,
  tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
};

const testEntries: TestEntry[] = [
  { id: 1, name: 'AA', value: 'BB' },
  { id: 2, name: 'config', value: 'true' },
];

const testMetaResp: TableMetaResp = {
  pageCount: 1,
  entryCount: 2,
  pageSize: 10,
  page: 0,
  sortBy: 'name',
  sortOrder: 'ASC',
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

/** Create component with given options. */
function createComponent(
  options: {
    modelValue?: TestUserEntry | null;
    entry?: TestEntry | null;
    formFilter?: TestFormFilter;
    formEntry?: any;
    fetchData?: any;
    convertToReq?: any;
    processEntry?: any;
    resolveRowMeta?: any;
    inlineEdit?: boolean;
    addNewEntry?: boolean;
  } = {},
) {
  return mount(AdminUserTab, {
    global: {
      plugins: [i18n],
    },
    props: {
      tableId: 'testTable',
      columns: testColumns,
      fetchData: options.fetchData ?? mockFetchData,
      convertToReq: options.convertToReq ?? mockConvertToReq,
      processEntry: options.processEntry,
      resolveRowMeta: options.resolveRowMeta,
      inlineEdit: options.inlineEdit ?? false,
      addNewEntry: options.addNewEntry ?? false,
      emptyText: 'test.table.page.empty',
      emptyNoUserText: 'test.table.page.emptyNoUser',
      modelValue: options.modelValue ?? null,
      entry: options.entry ?? null,
      formFilter: options.formFilter ?? defaultFormFilter,
      formEntry: options.formEntry ?? null,
    },
    slots: {
      // Provide a simple filter slot to verify slot rendering.
      filter: '<div data-testid="test-filter">Filter Panel</div>',
    },
  });
}

// ////////////////////////////////////////////////////////////////////////////
// Mocks

let mockConvertToReq: ReturnType<typeof vi.fn>;
let mockFetchData: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockConvertToReq = vi.fn<(form: any, userId: number) => void>((form: any, userId: number) => ({ ...form, userId }));
  mockFetchData = vi.fn<() => void>();
});

// ////////////////////////////////////////////////////////////////////////////
// Tests

/** Tests of AdminUserTab component. */
describe('AdminUserTab', () => {
  // //////////////////////////////////////////////////////////////////////////
  // No user selected

  describe('no user selected', () => {
    it('renders filter slot', () => {
      // Arrange & Act: Mount with no user.
      const wrapper = createComponent();

      // Assert: Filter slot content is rendered.
      const filterEl = wrapper.find('[data-testid="test-filter"]');
      expect(filterEl.exists()).toBe(true);
      expect(filterEl.text()).toBe('Filter Panel');
    });

    it('does not call fetchData on mount', () => {
      // Arrange & Act: Mount with no user, fetchData not set up to resolve.
      createComponent();

      // Assert: fetchData was never called.
      expect(mockFetchData).not.toHaveBeenCalled();
    });

    it('shows emptyNoUserText when no user is selected', async () => {
      // Arrange & Act: Mount with no user.
      const wrapper = createComponent();
      await nextTick();

      // Assert: Table shows empty state with no-user text.
      const tableEmpty = wrapper.find('.table-empty');
      expect(tableEmpty.exists()).toBe(true);
      expect(tableEmpty.text()).toBe('Select user to show data.');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // User selected

  describe('user selected', () => {
    it('calls convertToReq and fetchData on mount with user', async () => {
      // Arrange: Create deferred promise to control fetch timing.
      const { promise, resolve } = createDeferredPromise<any>();
      mockFetchData.mockReturnValue(promise);

      // Act: Mount with a user selected.
      createComponent({ modelValue: testUser1, fetchData: mockFetchData, convertToReq: mockConvertToReq });
      await nextTick();

      // Assert: convertToReq called with formFilter and userId.
      expect(mockConvertToReq).toHaveBeenCalledTimes(1);
      expect(mockConvertToReq).toHaveBeenCalledWith(defaultFormFilter, testUser1.id);

      // Assert: fetchData called with the request from convertToReq.
      expect(mockFetchData).toHaveBeenCalledTimes(1);
      expect(mockFetchData).toHaveBeenCalledWith({ ...defaultFormFilter, userId: testUser1.id });

      // Cleanup: resolve to avoid hanging promises.
      resolve({ data: { entries: [], tableMeta: testMetaResp } });
    });

    it('calls processEntry for each returned entry', async () => {
      // Arrange: Fetch resolves with entries.
      const { promise, resolve } = createDeferredPromise<any>();
      mockFetchData.mockReturnValue(promise);

      // Create transformation that marks each entry.
      const transformEntry = vi.fn<(entry: TestEntry) => void>((entry: TestEntry) => ({ ...entry, transformed: true }));
      createComponent({
        modelValue: testUser1,
        fetchData: mockFetchData,
        processEntry: transformEntry,
      });

      // Act: Resolve fetch with entries.
      resolve({ data: { entries: testEntries, tableMeta: testMetaResp } });
      await flushPromises();
      await nextTick();

      // Assert: Each entry was transformed.
      expect(transformEntry).toHaveBeenCalledTimes(2);
      expect(transformEntry).toHaveBeenCalledWith(testEntries[0]);
      expect(transformEntry).toHaveBeenCalledWith(testEntries[1]);
    });

    it('resets selEntryRecord after data load', async () => {
      // Arrange: Pre-select an entry, then fetch new data.
      const { promise, resolve } = createDeferredPromise<any>();
      mockFetchData.mockReturnValue(promise);

      const wrapper = createComponent({
        modelValue: testUser1,
        fetchData: mockFetchData,
        entry: { id: 99, name: 'stale', value: 'data' },
      });

      // Act: Resolve fetch.
      resolve({ data: { entries: testEntries, tableMeta: testMetaResp } });
      await flushPromises();
      await nextTick();

      // Assert: entry model was reset to null.
      expect(wrapper.emitted('update:entry')).toBeDefined();
      const lastEmit = wrapper.emitted('update:entry')!;
      const lastValue = lastEmit[lastEmit.length - 1]?.[0];
      expect(lastValue).toBeNull();
    });

    it('shows emptyText when data is empty with user selected', async () => {
      // Arrange: Fetch resolves with empty entries.
      const { promise, resolve } = createDeferredPromise<any>();
      mockFetchData.mockReturnValue(promise);

      const wrapper = createComponent({ modelValue: testUser1, fetchData: mockFetchData });

      // Act: Resolve with no entries.
      resolve({ data: { entries: [], tableMeta: { ...testMetaResp, entryCount: 0, pageCount: 0 } } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Assert: Shows empty text (not no-user text).
      const tableEmpty = wrapper.find('.table-empty');
      expect(tableEmpty.exists()).toBe(true);
      expect(tableEmpty.text()).toBe('⚠️ No entries to show. ⚠️');
    });

    it('renders table rows when data is loaded', async () => {
      // Arrange: Fetch resolves with entries.
      const { promise, resolve } = createDeferredPromise<any>();
      mockFetchData.mockReturnValue(promise);

      const wrapper = createComponent({ modelValue: testUser1, fetchData: mockFetchData });

      // Act: Resolve fetch.
      resolve({ data: { entries: testEntries, tableMeta: testMetaResp } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Assert: Table rows are rendered.
      const rows = wrapper.findAll('.table-row');
      expect(rows).toHaveLength(2);

      // Assert: No empty message.
      expect(wrapper.find('.table-empty').exists()).toBe(false);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // User change

  describe('user change', () => {
    it('refetches data when user changes', async () => {
      // Arrange: Mount with first user, let fetch complete.
      const { promise: promise1, resolve: resolve1 } = createDeferredPromise<any>();
      mockFetchData.mockReturnValue(promise1);

      const wrapper = createComponent({
        modelValue: testUser1,
        fetchData: mockFetchData,
        convertToReq: mockConvertToReq,
      });

      resolve1({ data: { entries: testEntries, tableMeta: testMetaResp } });
      await flushPromises();
      await nextTick();

      expect(mockFetchData).toHaveBeenCalledTimes(1);
      expect(mockConvertToReq).toHaveBeenCalledWith(defaultFormFilter, testUser1.id);
      vi.clearAllMocks();

      // Act: Change user.
      const { promise: promise2, resolve: resolve2 } = createDeferredPromise<any>();
      mockFetchData.mockReturnValue(promise2);

      await wrapper.setProps({ modelValue: testUser2 });
      await nextTick();

      resolve2({ data: { entries: [], tableMeta: testMetaResp } });
      await flushPromises();
      await nextTick();

      // Assert: New fetch with new userId.
      expect(mockConvertToReq).toHaveBeenCalledTimes(1);
      expect(mockConvertToReq).toHaveBeenCalledWith(defaultFormFilter, testUser2.id);
      expect(mockFetchData).toHaveBeenCalledTimes(1);
      expect(mockFetchData).toHaveBeenCalledWith({ ...defaultFormFilter, userId: testUser2.id });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Error handling

  describe('error handling', () => {
    it('shows error message on fetch failure', async () => {
      // Arrange: Mount with user, fetch rejects.
      const { promise, resolve } = createDeferredPromise<any>();
      mockFetchData.mockReturnValue(promise);

      createComponent({ modelValue: testUser1, fetchData: mockFetchData });

      // Act: Reject fetch.
      const testError = new Error('Network error');
      resolve(Promise.reject(testError));
      // Need to let the catch block process.
      try {
        await flushPromises();
      } catch {
        // Expected - the rejection propagates.
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
      const { promise, resolve } = createDeferredPromise<any>();
      mockFetchData.mockReturnValue(promise);

      createComponent({ modelValue: testUser1, fetchData: mockFetchData });

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
      expect(backendApi.logError).toHaveBeenCalledWith(testError, 'User tab table reload failed!');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Exposed methods

  describe('exposed methods', () => {
    it('handleReload is exposed and triggers data fetch', async () => {
      // Arrange: Mount with no user, fetchData ready.
      const { promise, resolve } = createDeferredPromise<any>();
      mockFetchData.mockReturnValue(promise);

      const wrapper = createComponent({
        modelValue: testUser1,
        fetchData: mockFetchData,
        convertToReq: mockConvertToReq,
      });

      // Let initial load complete.
      resolve({ data: { entries: testEntries, tableMeta: testMetaResp } });
      await flushPromises();
      await nextTick();
      vi.clearAllMocks();

      // Act: Call exposed handleReload.
      const { promise: promise2, resolve: resolve2 } = createDeferredPromise<any>();
      mockFetchData.mockReturnValue(promise2);

      (wrapper.vm as any).handleReload();
      await nextTick();

      // Assert: convertToReq and fetchData were called.
      expect(mockConvertToReq).toHaveBeenCalledTimes(1);
      expect(mockConvertToReq).toHaveBeenCalledWith(defaultFormFilter, testUser1.id);
      expect(mockFetchData).toHaveBeenCalledTimes(1);

      // Cleanup.
      resolve2({ data: { entries: [], tableMeta: testMetaResp } });
    });
  });
});
