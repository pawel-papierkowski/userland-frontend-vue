import { useUserEventStore } from '@/stores/events/user-events.ts';

import type { UserFullDataForm } from '@/code/data/features/user/admin-user-type.ts';

/**
 * Class for notifying about application-wide user-related events.
 * Essentially it is wrapper for user event store.
 */
export class AppUserEventer {
  /**
   * Notifies that user has been (de)selected to anyone interested.
   * @param diffData Changed fields.
   */
  public static notifyUserSelected() {
    const eventStore = useUserEventStore();
    eventStore.notifyUserSelected();
  }

  /**
   * Notifies that user data has been updated to anyone interested.
   * @param diffData Changed fields.
   */
  public static notifyUserUpdated(diffData: UserFullDataForm) {
    const eventStore = useUserEventStore();
    eventStore.notifyUserUpdated(diffData);
  }
}
