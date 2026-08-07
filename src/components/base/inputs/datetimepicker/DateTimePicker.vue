<script setup lang="ts">
/** This is date&time picker. Uses Date class for both input and output.
 * Note it is timezone-agnostic. You are one to adjust result to timezone etc. as needed.
 *
 * Features:
 * - Can select date, time or both date and time.
 * - Can disable or mark as invalid.
 * - Accept null (not set) value.
 * - Input fields are not editable. You set value via picker panels.
 * - Keyboard navigation supported (moving between subcomponents).
 * - Supports <label>.
 * - Supports WAI-ARIA.
 *
 * Models:
 * - v-model - Currently selected date and time. Null means it is unset. Note it is processed as-is.
 *
 * Properties:
 * - id - Used for identification and id attribute in focusable element (so <label> etc. work properly). Optional.
 * - mode - Mode of operation (both date and time, only date, only time). Optional, default is 'datetime'.
 * - allowNull - If true, allow deselecting date. Optional, default is false.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 * - invalid - If true, shows component as having invalid state. Visual only. Optional, default is false.
 * - showWeeks - If true, show weeks. Optional, default is false.
 * - dateTimeMin - If not null, defines earliest allowed date. Optional, default is null.
 * - dateTimeMax - If not null, defines latest allowed date. Optional, default is null.
 */
import { ref } from 'vue';

import DatePicker from '@/components/base/inputs/datetimepicker/DatePicker.vue';
import TimePicker from '@/components/base/inputs/datetimepicker/TimePicker.vue';

const currDateTime = defineModel<Date | null>({ required: true });

const props = withDefaults(
  defineProps<{
    /** Used for identification and id attribute in focusable element (so <label> etc. work properly). Optional. */
    id?: string;
    /** Mode of operation (both date and time, only date, only time). Optional, default is datetime. */
    mode?: 'datetime' | 'date' | 'time';
    /** If true, allow deselecting date. Optional, default is false. */
    allowNull?: boolean;
    /** If true, acts as disabled component (panels do not show). Optional, default is false. */
    disabled?: boolean;
    /** If true, shows component as having invalid state. Visual only. Optional, default is false. */
    invalid?: boolean;
    /** If true, show weeks. Optional, default is false. */
    showWeeks?: boolean;
    /** If not null, defines earliest allowed date. Optional, default is null. */
    dateTimeMin?: Date | null;
    /** If not null, defines latest allowed date. Optional, default is null. */
    dateTimeMax?: Date | null;
  }>(),
  {
    id: '',
    mode: 'datetime',
    allowNull: false,
    disabled: false,
    invalid: false,
    showWeeks: false,
    dateTimeMin: null,
    dateTimeMax: null,
  },
);

const dateId = `${props.id}`;
const timeId = props.mode === 'datetime' ? `t${props.id}` : `${props.id}`;

// References to child components, used for cross-panel close coordination.
const datePickerRef = ref<InstanceType<typeof DatePicker> | null>(null);
const timePickerRef = ref<InstanceType<typeof TimePicker> | null>(null);

/**
 * Handle focus moving between the two pickers.
 * When one input receives focus, the other picker's panel is closed.
 */
const handleGeneralFocusIn = (e: FocusEvent) => {
  const target = e.target as HTMLElement;

  // If time input received focus, close date panel.
  if (target.id === `timepicker_${timeId}`) {
    datePickerRef.value?.hidePanel();
  }
  // If date input received focus, close time panel.
  if (target.id === `datepicker_${dateId}`) {
    timePickerRef.value?.hidePanel();
  }
};

/**
 * Handle click from the hidden button via <label> click.
 * Opens the correct panel directly.
 */
const handleLabelClick = () => {
  if (props.disabled) return;

  if (props.mode === 'time') {
    // For mode 'time', open clock panel.
    timePickerRef.value?.showPanel();
  } else {
    // For mode 'date' and 'datetime', open calendar panel.
    datePickerRef.value?.showPanel();
  }
};
</script>

<template>
  <div class="picker-general" @focusin="handleGeneralFocusIn">
    <!-- Hidden button: labelable target for <label for="...">. -->
    <button :id="id" class="hidden-label-button" tabindex="-1" aria-hidden="true" @click="handleLabelClick()"></button>

    <DatePicker
      v-if="mode === 'datetime' || mode === 'date'"
      ref="datePickerRef"
      v-model="currDateTime"
      :id="dateId"
      :allowNull="allowNull"
      :disabled="disabled"
      :invalid="invalid"
      :showWeeks="showWeeks"
      :dateTimeMin="dateTimeMin"
      :dateTimeMax="dateTimeMax"
    />

    <TimePicker
      v-if="mode === 'datetime' || mode === 'time'"
      ref="timePickerRef"
      v-model="currDateTime"
      :id="timeId"
      :allowNull="allowNull"
      :disabled="disabled"
      :invalid="invalid"
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
