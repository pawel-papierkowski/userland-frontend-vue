<script setup lang="ts">
/**
 * View of user's JWT. No editing here.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { reactive } from 'vue';

import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import { TimeUtils } from '@/code/utils/TimeUtils';

import type { UserTableEntry, UserJwtTableFilterForm, UserJwtTableReq, UserJwtTableEntry } from '@/code/data/features/user/admin-user.ts';
import { userJwtTableColumns } from '@/code/data/features/user/user-const.ts';

import AdminUserTab from '@/components/pages/admin/user/common/AdminUserTab.vue';
import AdminUserJwtFilter from '@/components/pages/admin/user/jwt/AdminUserJwtFilter.vue';

const selUserRecord = defineModel<UserTableEntry|null>();

const form: UserJwtTableFilterForm = reactive({
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
const convertToReq = (form: UserJwtTableFilterForm, userId: number): UserJwtTableReq => {
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
const processEntry = (entry: UserJwtTableEntry) => {
  if (entry.createdAt) {
    entry.createdAt = entry.createdAt.replace('T', ' ').split('.')[0] || entry.createdAt;
  }
  if (entry.expiresAt) {
    entry.expiresAt = entry.expiresAt.replace('T', ' ').split('.')[0] || entry.expiresAt;
  }
};
</script>

<template>
  <AdminUserTab
    v-model="selUserRecord"
    v-model:form="form"
    :columns="userJwtTableColumns"
    :fetchData="backendApiAdminUser.loadJwtPage"
    :convertToReq="convertToReq"
    :processEntry="processEntry"
    emptyText="admin.user.jwt.table.empty"
    emptyNoUserText="admin.user.jwt.table.emptyNoUser"
  >
    <template #filter="{ isSubmitting, isDisabled, handleReload }">
      <AdminUserJwtFilter v-model="form" :isSubmitting="isSubmitting" :disabled="isDisabled" @reload="handleReload"/>
    </template>
  </AdminUserTab>
</template>

<style scoped></style>
