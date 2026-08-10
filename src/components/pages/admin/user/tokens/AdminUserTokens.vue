<script setup lang="ts">
/**
 * View of user's tokens.
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
  UserTokenTableFilterForm,
  UserTokenTableReq,
  UserTokenTableEntry,
} from '@/code/data/features/user/admin-user-type.ts';
import { userTokensTableColumns } from '@/code/data/features/user/user-const.ts';

import AdminUserTab from '@/components/pages/admin/user/common/AdminUserTab.vue';
import AdminUserTokensFilter from '@/components/pages/admin/user/tokens/AdminUserTokensFilter.vue';

/** User selected in main user table. Null means no user was selected. */
const selUserRecord = defineModel<UserTableEntry | null>();

const props = withDefaults(
  defineProps<{
    /** True if this tab is currently the active tab in the tab group. */
    isActive?: boolean;
  }>(),
  { isActive: true },
);

const { usersReloadTrigger } = storeToRefs(useUserEventStore());

const formFilter: UserTokenTableFilterForm = reactive({
  userId: -1,
  createdFromAt: null,
  createdToAt: null,
  tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
});

/** Used to enforce reload of this table. */
const reloadTrigger = ref(0);

// WATCHES

/**
 * React on main user table being reloaded.
 * Forces reload of user tokens table when this tab becomes active again.
 */
watch([usersReloadTrigger], () => {
  reloadTrigger.value++;
});

// FUNCTIONS

/**
 * Convert form data to request data.
 * @param form Form data.
 * @param userId User ID.
 * @returns Request data.
 */
const convertToReq = (form: UserTokenTableFilterForm, userId: number): UserTokenTableReq => {
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
const processEntry = (entry: UserTokenTableEntry): UserTokenTableEntry => {
  return { ...entry, createdAt: TimeUtils.zoned(entry.createdAt), expiresAt: TimeUtils.zoned(entry.expiresAt) };
};
</script>

<template>
  <AdminUserTab
    v-model="selUserRecord"
    v-model:formFilter="formFilter"
    :isActive="props.isActive"
    :reloadTrigger="reloadTrigger"
    tableId="userTokens"
    :columns="userTokensTableColumns"
    :fetchData="backendApiAdminUser.loadTokensPage"
    :convertToReq="convertToReq"
    :processEntry="processEntry"
    emptyText="admin.user.tokens.table.empty"
    emptyNoUserText="admin.user.tokens.table.emptyNoUser"
  >
    <template #filter="{ isBusy, isDisabled, handleReload }">
      <AdminUserTokensFilter v-model="formFilter" :isBusy="isBusy" :disabled="isDisabled" @reload="handleReload" />
    </template>
  </AdminUserTab>
</template>

<style scoped></style>
