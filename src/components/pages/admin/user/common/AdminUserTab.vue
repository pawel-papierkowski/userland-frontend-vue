<script
  setup
  lang="ts"
  generic="
    F extends { tableMeta: TableMetaReq | null },
    E extends Record<string, any>,
    FE extends Record<string, any>,
    R
  "
>
/**
 * Generic component for admin user tabs (History, Config, etc.).
 * Handles data fetching, pagination, sorting, and user selection changes.
 *
 * Generics:
 * - F: Type of filter form.
 * - E: Type of table entry.
 * - FE: Form for entry itself.
 * - R: Type of API request used in fetchData.
 *
 * Models:
 * - v-model - Selected user record.
 * - v-model:entry - Selected entry.
 * - v-model:formFilter - Filter form state.
 * - v-model:formEntry - Form for entry. Used in in-line edit.
 *
 * Props:
 * - tableId - Identificator of table.
 * - columns - Data about columns.
 * - fetchData - Function that fetches data from backend to table.
 * - convertToReq - Function that converts filter form to API request.
 * - processEntry - Function that processes given entry for showing in table. Optional.
 * - inlineEdit - If true, selecting entry will cause it to be editable in-place. Optional.
 * - addNewEntry - If true, shows additional row where you add new entry. Only when inlineEdit === true. Optional.
 * - emptyText - Text to show when table is empty.
 * - emptyNoUserText - Text to show when table is empty because no user was selected.
 * - isActive - If true, this tab is the currently active tab in the tab group. Data is loaded lazily,
 *   only when this tab is active. Optional, default true.
 * - reloadTrigger - Number that is bumped when user data was updated. Causes data reload on next activation
 *   of this tab, even if it was already loaded for the selected user. Optional, default 0.
 */
import { useSlots, ref, watch, computed } from 'vue';
import type { Ref } from 'vue';

import apiLogging from '@/services/api-logging.ts';
import { AppMessager } from '@/code/wrappers/messages/AppMessager.ts';

import type { UserTableEntry } from '@/code/data/features/user/admin-user-type.ts';
import type {
  ColumnData,
  RowMeta,
  TableMetaReq,
  TableMetaResp,
  TablePageExpose,
} from '@/code/data/features/common/type.ts';

import TableWrapper from '@/components/common/table/TableWrapper.vue';
import TablePage from '@/components/common/table/TablePage.vue';

const slots = useSlots();
const selUserRecord = defineModel<UserTableEntry | null>();
const selEntryRecord = defineModel<E | null>('entry', { required: false });
const formFilter = defineModel<F>('formFilter', { required: true });
const formEntry = defineModel<FE | null>('formEntry', { required: false });

const props = withDefaults(
  defineProps<{
    tableId: string;
    columns: ColumnData[];
    fetchData: (req: R) => Promise<{ data: { entries: E[]; tableMeta: TableMetaResp } }>;
    convertToReq: (form: F, userId: number) => R;
    processEntry?: (entry: E) => E;
    resolveRowMeta?: (entry: E | null) => RowMeta | null;
    inlineEdit?: boolean;
    addNewEntry?: boolean;
    emptyText: string;
    emptyNoUserText: string;
    isActive?: boolean;
    reloadTrigger?: number;
  }>(),
  {
    inlineEdit: false,
    addNewEntry: false,
    isActive: true,
    reloadTrigger: 0,
  },
);

/** Loaded page of data. */
const data: Ref<{ entries: E[]; tableMeta: TableMetaResp }> = ref({
  entries: [],
  tableMeta: { pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: '', sortOrder: '' },
});

/** Current page. */
const currPage = ref(0);
/** Current sort column. Null means default sorting. */
const currSortBy: Ref<string | null> = ref(null);
/** Current sort order. Null means default sort order. */
const currSortOrder: Ref<string | null> = ref(null);

/** Reference to tab component. */
const tablePageRef = ref<TablePageExpose | null>(null);
/** True if submission is in progress, otherwise false. Used to disable submit button. */
const isBusy = ref(false);
/** True if data load is in progress, otherwise false. */
const isLoading = ref(false);
/** Can spinner spin? */
const canSpin = ref(true);

/** ID of user whose data is currently loaded. Null means no data loaded yet. */
const loadedUserId: Ref<number | null> = ref(null);
/** True if data must be reloaded on next activation, even if already loaded for the user. */
let forceReload = false;

// COMPUTATIONS

/** Get list of all columns that have slots. */
const slottedColumns = computed(() => {
  return props.columns.filter((c) => slots['column_' + c.name]);
});

const isDisabled = computed(() => selUserRecord.value === null);

//

/** Handle reload of table with filtering. */
const handleReload = async () => {
  data.value.entries = [];
  if (!selUserRecord.value) {
    // User is not selected, so show empty space instead of table rows. Note table UI (paginers, column headers etc) is still present.
    isLoading.value = false;
    isBusy.value = false;
    return;
  }
  isLoading.value = true;
  isBusy.value = true;
  canSpin.value = true;

  try {
    const req = props.convertToReq(formFilter.value, selUserRecord.value.id);
    const result = await props.fetchData(req);
    const resp = result.data;

    if (props.processEntry) {
      resp.entries = resp.entries.map((entry: E) => props.processEntry!(entry));
    }
    data.value = resp;
    loadedUserId.value = selUserRecord.value?.id ?? null;

    selEntryRecord.value = null; // always deselect subtable entry

    currSortBy.value = data.value.tableMeta.sortBy;
    currSortOrder.value = data.value.tableMeta.sortOrder;
    isLoading.value = false;
  } catch (error) {
    // Note in case of error spinner stays visible. There is no data to show in table (because error happened during load or processing)
    // and we want to show feedback for user that there was some issue. So we show spinner, but with spin stopped.
    canSpin.value = false;
    AppMessager.errorT(error, 'admin.user.msg.errorLoadTable.title', 'admin.user.msg.errorLoadTable.content');
    apiLogging.logError(error, 'User tab table reload failed!');
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

/**
 * Reload table only if this tab is active and the selected user's data was not loaded yet.
 * Deactivated tabs load nothing; they reload once when they become active (unless data is already loaded).
 */
const maybeReload = () => {
  if (!selUserRecord.value) {
    // User is not selected, so nothing to load. Reset so re-selection triggers a reload.
    loadedUserId.value = null;
    handleReload(); // Clear any previously shown data for the old user.
    return;
  }
  if (!props.isActive) return;
  // Do not reload data that is already loaded for this user, unless a reload was forced.
  if (!forceReload && loadedUserId.value === selUserRecord.value.id) return;
  forceReload = false;
  handleReload();
};

/** Change in user selection or tab activation requires reload of form (only when tab is active). */
watch([selUserRecord, () => props.isActive], maybeReload, { immediate: true });

/** React on user data being updated - force reload on next activation of this tab. */
watch(
  () => props.reloadTrigger,
  () => {
    forceReload = true;
  },
);

/** Update filter with current page number. */
watch(currPage, (_, oldVal) => {
  if (oldVal === null) return;

  if (!formFilter.value.tableMeta)
    formFilter.value.tableMeta = { pageSize: null, page: currPage.value, sortBy: null, sortOrder: null };
  else formFilter.value.tableMeta.page = currPage.value;
  handleReload();
});

/** Update filter with current sort by and sort order field. */
watch([currSortBy, currSortOrder], (_, [oldSortBy, oldSortOrder]) => {
  if (oldSortBy === null && oldSortOrder === null) return;

  if (!formFilter.value.tableMeta)
    formFilter.value.tableMeta = {
      pageSize: null,
      page: null,
      sortBy: currSortBy.value,
      sortOrder: currSortOrder.value,
    };
  else {
    formFilter.value.tableMeta.sortBy = currSortBy.value;
    formFilter.value.tableMeta.sortOrder = currSortOrder.value;
  }
  handleReload();
});

// FUNCTIONS

/**
 * Select entry. If this entry is already selected, it is deselected.
 * @param entry Entry to select or null if you want to deselect.
 * @param force If true, ignore props.canSelect.
 * @returns Promise.
 */
const selectEntry = (entry: E | null, force: boolean): Promise<void> => {
  if (!tablePageRef.value) return Promise.resolve();
  return tablePageRef.value.selectEntry(entry, force);
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
      <TablePage
        ref="tablePageRef"
        v-model="selEntryRecord"
        v-model:formEntry="formEntry"
        v-model:currPage="currPage"
        v-model:currSortBy="currSortBy"
        v-model:currSortOrder="currSortOrder"
        :tableId="tableId"
        :columns="columns"
        :data="data.entries"
        :meta="data.tableMeta"
        :resolveRowMeta="resolveRowMeta"
        :isLoading="isLoading"
        :canSpin="canSpin"
        :canSelect="false"
        :inlineEdit="inlineEdit"
        :addNewEntry="addNewEntry"
        :empty="resolveEmptyText()"
      >
        <!-- Forwarding paginer options slot, if it exists. -->
        <template v-if="$slots['paginer_options']" #[`paginer_options`]="slotData">
          <slot name="paginer_options" v-bind="slotData || {}" />
        </template>
        <!-- Slot forwarding: forward all slots that match columns. -->
        <template v-for="col in slottedColumns" :key="col.name" #[`column_${col.name}`]="slotData">
          <slot :name="`column_${col.name}`" v-bind="slotData || {}" />
        </template>
      </TablePage>
    </template>
    <template #entryEditor> </template>
  </TableWrapper>
</template>

<style scoped></style>
