/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';

import type { TableMetaResp } from '@/code/data/features/common/type.ts';

import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import apiLogging from '@/services/api-logging.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

import AdminUserPermissions from '@/components/pages/admin/user/permissions/AdminUserPermissions.vue';

// Mocks — these must be at module level.

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
// api-users.ts calls backendApi.create('/users') at module level — mock to prevent side effects.
vi.mock('@/services/features/api-users.ts', () => ({ default: {} }));
// api-admin-users.ts calls backendApi.create('/admin') at module level — mock to prevent side effects.
vi.mock('@/services/features/api-admin-users.ts', () => ({
  default: {
    loadPermissionsPage: vi.fn<() => void>(),
    editPermissionEntry: vi.fn<() => void>(),
    deletePermissionEntry: vi.fn<() => void>(),
  },
}));
vi.mock('@/code/stores/login/AppLoginer.ts', () => ({
  AppLoginer: {
    getEmail: vi.fn<() => void>(),
    hasPermissionsAny: vi.fn<() => void>(),
    hasPermission: vi.fn<() => void>(),
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

interface TestPermEntry {
  id: number;
  createdAt: string;
  name: string;
  value: string;
  meta: any;
  [key: string]: any;
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

const testEntries: TestPermEntry[] = [
  {
    id: 1,
    createdAt: '2024-06-15T12:00:00Z',
    name: 'role_admin',
    value: 'true',
    meta: {
      options: {
        edit: { access: 'ENABLED', reason: null },
        delete: { access: 'ENABLED', reason: null },
      },
      data: null,
    },
  },
  {
    id: 2,
    createdAt: '2024-07-20T08:30:00Z',
    name: 'user_view',
    value: 'true',
    meta: {
      options: {
        edit: { access: 'ENABLED', reason: null },
        delete: { access: 'ENABLED', reason: null },
      },
      data: null,
    },
  },
];

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

let mockLoadPage: ReturnType<typeof vi.fn>;
let mockEditEntry: ReturnType<typeof vi.fn>;
let mockDeleteEntry: ReturnType<typeof vi.fn>;
let mockGetEmail: ReturnType<typeof vi.fn>;
let mockHasPermissionsAny: ReturnType<typeof vi.fn>;
let pinia: ReturnType<typeof createPinia>;

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  vi.clearAllMocks();

  mockLoadPage = vi.mocked(backendApiAdminUser.loadPermissionsPage) as any;
  mockEditEntry = vi.mocked(backendApiAdminUser.editPermissionEntry) as any;
  mockDeleteEntry = vi.mocked(backendApiAdminUser.deletePermissionEntry) as any;
  mockGetEmail = vi.mocked(AppLoginer.getEmail) as any;
  mockHasPermissionsAny = vi.mocked(AppLoginer.hasPermissionsAny) as any;

  // Default: admin user with full access, viewing another user.
  mockGetEmail.mockReturnValue('admin@test.com');
  mockHasPermissionsAny.mockReturnValue(true);
});

/** Create mounted component. */
function createComponent(modelValue?: TestUserEntry | null) {
  return mount(AdminUserPermissions, {
    global: {
      plugins: [i18n, pinia],
    },
    props: {
      modelValue: modelValue ?? null,
    },
  });
}

// ////////////////////////////////////////////////////////////////////////////
// Tests

/** Tests of AdminUserPermissions component. */
describe('AdminUserPermissions', () => {
  // //////////////////////////////////////////////////////////////////////////
  // No user selected

  describe('no user selected', () => {
    it('renders filter slot', () => {
      // Arrange & Act: Mount with no user.
      const wrapper = createComponent();

      // Assert: AdminUserPermissionsFilter is rendered via the filter slot.
      const formFilter = wrapper.find('[data-testid="form-user-filter"]');
      expect(formFilter.exists()).toBe(true);
    });

    it('does not call loadPermissionsPage on mount', () => {
      // Arrange & Act: Mount with no user.
      createComponent();

      // Assert: No API call made when no user is selected.
      expect(mockLoadPage).not.toHaveBeenCalled();
    });

    it('shows emptyNoUserText', () => {
      // Arrange & Act: Mount with no user.
      const wrapper = createComponent();

      // Assert: Empty message says "no user".
      const emptyEl = wrapper.find('.table-empty');
      expect(emptyEl.exists()).toBe(true);
      expect(emptyEl.text()).toBe('No permissions to show.');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Permission gating — resolveAdd

  describe('resolveAdd permission checks', () => {
    it('shows add button ENABLED when user has permissions', async () => {
      // Arrange: User has permissions and is not self.
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(promise);
      mockGetEmail.mockReturnValue('admin@test.com');
      mockHasPermissionsAny.mockReturnValue(true);

      const wrapper = createComponent(testUser1);

      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Assert: Add button is visible and not disabled.
      const addBtn = wrapper.find('.table-paginer-options .entry-btn');
      expect(addBtn.exists()).toBe(true);
      expect(addBtn.text()).toBe('➕');
      expect(addBtn.classes()).not.toContain('disabled');
    });

    it('shows add button DISABLED when user lacks permissions', async () => {
      // Arrange: User lacks edit permissions.
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(promise);
      mockHasPermissionsAny.mockReturnValue(false);

      const wrapper = createComponent(testUser1);

      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Assert: Add button is visible but disabled.
      const addBtn = wrapper.find('.table-paginer-options .entry-btn');
      expect(addBtn.exists()).toBe(true);
      expect(addBtn.text()).toBe('➕');
      expect(addBtn.classes()).toContain('disabled');
    });

    it('shows add button DISABLED when selected user is self', async () => {
      // Arrange: Selected user has same email as logged-in user.
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(promise);
      mockGetEmail.mockReturnValue('user1@test.com');

      const wrapper = createComponent(testUser1);

      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Assert: Add button is visible but disabled.
      const addBtn = wrapper.find('.table-paginer-options .entry-btn');
      expect(addBtn.exists()).toBe(true);
      expect(addBtn.classes()).toContain('disabled');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Add new entry

  describe('addEntry', () => {
    it('sets up empty form and shows new entry row', async () => {
      // Arrange: Mount with user and resolved data.
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(promise);

      const wrapper = createComponent(testUser1);

      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Act: Click the add button in paginer.
      const addBtn = wrapper.find('.table-paginer-options .entry-btn');
      await addBtn.trigger('click');
      await nextTick();

      // Assert: New entry row is visible (save and cancel buttons).
      const btns = wrapper.findAll('.entry-btn');
      const saveBtns = btns.filter((b) => b.text() === '💾');
      const cancelBtns = btns.filter((b) => b.text() === '❌');
      expect(saveBtns.length).toBeGreaterThanOrEqual(1);
      expect(cancelBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Save entry validation

  describe('saveEntry validation', () => {
    it('rejects save when name is empty', async () => {
      // Arrange: Mount with user, add new entry.
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(promise);

      const wrapper = createComponent(testUser1);
      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Click add to show save button.
      const addBtn = wrapper.find('.table-paginer-options .entry-btn');
      await addBtn.trigger('click');
      await nextTick();

      // Act: Click save with empty name.
      const saveBtns = wrapper.findAll('.entry-btn').filter((b) => b.text() === '💾');
      await saveBtns[0]!.trigger('click');
      await nextTick();

      // Assert: Validation error shown, API not called.
      expect(AppMessager.failureT).toHaveBeenCalledWith(
        'admin.user.permissions.table.msg.save.badName.title',
        'admin.user.permissions.table.msg.save.badName.content',
      );
      expect(mockEditEntry).not.toHaveBeenCalled();
    });

    it('rejects save when value is empty', async () => {
      // Arrange: Mount with user, add new entry.
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(promise);

      const wrapper = createComponent(testUser1);
      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Click add to show save button.
      const addBtn = wrapper.find('.table-paginer-options .entry-btn');
      await addBtn.trigger('click');
      await nextTick();

      // Set name via the ComboBox (name column uses a combo box instead of plain input).
      const combobox = wrapper.find('[role="combobox"]');
      expect(combobox.exists()).toBe(true);
      await combobox.trigger('click');
      await nextTick();
      // Select the first option: 'role'.
      const firstOption = wrapper.find('[data-testid="combobox__0"]');
      expect(firstOption.exists()).toBe(true);
      await firstOption.trigger('click');
      await nextTick();

      // Act: Click save with value empty.
      const saveBtns = wrapper.findAll('.entry-btn').filter((b) => b.text() === '💾');
      await saveBtns[0]!.trigger('click');
      await nextTick();

      // Assert: Validation error for empty value.
      expect(AppMessager.failureT).toHaveBeenCalledWith(
        'admin.user.permissions.table.msg.save.badValue.title',
        'admin.user.permissions.table.msg.save.badValue.content',
      );
      expect(mockEditEntry).not.toHaveBeenCalled();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Save entry

  describe('saveEntry', () => {
    it('calls API and shows success on save for new entry', async () => {
      // Arrange: Mount with user, add new entry.
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(promise);
      mockEditEntry.mockResolvedValue({ data: {} });

      const wrapper = createComponent(testUser1);
      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Click add to show save button.
      const addBtn = wrapper.find('.table-paginer-options .entry-btn');
      await addBtn.trigger('click');
      await nextTick();

      // Set name via the ComboBox.
      const combobox = wrapper.find('[role="combobox"]');
      expect(combobox.exists()).toBe(true);
      await combobox.trigger('click');
      await nextTick();
      const firstOption = wrapper.find('[data-testid="combobox__0"]');
      expect(firstOption.exists()).toBe(true);
      await firstOption.trigger('click');
      await nextTick();

      // Set value via the input in the value cell.
      const valueInput = wrapper.find('[data-testid="cell_userPermissions_-1_value"] input');
      await valueInput.setValue('true');
      await nextTick();

      // Act: Click save.
      const saveBtns = wrapper.findAll('.entry-btn').filter((b) => b.text() === '💾');
      await saveBtns[0]!.trigger('click');
      await nextTick();

      // Assert: API called with correct data.
      expect(mockEditEntry).toHaveBeenCalledWith({
        id: null,
        userId: testUser1.id,
        name: 'role',
        value: 'true',
      });

      // Assert: Success message shown.
      expect(AppMessager.successT).toHaveBeenCalledWith(
        'admin.user.permissions.table.msg.save.success.title',
        'admin.user.permissions.table.msg.save.success.content',
      );
    });

    it('calls API with entry id for existing entry', async () => {
      // Arrange: Mount with user and entries in the table.
      const { promise: loadPromise, resolve: loadResolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(loadPromise);

      const wrapper = createComponent(testUser1);
      loadResolve({
        data: {
          entries: testEntries,
          tableMeta: { pageCount: 1, entryCount: 2, pageSize: 10, page: 0, sortBy: 'name', sortOrder: 'ASC' },
        },
      });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Find the edit button on the first row.
      const editBtns = wrapper.findAll('.entry-btn').filter((b) => b.text() === '✏️');
      expect(editBtns.length).toBeGreaterThanOrEqual(1);

      // Act: Click edit on the first entry.
      await editBtns[0]!.trigger('click');
      await nextTick();

      // The form should now have the entry's data. Click save button.
      mockEditEntry.mockResolvedValue({ data: {} });
      const saveBtns = wrapper.findAll('.entry-btn').filter((b) => b.text() === '💾');
      const saveBtn = saveBtns[0]!;
      await saveBtn?.trigger('click');
      await nextTick();

      // Assert: API called with entry id.
      expect(mockEditEntry).toHaveBeenCalledWith({
        id: testEntries[0]!.id,
        userId: testUser1.id,
        name: testEntries[0]!.name,
        value: testEntries[0]!.value,
      });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Cancel entry

  describe('cancelEntry', () => {
    it('exits add mode when cancel is clicked', async () => {
      // Arrange: Mount with user, add new entry.
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(promise);

      const wrapper = createComponent(testUser1);
      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Click add.
      const addBtn = wrapper.find('.table-paginer-options .entry-btn');
      await addBtn.trigger('click');
      await nextTick();

      // Verify we see save/cancel buttons.
      expect(wrapper.findAll('.entry-btn').filter((b) => b.text() === '❌').length).toBeGreaterThanOrEqual(1);

      // Act: Click cancel.
      const cancelBtns2 = wrapper.findAll('.entry-btn').filter((b) => b.text() === '❌');
      await cancelBtns2[0]!.trigger('click');
      await nextTick();

      // Assert: Cancel buttons gone (add mode exited).
      const cancelBtnsAfter = wrapper.findAll('.entry-btn').filter((b) => b.text() === '❌');
      expect(cancelBtnsAfter.length).toBe(0);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Edit entry

  describe('editEntry', () => {
    it('populates form and selects entry when edit is clicked', async () => {
      // Arrange: Mount with user and entries.
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(promise);

      const wrapper = createComponent(testUser1);
      resolve({
        data: {
          entries: testEntries,
          tableMeta: { pageCount: 1, entryCount: 2, pageSize: 10, page: 0, sortBy: 'name', sortOrder: 'ASC' },
        },
      });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Act: Click edit on the first entry.
      const editBtns = wrapper.findAll('.entry-btn').filter((b) => b.text() === '✏️');
      expect(editBtns.length).toBeGreaterThanOrEqual(1);
      await editBtns[0]!.trigger('click');
      await nextTick();

      // Assert: Now we see save/cancel instead of edit/delete for the selected entry.
      const saveBtns = wrapper.findAll('.entry-btn').filter((b) => b.text() === '💾');
      expect(saveBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Delete entry

  describe('deleteEntry', () => {
    it('calls API and shows success on delete', async () => {
      // Arrange: Mount with user and entries.
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(promise);
      mockDeleteEntry.mockResolvedValue({ data: {} });

      const wrapper = createComponent(testUser1);
      resolve({
        data: {
          entries: testEntries,
          tableMeta: { pageCount: 1, entryCount: 2, pageSize: 10, page: 0, sortBy: 'name', sortOrder: 'ASC' },
        },
      });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Act: Click delete on the first entry.
      const deleteBtns = wrapper.findAll('.entry-btn').filter((b) => b.text() === '🗑️');
      expect(deleteBtns.length).toBeGreaterThanOrEqual(1);
      await deleteBtns[0]!.trigger('click');
      await nextTick();

      // Assert: API called with correct id.
      expect(mockDeleteEntry).toHaveBeenCalledWith(testEntries[0]!.id);

      // Assert: Success message shown.
      expect(AppMessager.successT).toHaveBeenCalledWith(
        'admin.user.permissions.table.msg.delete.success.title',
        'admin.user.permissions.table.msg.delete.success.content',
      );
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Error handling

  describe('error handling', () => {
    it('shows error when saveEntry fails', async () => {
      // Arrange: Mount with user, add new entry, save API fails.
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(promise);

      const wrapper = createComponent(testUser1);
      resolve({ data: { entries: [], tableMeta: emptyMeta } });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Click add.
      const addBtn = wrapper.find('.table-paginer-options .entry-btn');
      await addBtn.trigger('click');
      await nextTick();

      // Set name via the ComboBox.
      const combobox = wrapper.find('[role="combobox"]');
      expect(combobox.exists()).toBe(true);
      await combobox.trigger('click');
      await nextTick();
      const firstOption = wrapper.find('[data-testid="combobox__0"]');
      expect(firstOption.exists()).toBe(true);
      await firstOption.trigger('click');
      await nextTick();

      // Set value via the input in the value cell.
      const valueInput = wrapper.find('[data-testid="cell_userPermissions_-1_value"] input');
      await valueInput.setValue('true');
      await nextTick();

      // Act: Click save, API rejects.
      const testError = new Error('Save failed');
      mockEditEntry.mockRejectedValue(testError);

      const saveBtns = wrapper.findAll('.entry-btn').filter((b) => b.text() === '💾');
      await saveBtns[0]?.trigger('click');
      await flushPromises();
      await nextTick();

      // Assert: Error message shown.
      expect(AppMessager.errorT).toHaveBeenCalledWith(
        testError,
        'admin.user.permissions.table.msg.save.fail.title',
        'admin.user.permissions.table.msg.save.fail.content',
      );
      expect(apiLogging.logError).toHaveBeenCalledWith(testError, 'Failed to save user permission entry!');
    });

    it('shows error when deleteEntry fails', async () => {
      // Arrange: Mount with user and entries.
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(promise);

      const wrapper = createComponent(testUser1);
      resolve({
        data: {
          entries: testEntries,
          tableMeta: { pageCount: 1, entryCount: 2, pageSize: 10, page: 0, sortBy: 'name', sortOrder: 'ASC' },
        },
      });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Act: Click delete, API rejects.
      const testError = new Error('Delete failed');
      mockDeleteEntry.mockRejectedValue(testError);

      const deleteBtns = wrapper.findAll('.entry-btn').filter((b) => b.text() === '🗑️');
      await deleteBtns[0]?.trigger('click');
      await flushPromises();
      await nextTick();

      // Assert: Error message shown.
      expect(AppMessager.errorT).toHaveBeenCalledWith(
        testError,
        'admin.user.permissions.table.msg.delete.fail.title',
        'admin.user.permissions.table.msg.delete.fail.content',
      );
      expect(apiLogging.logError).toHaveBeenCalledWith(testError, 'Failed to delete user permission entry!');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // User selection

  describe('user selection', () => {
    it('deselects entry when user selection changes', async () => {
      // Arrange: Mount with user.
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadPage.mockReturnValue(promise);

      const wrapper = createComponent(testUser1);
      resolve({
        data: {
          entries: testEntries,
          tableMeta: { pageCount: 1, entryCount: 2, pageSize: 10, page: 0, sortBy: 'name', sortOrder: 'ASC' },
        },
      });
      await flushPromises();
      await nextTick();
      await nextTick();

      // Select an entry by clicking edit.
      const editBtns = wrapper.findAll('.entry-btn').filter((b) => b.text() === '✏️');
      await editBtns[0]?.trigger('click');
      await nextTick();

      // Assert: Verify we have add entry button and save/cancel for the selected entry.
      let saveBtns = wrapper.findAll('.entry-btn').filter((b) => b.text() === '➕' || b.text() === '💾');
      expect(saveBtns.length).toBeGreaterThanOrEqual(2);

      // Act: Deselect user.
      await wrapper.setProps({ modelValue: null });
      await nextTick();

      // Assert: Add entry and save/cancel buttons are gone.
      saveBtns = wrapper.findAll('.entry-btn').filter((b) => b.text() === '➕' || b.text() === '💾');
      expect(saveBtns.length).toBe(0);
    });
  });
});
