<script setup lang="ts" generic="E extends Record<string, any>, FE extends Record<string, any>">
/** Component that shows row of table.
 *
 * Models:
 * - v-model - Selected record. Null means nothing is selected.
 * - v-model:formEntry - Form for entry. Used in in-line edit.
 *
 * Properties:
 * - columns - Data about columns. First column must be unique key.
 * - entry - Single entry of table. Can be null.
 * - inlineEdit - If true, selecting entry will cause it to be editable in-place. Optional.
 *
 * Slots:
 * - custom slots defined for colums, with name 'column_[column name]'.
 */

import type { ColumnData } from '@/code/data/features/common/type.ts';

import TableCell from '@/components/common/table/TableCell.vue';

const selRecord = defineModel<E | null>({ required: false });
const formEntry = defineModel<FE | null>('formEntry', { required: false });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(
  defineProps<{
    columns: ColumnData[];
    entry: E|null;
    inlineEdit?: boolean;
  }>(),
  {
    inlineEdit: false,
  },
);

</script>

<template>
  <!-- CELLS FOR SINGLE TABLE ROW -->
  <template v-for="(column, colIndex) in columns" :key="colIndex">
    <TableCell
      v-model="selRecord"
      v-model:formEntry="formEntry"
      :column="column"
      :entry="entry"
      :inlineEdit="inlineEdit"
    >
      <!-- Slot forwarding: forward all slots that match columns. -->
      <template v-if="$slots[`column_${column.name}`]" #[`column_${column.name}`]="slotData">
        <slot :name="`column_${column.name}`" v-bind="slotData || {}" />
      </template>
    </TableCell>
  </template>
</template>

<style scoped></style>
