<script setup lang="ts">
/**
 * View of user's history. No editing here.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { ref, reactive, watch } from 'vue';
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

/** User selected in main user table. Null means no user was selected. */
const selUserRecord = defineModel<UserTableEntry | null>();

const props = withDefaults(
  defineProps<{
    /** True if this tab is currently the active tab in the tab group. */
    isActive?: boolean;
  }>(),
  { isActive: true },
);

const { usersReloadTrigger, userUpdatedTrigger } = storeToRefs(useUserEventStore());

const formFilter: UserHistoryTableFilterForm = reactive({
  userId: -1,
  who: null,
  what: null,
  createdFromAt: null,
  createdToAt: null,
  tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
});

/** Reference to tab component. */
const tabRef = ref<AdminUserTabExpose | null>(null);

/** Used to enforce reload of this table later. */
const reloadTrigger = ref(0);

// WATCHES

/**
 * React on main user table being reloaded or user data being updated.
 * Forces reload of user history table when this tab is active or becomes active again.
 */
watch([usersReloadTrigger, userUpdatedTrigger], async () => {
  if (props.isActive) await tabRef.value?.handleReload(); // reload immediately
  else reloadTrigger.value++; // reload later, when we open this tab
});

// FUNCTIONS

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
const processEntry = (entry: UserHistoryTableEntry): UserHistoryTableEntry => {
  return { ...entry, createdAt: TimeUtils.zoned(entry.createdAt) };
};
</script>

<template>
  <AdminUserTab
    ref="tabRef"
    v-model="selUserRecord"
    v-model:formFilter="formFilter"
    :isActive="props.isActive"
    :reloadTrigger="reloadTrigger"
    tableId="userHistory"
    :columns="userHistoryTableColumns"
    :fetchData="backendApiAdminUser.loadHistoryPage"
    :convertToReq="convertToReq"
    :processEntry="processEntry"
    emptyText="admin.user.history.table.empty"
    emptyNoUserText="admin.user.history.table.emptyNoUser"
  >
    <template #filter="{ isBusy, isDisabled, handleReload }">
      <AdminUserHistoryFilter v-model="formFilter" :isBusy="isBusy" :disabled="isDisabled" @reload="handleReload" />
    </template>
  </AdminUserTab>
</template>

<style scoped></style>
