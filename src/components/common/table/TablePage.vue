<script setup lang="ts" generic="E extends Record<string, any>, FE extends Record<string, any>">
/** Component that shows any table.
 *
 * Features:
 * - Selecting/deselecting record.
 * - Pagination.
 * - Sorting of any column (ASC or DESC).
 *
 * Generics:
 * - E: Type of table entry.
 * - FE: Form for entry.
 *
 * Models:
 * - v-model - Selected record. Null means nothing is selected.
 * - v-model:formEntry - Form for entry. Used in in-line edit.
 * - v-model:currPage - Currently selected page.
 * - v-model:currSortBy - Current sort column.
 * - v-model:currSortOrder - Current sort order.
 *
 * Properties:
 * - tableId - Identificator of table.
 * - columns - Data about columns. First column must be unique key.
 * - data - Content of table itself.
 * - meta - Table metadata.
 * - canSelect - If true, can select row in table. Optional, defaults to true. Note you still can select programmatically.
 * - inlineEdit - If true, selecting entry will cause it to be editable in-place. Optional.
 * - addNewEntry - If true, shows additional row where you add new entry. Only when inlineEdit === true. Optional.
 * - isLoading - If true, show spinner instead of table content.
 * - canSpin - If true, spinner can spin.
 * - empty - I18n key to show when table is empty. Optional.
 *
 * Slots:
 * - custom slots defined for colums, with name 'column_[column name]'.
 */
import { useSlots, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ColumnData, RowMeta, TableMetaResp } from '@/code/data/features/common/type.ts';

import TableRow from '@/components/common/table/TableRow.vue';
import TablePaginer from '@/components/common/table/TablePaginer.vue';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

const { t } = useI18n();

const slots = useSlots();
const selRecord = defineModel<E | null>({ required: false });
const formEntry = defineModel<FE | null>('formEntry', { required: false });
const currPage = defineModel<number>('currPage', { required: true });
const currSortBy = defineModel<string | null>('currSortBy', { required: true });
const currSortOrder = defineModel<string | null>('currSortOrder', { required: true });

const props = withDefaults(
  defineProps<{
    tableId: string;
    columns: ColumnData[];
    data: E[];
    meta: TableMetaResp;
    resolveRowMeta?: (entry: E|null) => RowMeta|null;
    canSelect?: boolean;
    inlineEdit?: boolean;
    addNewEntry?: boolean;
    isLoading: boolean;
    canSpin: boolean;
    empty?: string;
  }>(),
  {
    canSelect: true,
    inlineEdit: false,
    addNewEntry: false,
    empty: '',
  },
);

// COMPUTATIONS

/** Find out count of visible columns. */
const visibleColumnsCount = computed(() => {
  return props.columns.filter((c) => c.visible).length;
});

/** Get list of all columns that have slots. */
const slottedColumns = computed(() => {
  return props.columns.filter((c) => slots['column_' + c.name]);
});

// WATCHES

/** If you disable selection abiliy, automatically deselect. */
watch(
  () => props.canSelect, () => {
    if (!props.canSelect) selRecord.value = null;
  },
);

/** React to end of loading. */
watch(() => props.isLoading, (newVal) => {
  if (newVal) return;
  // We know we stopped loading. Ensure page data is consistent.
  // Remember, currPage is zero-indexed.

  if (currPage.value === 0) return; // do not touch if we are on first page

  if (props.meta.pageCount === 0) {
    currPage.value = 0; // reset currPage to ensure it will always try to load first page
    return;
  }

  // Check if current page is too large.
  const offPageNumber = currPage.value + 1; // one-indexed
  if (props.meta.pageCount < offPageNumber) {
    currPage.value = props.meta.pageCount - 1;
    if (currPage.value < 0) currPage.value = 0;
    return;
  }
});

// Table column handling.

/**
 * Check if given column can be sorted.
 * @param column Given column.
 * @returns True if column should be sortable, otherwise false.
 */
const canSortColumn = (column: ColumnData): boolean => {
  if (selRecord.value !== null && props.inlineEdit) return false;
  return column.defSort !== '';
}

/**
 * Check if paginer should be disabled.
 * @returns True if paginer should be disabled, otherwise false.
 */
const canDisablePaginer = (): boolean => {
  if (selRecord.value !== null && props.inlineEdit) return true;
  return false;
}

/**
 * Find out additional classes for column header.
 * @param column Column data.
 */
const columHeaderClass = (column: ColumnData) => {
  return {
    sortable: canSortColumn(column)
  }
};

/**
 * Determine class for sort marker, if any.
 * @param column Column data.
 */
const sortMarker = (column: ColumnData) => {
  if (currSortBy.value !== column.name) {
    if (column.defSort === 'DESC') return 'arrow-desc potential';
    else return 'arrow-asc potential';
  }
  if (currSortOrder.value === 'DESC') return 'arrow-desc';
  return 'arrow-asc';
};

/**
 * Change sorting for this column.
 * @param column Column data.
 */
const changeSort = (column: ColumnData) => {
  if (!canSortColumn(column)) return; // No sorting enabled here.

  // Table is already sorted by this column, we reverse direction of sorting.
  if (currSortBy.value === column.name) {
    if (currSortOrder.value === 'DESC') currSortOrder.value = 'ASC';
    else currSortOrder.value = 'DESC';
    return;
  }

  // We choose different column to sort.
  currSortBy.value = column.name;
  currSortOrder.value = column.defSort;
};

// Table row.

/**
 * Determine class for table row.
 * @param entry Entry. Can be null if it is row for new entry.
 * @param rowIndex Row index.
 */
const rowClass = (entry: E|null, rowIndex: number) => {
  const key = props.columns[0]?.name || ''; // first column is key uniquely identyfying entry, like id or business key
  let selected = false;
  if (selRecord.value && entry !== null) selected = selRecord.value[key] === entry[key];

  return {
    unselectable: !props.canSelect,
    selected: selected,
    odd: rowIndex % 2 === 0,
  };
};

/**
 * Select entry. If this entry is already selected, it is deselected.
 * @param entry Entry to select or null if you want to deselect.
 * @param force If true, ignore props.canSelect.
 */
const selectEntry = (entry: E|null, force: boolean) => {
  if (!force && !props.canSelect) return;
  // This automatically emits 'update:modelValue' to the parent.
  if (entry === null) selRecord.value = null;
  else if (selRecord.value === entry) selRecord.value = null;
  else selRecord.value = entry;
};

//

/** Allow calling selectEntry from outside. */
defineExpose({
  selectEntry,
});
</script>

<template>
  <div class="table-container" role="table" :data-testid="`table_${props.tableId}`"
    :style="{ '--col-count': visibleColumnsCount }">
    <!-- TABLE HEADER -->
    <div class="table-header-group" role="rowgroup">
      <div class="table-header-row" role="row">
        <template v-for="(column, colIndex) in columns" :key="colIndex">
          <div v-if="column.visible" class="table-header-cell" :class="columHeaderClass(column)" role="columnheader"
            @click="changeSort(column)">
            {{ t(column.translation) }}
            <span v-if="column.defSort !== ''" :class="sortMarker(column)"></span>
          </div>
        </template>
      </div>
    </div>

    <div class="table-entire-row">
      <TablePaginer v-model:currPage="currPage" :tableId="tableId" :meta="meta" :isDisabled="canDisablePaginer()">
        <!-- Forwarding paginer options slot, if it exists. -->
        <template v-if="$slots['paginer_options']" #[`paginer_options`]="slotData">
          <slot name="paginer_options" v-bind="slotData || {}" />
        </template>
      </TablePaginer>
    </div>

    <template v-if="isLoading">
      <div class="spinner-container table-entire-row">
        <SpinnerTorus data-testid="spinner" display="block" size="100px" :canSpin="canSpin" />
      </div>
    </template>

    <template v-else>
      <!-- ADD NEW IN-LINE ENTRY -->
      <div v-if="addNewEntry && inlineEdit" class="table-row-group" role="rowgroup">
        <div class="table-row" :class="rowClass(null, 0)" role="row" >
          <TableRow
            v-model="selRecord"
            v-model:formEntry="formEntry"
            :tableId="tableId"
            :columns="columns"
            :rowIndex="-1"
            :entry="null"
            :inlineEdit="inlineEdit"
            :rowMeta="resolveRowMeta ? resolveRowMeta(null) : null"
          >
            <!-- Slot forwarding: forward all slots that match columns. -->
            <template v-for="(column, colIndex) in slottedColumns" :key="colIndex" #[`column_${column.name}`]="slotData">
              <slot :name="`column_${column.name}`" v-bind="slotData || {}" />
            </template>
          </TableRow>
        </div>
      </div>

      <!-- TABLE ROWS -->
      <div class="table-row-group" role="rowgroup">
        <div
          v-for="(entry, rowIndex) in data" :key="rowIndex"
          class="table-row" :class="rowClass(entry, rowIndex)"
          role="row"
          @click="selectEntry(entry, false)"
        >
          <TableRow
            v-model="selRecord"
            v-model:formEntry="formEntry"
            :tableId="tableId"
            :columns="columns"
            :rowIndex="rowIndex"
            :entry="entry"
            :inlineEdit="inlineEdit"
            :rowMeta="resolveRowMeta ? resolveRowMeta(entry) : null"
          >
            <!-- Slot forwarding: forward all slots that match columns. -->
            <template v-for="(column, colIndex) in slottedColumns" :key="colIndex" #[`column_${column.name}`]="slotData">
              <slot :name="`column_${column.name}`" v-bind="slotData || {}" />
            </template>
          </TableRow>
        </div>
      </div>
    </template>

    <div class="table-empty table-entire-row" v-if="!isLoading && data.length === 0">{{ t(empty) }}</div>

    <div class="table-entire-row">
      <TablePaginer v-model:currPage="currPage" :tableId="tableId" :meta="meta" :isDisabled="canDisablePaginer()" />
    </div>
  </div>
</template>

<style scoped>
/* Down arrow (descending sort). */
.arrow-desc {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--tablepage-color);

  margin-left: 2px;
}
.arrow-desc.potential {
  opacity: 0.1;
}
.table-header:hover .arrow-desc.potential {
  opacity: 0.5;
}

/* Up arrow (ascending sort). */
.arrow-asc {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 6px solid var(--tablepage-color);

  margin-left: 2px;
}
.arrow-asc.potential {
  opacity: 0.1;
}
.table-header:hover .arrow-asc.potential {
  opacity: 0.5;
}
</style>
