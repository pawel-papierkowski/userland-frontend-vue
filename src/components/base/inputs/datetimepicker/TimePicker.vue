<script setup lang="ts">
/** Dedicated time picker. Do not use it directly. Use DateTimePicker with attribute mode="time".
 *
 * Models:
 * - v-model - Currently selected date and time. Null means it is unset.
 *
 * Properties:
 * - ident - Used for identification in form.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 */
import { ref, computed, nextTick, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

import { TimeUtils } from '@/code/utils/TimeUtils';

const { t } = useI18n();

const currDateTime = defineModel<Date | null>({ required: true });

const props = withDefaults(defineProps<{
  /** Used for identification in form. */
  ident: string;
  /**  If true, acts as disabled component (clock panel does not show). Optional, default is false. */
  disabled?: boolean
}>(), {
  disabled: false
});

const isClockVisible = ref(false);
const pickerRef = ref<HTMLElement | null>(null);
const clockContainerRef = ref<HTMLElement | null>(null);

const hourRef = ref<HTMLElement | null>(null);
const minuteRef = ref<HTMLElement | null>(null);

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

const viewHour = ref<number|null>(null);
const viewMinute = ref<number|null>(null);
const selectedHour = ref<number|null>(null);
const selectedMinute = ref<number|null>(null);

const containerStyle = ref({
  left: '0',
  right: 'auto'
});

onClickOutside(pickerRef, () => {
  // note we use pickerRef, not clockContainerRef, as it would cause issues
  hidePanel();
});

// COMPUTATIONS

/** Compute currently displayed time value in time input. */
const displayTimeValue = computed(() => {
  const formattedTime = TimeUtils.formatTime(currDateTime.value);
  if (!formattedTime) return null;
  return '🕜 ' + formattedTime;
});
/** Compute placeholder value for time input. */
const placeholderTimeValue = computed(() => {
  return '🕜 ' + t('dateTimePicker.placeholder.time');
});

// WATCHES

/** If currDateTime model changes, also change certain fields. */
watch(currDateTime, () => {
  selectedHour.value = currDateTime.value?.getHours() ?? null;
  selectedMinute.value = currDateTime.value?.getMinutes() ?? null;
});

/** If you disable picker, panel will close. */
watch(() => props.disabled, () => {
  if (props.disabled) {
    isClockVisible.value = false;
  }
});

/** If picker panel is opened, scroll to actual hour and minute. */
watch(isClockVisible, (visible) => {
  if (visible) {
    scrollToSelected();
  }
});

// FUNCTIONS.

/** Toggle visibility of time picker panel. */
const toggleTimePickerVisibility = async () => {
  if (isClockVisible.value) {
    isClockVisible.value = false;
  } else {
    isClockVisible.value = true;
    findCurrentTime();

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
const findCurrentTime = () => {
  if (currDateTime.value !== null) return;
  const date = new Date();
  viewHour.value = date.getHours();
  viewMinute.value = date.getMinutes();
}

/** Select hour. */
const selectHour = (h: number) => {
  const date = currDateTime.value ? new Date(currDateTime.value) : new Date();
  if (!currDateTime.value) date.setSeconds(0, 0);
  date.setHours(h);
  currDateTime.value = date;
};

/** Select minute. */
const selectMinute = (m: number) => {
  const date = currDateTime.value ? new Date(currDateTime.value) : new Date();
  if (!currDateTime.value) date.setSeconds(0, 0);
  date.setMinutes(m);
  currDateTime.value = date;
};

/** Scroll to selected hour and minute. */
const scrollToSelected = () => {
  nextTick(() => {
    let selectedHour: Element | null = null;
    let selectedMinute: Element | null = null;
    if (currDateTime.value === null) {
      if (hourRef.value) selectedHour = hourRef.value.querySelector('.curr');
      if (minuteRef.value) selectedMinute = minuteRef.value.querySelector('.curr');
    } else {
      if (hourRef.value) selectedHour = hourRef.value.querySelector('.selected');
      if (minuteRef.value) selectedMinute = minuteRef.value.querySelector('.selected');
    }
    if (selectedHour) selectedHour.scrollIntoView({ block: 'center' });
    if (selectedMinute) selectedMinute.scrollIntoView({ block: 'center' });
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
    curr: viewHour.value === h
  };
}

/**
 * Resolve class of minute item.
 * @param m Minute.
 */
const resolveMinuteClass = (m: number) => {
  return {
    selected: selectedMinute.value === m,
    curr: viewMinute.value === m
  };
}

/** Hide panel. */
const hidePanel = () => {
  isClockVisible.value = false;
};
</script>

<template>
  <div class="picker" ref="pickerRef">
    <input
      :id="ident+'_time'"
      :data-testid="ident+'_time'"
      type="text"
      class="picker-input-time"
      :class="{ disabled: disabled }"
      :value="displayTimeValue"
      :placeholder="placeholderTimeValue"
      :disabled="disabled"
      readonly
      autocomplete="off"
      @click="toggleTimePickerVisibility" />

    <!-- Time picker panel. -->
    <div v-if="isClockVisible" class="clock-container" ref="clockContainerRef" :style="containerStyle">
      <div class="clock-columns">

        <!-- Hours scroller. -->
        <div class="clock-column" ref="hourRef">
          <div class="column-header">{{ t('dateTimePicker.hour') }}</div>
          <div v-for="h in hours" :key="h"
               class="time-item"
               :class="resolveHourClass(h)"
               @click="selectHour(h)">
            {{ h.toString().padStart(2, '0') }}
          </div>
        </div>

        <!-- Minutes scroller. -->
        <div class="clock-column" ref="minuteRef">
          <div class="column-header">{{ t('dateTimePicker.minute') }}</div>
          <div v-for="m in minutes" :key="m"
               class="time-item"
               :class="resolveMinuteClass(m)"
               @click="selectMinute(m)">
            {{ m.toString().padStart(2, '0') }}
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.picker {
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
.picker-input-time::selection {
  background: transparent; /** Prevents highlight when you double-click. */
}

.picker-input-time.disabled {
  cursor: default;
}

.picker-general.err .picker-input-time {
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
