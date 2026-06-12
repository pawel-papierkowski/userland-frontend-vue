<script setup lang="ts">
/**
 * View/edit of user's permissions. Only admin can edit permissions.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { ref, reactive } from 'vue';
import type { Ref } from 'vue';

import backendApi from '@/services/api-common.ts';
import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import { TimeUtils } from '@/code/utils/TimeUtils';

import type {
  UserTableEntry,
  UserPermissionTableFilterForm,
  UserPermissionTableReq,
  UserPermissionTableEntry,
  AdminUserTabExpose,
} from '@/code/data/features/user/admin-user-type.ts';
import { userPermissionsTableColumns } from '@/code/data/features/user/user-const.ts';

import EntryOptions from '@/components/common/table/EntryOptions.vue';
import AdminUserTab from '@/components/pages/admin/user/common/AdminUserTab.vue';
import AdminUserPermissionsFilter from '@/components/pages/admin/user/permissions/AdminUserPermissionsFilter.vue';

const selUserRecord = defineModel<UserTableEntry | null>();

const form: UserPermissionTableFilterForm = reactive({
  userId: -1,
  createdFromAt: null,
  createdToAt: null,
  tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
});

/** Reference to tab component. */
const tabRef = ref<AdminUserTabExpose | null>(null);
/** True if busy executing options. */
const isBusyOptions: Ref<boolean> = ref(false);

//

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

//

/**
 * Add new entry.
 * @param entry Table entry.
 */
const addEntry = async () => {
  // TODO
  console.warn(`Should execute option addEntry() for permission entry.`);
}

/**
 * Edit given entry.
 * @param entry Table entry.
 */
const editEntry = async (entry: UserPermissionTableEntry) => {
  // TODO
  console.warn(`Should execute option editEntry() for permission entry.`);
}

/**
 * Delete given entry.
 * @param entry Table entry.
 */
const deleteEntry = async (entry: UserPermissionTableEntry) => {
  isBusyOptions.value = true;

  try {
    await backendApiAdminUser.deletePermissionEntry(entry.id);
    tabRef.value?.handleReload();
    AppMessager.successT('admin.user.permissions.table.msg.delete.success.title', 'admin.user.permissions.table.msg.delete.success.content');
  } catch (error) {
    AppMessager.errorT(error, 'admin.user.permissions.table.msg.delete.fail.title', 'admin.user.permissions.table.msg.delete.fail.content');
    backendApi.logError(error, 'Failed to delete user permission entry!');
  } finally {
    isBusyOptions.value = false;
  }
}

/** Actions for EntryOptions. */
const actions: Record<string, (entry: UserPermissionTableEntry) => Promise<void>> = reactive({
  edit: editEntry,
  delete: deleteEntry,
});

</script>

<template>
  <AdminUserTab
    ref="tabRef"
    v-model="selUserRecord"
    v-model:form="form"
    :columns="userPermissionsTableColumns"
    :fetchData="backendApiAdminUser.loadPermissionsPage"
    :convertToReq="convertToReq"
    :processEntry="processEntry"
    emptyText="admin.user.permissions.table.empty"
    emptyNoUserText="admin.user.permissions.table.emptyNoUser"
  >
    <template #filter="{ isBusy, isDisabled, handleReload }">
      <AdminUserPermissionsFilter v-model="form" :isBusy="isBusy" :disabled="isDisabled" @reload="handleReload" />
    </template>
    <!-- Custom slots. -->
    <template #column_options="{ entry }">
      <EntryOptions :meta="entry.meta" :entry="entry" :actions="actions" :isBusy="isBusyOptions"
        langPrefix="admin.user.permissions.table.texts" />
    </template>
  </AdminUserTab>
</template>

<style scoped></style>
