<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * Component that shows any table.
 * Features:
 * - Selecting record
 * - Pagination
 * - Sorting of any column ASC or DESC
 *
 * Properties:
 * - v-model - Holds selected record.
 * - :columns - Array of columns.
 * - :data - Array of data.
 */
import { useI18n } from 'vue-i18n';
import type { ColumnData } from "@/code/data/features/common.ts";

const { t } = useI18n();

const selRecord = defineModel<T | null>(); // Selected record, null means nothing is selected.

const props = defineProps<{
  columns: ColumnData[];
  data: T[];
}>();

const selectItem = (item: T) => {
  selRecord.value = item; // This automatically emits 'update:modelValue' to the parent
}

</script>

<template>
  <div class="table-container">
    <div v-for="(column, colIndex) in columns" :key="colIndex" class="table-header">
      <span class="cell-label">{{ t(column.translation) }}</span>
    </div>
    <div v-for="(entry, rowIndex) in data" :key="rowIndex"
          class="table-row"
          :class="{ selected: selRecord === entry, odd: rowIndex%2 === 0 }"
          @click="selectItem(entry)">
      <div v-for="(column, colIndex) in columns" :key="colIndex" class="table-cell">
        <span class="cell-value">{{ entry[column.name] }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
