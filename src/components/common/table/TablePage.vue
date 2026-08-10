<script setup lang="ts" generic="E extends Record<string, any>, FE extends Record<string, any>">
/** Component that shows any table.
 *
 * Features:
 * - Selecting/deselecting record.
 * - Pagination.
 * - Sorting of any column (ASC or DESC).
 * - Supports keyboard navigation.
 * - Supports WAI-ARIA.
 *
 * Generics:
 * - E: Type of table entry.
 * - FE: Form for entry.
 *
 * Models:
 * - v-model - Selected record. Null means nothing is selected.
 * - v-model:formEntry - Form for entry. Used in in-line edit. Can be null if in-line edit is not used.
 * - v-model:currPage - Currently selected page. Zero-indexed.
 * - v-model:currSortBy - Current sort column.
 * - v-model:currSortOrder - Current sort order.
 *
 * Properties:
 * - tableId - Identificator of table.
 * - columns - Data about columns. First column must be unique key.
 * - data - Content of table itself: single page of entries.
 * - meta - Table metadata.
 * - resolveRowMeta - ?.
 * - isLoading - If true, show spinner instead of table content. Used to indicate loading content for table. Optional.
 * - canSpin - If true, spinner can spin. Used to indicate error due loading content for table. Optional.
 * - canSelect - If true, can select row in table. Optional, defaults to true. Note you still can select programmatically.
 * - inlineEdit - If true, selecting entry will cause it to be editable in-place. Optional.
 * - addNewEntry - If true, shows additional row where you add new entry. Only when inlineEdit === true. Optional.
 * - empty - I18n key to show when table is empty. Optional.
 * - descr: Description of loading state for screen readers and the like. Undefined means no aria will be present.
 *
 * Slots:
 * - custom slots defined for colums, with name 'column_[column name]'.
 */
import { useSlots, computed, watch, ref } from 'vue';
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
    resolveRowMeta?: (entry: E | null) => RowMeta | null;
    isLoading?: boolean;
    canSpin?: boolean;
    canSelect?: boolean;
    inlineEdit?: boolean;
    addNewEntry?: boolean;
    empty?: string;
    descr?: string;
  }>(),
  {
    isLoading: false,
    canSpin: true,
    canSelect: true,
    inlineEdit: false,
    addNewEntry: false,
    empty: '',
  },
);

// ROW REFS FOR KEYBOARD NAVIGATION

/** Template refs for each row, keyed by their index in props.data. */
const rowRefs = ref(new Map<number, HTMLElement>());

/** Index of the row currently tracked as focused by arrow-key navigation. Null when no focus is present. */
const focusedRowIndex = ref<number | null>(null);

/**
 * Callback for `:ref` binding on each row div. Stores/removes the element in rowRefs.
 * @param index Row index in data array.
 * @param el The element or null (on unmount).
 */
const setRowRef = (index: number, el: HTMLElement | null) => {
  if (el) {
    rowRefs.value.set(index, el);
  } else {
    rowRefs.value.delete(index);
  }
};

/** Reset focused row index when data changes (e.g. after pagination). */
watch(
  () => props.data,
  () => {
    focusedRowIndex.value = null;
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
  () => props.canSelect,
  () => {
    if (!props.canSelect) selRecord.value = null;
  },
);

/** React to end of loading. */
watch(
  () => props.isLoading,
  (newVal) => {
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
  },
);

// Table column handling.

/**
 * Check if given column can be sorted.
 * @param column Given column.
 * @returns True if column should be sortable, otherwise false.
 */
const canSortColumn = (column: ColumnData): boolean => {
  if (selRecord.value !== null && props.inlineEdit) return false;
  return column.defSort !== '';
};

/**
 * Check if paginer should be disabled.
 * @returns True if paginer should be disabled, otherwise false.
 */
const canDisablePaginer = (): boolean => {
  if (props.data.length === 0) return true; // no results
  if (selRecord.value !== null && props.inlineEdit) return true; // during inline edit
  return false;
};

/**
 * Find out additional classes for column header.
 * @param column Column data.
 */
const columHeaderClass = (column: ColumnData) => {
  return {
    sortable: canSortColumn(column),
  };
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

/** Handle keyboard on the column header cell. */
const onKeydownSort = (e: KeyboardEvent, column: ColumnData) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      changeSort(column);
      break;
  }
};

// Table row.

/**
 * Determine class for table row.
 * @param entry Entry. Can be null if it is row for new entry.
 * @param rowIndex Row index.
 */
const rowClass = (entry: E | null, rowIndex: number) => {
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
 * Determine tab index.
 * @param entry Entry for given row.
 * @returns Tab index attribute value.
 */
const getTabIndex = (): number => {
  return props.canSelect ? 0 : -1;
};

/**
 * Select entry. If this entry is already selected, it is deselected.
 * @param entry Entry to select or null if you want to deselect.
 * @param force If true, ignore props.canSelect.
 */
const selectEntry = (entry: E | null, force: boolean) => {
  if (!force && !props.canSelect) return;

  // First column is key uniquely identifying entry, like id or business key.
  const key = props.columns[0]?.name || '';

  // Compare by unique key, not by reference: after a table reload the selected record may be a
  // different object instance of the same entry, and highlight logic (rowClass) uses key comparison.
  //const isSelected = selRecord.value === entry;
  const isSelected = entry !== null && selRecord.value !== null && selRecord.value !== undefined && selRecord.value[key] === entry[key];

  // This automatically emits 'update:modelValue' to the parent.
  if (entry === null || isSelected) { // deselect
    selRecord.value = null;
    focusedRowIndex.value = null;
  } else selRecord.value = entry; // select
};

/**
 * What to do when you press key while focused on given row.
 * @param e Keyboard event.
 * @param entry Entry.
 */
const onKeydownEntry = (e: KeyboardEvent, entry: E | null) => {
  if (entry === null) return;

  const entryIndex = props.data.indexOf(entry);
  if (entryIndex === -1) return;

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      // Move from the row that actually has focus, wrapping to last entry.
      {
        let targetIndex = entryIndex - 1;
        if (targetIndex < 0) targetIndex = props.data.length - 1;
        focusedRowIndex.value = targetIndex;
        rowRefs.value.get(targetIndex)?.focus();
      }
      break;
    case 'ArrowDown':
      e.preventDefault();
      // Move from the row that actually has focus, wrapping to first entry.
      {
        let targetIndex = entryIndex + 1;
        if (targetIndex >= props.data.length) targetIndex = 0;
        focusedRowIndex.value = targetIndex;
        rowRefs.value.get(targetIndex)?.focus();
      }
      break;
    case 'Enter':
    case ' ':
      selectEntry(entry, false);
      break;
  }
};

//

/** Allow calling selectEntry from outside. */
defineExpose({
  selectEntry,
});
</script>

<template>
  <div class="table-container" role="table" :data-testid="tableId" :style="{ '--col-count': visibleColumnsCount }">
    <!-- TABLE HEADER -->
    <div class="table-header-group" role="rowgroup">
      <div class="table-header-row" role="row">
        <template v-for="(column, colIndex) in columns" :key="colIndex">
          <div
            v-if="column.visible"
            class="table-header-cell"
            :class="columHeaderClass(column)"
            role="columnheader"
            :tabindex="canSortColumn(column) ? 0 : -1"
            @keydown="onKeydownSort($event, column)"
            @click="changeSort(column)"
          >
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
        <SpinnerTorus data-testid="spinner" display="block" size="100px" :canSpin="canSpin" :descr="descr" />
      </div>
    </template>

    <template v-else>
      <!-- NEW IN-LINE ENTRY -->
      <div v-if="addNewEntry && inlineEdit" class="table-row-group" role="rowgroup">
        <div class="table-row" :class="rowClass(null, 0)" role="row">
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
            <template
              v-for="(column, colIndex) in slottedColumns"
              :key="colIndex"
              #[`column_${column.name}`]="slotData"
            >
              <slot :name="`column_${column.name}`" v-bind="slotData || {}" />
            </template>
          </TableRow>
        </div>
      </div>

      <!-- TABLE ROWS -->
      <div class="table-row-group" role="rowgroup">
        <div
          v-for="(entry, rowIndex) in data"
          :key="rowIndex"
          class="table-row"
          :class="rowClass(entry, rowIndex)"
          role="row"
          :tabindex="getTabIndex()"
          :ref="(el) => setRowRef(rowIndex, el as HTMLElement | null)"
          @keydown="onKeydownEntry($event, entry)"
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
            <template
              v-for="(column, colIndex) in slottedColumns"
              :key="colIndex"
              #[`column_${column.name}`]="slotData"
            >
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
