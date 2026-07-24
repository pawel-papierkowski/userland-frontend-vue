<script setup lang="ts">
/** This is date&time picker. Uses Date class for both input and output.
 * Note it is timezone-agnostic. You are one to adjust result to timezone etc. as needed.
 *
 * Features:
 * - Can select date, time or both date and time.
 * - Can disable or mark as invalid.
 * - Accept null (not set) value.
 * - Input fields are not editable. You set value via picker panels.
 * - Keyboard navigation supported.
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

//
// References to child components, used for cross-panel close coordination.
const datePickerRef = ref<InstanceType<typeof DatePicker> | null>(null);
const timePickerRef = ref<InstanceType<typeof TimePicker> | null>(null);

/**
 * Handle focus moving between the two pickers.
 * When one input receives focus, the other picker's panel is closed.
 */
const handleGeneralFocusin = (e: FocusEvent) => {
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
 * Handle focus arriving on the hidden button via <label> click.
 * Routes focus to the correct input depending on mode, which triggers
 * auto-open of the corresponding panel.
 */
const handleHiddenButtonFocus = () => {
  if (props.disabled) return;

  if (props.mode === 'time') {
    const timeInput = document.getElementById(`timepicker_${timeId}`);
    timeInput?.focus();
  } else {
    // For 'date' and 'datetime', focus the date input.
    const dateInput = document.getElementById(`datepicker_${dateId}`);
    dateInput?.focus();
  }
};
</script>

<template>
  <div class="picker-general" @focusin="handleGeneralFocusin">
    <button
      :id="id"
      class="hidden-button"
      tabindex="-1"
      @focus="handleHiddenButtonFocus"
    ></button>
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

/** Hidden button target for <label> clicking. */
.hidden-button {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>
