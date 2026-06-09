<script setup lang="ts">
/** This is date&time picker. Uses Date class for both input and output.
 *
 * Features:
 * - Can pick date, time or both date and time.
 * - Accept null (not set) value.
 * - Input is not editable.
 *
 * Models:
 * - v-model - Currently selected date and time. Null means it is unset.
 *
 * Properties:
 * - ident - Used for identification in form.
 * - mode - Mode of operation. Optional, default is datetime.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 * - dateTimeMin - If not null, defines earliest allowed date. Optional, default is null.
 * - dateTimeMax - If not null, defines latest allowed date. Optional, default is null.
 */
import { ref } from 'vue';
import { onClickOutside } from '@vueuse/core';

import DatePicker from '@/components/base/inputs/datetimepicker/DatePicker.vue';
import TimePicker from '@/components/base/inputs/datetimepicker/TimePicker.vue';

const currDateTime = defineModel<Date | null>({ required: true });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(defineProps<{
  /** Used for identification in form. */
  ident: string;
  /** Mode of operation. Optional, default is datetime. */
  mode?: 'date' | 'time' | 'datetime';
  /**  If true, acts as disabled component (calendar panel does not show). Optional, default is false. */
  disabled?: boolean,
  /** If not null, defines earliest allowed date. Optional, default is null. */
  dateTimeMin?: Date|null;
  /** If not null, defines latest allowed date. Optional, default is null. */
  dateTimeMax?: Date|null;
}>(), {
  mode: 'datetime',
  disabled: false,
  dateTimeMin: null,
  dateTimeMax: null
});

/** Reference to general picker element. */
const pickerRef = ref(null);
/** Reference to date picker. */
const datePickerRef = ref<InstanceType<typeof DatePicker> | null>(null);
/** Reference to time picker. */
const timePickerRef = ref<InstanceType<typeof TimePicker> | null>(null);

onClickOutside(pickerRef, () => {
  // Hide panels in both pickers. TODO looks like it is not needed?
  //datePickerRef.value?.hidePanel();
  //timePickerRef.value?.hidePanel();
});
</script>

<template>
  <div class="picker-general" ref="pickerRef">
    <DatePicker ref="datePickerRef" v-if="mode === 'datetime' || mode === 'date'"
      v-model="currDateTime"
      :ident="ident+'_date'"
      :disabled="disabled"
      :dateTimeMin="dateTimeMin"
      :dateTimeMax="dateTimeMax"
    />

    <TimePicker ref="timePickerRef" v-if="mode === 'datetime' || mode === 'time'"
      v-model="currDateTime"
      :ident="ident+'_time'"
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
