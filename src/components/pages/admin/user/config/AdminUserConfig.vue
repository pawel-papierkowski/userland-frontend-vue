<script setup lang="ts">
/**
 * View/edit of user's configuration. Only admin can edit configuration.
 *
 * Models:
 * - v-model - Holds selected user.
 */
import { ref, reactive, shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';

import apiLogging from '@/services/api-logging.ts';
import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import { TimeUtils } from '@/code/utils/TimeUtils.ts';

import { useUserEventStore } from '@/stores/events/user-events.ts';
import type { EntryMeta, EntryOption, RowMeta } from '@/code/data/features/common/type.ts';
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

import { AppLoginer } from '@/code/wrappers/login/AppLoginer.ts';
import { AppMessager } from '@/code/wrappers/messages/AppMessager.ts';
import { AppUserEventer } from '@/code/wrappers/events/AppUserEventer.ts';

import EntryOptions from '@/components/common/table/EntryOptions.vue';
import AdminUserTab from '@/components/pages/admin/user/common/AdminUserTab.vue';
import AdminUserConfigFilter from '@/components/pages/admin/user/config/AdminUserConfigFilter.vue';

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

/** Selected entry record. Use shallowRef to avoid deep reactivity issues with generic types in templates. */
const selEntryRecord = shallowRef<UserConfigTableEntry | null>(null);

const formFilter: UserConfigTableFilterForm = reactive({
  userId: -1,
  createdFromAt: null,
  createdToAt: null,
  tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
});

const formEntry: UserConfigEntryEditForm = reactive({
  name: '',
  value: '',
});

/** Reference to tab component. */
const tabRef = ref<AdminUserTabExpose | null>(null);
/** True if adding new entry. */
const addNewEntry = ref(false);
/** True if busy executing options. */
const isBusyOptions = ref(false);

/** Used to enforce reload of this table later. */
const reloadTrigger = ref(0);

// WATCHES

/**
 * React on main user table being reloaded.
 * Forces reload of user config table when this tab is active or becomes active again.
 */
watch([usersReloadTrigger], async () => {
  if (props.isActive)
    await tabRef.value?.handleReload(); // reload immediately
  else reloadTrigger.value++; // reload later, when we open this tab
});

/** React on user being (de)selected. */
watch(selUserRecord, async () => {
  // Deselect anything in subtable.
  await tabRef.value?.selectEntry(null, true);
});

// FUNCTIONS

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
const convertEditToReq = (form: UserConfigEntryEditForm, id: number | null, userId: number): UserConfigEntryEditReq => {
  return {
    id: id,
    userId: userId,
    name: form.name,
    value: form.value,
  };
};

/**
 * Process single entry.
 * @param entry Table entry.
 */
const processEntry = (entry: UserConfigTableEntry): UserConfigTableEntry => {
  return { ...entry, createdAt: TimeUtils.zoned(entry.createdAt) };
};

//

/**
 * Add new entry.
 * @param entry Table entry.
 */
const addEntry = async () => {
  if (!selUserRecord.value || addNewEntry.value) return; // user must be selected, already in add entry mode
  formEntry.name = '';
  formEntry.value = '';
  await tabRef.value?.selectEntry(null, true); // deselect in case something is selected
  addNewEntry.value = true;
};

/**
 * Save given entry. Both for new entry and editing existing entry.
 * @param entry Table entry.
 */
const saveEntry = async (entry: UserConfigTableEntry | null) => {
  if (!verifyForm()) return;
  isBusyOptions.value = true;

  try {
    const req = convertEditToReq(formEntry, entry?.id ?? null, selUserRecord.value?.id ?? -1);
    await backendApiAdminUser.editConfigEntry(req);
    await tabRef.value?.selectEntry(entry, true); // since same entry is already selected, this will deselect
    await tabRef.value?.handleReload();
    addNewEntry.value = false;
    AppMessager.successT(
      'admin.user.config.table.msg.save.success.title',
      'admin.user.config.table.msg.save.success.content',
    );
    AppUserEventer.notifyUserUpdatedConfig();
  } catch (error) {
    AppMessager.errorT(
      error,
      'admin.user.config.table.msg.save.fail.title',
      'admin.user.config.table.msg.save.fail.content',
    );
    apiLogging.logError(error, 'Failed to save user config entry!');
  } finally {
    isBusyOptions.value = false;
  }
};

/** Verify form state. */
const verifyForm = (): boolean => {
  // Note we do not check if config entry with same name/value already exists - error from backend is clear enough.
  if (formEntry.name === '') {
    AppMessager.failureT(
      'admin.user.config.table.msg.save.badName.title',
      'admin.user.config.table.msg.save.badName.content',
    );
    return false;
  }
  if (formEntry.value === '') {
    AppMessager.failureT(
      'admin.user.config.table.msg.save.badValue.title',
      'admin.user.config.table.msg.save.badValue.content',
    );
    return false;
  }
  return true;
};

/**
 * Cancel editing given entry.
 * @param entry Table entry.
 */
const cancelEntry = async (entry: UserConfigTableEntry | null) => {
  addNewEntry.value = false;
  await tabRef.value?.selectEntry(entry, true); // since same entry is already selected, this will deselect
};

/**
 * Edit given entry.
 * @param entry Table entry.
 */
const editEntry = async (entry: UserConfigTableEntry | null) => {
  if (entry === null) return;
  formEntry.name = entry.name;
  formEntry.value = entry.value;
  await tabRef.value?.selectEntry(entry, true);
};

/**
 * Delete given entry.
 * @param entry Table entry.
 */
const deleteEntry = async (entry: UserConfigTableEntry | null) => {
  if (entry === null) return;
  isBusyOptions.value = true;

  try {
    await backendApiAdminUser.deleteConfigEntry(entry.id);
    await tabRef.value?.handleReload();
    AppMessager.successT(
      'admin.user.config.table.msg.delete.success.title',
      'admin.user.config.table.msg.delete.success.content',
    );
    AppUserEventer.notifyUserUpdatedConfig();
  } catch (error) {
    AppMessager.errorT(
      error,
      'admin.user.config.table.msg.delete.fail.title',
      'admin.user.config.table.msg.delete.fail.content',
    );
    apiLogging.logError(error, 'Failed to delete user config entry!');
  } finally {
    isBusyOptions.value = false;
  }
};

/** Actions for EntryOptions. */
const actions: Record<string, (entry: UserConfigTableEntry | null) => Promise<void>> = {
  add: addEntry,
  save: saveEntry,
  cancel: cancelEntry,
  edit: editEntry,
  delete: deleteEntry,
};

//

/**
 * Check if current entry is considered busy, therefore its options should be disabled.
 * @param paginer If true, we ask about paginer options.
 * @param entry Entry.
 */
const isBusyForEntry = (paginer: boolean, entry: UserConfigTableEntry | null): boolean => {
  if (!selUserRecord.value) return true; // no user is selected
  if (isBusyOptions.value) return true; // explicitly busy for whatever reason
  if (paginer && addNewEntry.value) return true;

  if (addNewEntry.value && entry !== null) return true;
  if (selEntryRecord.value !== null && entry?.id !== selEntryRecord.value?.id) return true;
  return false;
};

//

/**
 * Determine available general options.
 * @returns Entry meta.
 */
const metaGeneral = (): EntryMeta | null => {
  if (!selUserRecord.value) return null; // hide options completely if no user is selected

  const options: Record<string, EntryOption> = {
    add: resolveAdd(),
  };
  return {
    options: options,
    data: null,
  };
};

/**
 * Determine state of Add option.
 * @returns State of Add option.
 */
const resolveAdd = (): EntryOption => {
  if (selUserRecord.value?.email === AppLoginer.getEmail())
    return {
      access: 'DISABLED',
      reason: 'notYourself',
    };
  if (!AppLoginer.hasPermissionsAny(['role_admin', 'user_edit']))
    return {
      access: 'DISABLED',
      reason: 'adminOnly',
    };
  return {
    access: 'ENABLED',
    reason: null,
  };
};

//

/**
 * Determine available options for given entry.
 * @param entry Entry.
 */
const metaForEntry = (entry: UserConfigTableEntry | null): EntryMeta | null => {
  if (entry === null || (selEntryRecord.value !== null && entry.id === selEntryRecord.value?.id)) {
    // We have new entry to add OR entry selected. We need custom metadata for editing entry.
    const options: Record<string, EntryOption> = {
      save: {
        access: 'ENABLED',
        reason: null,
      },
      cancel: {
        access: 'ENABLED',
        reason: null,
      },
    };
    return {
      options: options,
      data: null,
    };
  }
  return entry.meta;
};

//

/**
 * Provide row metadata for given entry. Mark inputs that are empty as invalid.
 * @param entry Entry or null if new entry.
 * @param rowIndex Row index.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const resolveRowMeta = (entry: UserConfigTableEntry | null): RowMeta | null => {
  return {
    name: {
      css: formEntry.name === '' ? 'err' : '',
    },
    value: {
      css: formEntry.value === '' ? 'err' : '',
    },
  };
};
</script>

<template>
  <AdminUserTab
    ref="tabRef"
    v-model="selUserRecord"
    v-model:entry="selEntryRecord"
    v-model:formFilter="formFilter"
    v-model:formEntry="formEntry"
    :isActive="props.isActive"
    :reloadTrigger="reloadTrigger"
    tableId="userConfig"
    :columns="userConfigTableColumns"
    :fetchData="backendApiAdminUser.loadConfigPage"
    :convertToReq="convertFilterToReq"
    :processEntry="processEntry"
    :resolveRowMeta="resolveRowMeta"
    :inlineEdit="true"
    :addNewEntry="addNewEntry"
    emptyText="admin.user.config.table.empty"
    emptyNoUserText="admin.user.config.table.emptyNoUser"
  >
    <!-- Filter panel. -->
    <template #filter="{ isBusy, isDisabled, handleReload }">
      <AdminUserConfigFilter v-model="formFilter" :isBusy="isBusy" :disabled="isDisabled" @reload="handleReload" />
    </template>
    <!-- Paginer options for whole table. -->
    <template #paginer_options>
      <EntryOptions
        tableId="userConfig"
        :rowIndex="-2"
        :meta="metaGeneral()"
        :entry="null"
        :actions="actions"
        :isBusy="isBusyForEntry(true, null)"
        langPrefix="admin.user.config.table.texts"
      />
    </template>
    <!-- Custom slots: options. -->
    <template #column_options="{ entry, rowIndex }">
      <EntryOptions
        tableId="userConfig"
        :rowIndex="rowIndex"
        :meta="metaForEntry(entry)"
        :entry="entry"
        :actions="actions"
        :isBusy="isBusyForEntry(false, entry)"
        langPrefix="admin.user.config.table.texts"
      />
    </template>
  </AdminUserTab>
</template>

<style scoped></style>
