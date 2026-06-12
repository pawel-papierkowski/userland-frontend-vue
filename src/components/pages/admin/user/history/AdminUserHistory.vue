<script setup lang="ts">
/**
 * View of user's history. No editing here.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { onActivated, ref, reactive, watch } from 'vue';
import type { Ref } from 'vue';
import { storeToRefs } from 'pinia';

import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import { TimeUtils } from '@/code/utils/TimeUtils';

import { useUserEventStore } from '@/stores/events/user-events.ts';
import type {
  UserTableEntry,
  UserHistoryTableFilterForm,
  UserHistoryTableReq,
  UserHistoryTableEntry,
  AdminUserTabExpose,
} from '@/code/data/features/user/admin-user-type.ts';
import { userHistoryTableColumns } from '@/code/data/features/user/user-const.ts';

import AdminUserTab from '@/components/pages/admin/user/common/AdminUserTab.vue';
import AdminUserHistoryFilter from '@/components/pages/admin/user/history/AdminUserHistoryFilter.vue';

const userEventStore = useUserEventStore();
const { userUpdatedTrigger } = storeToRefs(userEventStore);

const selUserRecord = defineModel<UserTableEntry | null>();

const form: UserHistoryTableFilterForm = reactive({
  userId: -1,
  who: null,
  what: null,
  createdFromAt: null,
  createdToAt: null,
  tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
});

/** Reference to tab component. */
const tabRef = ref<AdminUserTabExpose | null>(null);
/** True if table should be reloaded. */
const shouldReload: Ref<boolean> = ref(false);

//

/**
 * Convert form data to request data.
 * @param form Form data.
 * @param userId User ID.
 * @returns Request data.
 */
const convertToReq = (form: UserHistoryTableFilterForm, userId: number): UserHistoryTableReq => {
  const createdFromStr = TimeUtils.cnvDate(form.createdFromAt);
  const createdToStr = TimeUtils.cnvDate(form.createdToAt);

  return {
    ...form,
    userId: userId,
    createdFromAt: createdFromStr === null ? null : createdFromStr + 'T00:00:00',
    createdToAt: createdToStr === null ? null : createdToStr + 'T23:59:59.999999',
  };
};

/**
 * Process single entry.
 * @param entry Table entry.
 */
const processEntry = (entry: UserHistoryTableEntry) => {
  if (entry.createdAt) {
    entry.createdAt = entry.createdAt.replace('T', ' ').split('.')[0] || entry.createdAt;
  }
};

//

/** When user switches to this tab. */
onActivated(() => {
  if (shouldReload.value) {
    shouldReload.value = false;
    tabRef.value?.handleReload();
  }
});

/** React on user data being updated. */
watch(userUpdatedTrigger, async () => {
  // We do not want to reload history right away, but when user goes to this tab.
  shouldReload.value = true;
});
</script>

<template>
  <AdminUserTab
    ref="tabRef"
    v-model="selUserRecord"
    v-model:form="form"
    :columns="userHistoryTableColumns"
    :fetchData="backendApiAdminUser.loadHistoryPage"
    :convertToReq="convertToReq"
    :processEntry="processEntry"
    emptyText="admin.user.history.table.empty"
    emptyNoUserText="admin.user.history.table.emptyNoUser"
  >
    <template #filter="{ isBusy, isDisabled, handleReload }">
      <AdminUserHistoryFilter v-model="form" :isBusy="isBusy" :disabled="isDisabled" @reload="handleReload" />
    </template>
  </AdminUserTab>
</template>

<style scoped></style>
