/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount, type DOMWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import apiLogging from '@/services/api-logging.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';
import { AppUserEventer } from '@/code/stores/events/AppUserEventer.ts';

import type { UserFullDataResp } from '@/code/data/features/user/admin-user-type.ts';

import AdminUserMain from '@/components/pages/admin/user/main/AdminUserMain.vue';

// ////////////////////////////////////////////////////////////////////////////
// Mocks — must be at module level.

vi.mock('@/services/features/api-admin-users.ts', () => ({
  default: {
    loadUserData: vi.fn<() => void>(),
    editUserData: vi.fn<() => void>(),
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
vi.mock('@/code/stores/login/AppLoginer.ts', () => ({
  AppLoginer: {
    getEmail: vi.fn<() => void>(),
    hasPermissionsAny: vi.fn<() => void>(),
  },
}));
vi.mock('@/code/stores/events/AppUserEventer.ts', () => ({
  AppUserEventer: {
    notifyUserSelected: vi.fn<() => void>(),
    notifyUserUpdated: vi.fn<() => void>(),
  },
}));

// Side-effect mocks.
vi.mock('@/services/features/api-users.ts', () => ({ default: {} }));

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

const testUser: TestUserEntry = {
  id: 10,
  createdAt: '2024-01-15T10:00:00Z',
  username: 'alice',
  email: 'alice@test.com',
};

const testUserData: UserFullDataResp = {
  id: 10,
  createdAt: '2024-01-15T10:00:00Z',
  modifiedAt: '2024-06-01T08:00:00Z',
  username: 'alice',
  email: 'alice@test.com',
  status: 'ACTIVE',
  locked: false,
  lang: 'en',
  profile: { name: 'Alice', surname: 'Smith' },
};

const testUserDataLocked: UserFullDataResp = {
  ...testUserData,
  locked: true,
};

// ////////////////////////////////////////////////////////////////////////////
// Helpers

function createDeferredPromise<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Check if a DOM element is disabled. Cast is required because Element base type lacks `disabled`. */
function isDisabled(el: DOMWrapper<Element>): boolean {
  return (el.element as HTMLButtonElement | HTMLInputElement).disabled;
}

// ////////////////////////////////////////////////////////////////////////////
// Mocks setup

let mockLoadUserData: ReturnType<typeof vi.fn>;
let mockEditUserData: ReturnType<typeof vi.fn>;
let mockGetEmail: ReturnType<typeof vi.fn>;
let mockHasPermissionsAny: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();

  mockLoadUserData = vi.mocked(backendApiAdminUser.loadUserData) as any;
  mockEditUserData = vi.mocked(backendApiAdminUser.editUserData) as any;
  mockGetEmail = vi.mocked(AppLoginer.getEmail) as any;
  mockHasPermissionsAny = vi.mocked(AppLoginer.hasPermissionsAny) as any;

  // Default: admin user viewing another user, has full permissions.
  mockGetEmail.mockReturnValue('admin@test.com');
  mockHasPermissionsAny.mockReturnValue(true);
});

/** Create filter with stubbing. */
function createComponent(modelValue?: TestUserEntry | null) {
  return shallowMount(AdminUserMain, {
    global: { plugins: [i18n], stubs: { TextBox: false } },
    props: { modelValue: modelValue ?? null },
  });
}

// ////////////////////////////////////////////////////////////////////////////
// Tests

/** Tests of AdminUserMain component. */
describe('AdminUserMain', () => {
  // //////////////////////////////////////////////////////////////////////////
  // Initial load

  describe('initial load', () => {
    it('does not load data on mount when no user selected', () => {
      createComponent();
      expect(mockLoadUserData).not.toHaveBeenCalled();
    });

    it('loads data when user is selected via watch', async () => {
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(promise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();

      // Assert: LoadUserData was called with correct user id.
      expect(mockLoadUserData).toHaveBeenCalledTimes(1);
      expect(mockLoadUserData).toHaveBeenCalledWith(testUser.id);

      // Cleanup.
      resolve({ data: testUserData });
      await flushPromises();
    });

    it('shows spinner during loading and form after', async () => {
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(promise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();

      // Assert: Spinner is visible, form is hidden.
      expect(wrapper.find('[data-testid="spinner"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="form-user-main"]').exists()).toBe(false);

      // Act: Complete loading.
      resolve({ data: testUserData });
      await flushPromises();
      await nextTick();

      // Assert: Form is visible, spinner is hidden.
      expect(wrapper.find('[data-testid="spinner"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="form-user-main"]').exists()).toBe(true);
    });

    it('fills form fields from response data', async () => {
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(promise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();

      resolve({ data: testUserData });
      await flushPromises();
      await nextTick();

      // Assert: Divs and inputs contain the loaded data.
      const createdAtDiv = wrapper.find('[data-testid="createdAt"]');
      const modifiedAtDiv = wrapper.find('[data-testid="modifiedAt"]');
      const usernameInput = wrapper.find('[data-testid="username"]') as any;
      const emailInput = wrapper.find('[data-testid="email"]') as any;
      const statusDiv = wrapper.find('[data-testid="status"]');
      const lockedDiv = wrapper.find('[data-testid="locked"]');
      const langDiv = wrapper.find('[data-testid="lang"]');
      const nameInput = wrapper.find('[data-testid="name"]') as any;
      const surnameInput = wrapper.find('[data-testid="surname"]') as any;

      expect(createdAtDiv.element.textContent).toBe('2024-01-15 11:00:00');
      expect(modifiedAtDiv.element.textContent).toBe('2024-06-01 10:00:00');
      expect(usernameInput.element.value).toBe('alice');
      expect(emailInput.element.value).toBe('alice@test.com');
      expect(statusDiv.element.textContent).toBe('Active');
      expect(lockedDiv.element.textContent).toBe('false');
      expect(langDiv.element.textContent).toBe('English 🇬🇧');
      expect(nameInput.element.value).toBe('Alice');
      expect(surnameInput.element.value).toBe('Smith');
    });

    it('shows error message on load failure', async () => {
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(promise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();

      // Act: Reject the load.
      const testError = new Error('Load failed');
      resolve(Promise.reject(testError));
      try {
        await flushPromises();
      } catch {
        // Expected.
      }
      await nextTick();

      // Assert: Error was shown, no form (spinner stopped).
      expect(AppMessager.errorT).toHaveBeenCalledWith(
        testError,
        'admin.user.msg.errorLoadUser.title',
        'admin.user.msg.errorLoadUser.content',
      );
      expect(apiLogging.logError).toHaveBeenCalledWith(testError, 'Loading user data failed!');
      // Spinner should be stopped (canSpin false) but still visible since isLoading stays true.
      // Because form never loads - user stays in loading state with stopped spinner.
      expect(wrapper.find('[data-testid="form-user-main"]').exists()).toBe(false);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Update

  describe('update', () => {
    it('calls editUserData with correct payload on update', async () => {
      // Arrange: Load user data.
      const { promise: loadPromise, resolve: loadResolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(loadPromise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();
      loadResolve({ data: testUserData });
      await flushPromises();
      await nextTick();

      // Act: Click update button.
      mockEditUserData.mockResolvedValue({ data: testUserData });
      await wrapper.find('[data-testid="btn-update"]').trigger('click');
      await nextTick();

      // Assert: EditUserData was called with correct payload.
      expect(mockEditUserData).toHaveBeenCalledTimes(1);
      const payload = mockEditUserData.mock.calls[0]?.[0] as any;
      expect(payload.id).toBe(testUser.id);
      expect(payload.username).toBe('alice');
      expect(payload.email).toBe('alice@test.com');
      expect(payload.locked).toBeNull(); // no change, lock via separate button
      expect(payload.lang).toBeNull(); // no change
      expect(payload.profile).toEqual({ name: 'Alice', surname: 'Smith' });
    });

    it('notifies user updated after success', async () => {
      // Arrange: Load user data.
      const { promise: loadPromise, resolve: loadResolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(loadPromise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();
      loadResolve({ data: testUserData });
      await flushPromises();
      await nextTick();

      // Act: Click update with a response that has updated modifiedAt
      // to simulate a real backend change (otherwise diff detects no change).
      const updatedData = { ...testUserData, modifiedAt: '2024-07-01T10:00:00Z' };
      mockEditUserData.mockResolvedValue({ data: updatedData });
      await wrapper.find('[data-testid="btn-update"]').trigger('click');
      await nextTick();

      // Assert: NotifyUserUpdated was called.
      expect(AppUserEventer.notifyUserUpdated).toHaveBeenCalledTimes(1);
    });

    it('shows error on update failure', async () => {
      // Arrange: Load user data.
      const { promise: loadPromise, resolve: loadResolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(loadPromise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();
      loadResolve({ data: testUserData });
      await flushPromises();
      await nextTick();

      // Act: Click update, API fails.
      const testError = new Error('Update failed');
      mockEditUserData.mockRejectedValue(testError);
      await wrapper.find('[data-testid="btn-update"]').trigger('click');
      await flushPromises();
      await nextTick();

      // Assert: Error was shown.
      expect(AppMessager.errorT).toHaveBeenCalledWith(
        testError,
        'admin.user.msg.error.title',
        'admin.user.msg.error.content',
      );
      expect(apiLogging.logError).toHaveBeenCalledWith(testError, 'Updating user data failed!');
    });

    it('does not update or notify when no user is selected', async () => {
      // Arrange: No user selected.
      createComponent();

      // Act: There is no button to click (form not shown).
      // Assert: No API calls.
      expect(mockEditUserData).not.toHaveBeenCalled();
      expect(AppUserEventer.notifyUserUpdated).not.toHaveBeenCalled();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Lock toggle

  describe('lock toggle', () => {
    it('sends locked=true when unlocking user', async () => {
      // Arrange: Load unlocked user.
      const { promise: loadPromise, resolve: loadResolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(loadPromise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();
      loadResolve({ data: testUserData }); // locked: false
      await flushPromises();
      await nextTick();

      // Act: Click lock button.
      const lockedResponse = { ...testUserData, locked: true };
      mockEditUserData.mockResolvedValue({ data: lockedResponse });
      await wrapper.find('[data-testid="btn-lock"]').trigger('click');
      await nextTick();

      // Assert: EditUserData called with locked: true.
      expect(mockEditUserData).toHaveBeenCalledTimes(1);
      const payload = mockEditUserData.mock.calls[0]?.[0] as any;
      expect(payload.locked).toBe(true);
      // Only locked field should be sent; other fields are null (no change).
      expect(payload.username).toBeNull();
      expect(payload.email).toBeNull();
      expect(payload.lang).toBeNull();
      expect(payload.profile).toBeNull();
    });

    it('sends locked=false when locking user', async () => {
      // Arrange: Load locked user.
      const { promise: loadPromise, resolve: loadResolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(loadPromise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();
      loadResolve({ data: testUserDataLocked }); // locked: true
      await flushPromises();
      await nextTick();

      // Act: Click lock button (which now shows "Unlock").
      const unlockedResponse = { ...testUserDataLocked, locked: false };
      mockEditUserData.mockResolvedValue({ data: unlockedResponse });
      await wrapper.find('[data-testid="btn-lock"]').trigger('click');
      await nextTick();

      // Assert: EditUserData called with locked: false.
      const payload = mockEditUserData.mock.calls[0]?.[0] as any;
      expect(payload.locked).toBe(false);
    });

    it('shows error on lock failure', async () => {
      // Arrange: Load unlocked user.
      const { promise: loadPromise, resolve: loadResolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(loadPromise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();
      loadResolve({ data: testUserData });
      await flushPromises();
      await nextTick();

      // Act: Click lock, API fails.
      const testError = new Error('Lock failed');
      mockEditUserData.mockRejectedValue(testError);
      await wrapper.find('[data-testid="btn-lock"]').trigger('click');
      await flushPromises();
      await nextTick();

      // Assert: Error was shown.
      expect(AppMessager.errorT).toHaveBeenCalledWith(
        testError,
        'admin.user.msg.error.title',
        'admin.user.msg.error.content',
      );
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Permission gating

  describe('permission gating', () => {
    it('disables all inputs when viewing own account', async () => {
      // Arrange: Logged-in user matches the viewed user.
      mockGetEmail.mockReturnValue('alice@test.com');
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(promise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();
      resolve({ data: testUserData });
      await flushPromises();
      await nextTick();

      // Assert: All inputs are disabled.
      wrapper.findAll('input').forEach((input) => {
        expect(isDisabled(input)).toBe(true);
      });
      // Assert: Buttons are disabled.
      expect(isDisabled(wrapper.find('[data-testid="btn-update"]'))).toBe(true);
      expect(isDisabled(wrapper.find('[data-testid="btn-lock"]'))).toBe(true);
    });

    it('disables all inputs when lacking permissions', async () => {
      // Arrange: User lacks edit permissions.
      mockHasPermissionsAny.mockReturnValue(false);
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(promise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();
      resolve({ data: testUserData });
      await flushPromises();
      await nextTick();

      // Assert: All inputs are disabled.
      wrapper.findAll('input').forEach((input) => {
        expect(isDisabled(input)).toBe(true);
      });
    });

    it('disables all inputs when no user selected', () => {
      // Arrange: Mount with no user.
      const wrapper = createComponent(null);

      // Assert: Form is rendered (isLoading is false) but all inputs are disabled.
      expect(wrapper.find('[data-testid="form-user-main"]').exists()).toBe(true);
      wrapper.findAll('input').forEach((input) => {
        expect(isDisabled(input)).toBe(true);
      });
    });

    it('enables form for admin viewing another user', async () => {
      // Arrange: Admin viewing another user (default mocks).
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(promise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();
      resolve({ data: testUserData });
      await flushPromises();
      await nextTick();

      // Assert: Inputs are enabled.
      wrapper.findAll('input').forEach((input) => {
        expect(isDisabled(input)).toBe(false);
      });
      // Assert: Buttons are enabled.
      expect(isDisabled(wrapper.find('[data-testid="btn-update"]'))).toBe(false);
      expect(isDisabled(wrapper.find('[data-testid="btn-lock"]'))).toBe(false);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Self-edit warning

  describe('self-edit warning', () => {
    it('shows warning message when viewing own account with permissions', async () => {
      // Arrange: Logged-in user matches viewed user, has permissions.
      mockGetEmail.mockReturnValue('alice@test.com');
      mockHasPermissionsAny.mockReturnValue(true);
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(promise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();
      resolve({ data: testUserData });
      await flushPromises();
      await nextTick();

      // Assert: Warning message is rendered.
      const warning = wrapper.find('.onpage-msg');
      expect(warning.exists()).toBe(true);
      expect(warning.text()).toBe('You cannot edit your own account.');
    });

    it('does not show warning when viewing another user', async () => {
      // Arrange: Admin viewing another user (default mocks).
      const { promise, resolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(promise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();
      resolve({ data: testUserData });
      await flushPromises();
      await nextTick();

      // Assert: No warning message.
      expect(wrapper.find('.onpage-msg').exists()).toBe(false);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Busy state

  describe('busy state', () => {
    it('disables buttons while update is in progress', async () => {
      // Arrange: Load user data.
      const { promise: loadPromise, resolve: loadResolve } = createDeferredPromise<any>();
      mockLoadUserData.mockReturnValue(loadPromise);

      const wrapper = createComponent(null);
      await wrapper.setProps({ modelValue: testUser });
      await nextTick();
      loadResolve({ data: testUserData });
      await flushPromises();
      await nextTick();

      // Act: Click update, but keep the promise pending.
      const { promise: updatePromise } = createDeferredPromise<any>();
      mockEditUserData.mockReturnValue(updatePromise);
      await wrapper.find('[data-testid="btn-update"]').trigger('click');
      await nextTick();

      // Assert: Buttons are disabled while busy.
      expect(isDisabled(wrapper.find('[data-testid="btn-update"]'))).toBe(true);
      expect(isDisabled(wrapper.find('[data-testid="btn-lock"]'))).toBe(true);
    });
  });
});
