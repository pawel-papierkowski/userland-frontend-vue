<script setup lang="ts">
/** Table wrapper. */
</script>

<template>
  <div class="table-wrapper">
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
