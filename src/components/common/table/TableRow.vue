<script setup lang="ts" generic="E extends Record<string, any>, FE extends Record<string, any>">
/** Component that shows row of table.
 *
 * Models:
 * - v-model - Selected entry for table page where this row exist. Null means nothing is selected.
 * - v-model:formEntry - Form for current entry. Used in in-line edit.
 *
 * Properties:
 * - tableId - Identificator of table.
 * - rowIndex - Index of row in table. -1 means special row.
 * - columns - Data about columns. First column must be unique key.
 * - entry - Current entry of table for this row. Can be null.
 * - inlineEdit - If true, selecting entry will cause it to be editable in-place. Optional.
 * - rowMeta - Row metadata. Contains field metadata keyed by column name. Optional.
 *
 * Slots:
 * - custom slots defined for colums, with name 'column_[column name]'.
 */

import type { ColumnData, FieldMeta, RowMeta } from '@/code/data/features/common/type.ts';

import TableCell from '@/components/common/table/TableCell.vue';

const selRecord = defineModel<E | null>({ required: false });
const formEntry = defineModel<FE | null>('formEntry', { required: false });

const props = withDefaults(
  defineProps<{
    tableId: string;
    rowIndex: number;
    columns: ColumnData[];
    entry: E | null;
    inlineEdit?: boolean;
    rowMeta?: RowMeta | null;
  }>(),
  {
    inlineEdit: false,
    rowMeta: null,
  },
);

//

/**
 * Retrieve correct field metadata for given column.
 * @param column Column.
 */
const resolveFieldMeta = (column: ColumnData): FieldMeta | null => {
  if (!props.rowMeta) return null;
  return props.rowMeta[column.name] || null;
};
</script>

<template>
  <div :data-testid="`${props.tableId}_${rowIndex}`" class="table-row-inner">
    <!-- CELLS FOR SINGLE TABLE ROW -->
    <template v-for="(column, colIndex) in columns" :key="colIndex">
      <TableCell
        v-model="selRecord"
        v-model:formEntry="formEntry"
        :tableId="tableId"
        :rowIndex="rowIndex"
        :column="column"
        :entry="entry"
        :inlineEdit="inlineEdit"
        :fieldMeta="resolveFieldMeta(column)"
      >
        <!-- Slot forwarding: forward all slots that match columns. -->
        <template v-if="$slots[`column_${column.name}`]" #[`column_${column.name}`]="slotData">
          <slot :name="`column_${column.name}`" v-bind="slotData || {}" />
        </template>
      </TableCell>
    </template>
  </div>
</template>

<style scoped></style>
