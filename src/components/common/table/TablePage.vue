<script setup lang="ts" generic="E extends Record<string, any>">
/**
 * Component that shows any table.
 * Features:
 * - Selecting/deselecting record.
 * - Pagination.
 * - Sorting of any column (ASC or DESC).
 *
 * Generics:
 * - E: Type of table entry.
 *
 * Models:
 * - v-model - Holds selected record.
 *
 * Properties:
 * - :columns - Array of columns. First column must be unique key.
 * - :data - Array of data.
 * - empty - I18n key for empty table.
 */
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ColumnData, TableMetaResp } from "@/code/data/features/common.ts";

import TablePaginer from '@/components/common/table/TablePaginer.vue';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

const { t } = useI18n();

const selRecord = defineModel<E | null>({ required: true }); // Selected record, null means nothing is selected.
const currPage = defineModel<number>('currPage', { required: true }); // Currently selected page.
const currSortBy = defineModel<string|null>('currSortBy', { required: true }); // Current sort column.
const currSortOrder = defineModel<string|null>('currSortOrder', { required: true }); // Current sort order.

const props = withDefaults(defineProps<{
  columns: ColumnData[]; // Data about columns.
  data: E[]; // Content of table itself.
  meta: TableMetaResp; // Table metadata.
  canSelect?: boolean; // If true, can select row in table. Optional, defaults to true.
  isLoading: boolean; // If true, show spinner instead of table content.
  canSpin: boolean; // If true, can spin.
  empty?: string; // I18n key to show when table is empty. Optional.
}>(), {
  canSelect: true,
  empty: ''
});

/** If you disable selection abiliy, automatically deselect. */
watch(() => props.canSelect, () => {
  if (!props.canSelect) selRecord.value = null;
});

/**
 * Select entry. If this entry is already selected, it is deselected.
 * @param entry Entry to select.
 */
const selectEntry = (entry: E) => {
  if (!props.canSelect) return;
  // This automatically emits 'update:modelValue' to the parent.
  if (selRecord.value === entry) selRecord.value = null;
  else selRecord.value = entry;
}

const changeSort = (column: ColumnData) => {
  if (currSortBy.value === column.name) {
    if (currSortOrder.value === 'DESC') currSortOrder.value = 'ASC';
    else currSortOrder.value = 'DESC';
    return;
  }
  // Different column to sort.
  currSortBy.value = column.name;
  currSortOrder.value = column.defSort;
}

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
}

/**
 * Determine class for table row.
 * @param entry Entry.
 * @param rowIndex Row index.
 */
const rowClass = (entry: E, rowIndex: number) => {
  const key = props.columns[0]?.name || ''; // first column is key uniquely identyfying entry, like id or business key
  const selected = selRecord.value === null ? false : selRecord.value[key] === entry[key];
  return {
    unselectable: !props.canSelect,
    selected: selected,
    odd: rowIndex%2 === 0
  };
}
</script>

<template>
  <div class="table-container" role="table">

    <!-- TABLE HEADER -->
    <div class="table-header-group" role="rowgroup">
      <div class="table-header-row" role="row">
        <template v-for="(column, colIndex) in columns" :key="colIndex">
          <div v-if="column.visible" class="table-header-cell" role="columnheader"
            @click="changeSort(column)">
            {{ t(column.translation) }}
            <span :class="sortMarker(column)"></span>
          </div>
        </template>
      </div>
    </div>

    <TablePaginer v-model:currPage="currPage" :meta="meta" />

    <div class="table-empty" v-if="!isLoading && data.length === 0">{{ t(empty) }}</div>
    <template v-if="isLoading">
      <div class="spinner-container">
        <SpinnerTorus data-testid="spinner" display="block" size="100px" :canSpin="canSpin" />
      </div>
    </template>

    <template v-else>
      <!-- TABLE ROWS -->
      <div class="table-row-group" role="rowgroup">
        <div v-for="(entry, rowIndex) in data" :key="rowIndex"
              class="table-row" :class="rowClass(entry, rowIndex)"
              role="row" @click="selectEntry(entry)">

          <!-- CELLS FOR SINGLE TABLE ROW -->
          <template v-for="(column, colIndex) in columns" :key="colIndex">
            <div v-if="column.visible" class="table-cell" role="cell">
              <span class="cell-value">{{ entry[column.name] }}</span>
            </div>
          </template>
        </div>
      </div>
    </template>

    <TablePaginer v-model:currPage="currPage" :meta="meta" />
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
