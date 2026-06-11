<script setup lang="ts">
/**
 * View/edit of user's configuration.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';

import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import { TimeUtils } from '@/code/utils/TimeUtils.ts';
import { TableUtils } from '@/code/utils/TableUtils.ts';

import type {
  UserTableEntry,
  UserConfigTableFilterForm,
  UserConfigTableReq,
  UserConfigTableEntry,
} from '@/code/data/features/user/admin-user-type.ts';
import { userConfigTableColumns } from '@/code/data/features/user/user-const.ts';

import AdminUserTab from '@/components/pages/admin/user/common/AdminUserTab.vue';
import AdminUserConfigFilter from '@/components/pages/admin/user/config/AdminUserConfigFilter.vue';

const { t } = useI18n();

const selUserRecord = defineModel<UserTableEntry | null>();

const form: UserConfigTableFilterForm = reactive({
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
const convertToReq = (form: UserConfigTableFilterForm, userId: number): UserConfigTableReq => {
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
const processEntry = (entry: UserConfigTableEntry) => {
  if (entry.createdAt) {
    entry.createdAt = entry.createdAt.replace('T', ' ').split('.')[0] || entry.createdAt;
  }
};

// OPTIONS

/**
 * Get dynamic class of delete button.
 * @param entry Entry.
 */
const deleteBtnClass = (entry: UserConfigTableEntry) => {
  return {
    disabled: !canDelete(entry)
  }
};

/**
 * Check if can delete entry.
 * @param entry Entry.
 * @returns True if can delete, otherwise false.
 */
const canDelete = (entry: UserConfigTableEntry): boolean => {
  const option = TableUtils.ExtractOption(entry.meta, 'delete');
  if (option == null) return false;
  return option.access === 'ENABLED';
};

/**
 * Check if delete button is visible.
 * @param entry Entry.
 * @returns True if can see delete button, otherwise false.
 */
const canSee = (entry: UserConfigTableEntry): boolean => {
  const option = TableUtils.ExtractOption(entry.meta, 'delete');
  if (option == null) return false;
  return option.access !== 'INVISIBLE';
};

/**
 * Resolve tooltip for delete button.
 * @param entry Entry.
 */
const deleteTooltip = (entry: UserConfigTableEntry): string => {
  const option = TableUtils.ExtractOption(entry.meta, 'delete');
  const reason = option?.reason ? option.reason : 'action';
  return 'admin.user.config.table.tooltip.delete.' + reason;
};

/**
 * Delete config entry.
 * @param entry Entry to delete.
 */
const deleteConfig = async (entry: UserConfigTableEntry) => {
  if (!canDelete(entry)) return;
  // TODO actually delete, for now just acknowledge
  console.warn('Should delete entry and reload table');
};
</script>

<template>
  <AdminUserTab
    v-model="selUserRecord"
    v-model:form="form"
    :columns="userConfigTableColumns"
    :fetchData="backendApiAdminUser.loadConfigPage"
    :convertToReq="convertToReq"
    :processEntry="processEntry"
    emptyText="admin.user.config.table.empty"
    emptyNoUserText="admin.user.config.table.emptyNoUser"
  >
    <template #filter="{ isBusy, isDisabled, handleReload }">
      <AdminUserConfigFilter v-model="form" :isBusy="isBusy" :disabled="isDisabled" @reload="handleReload" />
    </template>
    <!-- Custom slots. -->
    <template #column_options="{ entry }">
      <div class="entry-content">
        <div class="entry-btn" :class="deleteBtnClass(entry)" :title="t(deleteTooltip(entry))"
          v-if="canSee(entry)" @click="deleteConfig(entry)">
          ❌
        </div>
      </div>
    </template>
  </AdminUserTab>
</template>

<style scoped></style>
