<script setup lang="ts">
/** User management page. Shows table with users and allows editing selected user. */
import { onMounted, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useUserEventStore } from '@/stores/events/user-events.ts';
import backendApi from '@/services/api-common.ts';
import backendApiAdminUser from '@/services/features/api-admin-users.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import { TimeUtils } from '@/code/utils/TimeUtils';

import type {
  UserTableFilterForm,
  UserTableReq,
  UserTableResp,
  UserTableEntry,
} from '@/code/data/features/user/admin-user-type.ts';
import { userTableColumns, emptyUserTable } from '@/code/data/features/user/user-const.ts';

import AdminUserFilter from '@/components/pages/admin/user/main/AdminUserFilter.vue';
import AdminUserEditor from '@/components/pages/admin/user/main/AdminUserEditor.vue';

import TableWrapper from '@/components/common/table/TableWrapper.vue';
import TablePage from '@/components/common/table/TablePage.vue';

const userEventStore = useUserEventStore();
const { userUpdatedTrigger, diffUserData } = storeToRefs(userEventStore);

/** User table filtering form data. */
const form: UserTableFilterForm = reactive({
  username: null,
  email: null,
  status: null,
  locked: null,
  createdFromAt: null,
  createdToAt: null,
  tableMeta: { pageSize: null, page: null, sortBy: null, sortOrder: null },
});

/** Loaded page of users. */
const data: Ref<UserTableResp> = ref(emptyUserTable);
/** Selected user record. */
const selUserRecord: Ref<UserTableEntry | null> = ref(null);
/** Current page. */
const currPage: Ref<number> = ref(0);
/** Current sort column. Null means default sorting. */
const currSortBy: Ref<string | null> = ref(null);
/** Current sort order. Null means default sort order. */
const currSortOrder: Ref<string | null> = ref(null);

/** True if submission is in progress, otherwise false. Used to disable submit button. */
const isBusy: Ref<boolean> = ref(false);
/** True if data load is in progress, otherwise false. */
const isLoading: Ref<boolean> = ref(false);
/** Can spinner spin? */
const canSpin: Ref<boolean> = ref(true);

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

//

/** Handle reload of user table with filtering. */
const handleReload = async () => {
  isLoading.value = true;
  isBusy.value = true;
  canSpin.value = true;
  data.value = emptyUserTable;

  try {
    const req = convertToReq(form);
    const result = await backendApiAdminUser.loadPage(req); // API CALL
    processData(result.data);
    data.value = result.data;

    currSortBy.value = data.value.tableMeta.sortBy;
    currSortOrder.value = data.value.tableMeta.sortOrder;
    isLoading.value = false;
  } catch (error) {
    canSpin.value = false;
    AppMessager.errorT(error, 'admin.user.msg.errorLoadTable.title', 'admin.user.msg.errorLoadTable.content');
    backendApi.logError(error, 'User table reload failed!');
  } finally {
    isBusy.value = false;
  }
};

/**
 * Convert form data to request data.
 * @param form Form data.
 * @returns Request data.
 */
const convertToReq = (form: UserTableFilterForm): UserTableReq => {
  const createdFromStr = TimeUtils.cnvDate(form.createdFromAt);
  const createdToStr = TimeUtils.cnvDate(form.createdToAt);

  return {
    ...form,
    createdFromAt: createdFromStr === null ? null : createdFromStr + 'T00:00:00',
    createdToAt: createdToStr === null ? null : createdToStr + 'T23:59:59.999999',
  };
};

/**
 * Process data.
 * @param data Data to process.
 */
const processData = (data: UserTableResp) => {
  data.entries.forEach((entry) => {
    processEntry(entry);
  });
};

/**
 * Process single entry.
 * @param entry Table entry.
 */
const processEntry = (entry: UserTableEntry) => {
  entry.createdAt = TimeUtils.zoned(entry.createdAt);
};

//

/** React on user data being updated. */
watch(userUpdatedTrigger, async () => {
  if (diffUserData.value.username !== null || diffUserData.value.email !== null) await handleReload();
});

/** Automatically call once user enters page. */
onMounted(async () => {
  await handleReload();
});
</script>

<template>
  <TableWrapper>
    <template #filterPanel>
      <AdminUserFilter v-model="form" :isBusy="isBusy" @reload="handleReload" />
    </template>
    <template #tablePanel>
      <TablePage
        v-model="selUserRecord"
        v-model:currPage="currPage"
        v-model:currSortBy="currSortBy"
        v-model:currSortOrder="currSortOrder"
        :columns="userTableColumns"
        :data="data.entries"
        :meta="data.tableMeta"
        :isLoading="isLoading"
        :canSpin="canSpin"
        empty="admin.user.table.empty"
      />
    </template>
    <template #entryEditor>
      <AdminUserEditor v-model="selUserRecord" />
    </template>
  </TableWrapper>
</template>

<style scoped></style>
