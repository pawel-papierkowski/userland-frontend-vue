import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useUserEventStore } from '@/stores/events/user-events.ts';
import { emptyUserForm } from '@/code/data/features/user/user-const.ts';
import type { UserFullDataFormDiff } from '@/code/data/features/user/admin-user-type.ts';

/** Tests useUserEventStore. */
describe('useUserEventStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // //////////////////////////////////////////////////////////////////////////
  // General.

  describe('general', () => {
    it('initializes all triggers at 0', () => {
      // Arrange: Create store (fresh Pinia in beforeEach).

      // Act: No action needed, checking initial state.

      // Assert: All triggers start at 0.
      const store = useUserEventStore();
      expect(store.usersReloadTrigger).toBe(0);
      expect(store.userSelectedTrigger).toBe(0);
      expect(store.userUpdatedConfigTrigger).toBe(0);
      expect(store.userUpdatedPermissionsTrigger).toBe(0);
      expect(store.userUpdatedTrigger).toBe(0);
    });

    it('initializes diff with empty user form', () => {
      // Arrange: Create store (fresh Pinia in beforeEach).

      // Act: No action needed, checking initial state.

      // Assert: Diff is set to the empty user form constant.
      const store = useUserEventStore();
      expect(store.userUpdatedDiff).toStrictEqual(emptyUserForm);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // notifyUsersReload.

  describe('notifyUsersReload', () => {
    it('increments usersReloadTrigger', () => {
      // Arrange: Create store.
      const store = useUserEventStore();

      // Act: Notify users reload.
      store.notifyUsersReload();

      // Assert: Trigger incremented by 1.
      expect(store.usersReloadTrigger).toBe(1);
    });

    it('increments cumulatively on multiple calls', () => {
      // Arrange: Create store.
      const store = useUserEventStore();

      // Act: Notify three times.
      store.notifyUsersReload();
      store.notifyUsersReload();
      store.notifyUsersReload();

      // Assert: Trigger is 3.
      expect(store.usersReloadTrigger).toBe(3);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // notifyUserSelected.

  describe('notifyUserSelected', () => {
    it('increments userSelectedTrigger', () => {
      // Arrange: Create store.
      const store = useUserEventStore();

      // Act: Notify user selected.
      store.notifyUserSelected();

      // Assert: Trigger incremented by 1.
      expect(store.userSelectedTrigger).toBe(1);
    });

    it('increments cumulatively on multiple calls', () => {
      // Arrange: Create store.
      const store = useUserEventStore();

      // Act: Notify three times.
      store.notifyUserSelected();
      store.notifyUserSelected();
      store.notifyUserSelected();

      // Assert: Trigger is 3.
      expect(store.userSelectedTrigger).toBe(3);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // notifyUserUpdatedConfig.

  describe('notifyUserUpdatedConfig', () => {
    it('increments userUpdatedConfigTrigger', () => {
      // Arrange: Create store.
      const store = useUserEventStore();

      // Act: Notify user config updated.
      store.notifyUserUpdatedConfig();

      // Assert: Trigger incremented by 1.
      expect(store.userUpdatedConfigTrigger).toBe(1);
    });

    it('increments cumulatively on multiple calls', () => {
      // Arrange: Create store.
      const store = useUserEventStore();

      // Act: Notify three times.
      store.notifyUserUpdatedConfig();
      store.notifyUserUpdatedConfig();
      store.notifyUserUpdatedConfig();

      // Assert: Trigger is 3.
      expect(store.userUpdatedConfigTrigger).toBe(3);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // notifyUserUpdatedPermissions.

  describe('notifyUserUpdatedPermissions', () => {
    it('increments userUpdatedPermissionsTrigger', () => {
      // Arrange: Create store.
      const store = useUserEventStore();

      // Act: Notify user permissions updated.
      store.notifyUserUpdatedPermissions();

      // Assert: Trigger incremented by 1.
      expect(store.userUpdatedPermissionsTrigger).toBe(1);
    });

    it('increments cumulatively on multiple calls', () => {
      // Arrange: Create store.
      const store = useUserEventStore();

      // Act: Notify three times.
      store.notifyUserUpdatedPermissions();
      store.notifyUserUpdatedPermissions();
      store.notifyUserUpdatedPermissions();

      // Assert: Trigger is 3.
      expect(store.userUpdatedPermissionsTrigger).toBe(3);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // notifyUserUpdated.

  describe('notifyUserUpdated', () => {
    it('increments userUpdatedTrigger', () => {
      // Arrange: Create store.
      const store = useUserEventStore();
      const diff: UserFullDataFormDiff = { ...emptyUserForm, username: 'newname' };

      // Act: Notify user updated.
      store.notifyUserUpdated(diff);

      // Assert: Trigger incremented by 1.
      expect(store.userUpdatedTrigger).toBe(1);
    });

    it('stores diff data', () => {
      // Arrange: Create store.
      const store = useUserEventStore();
      const diff: UserFullDataFormDiff = { ...emptyUserForm, email: 'new@email.com' };

      // Act: Notify user updated with diff.
      store.notifyUserUpdated(diff);

      // Assert: Diff is stored.
      expect(store.userUpdatedDiff).toStrictEqual(diff);
    });

    it('updates diff on subsequent calls', () => {
      // Arrange: Create store.
      const store = useUserEventStore();
      const diff1: UserFullDataFormDiff = { ...emptyUserForm, username: 'first' };
      const diff2: UserFullDataFormDiff = { ...emptyUserForm, username: 'second' };

      // Act: Notify twice with different diffs.
      store.notifyUserUpdated(diff1);
      store.notifyUserUpdated(diff2);

      // Assert: Diff has the latest data.
      expect(store.userUpdatedDiff).toStrictEqual(diff2);
      expect(store.userUpdatedTrigger).toBe(2);
    });
  });
});
