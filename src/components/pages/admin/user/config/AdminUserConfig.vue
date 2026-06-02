<script setup lang="ts">
/**
 * View/edit of user's configuration.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { reactive, ref, watch, computed } from 'vue';
import type { Ref } from 'vue';

import backendApi from '@/services/api-common.ts';
import backendApiAdminUser from '@/services/features/api-admin-users.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import { TimeUtils } from '@/code/utils/TimeUtils';

import type { UserTableEntry } from '@/code/data/features/user/admin-user.ts';

import type { UserConfigTableFilterForm, UserConfigTableReq, UserConfigTableResp, UserConfigTableEntry } from '@/code/data/features/user/admin-user.ts';
import { userConfigTableColumns, emptyUserConfigTable } from '@/code/data/features/user/user-const.ts';

import AdminUserConfigFilter from '@/components/pages/admin/user/config/AdminUserConfigFilter.vue';

import TableWrapper from '@/components/common/table/TableWrapper.vue';
import TablePage from '@/components/common/table/TablePage.vue';

/** User config table filtering form data. */
const form: UserConfigTableFilterForm = reactive({
  userId: -1,
  who: null,
  what: null,
  createdFromAt: null,
  createdToAt: null,
  tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
});

/** Loaded page of user config. */
const data: Ref<UserConfigTableResp> = ref(emptyUserConfigTable);
/** Selected user record. */
const selUserRecord = defineModel<UserTableEntry|null>();
/** Selected user config record. */
const selConfigRecord: Ref<UserConfigTableEntry | null> = ref(null);
/** Current page. */
const currPage: Ref<number> = ref(0);
/** Current sort column. Null means default sorting. */
const currSortBy: Ref<string | null> = ref(null);
/** Current sort order. Null means default sort order. */
const currSortOrder: Ref<string | null> = ref(null);

/** True if submission is in progress, otherwise false. Used to disable submit button. */
const isSubmitting: Ref<boolean> = ref(false);
/** True if data load is in progress, otherwise false. */
const isLoading: Ref<boolean> = ref(false);
/** Can spinner spin? */
const canSpin: Ref<boolean> = ref(true);

const isDisabled = computed(() => { return selUserRecord.value === null; });

/** Handle reload of user config table with filtering. */
const handleReload = async () => {
  data.value = emptyUserConfigTable;
  if (!selUserRecord.value) {  // nothing to do
    isLoading.value = false;
    isSubmitting.value = false;
    return;
  }
  isLoading.value = true;
  isSubmitting.value = true;
  canSpin.value = true;

  try {
    const req = convertToReq(form);
    const result = await backendApiAdminUser.loadConfigPage(req); // API CALL
    processData(result.data);
    data.value = result.data;

    currSortBy.value = data.value.tableMeta.sortBy;
    currSortOrder.value = data.value.tableMeta.sortOrder;
    isLoading.value = false;
  } catch (error) {
    canSpin.value = false;
    AppMessager.errorT(error, 'admin.user.msg.errorLoadTable.title', 'admin.user.msg.errorLoadTable.content');
    backendApi.logError(error, 'User config table reload failed!');
  } finally {
    isSubmitting.value = false;
  }
};

/**
 * Convert form data to request data.
 * @param form Form data.
 * @returns Request data.
 */
const convertToReq = (form: UserConfigTableFilterForm): UserConfigTableReq => {
  const createdFromStr = TimeUtils.cnvDate(form.createdFromAt);
  const createdToStr = TimeUtils.cnvDate(form.createdToAt);

  return {
    ...form,
    userId: selUserRecord.value?.id || -1,
    createdFromAt: createdFromStr === null ? null : createdFromStr + 'T00:00:00',
    createdToAt: createdToStr === null ? null : createdToStr + 'T23:59:59.999999',
  };
};

/**
 * Process data.
 * @param data Data to process.
 */
const processData = (data: UserConfigTableResp) => {
  data.entries.forEach((entry) => {
    processEntry(entry);
  });
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

/** Find out correct text to show when table has no results. */
const resolveEmptyText = () => {
  if (!selUserRecord.value) return 'admin.user.config.table.emptyNoUser';
  return 'admin.user.config.table.empty';
}

// WATCHES

watch(currPage, (newVal, oldVal) => {
  if (oldVal === null) return;

  if (!form.tableMeta) form.tableMeta = { pageSize: null, page: currPage.value, sortBy: null, sortOrder: null };
  else form.tableMeta.page = currPage.value;
  handleReload();
});
watch(currSortBy, (newVal, oldVal) => {
  if (oldVal === null) return;

  if (!form.tableMeta)
    form.tableMeta = { pageSize: null, page: null, sortBy: currSortBy.value, sortOrder: currSortOrder.value };
  else {
    form.tableMeta.sortBy = currSortBy.value;
    form.tableMeta.sortOrder = currSortOrder.value;
  }
  handleReload();
});
watch(currSortOrder, (newVal, oldVal) => {
  if (oldVal === null) return;

  if (!form.tableMeta)
    form.tableMeta = { pageSize: null, page: null, sortBy: currSortBy.value, sortOrder: currSortOrder.value };
  else {
    form.tableMeta.sortBy = currSortBy.value;
    form.tableMeta.sortOrder = currSortOrder.value;
  }
  handleReload();
});
/** Change in selection requires reload of form. */
watch(selUserRecord, () => {
  handleReload();
}, { immediate: true });
</script>

<template>
  <TableWrapper layout="bottom">
    <template #filterPanel>
      <AdminUserConfigFilter v-model="form" :isSubmitting="isSubmitting" :disabled="isDisabled" @reload="handleReload"/>
    </template>
    <template #tablePanel>
      <TablePage v-model="selConfigRecord" v-model:currPage="currPage" v-model:currSortBy="currSortBy" v-model:currSortOrder="currSortOrder"
        :columns="userConfigTableColumns" :data="data.entries" :meta="data.tableMeta"
        :isLoading="isLoading" :canSpin="canSpin" :canSelect="false"
        :empty="resolveEmptyText()"/>
    </template>
    <template #entryEditor>
    </template>
  </TableWrapper>
</template>

<style scoped></style>
