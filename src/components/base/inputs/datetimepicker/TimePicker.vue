<script setup lang="ts">
/** Dedicated time picker. Do not use it directly. Use DateTimePicker with attribute mode="time".
 * Note it is timezone-agnostic. You are one to adjust result to timezone etc. as needed.
 *
 * Features:
 * - Can select time.
 * - Can disable or mark as invalid.
 * - Accept null (not set) value.
 * - Input field is not editable. You set value via clock panel.
 *
 * Models:
 * - v-model - Currently selected date and time. Null means it is unset. Note it is processed as-is.
 *   You are one to adjust result to timezone etc. when setting or after getting result.
 *
 * Properties:
 * - ident - Used for identification. Optional.
 * - allowNull - If true, allow deselecting time. Optional, default is false.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 * - invalid - If true, shows component as having invalid state. Visual only. Optional, default is false.
 */
import { ref, computed, nextTick, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

import { TimeUtils } from '@/code/utils/TimeUtils';

const { t } = useI18n();

/** Currently selected date and time. Null means it is unset. */
const selDateTime = defineModel<Date | null>({ required: true });

const props = withDefaults(
  defineProps<{
    /** Used for identification. */
    ident?: string;
    /** If true, allow deselecting time. Optional, default is false. */
    allowNull?: boolean;
    /** If true, acts as disabled component (clock panel does not show). Optional, default is false. */
    disabled?: boolean;
    /** If true, shows component as having invalid state. Visual only. Optional, default is false. */
    invalid?: boolean;
  }>(),
  {
    ident: '',
    allowNull: false,
    disabled: false,
    invalid: false,
  },
);

const isClockVisible = ref(false);
const pickerRef = ref<HTMLElement | null>(null);
const clockContainerRef = ref<HTMLElement | null>(null);

const hourRef = ref<HTMLElement | null>(null);
const minuteRef = ref<HTMLElement | null>(null);

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

const viewHour = ref<number | null>(null);
const viewMinute = ref<number | null>(null);
const selectedHour = computed(() => selDateTime.value?.getUTCHours() ?? null);
const selectedMinute = computed(() => selDateTime.value?.getUTCMinutes() ?? null);

const containerStyle = ref({
  left: '0',
  right: 'auto',
});

onClickOutside(pickerRef, () => {
  // note we use pickerRef, not clockContainerRef, as it would cause issues
  hidePanel();
});

// COMPUTATIONS

/** Compute currently displayed time value in time input. */
const displayTimeValue = computed(() => {
  const formattedTime = TimeUtils.formatUTCTime(selDateTime.value);
  if (!formattedTime) return null;
  return '🕜 ' + formattedTime;
});
/** Compute placeholder value for time input. */
const placeholderTimeValue = computed(() => {
  return '🕜 ' + t('dateTimePicker.placeholder.time');
});

// WATCHES

/** If you disable picker, panel will close. */
watch(
  () => props.disabled,
  () => {
    if (props.disabled) isClockVisible.value = false;
  },
);

/** If picker panel is opened, scroll to actual hour and minute. */
watch(isClockVisible, (visible) => {
  if (visible) scrollToSelected();
});

// FUNCTIONS.

/** Toggle visibility of time picker panel. */
const toggleTimePickerVisibility = async () => {
  if (isClockVisible.value) {
    isClockVisible.value = false;
  } else {
    isClockVisible.value = true;
    findViewTime();

    await nextTick();
    // Adjust picker position if needed to prevent window overflow.
    if (clockContainerRef.value) {
      const rect = clockContainerRef.value.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        containerStyle.value = { left: 'auto', right: '0' };
      } else {
        containerStyle.value = { left: '0', right: 'auto' };
      }
    }
  }
};

/** Find and set current time. */
const findViewTime = () => {
  const date = new Date();
  viewHour.value = date.getUTCHours();
  viewMinute.value = date.getUTCMinutes();
};

/** Select hour. */
const selectHour = (h: number) => {
  if (props.disabled) return;

  // Selecting same hour.
  if (selDateTime.value && selDateTime.value.getUTCHours() === h) {
    if (props.allowNull) selDateTime.value = null; // Deselect time.
    return;
  }

  const date = selDateTime.value ? new Date(selDateTime.value) : new Date();
  if (!selDateTime.value) date.setUTCSeconds(0, 0);
  date.setUTCHours(h);
  selDateTime.value = date;
};

/** Select minute. */
const selectMinute = (m: number) => {
  if (props.disabled) return;

  // Selecting same minute.
  if (selDateTime.value && selDateTime.value.getUTCMinutes() === m) {
    if (props.allowNull) selDateTime.value = null; // Deselect time.
    return;
  }

  const date = selDateTime.value ? new Date(selDateTime.value) : new Date();
  if (!selDateTime.value) date.setUTCSeconds(0, 0);
  date.setUTCMinutes(m);
  selDateTime.value = date;
};

/** Scroll to selected hour and minute. */
const scrollToSelected = () => {
  nextTick(() => {
    let selHourElement: Element | null = null;
    let selMinuteElement: Element | null = null;

    // If time is not selected, use current time as scroll target.
    if (selDateTime.value === null) {
      if (hourRef.value) selHourElement = hourRef.value.querySelector('.curr');
      if (minuteRef.value) selMinuteElement = minuteRef.value.querySelector('.curr');
    } else {
      if (hourRef.value) selHourElement = hourRef.value.querySelector('.selected');
      if (minuteRef.value) selMinuteElement = minuteRef.value.querySelector('.selected');
    }
    if (selHourElement) selHourElement.scrollIntoView({ block: 'center' });
    if (selMinuteElement) selMinuteElement.scrollIntoView({ block: 'center' });
  });
};

//

/**
 * Resolve class of hour item.
 * @param h Hour.
 */
const resolveHourClass = (h: number) => {
  return {
    selected: selectedHour.value === h,
    curr: viewHour.value === h,
  };
};

/**
 * Resolve class of minute item.
 * @param m Minute.
 */
const resolveMinuteClass = (m: number) => {
  return {
    selected: selectedMinute.value === m,
    curr: viewMinute.value === m,
  };
};

/** Hide panel. */
const hidePanel = () => {
  isClockVisible.value = false;
};
</script>

<template>
  <div class="picker-time" ref="pickerRef">
    <input type="text"
      :id="`timepicker_${ident}`"
      :data-testid="`timepicker_${ident}`"
      class="picker-input-time"
      :class="{ disabled: disabled, err: invalid }"
      :value="displayTimeValue"
      :placeholder="placeholderTimeValue"
      :disabled="disabled"
      readonly
      autocomplete="off"
      @click="toggleTimePickerVisibility"
    />

    <!-- Time picker panel. -->
    <div v-if="isClockVisible" class="clock-container" ref="clockContainerRef" :style="containerStyle">
      <div class="clock-columns">
        <!-- Hours scroller. -->
        <div class="clock-column" ref="hourRef">
          <div class="column-header">{{ t('dateTimePicker.hour') }}</div>
          <div
            v-for="h in hours"
            :key="h"
            class="time-item time-hour"
            :class="resolveHourClass(h)"
            :data-testid="`timepicker_${ident}_h${h}`"
            @click="selectHour(h)"
          >
            {{ h.toString().padStart(2, '0') }}
          </div>
        </div>

        <!-- Minutes scroller. -->
        <div class="clock-column" ref="minuteRef">
          <div class="column-header">{{ t('dateTimePicker.minute') }}</div>
          <div
            v-for="m in minutes"
            :key="m"
            class="time-item time-minute"
            :class="resolveMinuteClass(m)"
            :data-testid="`timepicker_${ident}_m${m}`"
            @click="selectMinute(m)"
          >
            {{ m.toString().padStart(2, '0') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker-time {
  display: inline-block;
  position: relative;
  width: var(--datetimepicker-time-width);
  user-select: none;
}

/** Time input field. **/

.picker-input-time {
  width: var(--datetimepicker-time-width);
  cursor: pointer;
  caret-color: transparent;
  user-select: none;
}
.picker-input-time:focus-visible {
  outline: var(--focus-outline);
  outline-offset: var(--focus-outline-offset);
}

.picker-input-time::selection {
  background: transparent; /** Prevents highlight when you double-click. */
}

.picker-input-time.disabled {
  cursor: default;
}

.picker.err .picker-input-time {
  color: var(--input-err-color);
  background: var(--input-err-background);
  border: var(--input-err-border);
}

/** Clock panel to pick time. **/

.clock-container {
  position: absolute;
  top: 100%;
  left: 0;

  margin: var(--datetimepicker-clock-offset);
  padding: var(--spacing-sm);
  min-width: 160px;

  background: var(--datetimepicker-clock-background);
  border: var(--datetimepicker-clock-border);
  border-radius: var(--datetimepicker-clock-border-radius);
  box-shadow: var(--datetimepicker-clock-shadow);

  z-index: 1000;
}

.picker.err .clock-container {
  background: var(--datetimepicker-clock-err-background);
}

.clock-columns {
  display: flex;
  height: 200px;
}

/* Define single clock column with time (hour or minute). Uses nice scrollbars. */

.clock-column {
  flex: 1;
  overflow-y: auto;

  /* Sleek scrollbar for Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

/* Sleek scrollbar for Chrome, Edge, and Safari */
.clock-column::-webkit-scrollbar {
  width: 6px;
}

.clock-column::-webkit-scrollbar-track {
  background: transparent;
}

.clock-column::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  border: 1px solid transparent;
}

.clock-column::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.clock-column::-webkit-scrollbar-button {
  width: 0;
  height: 0;
  display: none;
}

.column-header {
  position: sticky;
  top: 0;
  font-weight: bold;
  font-size: 0.8em;

  color: var(--color-text-primary);
  background: var(--datetimepicker-clock-background);

  padding: var(--spacing-xs) 0;
  text-align: center;
}

.time-item {
  padding: var(--spacing-xs) 0;
  text-align: center;
  cursor: pointer;
  border-radius: 4px;
  margin: 2px;
  color: var(--datetimepicker-time-color);
}

.time-item.curr {
  color: var(--datetimepicker-time-curr-color);
  background: var(--datetimepicker-time-curr-background);
  box-shadow: var(--datetimepicker-time-curr-shadow);
}

.time-item.selected {
  color: var(--datetimepicker-time-selected-color);
  background: var(--datetimepicker-time-selected-background);
}

.time-item:hover {
  color: var(--datetimepicker-time-hover-color);
  background: var(--datetimepicker-time-hover-background);
}

.time-item.curr:hover {
  color: var(--datetimepicker-time-hover-color);
  background: var(--datetimepicker-time-hover-background);
}
</style>
