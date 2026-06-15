<script setup lang="ts" generic="F extends { tableMeta: TableMetaReq | null }, E extends Record<string, any>, R">
/**
 * Generic component for admin user tabs (History, Config, etc.).
 * Handles data fetching, pagination, sorting, and user selection changes.
 *
 * Generics:
 * - F: Type of filter form.
 * - E: Type of table entry.
 * - R: Type of API request used in fetchData.
 *
 * Models:
 * - v-model - Selected user record.
 * - v-model:form - Filter form state.
 *
 * Props:
 * - columns - Data about columns.
 * - fetchData - Function that fetches data from backend to table.
 * - convertToReq - Function that converts filter form to API request.
 * - processEntry - Function that processes given entry for showing in table. Optional.
 * - emptyText - Text to show when table is empty.
 * - emptyNoUserText - Text to show when table is empty because no user was selected.
 */
import { ref, watch, computed } from 'vue';
import type { Ref } from 'vue';

import backendApi from '@/services/api-common.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';

import type { UserTableEntry } from '@/code/data/features/user/admin-user-type.ts';
import type { ColumnData, TableMetaReq, TableMetaResp, TablePageExpose } from '@/code/data/features/common/type.ts';
import { EnColumnKind } from '@/code/data/features/common/const.ts';

import TableWrapper from '@/components/common/table/TableWrapper.vue';
import TablePage from '@/components/common/table/TablePage.vue';

/** Selected user record. */
const selUserRecord = defineModel<UserTableEntry | null>();
/** Selected entry record. */
const selEntryRecord = defineModel<E | null>('entry', { required: true });
/** Form data. */
const form = defineModel<F>('form', { required: true });

const props = defineProps<{
  columns: ColumnData[];
  fetchData: (req: R) => Promise<{ data: { entries: E[]; tableMeta: TableMetaResp } }>;
  convertToReq: (form: F, userId: number) => R;
  processEntry?: (entry: E) => void;
  emptyText: string;
  emptyNoUserText: string;
}>();

/** Loaded page of data. */
const data: Ref<{ entries: E[]; tableMeta: TableMetaResp }> = ref({
  entries: [],
  tableMeta: { pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: '', sortOrder: '' },
});

/** Current page. */
const currPage: Ref<number> = ref(0);
/** Current sort column. Null means default sorting. */
const currSortBy: Ref<string | null> = ref(null);
/** Current sort order. Null means default sort order. */
const currSortOrder: Ref<string | null> = ref(null);

/** Reference to tab component. */
const tablePageRef = ref<TablePageExpose | null>(null);
/** True if submission is in progress, otherwise false. Used to disable submit button. */
const isBusy: Ref<boolean> = ref(false);
/** True if data load is in progress, otherwise false. */
const isLoading: Ref<boolean> = ref(false);
/** Can spinner spin? */
const canSpin: Ref<boolean> = ref(true);

const isDisabled = computed(() => selUserRecord.value === null);

//

/** Handle reload of table with filtering. */
const handleReload = async () => {
  data.value.entries = [];
  if (!selUserRecord.value) {
    isLoading.value = false;
    isBusy.value = false;
    return;
  }
  isLoading.value = true;
  isBusy.value = true;
  canSpin.value = true;

  try {
    const req = props.convertToReq(form.value, selUserRecord.value.id);
    const result = await props.fetchData(req);
    const resp = result.data;

    if (props.processEntry) {
      resp.entries.forEach((entry: E) => props.processEntry!(entry));
    }
    data.value = resp;

    currSortBy.value = data.value.tableMeta.sortBy;
    currSortOrder.value = data.value.tableMeta.sortOrder;
    isLoading.value = false;
  } catch (error) {
    canSpin.value = false;
    AppMessager.errorT(error, 'admin.user.msg.errorLoadTable.title', 'admin.user.msg.errorLoadTable.content');
    backendApi.logError(error, 'User tab table reload failed!');
  } finally {
    isBusy.value = false;
  }
};

/** Finds out correct text to use when table is empty. */
const resolveEmptyText = () => {
  if (!selUserRecord.value) return props.emptyNoUserText;
  return props.emptyText;
};

// WATCHERS

/** Change in selection requires reload of form. */
watch(
  selUserRecord,
  () => {
    handleReload();
  },
  { immediate: true },
);

watch(currPage, (newVal, oldVal) => {
  if (oldVal === null) return;

  if (!form.value.tableMeta)
    form.value.tableMeta = { pageSize: null, page: currPage.value, sortBy: null, sortOrder: null };
  else form.value.tableMeta.page = currPage.value;
  handleReload();
});

watch(currSortBy, (newVal, oldVal) => {
  if (oldVal === null) return;

  if (!form.value.tableMeta)
    form.value.tableMeta = { pageSize: null, page: null, sortBy: currSortBy.value, sortOrder: currSortOrder.value };
  else {
    form.value.tableMeta.sortBy = currSortBy.value;
    form.value.tableMeta.sortOrder = currSortOrder.value;
  }
  handleReload();
});

watch(currSortOrder, (newVal, oldVal) => {
  if (oldVal === null) return;

  if (!form.value.tableMeta)
    form.value.tableMeta = { pageSize: null, page: null, sortBy: currSortBy.value, sortOrder: currSortOrder.value };
  else {
    form.value.tableMeta.sortBy = currSortBy.value;
    form.value.tableMeta.sortOrder = currSortOrder.value;
  }
  handleReload();
});

//

/**
 * Select entry. If this entry is already selected, it is deselected.
 * @param entry Entry to select.
 * @param force If true, ignore props.canSelect.
 */
const selectEntry = (entry: E, force: boolean) => {
  tablePageRef.value?.selectEntry(entry, force);
};

//

/** Allow calling handleReload from outside. */
defineExpose({
  handleReload,
  selectEntry,
});
</script>

<template>
  <TableWrapper layout="bottom">
    <template #filterPanel>
      <slot name="filter" :isBusy="isBusy" :isDisabled="isDisabled" :handleReload="handleReload" />
    </template>
    <template #tablePanel>
      <TablePage ref="tablePageRef"
        v-model="selEntryRecord"
        v-model:currPage="currPage"
        v-model:currSortBy="currSortBy"
        v-model:currSortOrder="currSortOrder"
        :columns="columns"
        :data="data.entries"
        :meta="data.tableMeta"
        :isLoading="isLoading"
        :canSpin="canSpin"
        :canSelect="false"
        :empty="resolveEmptyText()"
      >
        <!-- Slot forwarding: forward only columns with kind = Custom if they exist in $slots -->
        <template
          v-for="col in columns.filter((c) => c.kind === EnColumnKind.Custom && $slots['column_' + c.name])"
          :key="col.name"
          #[`column_${col.name}`]="slotData"
        >
          <slot :name="`column_${col.name}`" v-bind="slotData || {}" />
        </template>
      </TablePage>
    </template>
    <template #entryEditor> </template>
  </TableWrapper>
</template>

<style scoped></style>
