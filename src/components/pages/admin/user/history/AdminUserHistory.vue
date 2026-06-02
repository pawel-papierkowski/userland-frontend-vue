<script setup lang="ts">
/**
 * View of user's history. No editing here.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { reactive } from 'vue';

import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import { TimeUtils } from '@/code/utils/TimeUtils';

import type { UserTableEntry, UserHistoryTableFilterForm, UserHistoryTableReq, UserHistoryTableEntry } from '@/code/data/features/user/admin-user.ts';
import { userHistoryTableColumns } from '@/code/data/features/user/user-const.ts';

import AdminUserTab from '@/components/pages/admin/user/common/AdminUserTab.vue';
import AdminUserHistoryFilter from '@/components/pages/admin/user/history/AdminUserHistoryFilter.vue';

const selUserRecord = defineModel<UserTableEntry|null>();

const form: UserHistoryTableFilterForm = reactive({
  userId: -1,
  who: null,
  what: null,
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
</script>

<template>
  <AdminUserTab
    v-model="selUserRecord"
    v-model:form="form"
    :columns="userHistoryTableColumns"
    :fetchData="backendApiAdminUser.loadHistoryPage"
    :convertToReq="convertToReq"
    :processEntry="processEntry"
    emptyText="admin.user.history.table.empty"
    emptyNoUserText="admin.user.history.table.emptyNoUser"
  >
    <template #filter="{ isSubmitting, isDisabled, handleReload }">
      <AdminUserHistoryFilter v-model="form" :isSubmitting="isSubmitting" :disabled="isDisabled" @reload="handleReload"/>
    </template>
  </AdminUserTab>
</template>

<style scoped></style>
