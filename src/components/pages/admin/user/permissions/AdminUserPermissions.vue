<script setup lang="ts">
/**
 * View/edit of user's permissions. Only admin can edit permissions.
 *
 * Models:
 * - v-model - Holds selected user.
 */
import { ref, reactive, shallowRef, watch } from 'vue';
import type { Ref } from 'vue';
import { storeToRefs } from 'pinia';

import backendApi from '@/services/api-common.ts';
import backendApiAdminUser from '@/services/features/api-admin-users.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import { TimeUtils } from '@/code/utils/TimeUtils';

import { useUserEventStore } from '@/stores/events/user-events.ts';
import type { EntryMeta, EntryOption, RowMeta } from '@/code/data/features/common/type.ts';
import type {
  UserTableEntry,
  UserPermissionTableFilterForm,
  UserPermissionTableReq,
  UserPermissionTableEntry,
  UserPermissionEntryEditForm,
  UserPermissionEntryEditReq,
  AdminUserTabExpose,
} from '@/code/data/features/user/admin-user-type.ts';
import { userPermissionsTableColumns, enUserPermissionName } from '@/code/data/features/user/user-const.ts';

import ComboBox from '@/components/base/inputs/ComboBox.vue';
import EntryOptions from '@/components/common/table/EntryOptions.vue';
import AdminUserTab from '@/components/pages/admin/user/common/AdminUserTab.vue';
import AdminUserPermissionsFilter from '@/components/pages/admin/user/permissions/AdminUserPermissionsFilter.vue';

const userEventStore = useUserEventStore();
const { userSelectedTrigger } = storeToRefs(userEventStore);

const selUserRecord = defineModel<UserTableEntry | null>();
/** Selected entry record. Use shallowRef to avoid deep reactivity issues with generic types in templates. */
const selEntryRecord = shallowRef<UserPermissionTableEntry | null>(null);

const formFilter: UserPermissionTableFilterForm = reactive({
  userId: -1,
  createdFromAt: null,
  createdToAt: null,
  tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
});

const formEntry: UserPermissionEntryEditForm = reactive({
  name: '',
  value: ''
});

/** Reference to tab component. */
const tabRef = ref<AdminUserTabExpose | null>(null);
/** True if adding new entry. */
const addNewEntry: Ref<boolean> = ref(false);
/** True if busy executing options. */
const isBusyOptions: Ref<boolean> = ref(false);

//

/**
 * Convert filter form data to request data.
 * @param form Form data.
 * @param userId User ID.
 * @returns Request data.
 */
const convertFilterToReq = (form: UserPermissionTableFilterForm, userId: number): UserPermissionTableReq => {
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
const convertEditToReq = (form: UserPermissionEntryEditForm, id: number|null, userId: number): UserPermissionEntryEditReq => {
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
const processEntry = (entry: UserPermissionTableEntry) => {
  entry.createdAt = TimeUtils.zoned(entry.createdAt);
};

//

/**
 * Add new entry.
 * @param entry Table entry.
 */
const addEntry = async () => {
  if (addNewEntry.value) return; // already in add entry mode
  formEntry.name = ''; // Force user to pick name from combobox list.
  formEntry.value = '';
  await tabRef.value?.selectEntry(null, true); // deselect in case something is selected
  addNewEntry.value = true;
}

/**
 * Save given entry.
 * @param entry Table entry.
 */
const saveEntry = async (entry: UserPermissionTableEntry|null) => {
  if (!verifyForm()) return;
  isBusyOptions.value = true;

  try {
    const req = convertEditToReq(formEntry, entry?.id || null, selUserRecord.value?.id || -1);
    await backendApiAdminUser.editPermissionEntry(req);
    await tabRef.value?.selectEntry(entry, true); // since same entry is already selected, this will deselect
    await tabRef.value?.handleReload();
    addNewEntry.value = false;
    AppMessager.successT('admin.user.permissions.table.msg.save.success.title', 'admin.user.permissions.table.msg.save.success.content');
  } catch (error) {
    AppMessager.errorT(error, 'admin.user.permissions.table.msg.save.fail.title', 'admin.user.permissions.table.msg.save.fail.content');
    backendApi.logError(error, 'Failed to save user permission entry!');
  } finally {
    isBusyOptions.value = false;
  }
}

/** Verify form state. */
const verifyForm = (): boolean => {
  // Note we do not check if permission entry with same name/value already exists - error from backend is clear enough.
  if (!formEntry.name) {
    AppMessager.failureT('admin.user.permissions.table.msg.save.badName.title', 'admin.user.permissions.table.msg.save.badName.content');
    return false;
  }
  if (!formEntry.value) {
    AppMessager.failureT('admin.user.permissions.table.msg.save.badValue.title', 'admin.user.permissions.table.msg.save.badValue.content');
    return false;
  }
  return true;
};

/**
 * Cancel editing given entry.
 * @param entry Table entry.
 */
const cancelEntry = async (entry: UserPermissionTableEntry|null) => {
  addNewEntry.value = false;
  await tabRef.value?.selectEntry(entry, true); // since same entry is already selected, this will deselect
}

/**
 * Edit given entry.
 * @param entry Table entry.
 */
const editEntry = async (entry: UserPermissionTableEntry|null) => {
  if (entry === null) return;
  formEntry.name = entry.name;
  formEntry.value = entry.value;
  await tabRef.value?.selectEntry(entry, true);
}

/**
 * Delete given entry.
 * @param entry Table entry.
 */
const deleteEntry = async (entry: UserPermissionTableEntry|null) => {
  if (entry === null) return;
  isBusyOptions.value = true;

  try {
    await backendApiAdminUser.deletePermissionEntry(entry.id);
    await tabRef.value?.handleReload();
    AppMessager.successT('admin.user.permissions.table.msg.delete.success.title', 'admin.user.permissions.table.msg.delete.success.content');
  } catch (error) {
    AppMessager.errorT(error, 'admin.user.permissions.table.msg.delete.fail.title', 'admin.user.permissions.table.msg.delete.fail.content');
    backendApi.logError(error, 'Failed to delete user permission entry!');
  } finally {
    isBusyOptions.value = false;
  }
}

/** Actions for EntryOptions. */
const actions: Record<string, (entry: UserPermissionTableEntry|null) => Promise<void>> = reactive({
  add: addEntry,
  save: saveEntry,
  cancel: cancelEntry,
  edit: editEntry,
  delete: deleteEntry,
});

//

/**
 * Check if current entry is considered busy, therefore its options should be disabled.
 * @param paginer If true, we ask about paginer options.
 * @param entry Entry.
 */
const isBusyForEntry = (paginer: boolean, entry: UserPermissionTableEntry|null): boolean => {
  if (isBusyOptions.value) return true;
  if (paginer && addNewEntry.value) return true;

  if (addNewEntry.value && entry !== null) return true;
  if (selEntryRecord.value !== null && entry?.id !== selEntryRecord.value?.id) return true;
  return false;
}

/** Determine available general options. */
const metaGeneral = (): EntryMeta|null => {
  const options: Record<string, EntryOption> = {
    add: {
      access: 'ENABLED',
      reason: null
    }
  }
  return {
    options: options,
    data: null
  };
}

/**
 * Determine available options for given entry.
 * @param entry Entry.
 */
const metaForEntry = (entry: UserPermissionTableEntry|null): EntryMeta|null => {
  if (entry === null || selEntryRecord.value !== null && entry.id === selEntryRecord.value?.id) {
    // We have new entry to add OR entry selected. We need custom metadata for editing entry.
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

//

/** React on user being (de)selected. */
watch(userSelectedTrigger, async () => {
  // Deselect anything in subtable.
  await tabRef.value?.selectEntry(null, true);
});

//

/**
 * Provide row metadata for given entry.
 * @param entry Entry or null if new entry.
 * @param rowIndex Row index.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const resolveRowMeta = (entry: UserPermissionTableEntry|null): RowMeta|null => {
  return {
    'name': {
      css: (formEntry.name === '' ? 'err' : ''),
    },
    'value': {
      css: (formEntry.value === '' ? 'err' : ''),
    }
  }
}
</script>

<template>
  <AdminUserTab
    ref="tabRef"
    v-model="selUserRecord"
    v-model:entry="selEntryRecord"
    v-model:formFilter="formFilter"
    v-model:formEntry="formEntry"
    tableId="userPermissions"
    :columns="userPermissionsTableColumns"
    :fetchData="backendApiAdminUser.loadPermissionsPage"
    :convertToReq="convertFilterToReq"
    :processEntry="processEntry"
    :resolveRowMeta="resolveRowMeta"
    :inlineEdit="true"
    :addNewEntry="addNewEntry"
    emptyText="admin.user.permissions.table.empty"
    emptyNoUserText="admin.user.permissions.table.emptyNoUser"
  >
    <!-- Filter panel. -->
    <template #filter="{ isBusy, isDisabled, handleReload }">
      <AdminUserPermissionsFilter v-model="formFilter" :isBusy="isBusy" :disabled="isDisabled" @reload="handleReload" />
    </template>
    <!-- Paginer options. -->
    <template #paginer_options>
      <EntryOptions :meta="metaGeneral()" :entry="null" :actions="actions" :isBusy="isBusyForEntry(true, null)"
        langPrefix="admin.user.permissions.table.texts" />
    </template>
    <!-- Custom slots: name and options. -->
    <template #column_options="{ entry }">
      <EntryOptions :meta="metaForEntry(entry)" :entry="entry" :actions="actions" :isBusy="isBusyForEntry(false, entry)"
        langPrefix="admin.user.permissions.table.texts" />
    </template>
    <template #column_name="{ entry, isEditMode, formEntry, fieldMeta }">
      <template v-if="isEditMode && formEntry">
        <ComboBox data-testid="permission-name"
          :class="fieldMeta?.css"
          v-model="formEntry.name"
          :options="enUserPermissionName"
          langPrefix=""
          placeholder="tech.user.permissionName.null"
        />
      </template>
      <template v-else>
        {{ entry?.name }}
      </template>
    </template>
  </AdminUserTab>
</template>

<style scoped></style>
