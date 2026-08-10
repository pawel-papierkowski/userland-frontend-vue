import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Ref } from 'vue';

import type { UserFullDataForm } from '@/code/data/features/user/admin-user-type.ts';
import { emptyUserForm } from '@/code/data/features/user/user-const.ts';

/**
 * Stores application-wide user-related events that other components can listen to.
 * This is used for cross-component communication when direct parent-child events are not practical.
 */
export const useUserEventStore = defineStore('user-events', () => {
  /** Trigger for user table reload. Increment to notify. */
  const usersReloadTrigger = ref(0);

  /** Notify that user table was reloaded. */
  function notifyUsersReload() {
    usersReloadTrigger.value++;
  }

  /** Trigger for user (de)selection. Increment to notify. */
  const userSelectedTrigger = ref(0);

  /** Notify that different user has been selected or deselected. */
  function notifyUserSelected() {
    userSelectedTrigger.value++;
  }

  /** Trigger for user data update. Increment to notify. */
  const userUpdatedTrigger = ref(0);
  /** Changed user data. Fields that weren't changed will be null. */
  const userUpdatedDiff: Ref<UserFullDataForm> = ref(emptyUserForm);

  /** Notify that user data has been updated. */
  function notifyUserUpdated(diffData: UserFullDataForm) {
    userUpdatedTrigger.value++;
    userUpdatedDiff.value = diffData;
  }

  //

  return {
    usersReloadTrigger,
    notifyUsersReload,

    userSelectedTrigger,
    notifyUserSelected,
    
    userUpdatedTrigger,
    userUpdatedDiff,
    notifyUserUpdated,
  };
});
