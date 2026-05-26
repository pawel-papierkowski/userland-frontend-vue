<script setup lang="ts">
/** Table wrapper. */

</script>

<template>
  <div class="table-wrapper">
    <div class="table-filter">
      <slot name="filterPanel" />
    </div>
    <div class="table-page">
      <slot name="tablePanel" />
    </div>
    <div class="table-entry-editor">
      <slot name="entryEditor" />
    </div>
  </div>
</template>

<style scoped></style>
