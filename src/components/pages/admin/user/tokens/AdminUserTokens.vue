<script setup lang="ts">
/**
 * View of user's tokens.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { reactive } from 'vue';

import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import { TimeUtils } from '@/code/utils/TimeUtils';

import type {
  UserTableEntry,
  UserTokenTableFilterForm,
  UserTokenTableReq,
  UserTokenTableEntry,
} from '@/code/data/features/user/admin-user-type.ts';
import { userTokensTableColumns } from '@/code/data/features/user/user-const.ts';

import AdminUserTab from '@/components/pages/admin/user/common/AdminUserTab.vue';
import AdminUserTokensFilter from '@/components/pages/admin/user/tokens/AdminUserTokensFilter.vue';

const selUserRecord = defineModel<UserTableEntry | null>();

const formFilter: UserTokenTableFilterForm = reactive({
  userId: -1,
  createdFromAt: null,
  createdToAt: null,
  tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
});

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
const processEntry = (entry: UserTokenTableEntry) => {
  entry.createdAt = TimeUtils.zoned(entry.createdAt);
  entry.expiresAt = TimeUtils.zoned(entry.expiresAt);
};
</script>

<template>
  <AdminUserTab
    v-model="selUserRecord"
    v-model:formFilter="formFilter"
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
