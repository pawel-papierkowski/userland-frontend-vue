<script setup lang="ts" generic="E extends Record<string, any>, FE extends Record<string, any>">
/** Component that shows cell of table.
 *
 * Generics:
 * - E: Type of table entry.
 * - FE: Form for entry.
 *
 * Models:
 * - v-model - Selected record. Null means nothing is selected.
 * - v-model:formEntry - Form for entry. Used in in-line edit.
 *
 * Properties:
 * - column - Data about column.
 * - inlineEdit - If true, selecting entry will cause it to be editable in-place. Optional.
 */
import { computed } from 'vue';
import type { VNode } from 'vue';

import type { ColumnData } from '@/code/data/features/common/type.ts';
import { EnColumnKind } from '@/code/data/features/common/const';

const selRecord = defineModel<E | null>({ required: false });
const formEntry = defineModel<FE | null>('formEntry', { required: false });

const props = withDefaults(
  defineProps<{
    column: ColumnData;
    entry: E;
    inlineEdit?: boolean;
  }>(),
  {
    inlineEdit: false,
  },
);

defineSlots<{
  [key: string]: (props: {
    entry: E,
    isEditMode?: boolean,
    formEntry?: FE | null
  }) => VNode[] // result of rendering slot
}>();

//

/** Determine if this cell should be in edit mode. */
const isEditMode = computed(() => {
  if (!props.inlineEdit) return false; // no editing at all
  if (!props.column.editable) return false; // this column cannot be edited
  if (props.entry !== selRecord.value) return false; // not selected
  return true;
});
</script>

<template>
  <div v-if="column.visible" class="table-cell" role="cell">
    <div v-if="column.kind === EnColumnKind.Data" :class="{ 'cell-value': !isEditMode }">
      <template v-if="$slots['column_' + column.name]">
        <!-- If slot with matching name is provided, it is used instead. -->
        <slot :name="'column_' + column.name" :entry="entry" :isEditMode="isEditMode" :formEntry="formEntry" />
      </template>
      <template v-else>
        <!-- Default column handling. -->
        <template v-if="isEditMode && formEntry">
          <input :id="column.name" :data-testid="column.name" type="text"
            v-model="formEntry[column.name]" autocomplete="off" />
        </template>
        <template v-else>
          {{ entry[column.name] }}
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
