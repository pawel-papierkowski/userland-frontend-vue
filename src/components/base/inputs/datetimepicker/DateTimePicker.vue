<script setup lang="ts">
/** This is date&time picker. Uses Date class for both input and output.
 *
 * Features:
 * - Can pick date, time or both date and time.
 * - Accept null (not set) value.
 * - Input fields are not editable. You set value via picker panels.
 *
 * Models:
 * - v-model - Currently selected date and time as UTC. Null means it is unset. Note it is processed as-is.
 *   You are one to adjust result to timezone etc. after getting result.
 *
 * Properties:
 * - ident - Used for identification in form. Optional.
 * - mode - Mode of operation. Optional, default is 'datetime'.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 * - dateTimeMin - If not null, defines earliest allowed date. Optional, default is null.
 * - dateTimeMax - If not null, defines latest allowed date. Optional, default is null.
 */
import DatePicker from '@/components/base/inputs/datetimepicker/DatePicker.vue';
import TimePicker from '@/components/base/inputs/datetimepicker/TimePicker.vue';

const currDateTime = defineModel<Date | null>({ required: true });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(defineProps<{
  /** Used for identification in form. */
  ident?: string;
  /** Mode of operation. Optional, default is datetime. */
  mode?: 'date' | 'time' | 'datetime';
  /**  If true, acts as disabled component (panels do not show). Optional, default is false. */
  disabled?: boolean;
  /** If not null, defines earliest allowed date. Optional, default is null. */
  dateTimeMin?: Date|null;
  /** If not null, defines latest allowed date. Optional, default is null. */
  dateTimeMax?: Date|null;
}>(), {
  ident: '',
  mode: 'datetime',
  disabled: false,
  dateTimeMin: null,
  dateTimeMax: null
});
</script>

<template>
  <div class="picker-general">
    <DatePicker v-if="mode === 'datetime' || mode === 'date'"
      v-model="currDateTime"
      :ident="ident"
      :disabled="disabled"
      :dateTimeMin="dateTimeMin"
      :dateTimeMax="dateTimeMax"
    />

    <TimePicker v-if="mode === 'datetime' || mode === 'time'"
      v-model="currDateTime"
      :ident="ident"
      :disabled="disabled"
    />
  </div>
</template>

<style scoped>
.picker-general {
  display: flex;
  flex-direction: row;
  gap: 0.2em;
  user-select: none;
}
</style>
