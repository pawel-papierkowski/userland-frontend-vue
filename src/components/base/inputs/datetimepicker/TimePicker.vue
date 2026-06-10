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
  /**  If true, acts as disabled component (calendar panel does not show). Optional, default is false. */
  disabled?: boolean
}>(), {
  disabled: false
});

const isClockVisible = ref(false);
const pickerRef = ref<HTMLElement | null>(null);
const clockContainerRef = ref<HTMLElement | null>(null);
const viewTime = ref(new Date()); // Date used for viewing hour/minute in clock.

const containerStyle = ref({
  left: '0',
  right: 'auto'
});

onClickOutside(pickerRef, () => {
  // note we use pickerRef, not clockContainerRef, as it would cause issues
  hidePanel();
});

// COMPUTATIONS.

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

/** If you disable picker, panel will close. */
watch(() => props.disabled, () => {
  if (props.disabled) {
    isClockVisible.value = false;
  }
});

// FUNCTIONS.

/** Toggle visibility of time picker panel. */
const toggleTimePickerVisibility = async () => {
  if (isClockVisible.value) {
    isClockVisible.value = false;
  } else {
    // If null, set viewTime to current date
    viewTime.value = currDateTime.value ? new Date(currDateTime.value) : new Date();
    isClockVisible.value = true;

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


//

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
      :value="displayTimeValue"
      :placeholder="placeholderTimeValue"
      :disabled="disabled"
      readonly
      autocomplete="off"
      @click="toggleTimePickerVisibility"
    />

    <div v-if="isClockVisible">
      <!-- Time picker panel. -->
      <div class="clock-container" ref="clockContainerRef" :style="containerStyle">
        TIME PICKER PANEL PLACEHOLDER
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

/** Clock panel to pick time. **/

.clock-container {
  position: absolute;
  top: 100%;
  left: 0;

  margin: var(--datetimepicker-clock-offset);
  padding: var(--spacing-sm);
  min-width: 280px;

  background: var(--datetimepicker-clock-background);
  border: var(--datetimepicker-clock-border);
  border-radius: var(--datetimepicker-clock-border-radius);
  box-shadow: var(--datetimepicker-clock-shadow);

  z-index: 1000;
}
</style>
