<script setup lang="ts">
/** This is date&time picker. Uses Date class for both input and output. Features:
 * - Can pick date, time or both date and time.
 */
const currDateTime = defineModel<Date|null>({ required: true }); // Date and time.

const props = defineProps<{
  ident: string; // Used for identification.
  mode: 'date'|'time'|'datetime'; // Mode of operation.
}>();
</script>

<template>
  <input
    :id="ident"
    :data-testid="ident"
    type="text"
    v-model="currDateTime"
    autocomplete="off"
  />
</template>

<style scoped></style>
