<script setup lang="ts">
/** Table wrapper.
 *
 * Slots:
 * - filterPanel - Where filter panel goes.
 * - tablePanel - Where table panel goes.
 * - entryEditor - Where editor panel for currently selected entry from table goes.
 *
 * Properties:
 * - layout - Specifies type of layout. Allowed values: side, bottom. Optional, defaults to side.
 */
const props = withDefaults(defineProps<{
  layout?: string;
}>(), {
  layout: 'side'
});

const getClass = () => {
  return {
    side: props.layout === 'side',
    bottom: props.layout === 'bottom',
  }
}
</script>

<template>
  <div class="table-wrapper" :class="getClass()">
    <div class="table-wrapper-filter">
      <slot name="filterPanel" />
    </div>
    <div class="table-wrapper-page">
      <slot name="tablePanel" />
    </div>
    <div class="table-wrapper-editor">
      <slot name="entryEditor" />
    </div>
  </div>
</template>

<style scoped></style>
