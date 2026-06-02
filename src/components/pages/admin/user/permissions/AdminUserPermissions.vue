<script setup lang="ts">
/**
 * View/edit of user's permissions. Only admin can edit permissions.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { reactive } from 'vue';

import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import { TimeUtils } from '@/code/utils/TimeUtils';

import type { UserTableEntry, UserPermissionTableFilterForm, UserPermissionTableReq, UserPermissionTableEntry } from '@/code/data/features/user/admin-user.ts';
import { userPermissionsTableColumns } from '@/code/data/features/user/user-const.ts';

import AdminUserTab from '@/components/pages/admin/user/common/AdminUserTab.vue';
import AdminUserPermissionsFilter from '@/components/pages/admin/user/permissions/AdminUserPermissionsFilter.vue';

const selUserRecord = defineModel<UserTableEntry|null>();

const form: UserPermissionTableFilterForm = reactive({
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
const convertToReq = (form: UserPermissionTableFilterForm, userId: number): UserPermissionTableReq => {
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
const processEntry = (entry: UserPermissionTableEntry) => {
  if (entry.createdAt) {
    entry.createdAt = entry.createdAt.replace('T', ' ').split('.')[0] || entry.createdAt;
  }
};
</script>

<template>
  <AdminUserTab
    v-model="selUserRecord"
    v-model:form="form"
    :columns="userPermissionsTableColumns"
    :fetchData="backendApiAdminUser.loadPermissionsPage"
    :convertToReq="convertToReq"
    :processEntry="processEntry"
    emptyText="admin.user.permissions.table.empty"
    emptyNoUserText="admin.user.permissions.table.emptyNoUser"
  >
    <template #filter="{ isSubmitting, isDisabled, handleReload }">
      <AdminUserPermissionsFilter v-model="form" :isSubmitting="isSubmitting" :disabled="isDisabled" @reload="handleReload"/>
    </template>
  </AdminUserTab>
</template>

<style scoped></style>
