<script setup lang="ts">
/** User management page. Shows table with users and allows editing selected user. */
import { onMounted, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useLogger } from 'vue-logger-plugin';

import backendApi from '@/services/api-common.ts';
import backendApiAdminUser from '@/services/features/api-admin-users.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager.ts';

import type { UserTableReq, UserTableResp, UserTableEntry } from '@/code/data/features/user/admin-user.ts';
import { userTableColumns, emptyUserTable } from '@/code/data/features/user/user-const.ts';

import AdminUserFilter from '@/components/pages/admin/user/AdminUserFilter.vue';
import AdminUserEditor from '@/components/pages/admin/user/AdminUserEditor.vue';

import TableWrapper from '@/components/common/table/TableWrapper.vue';
import TablePage from '@/components/common/table/TablePage.vue';

const log = useLogger();

/** User table filtering form data. */
const form: UserTableReq = reactive({
  username: null,
  email: null,
  status: null,
  locked: null,
  createdFromAt: null,
  createdToAt: null,
  tableMeta: { pageSize:null, page:null, sortBy:null, sortOrder:null },
});

/** Loaded page of users. */
const data: Ref<UserTableResp> = ref(emptyUserTable);
/** Selected record of table. */
const selRecord: Ref<UserTableEntry|null> = ref(null);
/** Current page. */
const currPage: Ref<number> = ref(0);
/** Current sort column. Null means default sorting. */
const currSortBy: Ref<string|null> = ref(null);
/** Current sort order. Null means default sort order. */
const currSortOrder: Ref<string|null> = ref(null);

/** True if data load is in progress, otherwise false. */
const isLoading: Ref<boolean> = ref(false);
/** Can spinner spin? */
const canSpin: Ref<boolean> = ref(true);

watch(currPage, (newVal, oldVal) => {
  log.debug(`Field currPage changed! newVal: '${newVal}', oldVal: '${oldVal}'`);
  if (oldVal === null) return;

  if (!form.tableMeta) form.tableMeta = { pageSize: null, page: currPage.value, sortBy: null, sortOrder: null };
  else form.tableMeta.page = currPage.value;
  handleReload();
});
watch(currSortBy, (newVal, oldVal) => {
  log.debug(`Field currSortBy changed! newVal: '${newVal}', oldVal: '${oldVal}'`);
  if (oldVal === null) return;

  if (!form.tableMeta) form.tableMeta = { pageSize: null, page: null, sortBy: currSortBy.value, sortOrder: currSortOrder.value };
  else {
    form.tableMeta.sortBy = currSortBy.value;
    form.tableMeta.sortOrder = currSortOrder.value;
  }
  handleReload();
});
watch(currSortOrder, (newVal, oldVal) => {
  log.debug(`Field currSortOrder changed! newVal: '${newVal}', oldVal: '${oldVal}'`);
  if (oldVal === null) return;

  if (!form.tableMeta) form.tableMeta = { pageSize: null, page: null, sortBy: currSortBy.value, sortOrder: currSortOrder.value };
  else {
    form.tableMeta.sortBy = currSortBy.value;
    form.tableMeta.sortOrder = currSortOrder.value;
  }
  handleReload();
});

/** Handle reload of user table with filtering. */
const handleReload = async () => {
  log.debug('Triggered handleReload().');
  isLoading.value = true;
  canSpin.value = true;
  data.value = emptyUserTable;

  try {
    const result = await backendApiAdminUser.loadPage(form); // API CALL
    processData(result.data);
    data.value = result.data;

    currSortBy.value = data.value.tableMeta.sortBy;
    currSortOrder.value = data.value.tableMeta.sortOrder;
  } catch (error) {
    canSpin.value = false;
    AppMessager.errorT(error, 'admin.user.msg.loadError.title', 'admin.user.msg.loadError.content');
    backendApi.logError(error, 'User table reload failed!');
  } finally {
    isLoading.value = false;
  }
};

/**
 * Process data.
 * @param data Data to process.
 */
const processData = (data: UserTableResp) => {
  data.entries.forEach((entry) => {
    processEntry(entry);
  });
}

/**
 * Process single entry.
 * @param entry Table entry.
 */
const processEntry = (entry: UserTableEntry) => {
  if (entry.createdAt) {
    entry.createdAt = entry.createdAt.replace('T', ' ').split('.')[0] || entry.createdAt;
  }
}

//

onMounted(async () => { // automatically call once user enters page
  await handleReload();
});
</script>

<template>
  <TableWrapper>
    <template #filterPanel>
      <AdminUserFilter v-model="form" :isLoading="isLoading" @reload="handleReload"/>
    </template>
    <template #tablePanel>
      <div>
        <TablePage v-model="selRecord" v-model:currPage="currPage" v-model:currSortBy="currSortBy" v-model:currSortOrder="currSortOrder"
          :columns="userTableColumns" :data="data.entries" :meta="data.tableMeta" :isLoading="isLoading"
          empty="admin.user.table.empty"/>
      </div>
    </template>
    <template #entryEditor>
      <AdminUserEditor v-model="selRecord" />
    </template>
  </TableWrapper>
</template>

<style scoped></style>
