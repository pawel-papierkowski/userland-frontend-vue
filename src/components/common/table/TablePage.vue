<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * Component that shows any table.
 * Features:
 * - Selecting record
 * - Pagination
 * - Sorting of any column (ASC or DESC)
 *
 * Properties:
 * - v-model - Holds selected record.
 * - :columns - Array of columns.
 * - :data - Array of data.
 * - empty - I18n key for empty table.
 */
import { useI18n } from 'vue-i18n';
import type { ColumnData } from "@/code/data/features/common.ts";

const { t } = useI18n();

const selRecord = defineModel<T | null>(); // Selected record, null means nothing is selected.

const props = defineProps<{
  columns: ColumnData[]; // Data about columns.
  data: T[]; // Content of table itself.
  empty: string; // I18n key to show when table is empty
}>();

const selectItem = (item: T) => {
  // This automatically emits 'update:modelValue' to the parent.
  if (selRecord.value === item) selRecord.value = null;
  else selRecord.value = item;
}
</script>

<template>
  <div class="table-container" role="table">
    <div class="table-header-group" role="rowgroup">
      <div class="table-header-row" role="row">
        <template v-for="(column, colIndex) in columns" :key="colIndex">
          <div v-if="column.visible" class="table-header" role="columnheader">
            {{ t(column.translation) }}
          </div>
        </template>
      </div>
    </div>
    <div class="table-empty" v-if="data.length === 0">{{ t(empty) }}</div>
    <div class="table-body-group" v-else role="rowgroup">
      <div v-for="(entry, rowIndex) in data" :key="rowIndex"
            class="table-row"
            :class="{ selected: selRecord === entry, odd: rowIndex%2 === 0 }"
            role="row"
            @click="selectItem(entry)">
        <template v-for="(column, colIndex) in columns" :key="colIndex">
          <div v-if="column.visible" class="table-cell" role="cell">
            <span class="cell-value">{{ entry[column.name] }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
