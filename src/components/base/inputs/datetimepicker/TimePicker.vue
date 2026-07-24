<script setup lang="ts">
/** Dedicated time picker. Do not use it directly. Use DateTimePicker with attribute mode="time".
 * Note it is timezone-agnostic. You are one to adjust result to timezone etc. as needed.
 *
 * Features:
 * - Can select time.
 * - Can disable or mark as invalid.
 * - Accept null (not set) value.
 * - Input field is not editable. You set value via clock panel.
 * - Keyboard navigation supported via arrows (open panel or change hour/minute), enter/space (pick hour/minute) and esc (close panel).
 * - Supports WAI-ARIA.
 *
 * Models:
 * - v-model - Currently selected date and time. Null means it is unset. Note it is processed as-is.
 *   You are one to adjust result to timezone etc. when setting or after getting result.
 *
 * Properties:
 * - id - Used for identification and id attribute in focusable element (so <label> etc. work properly). Optional.
 * - allowNull - If true, allow deselecting time. Optional, default is false.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 * - invalid - If true, shows component as having invalid state. Visual only. Optional, default is false.
 */
import { ref, computed, nextTick, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

import { TimeUtils } from '@/code/utils/TimeUtils.ts';
import { NavUtils } from '@/code/utils/NavUtils.ts';

const { t } = useI18n();

/** Currently selected date and time. Null means it is unset. */
const selDateTime = defineModel<Date | null>({ required: true });

const props = withDefaults(
  defineProps<{
    /** Used for identification and id attribute in focusable element (so <label> etc. work properly). Optional. */
    id?: string;
    /** If true, allow deselecting time. Optional, default is false. */
    allowNull?: boolean;
    /** If true, acts as disabled component (clock panel does not show). Optional, default is false. */
    disabled?: boolean;
    /** If true, shows component as having invalid state. Visual only. Optional, default is false. */
    invalid?: boolean;
  }>(),
  {
    id: '',
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

/** Keyboard-focus hour index. Set when panel opens, updated via arrow navigation. */
const focusedHour = ref<number | null>(null);
/** Keyboard-focus minute index. Set when panel opens, updated via arrow navigation. */
const focusedMinute = ref<number | null>(null);
/** Which listbox column currently has keyboard focus. */
const activeColumn = ref<'hour' | 'minute'>('hour');

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

const viewHour = ref<number | null>(null);
const viewMinute = ref<number | null>(null);
const selectedHour = computed(() => selDateTime.value?.getUTCHours() ?? null);
const selectedMinute = computed(() => selDateTime.value?.getUTCMinutes() ?? null);

/** aria-activedescendant value for the hour listbox. */
const hourActiveDesc = computed(() => {
  if (focusedHour.value === null) return undefined;
  return `timepicker_${props.id}_opt_h${focusedHour.value}`;
});
/** aria-activedescendant value for the minute listbox. */
const minuteActiveDesc = computed(() => {
  if (focusedMinute.value === null) return undefined;
  return `timepicker_${props.id}_opt_m${focusedMinute.value}`;
});

const containerStyle = ref({
  left: '0',
  right: 'auto',
});

onClickOutside(pickerRef, () => {
  // note we use pickerRef, not clockContainerRef, as it would cause issues
  hidePanel();
});

/** Handle focus leaving the picker entirely (e.g. Tab out of grid). */
const handleFocusOut = (e: FocusEvent) => {
  const relatedTarget = e.relatedTarget as HTMLElement | null;
  if (isClockVisible.value && relatedTarget && !pickerRef.value?.contains(relatedTarget)) {
    hidePanel();
  }
};

// COMPUTED

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
    if (props.disabled) hidePanel();
  },
);

/** If picker panel is opened, scroll to actual hour and minute. */
watch(isClockVisible, (visible) => {
  if (visible) scrollToSelected();
});

// FUNCTIONS.

/** Tracks if the next focus event is caused by a mouse click (to avoid auto-open on click). */
let focusFromClick = false;

/** Handle mousedown on input: mark that focus is from a click so auto-open is skipped. */
const handleMousedown = () => {
  focusFromClick = true;
};

/** Handle focus arriving on the input (e.g. via Tab). */
const handleInputFocus = () => {
  if (!focusFromClick && !isClockVisible.value && !props.disabled) {
    toggleTimePickerVisibility(false);
  }
  focusFromClick = false;
};

/** Handle click. */
const handleClick = async (viaKeyboard: boolean) => {
  if (props.disabled) return;
  toggleTimePickerVisibility(viaKeyboard);
};

/** Toggle visibility of time picker panel. */
const toggleTimePickerVisibility = async (viaKeyboard: boolean) => {
  if (isClockVisible.value) {
    hidePanel();
  } else {
    isClockVisible.value = true;
    findViewTime();

    // Initialize keyboard focus state.
    if (viaKeyboard) {
      setupFocus(true);
      if (selDateTime.value) {
        focusedHour.value = selDateTime.value.getUTCHours();
        focusedMinute.value = selDateTime.value.getUTCMinutes();
      } else {
        focusedHour.value = viewHour.value;
        focusedMinute.value = viewMinute.value;
      }
    }
    activeColumn.value = 'hour';

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

    // Move keyboard focus into the panel (hour column) so user can navigate immediately.
    hourRef.value?.focus();
  }
};

/** Find and set current time. */
const findViewTime = () => {
  const date = new Date();
  viewHour.value = date.getUTCHours();
  viewMinute.value = date.getUTCMinutes();
};

//

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
const selectMinute = (m: number, viaKeyboard: boolean) => {
  if (props.disabled) return;

  // Selecting same minute.
  if (!viaKeyboard && selDateTime.value && selDateTime.value.getUTCMinutes() === m) {
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

/** Scroll hour listbox so given hour is visible. */
const scrollHourIntoView = (h: number) => {
  nextTick(() => {
    if (hourRef.value) {
      const el = hourRef.value.querySelector(`[data-testid="timepicker_${props.id}_h${h}"]`);
      el?.scrollIntoView({ block: 'center' });
    }
  });
};

/** Scroll minute listbox so given minute is visible. */
const scrollMinuteIntoView = (m: number) => {
  nextTick(() => {
    if (minuteRef.value) {
      const el = minuteRef.value.querySelector(`[data-testid="timepicker_${props.id}_m${m}"]`);
      el?.scrollIntoView({ block: 'center' });
    }
  });
};

// KEYBOARD HANDLERS

/** Handle keyboard on the input. */
const onInputKeydown = (e: KeyboardEvent) => {
  if (props.disabled) return;

  if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
    e.preventDefault();
    if (!isClockVisible.value) toggleTimePickerVisibility(true);
  } else if (e.key === 'Escape' && isClockVisible.value) {
    e.preventDefault();
    hidePanel();
  }
};

/** Handle keyboard on the hour listbox. */
const onHourKeydown = (e: KeyboardEvent) => {
  if (props.disabled) return;

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      focusedHour.value =
        focusedHour.value !== null
          ? focusedHour.value > 0
            ? focusedHour.value - 1
            : 23
          : (selectedHour.value ?? viewHour.value ?? 0);
      scrollHourIntoView(focusedHour.value);
      break;
    case 'ArrowDown':
      e.preventDefault();
      focusedHour.value =
        focusedHour.value !== null
          ? focusedHour.value < 23
            ? focusedHour.value + 1
            : 0
          : (selectedHour.value ?? viewHour.value ?? 0);
      scrollHourIntoView(focusedHour.value);
      break;
    case 'ArrowRight':
      e.preventDefault();
      keyPressSwitchColumn();
      break;
    case 'Home': // Jump to start of list.
      e.preventDefault();
      focusedHour.value = 0;
      scrollHourIntoView(0);
      break;
    case 'End': // Jump to end of list.
      e.preventDefault();
      focusedHour.value = 23;
      scrollHourIntoView(23);
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      keyPressSelectHour();
      break;
    case 'Escape':
      e.preventDefault();
      hidePanelAndRefocus();
      break;
  }
};

/** Handle keyboard on the minute listbox. */
const onMinuteKeydown = (e: KeyboardEvent) => {
  if (props.disabled) return;

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      focusedMinute.value =
        focusedMinute.value !== null
          ? focusedMinute.value > 0
            ? focusedMinute.value - 1
            : 59
          : (selectedMinute.value ?? viewMinute.value ?? 0);
      scrollMinuteIntoView(focusedMinute.value);
      break;
    case 'ArrowDown':
      e.preventDefault();
      focusedMinute.value =
        focusedMinute.value !== null
          ? focusedMinute.value < 59
            ? focusedMinute.value + 1
            : 0
          : (selectedMinute.value ?? viewMinute.value ?? 0);
      scrollMinuteIntoView(focusedMinute.value);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      keyPressSwitchColumn();
      break;
    case 'Home': // Jump to start of list.
      e.preventDefault();
      focusedMinute.value = 0;
      scrollMinuteIntoView(0);
      break;
    case 'End': // Jump to end of list.
      e.preventDefault();
      focusedMinute.value = 59;
      scrollMinuteIntoView(59);
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      keyPressSelectMinute();
      break;
    case 'Escape':
      e.preventDefault();
      hidePanelAndRefocus();
      break;
  }
};

//

/** React on column change via key press. */
const keyPressSwitchColumn = () => {
  if (focusedHour.value === null || focusedMinute.value === null) {
    // Just show focus without switching column.
    setupFocus(false);
    return;
  }

  if (activeColumn.value === 'minute') {
    // Switch focus to hour column.
    activeColumn.value = 'hour';
    nextTick(() => hourRef.value?.focus());
  } else {
    // Switch focus to minute column.
    activeColumn.value = 'minute';
    nextTick(() => minuteRef.value?.focus());
  }
};

/** React on selecting hour via key press. */
const keyPressSelectHour = () => {
  if (focusedHour.value === null) {
    // Just show focus without selecting anything.
    setupFocus(false);
    return;
  }

  selectHour(focusedHour.value);
  nextTick(() => {
    // If time was deselected (allowNull same-hour toggle), close panel.
    // Otherwise move focus to minute column.
    if (selDateTime.value === null) {
      hidePanelAndRefocus();
    } else {
      activeColumn.value = 'minute';
      if (focusedMinute.value === null)
        focusedMinute.value = selDateTime.value ? selDateTime.value.getUTCMinutes() : viewMinute.value;
      nextTick(() => minuteRef.value?.focus());
    }
  });
};

/** React on selecting minute via key press. */
const keyPressSelectMinute = () => {
  if (focusedMinute.value === null) {
    // Just show focus without selecting anything.
    setupFocus(false);
    return;
  }

  selectMinute(focusedMinute.value, true);
  hidePanelAndFocusNext();
};

// UTILITIES.

/** Flip panel. Used by parent (DateTimePicker) for label clicking. */
const flipPanel = () => {
  console.warn('TimePicker.flipPanel() called.');
  toggleTimePickerVisibility(false);
};

/** Show panel (if not already visible). */
const showPanel = () => {
  if (!isClockVisible.value) toggleTimePickerVisibility(false);
};

/** Hide panel. Also removes inner focus on hour/minute. */
const hidePanel = () => {
  isClockVisible.value = false;
  focusedHour.value = null;
  focusedMinute.value = null;
};

/** Hide panel and return focus to the input. */
const hidePanelAndRefocus = () => {
  hidePanel();
  nextTick(() => {
    const inputEl = document.getElementById(`timepicker_${props.id}`);
    inputEl?.focus();
  });
};

/** Hide panel and move focus to the next focusable element on page. */
const hidePanelAndFocusNext = () => {
  hidePanel();
  nextTick(() => {
    const inputEl = document.getElementById(`timepicker_${props.id}`);
    NavUtils.FocusNext(inputEl);
  });
};

/**
 * Set up focus values.
 * @param force If true, will override focused values. If false, will set focused values only if these are null.
 */
const setupFocus = (force: boolean) => {
  if (force || focusedHour.value === null)
    focusedHour.value = selDateTime.value ? selDateTime.value.getUTCHours() : viewHour.value;
  if (force || focusedMinute.value === null)
    focusedMinute.value = selDateTime.value ? selDateTime.value.getUTCMinutes() : viewMinute.value;
};

/**
 * Resolve class of hour item.
 * @param h Hour.
 */
const resolveHourClass = (h: number) => {
  return {
    selected: selectedHour.value === h,
    curr: viewHour.value === h,
    focused: activeColumn.value === 'hour' && focusedHour.value === h,
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
    focused: activeColumn.value === 'minute' && focusedMinute.value === m,
  };
};

/** Expose panel handling so parent (DateTimePicker) can manage panels for subcomponents. */
defineExpose({ showPanel, hidePanel, flipPanel });
</script>

<template>
  <div class="picker-time" ref="pickerRef" @focusout="handleFocusOut">
    <input
      :id="`timepicker_${id}`"
      type="text"
      :data-testid="`timepicker_${id}`"
      class="picker-input-time"
      :class="{ disabled: disabled, err: invalid }"
      :value="displayTimeValue"
      :placeholder="placeholderTimeValue"
      :disabled="disabled"
      readonly
      autocomplete="off"
      role="combobox"
      :tabindex="disabled ? -1 : 0"
      aria-haspopup="listbox"
      :aria-expanded="isClockVisible"
      :aria-controls="`timepicker_${id}_panel`"
      :aria-label="t('dateTimePicker.placeholder.time')"
      :aria-disabled="disabled || undefined"
      @mousedown="handleMousedown"
      @focus="handleInputFocus"
      @click="handleClick(false)"
      @keydown="onInputKeydown"
    />

    <!-- Time picker: clock panel. -->
    <div
      v-show="isClockVisible"
      :id="`timepicker_${id}_panel`"
      class="clock-container"
      ref="clockContainerRef"
      role="dialog"
      :aria-label="t('dateTimePicker.placeholder.time')"
      aria-modal="true"
      :style="containerStyle"
    >
      <div class="clock-columns">
        <!-- Hours scroller. -->
        <div
          class="clock-column"
          ref="hourRef"
          role="listbox"
          tabindex="-1"
          :aria-label="t('dateTimePicker.hour')"
          :aria-activedescendant="hourActiveDesc"
          @keydown="onHourKeydown"
          @focus="activeColumn = 'hour'"
        >
          <div class="column-header" aria-hidden="true">{{ t('dateTimePicker.hour') }}</div>
          <div
            v-for="h in hours"
            :key="h"
            :id="`timepicker_${id}_opt_h${h}`"
            class="time-item time-hour"
            :class="resolveHourClass(h)"
            role="option"
            :aria-selected="selectedHour === h"
            :aria-label="`${h} ${t('dateTimePicker.hour')}`"
            :data-testid="`timepicker_${id}_h${h}`"
            @click="selectHour(h)"
          >
            {{ h.toString().padStart(2, '0') }}
          </div>
        </div>

        <!-- Minutes scroller. -->
        <div
          class="clock-column"
          ref="minuteRef"
          role="listbox"
          tabindex="-1"
          :aria-label="t('dateTimePicker.minute')"
          :aria-activedescendant="minuteActiveDesc"
          @keydown="onMinuteKeydown"
          @focus="activeColumn = 'minute'"
        >
          <div class="column-header" aria-hidden="true">{{ t('dateTimePicker.minute') }}</div>
          <div
            v-for="m in minutes"
            :key="m"
            :id="`timepicker_${id}_opt_m${m}`"
            class="time-item time-minute"
            :class="resolveMinuteClass(m)"
            role="option"
            :aria-selected="selectedMinute === m"
            :aria-label="`${m} ${t('dateTimePicker.minute')}`"
            :data-testid="`timepicker_${id}_m${m}`"
            @click="selectMinute(m, false)"
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

/** Keyboard-focus ring on the active option. */
.time-item.focused {
  outline: var(--focus-outline);
  outline-offset: var(--focus-outline-offset);
}

/** Suppress native focus ring on the listbox container itself. */
.clock-column:focus-visible {
  outline: none;
}
</style>
