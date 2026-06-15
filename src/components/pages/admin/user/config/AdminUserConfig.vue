<script setup lang="ts">
/**
 * View/edit of user's configuration. Only admin can edit configuration.
 *
 * Models:
 * - v-model - Holds selected user.
 */
import { ref, reactive, shallowRef } from 'vue';
import type { Ref } from 'vue';

import backendApi from '@/services/api-common.ts';
import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import { TimeUtils } from '@/code/utils/TimeUtils.ts';

import type { EntryMeta, EntryOption } from '@/code/data/features/common/type.ts';
import type {
  UserTableEntry,
  UserConfigTableFilterForm,
  UserConfigTableReq,
  UserConfigTableEntry,
  UserConfigEntryEditForm,
  UserConfigEntryEditReq,
  AdminUserTabExpose,
} from '@/code/data/features/user/admin-user-type.ts';
import { userConfigTableColumns } from '@/code/data/features/user/user-const.ts';

import EntryOptions from '@/components/common/table/EntryOptions.vue';
import AdminUserTab from '@/components/pages/admin/user/common/AdminUserTab.vue';
import AdminUserConfigFilter from '@/components/pages/admin/user/config/AdminUserConfigFilter.vue';

const selUserRecord = defineModel<UserTableEntry | null>();
/** Selected entry record. Use shallowRef to avoid deep reactivity issues with generic types in templates. */
const selEntryRecord = shallowRef<UserConfigTableEntry | null>(null);

const form: UserConfigTableFilterForm = reactive({
  userId: -1,
  createdFromAt: null,
  createdToAt: null,
  tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
});

const formEntry: UserConfigEntryEditForm = reactive({
  name: 'aa',
  value: 'bb'
});

/** Reference to tab component. */
const tabRef = ref<AdminUserTabExpose | null>(null);
/** True if busy executing options. */
const isBusyOptions: Ref<boolean> = ref(false);

//

/**
 * Convert filter form data to request data.
 * @param form Form data.
 * @param userId User ID.
 * @returns Request data.
 */
const convertFilterToReq = (form: UserConfigTableFilterForm, userId: number): UserConfigTableReq => {
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
 * Convert entry edit form data to entry edit request data.
 * @param form Entry edit form data.
 * @param id Entry identificator. Can be null if you want to add new entry.
 * @param userId User identificator.
 * @returns Entry edit request data.
 */
const convertEditToReq = (form: UserConfigEntryEditForm, id: number|null, userId: number): UserConfigEntryEditReq => {
  return {
    ...form,
    id: id,
    userId: userId,
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

//

/**
 * Add new entry.
 * @param entry Table entry.
 */
const addEntry = async () => {
  // TODO
  console.warn(`Should execute option addEntry() for config entry.`);
}

/**
 * Save given entry.
 * @param entry Table entry.
 */
const saveEntry = async (entry: UserConfigTableEntry) => {
  isBusyOptions.value = true;
  // Note we do not check if config entry with same name already exists - error from backend is clear enough.

  try {
    const req = convertEditToReq(formEntry, entry.id, selUserRecord.value?.id || -1);
    await backendApiAdminUser.editConfigEntry(req);
    await tabRef.value?.selectEntry(entry, true); // since same entry is already selected, this will deselect
    await tabRef.value?.handleReload();
    AppMessager.successT('admin.user.config.table.msg.save.success.title', 'admin.user.config.table.msg.save.success.content');
  } catch (error) {
    AppMessager.errorT(error, 'admin.user.config.table.msg.save.fail.title', 'admin.user.config.table.msg.save.fail.content');
    backendApi.logError(error, 'Failed to save user config entry!');
  } finally {
    isBusyOptions.value = false;
  }
}

/**
 * Cancel editing given entry.
 * @param entry Table entry.
 */
const cancelEntry = async (entry: UserConfigTableEntry) => {
  await tabRef.value?.selectEntry(entry, true); // since same entry is already selected, this will deselect
}

/**
 * Edit given entry.
 * @param entry Table entry.
 */
const editEntry = async (entry: UserConfigTableEntry) => {
  await tabRef.value?.selectEntry(entry, true);
}

/**
 * Delete given entry.
 * @param entry Table entry.
 */
const deleteEntry = async (entry: UserConfigTableEntry) => {
  isBusyOptions.value = true;

  try {
    await backendApiAdminUser.deleteConfigEntry(entry.id);
    await tabRef.value?.handleReload();
    AppMessager.successT('admin.user.config.table.msg.delete.success.title', 'admin.user.config.table.msg.delete.success.content');
  } catch (error) {
    AppMessager.errorT(error, 'admin.user.config.table.msg.delete.fail.title', 'admin.user.config.table.msg.delete.fail.content');
    backendApi.logError(error, 'Failed to delete user config entry!');
  } finally {
    isBusyOptions.value = false;
  }
}

/** Actions for EntryOptions. */
const actions: Record<string, (entry: UserConfigTableEntry) => Promise<void>> = reactive({
  save: saveEntry,
  cancel: cancelEntry,
  edit: editEntry,
  delete: deleteEntry,
});

//

/**
 * Check if current entry is considered busy, therefore its options should be disabled.
 * @param entry Entry.
 */
const isBusyForEntry = (entry: UserConfigTableEntry): boolean => {
  if (isBusyOptions.value) return true;
  if (selEntryRecord.value !== null && entry.id !== selEntryRecord.value?.id) return true;
  return false;
}

/**
 * Determine available options for given entry.
 * @param entry Entry.
 */
const metaForEntry = (entry: UserConfigTableEntry): EntryMeta|null => {
  if (selEntryRecord.value !== null && entry.id === selEntryRecord.value?.id) {
    // We have entry selected. We need custom metadata for editing entry.
    const options: Record<string, EntryOption> = {
      save: {
        access: 'ENABLED',
        reason: null
      },
      cancel: {
        access: 'ENABLED',
        reason: null
      }
    }
    return {
      options: options,
      data: null
    };
  }
  return entry.meta;
}
</script>

<template>
  <AdminUserTab
    ref="tabRef"
    v-model="selUserRecord"
    v-model:entry="selEntryRecord"
    v-model:form="form"
    :columns="userConfigTableColumns"
    :fetchData="backendApiAdminUser.loadConfigPage"
    :convertToReq="convertFilterToReq"
    :processEntry="processEntry"
    emptyText="admin.user.config.table.empty"
    emptyNoUserText="admin.user.config.table.emptyNoUser"
  >
    <template #filter="{ isBusy, isDisabled, handleReload }">
      <AdminUserConfigFilter v-model="form" :isBusy="isBusy" :disabled="isDisabled" @reload="handleReload" />
    </template>
    <!-- Custom slots. -->
    <template #column_options="{ entry }">
      <EntryOptions :meta="metaForEntry(entry)" :entry="entry" :actions="actions" :isBusy="isBusyForEntry(entry)"
        langPrefix="admin.user.config.table.texts" />
    </template>
  </AdminUserTab>
</template>

<style scoped></style>
