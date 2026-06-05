import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Ref } from 'vue';

import type { UserFullDataForm } from '@/code/data/features/user/admin-user.ts';
import { emptyUserForm } from '@/code/data/features/user/user-const.ts';

/**
 * Stores application-wide user-related events that other components can listen to.
 * This is used for cross-component communication when direct parent-child events are not practical.
 */
export const useUserEventStore = defineStore('user-events', () => {
  /** Trigger for user data update. Increment to notify. */
  const userUpdatedTrigger = ref(0);
  /** Changed user data. Fields that weren't changed will be null. */
  const userData: Ref<UserFullDataForm> = ref(emptyUserForm);

  /** Notify that user data has been updated. */
  function notifyUserUpdated(diffData: UserFullDataForm) {
    userUpdatedTrigger.value++;
    userData.value = diffData;
  }

  return { userUpdatedTrigger, userData, notifyUserUpdated };
});
