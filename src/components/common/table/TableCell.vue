<script setup lang="ts" generic="E extends Record<string, any>, FE extends Record<string, any>">
/** Component that shows cell of table.
 *
 * Generics:
 * - E: Type of table entry.
 * - FE: Form for entry.
 *
 * Models:
 * - v-model - Selected entry for table page where row with this cell exist. Null means nothing is selected.
 * - v-model:formEntry - Form for current entry. Used in in-line edit.
 *
 * Properties:
 * - tableId - Identificator of table.
 * - column - Data about column.
 * - rowIndex - Index of row in table.
 * - entry - Current entry of table for row with this cell. Can be null.
 * - inlineEdit - If true, selecting entry will cause it to be editable in-place. Optional.
 * - fieldMeta - If present, defines additional metadata about cell.
 */
import { computed } from 'vue';
import type { VNode } from 'vue';

import type { ColumnData, FieldMeta } from '@/code/data/features/common/type.ts';
import { EnColumnKind } from '@/code/data/features/common/const';

const selRecord = defineModel<E | null>({ required: false });
const formEntry = defineModel<FE | null>('formEntry', { required: false });

const props = withDefaults(
  defineProps<{
    tableId: string;
    column: ColumnData;
    rowIndex: number;
    entry: E|null;
    inlineEdit?: boolean;
    fieldMeta?: FieldMeta|null;
  }>(),
  {
    inlineEdit: false,
    fieldMeta: null,
  },
);

defineSlots<{
  [key: string]: (props: {
    entry: E|null,
    isEditMode?: boolean,
    formEntry?: FE | null
    fieldMeta?: FieldMeta|null;
  }) => VNode[] // result of rendering slot
}>();

//

/** Determine if this cell should be in edit mode. */
const isEditMode = computed(() => {
  if (!props.inlineEdit) return false; // no editing at all
  if (!props.column.editable) return false; // this column cannot be edited
  if (props.entry !== null && props.entry !== selRecord.value) return false; // not selected
  return true;
});

const dataTestId = computed(() => {
  return `cell_${props.tableId}_${props.rowIndex}_${props.column.name}`;
});

const cellClass = computed(() => {
  if (props.fieldMeta) return props.fieldMeta.css;
  return '';
});
</script>

<template>
  <div v-if="column.visible" class="table-cell" role="cell" :data-testid="dataTestId">
    <div v-if="column.kind === EnColumnKind.Data" :class="{ 'cell-value': !isEditMode }">
      <template v-if="$slots['column_' + column.name]">
        <!-- If slot with matching name is provided, it is used instead. -->
        <slot :name="'column_' + column.name" :entry="entry" :isEditMode="isEditMode" :formEntry="formEntry" :fieldMeta="fieldMeta" />
      </template>
      <template v-else>
        <!-- Default column handling. -->
        <template v-if="isEditMode && formEntry">
          <input :id="column.name" type="text" :class="cellClass"
            v-model="formEntry[column.name]" autocomplete="off" />
        </template>
        <template v-else>
          {{ entry === null ? '' : entry[column.name] }}
        </template>
      </template>
    </div>

    <template v-else-if="column.kind === EnColumnKind.Custom">
      <!-- Custom columns always use slot. -->
      <slot :name="'column_'+column.name" :entry="entry" />
    </template>
  </div>
</template>

<style scoped></style>
