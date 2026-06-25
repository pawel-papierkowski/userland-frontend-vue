<script setup lang="ts">
/** Dedicated date picker. Do not use it directly. Use DateTimePicker with attribute mode="date".
 * Note it is timezone-agnostic. You are one to adjust result to timezone etc. as needed.
 *
 * Models:
 * - v-model - Currently selected date and time. Null means it is unset. Note it is processed as-is.
 *   You are one to adjust result to timezone etc. when setting or after getting result.
 *
 * Properties:
 * - ident - Used for identification in form. Optional.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 * - dateTimeMin - If not null, defines earliest allowed date. Optional, default is null.
 * - dateTimeMax - If not null, defines latest allowed date. Optional, default is null.
 */
import { ref, computed, nextTick, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

import { TimeUtils } from '@/code/utils/TimeUtils';
import type { DatePick } from '@/code/data/general/datetime-types.ts';

const { t } = useI18n();

/** Currently selected date and time. Null means it is unset. */
const selDateTime = defineModel<Date | null>({ required: true });

const props = withDefaults(defineProps<{
  /** Used for identification in form. */
  ident?: string;
  /**  If true, acts as disabled component (calendar panel does not show). Optional, default is false. */
  disabled?: boolean,
  /** If not null, defines earliest allowed date. Optional, default is null. */
  dateTimeMin?: Date|null;
  /** If not null, defines latest allowed date. Optional, default is null. */
  dateTimeMax?: Date|null;
}>(), {
  ident: '',
  disabled: false,
  dateTimeMin: null,
  dateTimeMax: null
});

const isCalendarVisible = ref(false);
const pickerRef = ref<HTMLElement | null>(null);
const calendarContainerRef = ref<HTMLElement | null>(null);
const viewDate = ref(new Date()); // Date used for viewing month/year in calendar.

const containerStyle = ref({
  left: '0',
  right: 'auto'
});

onClickOutside(pickerRef, () => {
  // note we use pickerRef, not calendarContainerRef, as it would cause issues
  hidePanel();
});

// COMPUTATIONS

/** Compute currently displayed date value in date input. */
const displayDateValue = computed(() => {
  const formattedDate = TimeUtils.formatUTCDate(selDateTime.value);
  if (!formattedDate) return null;
  return '📅 ' + formattedDate;
});
/** Compute placeholder value for date input. */
const placeholderDateValue = computed(() => {
  return '📅 ' + t('dateTimePicker.placeholder.date');
});

/** Compute header text (year and name of month). */
const headerText = computed(() => {
  const monthIx = viewDate.value.getUTCMonth(); // reminder that for some reason month is zero-indexed
  return viewDate.value.getUTCFullYear() + ' ' + t('dateTimePicker.month.'+monthIx);
});

/** Shortcuts for days of week used in lang keys. */
const daysOfWeek = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** Recalculate days shown in calendar. */
const calendarDays = computed(() => {
  const year = viewDate.value.getUTCFullYear();
  const month = viewDate.value.getUTCMonth();

  const firstDay = TimeUtils.getUTCFirstDayOfMonth(year, month);
  const daysInMonth = TimeUtils.getUTCDaysInMonth(year, month);

  const days: DatePick[] = [];

  // Padding for previous month. Note that if month has first day on monday, entire previous week will be shown.
  for (let i = firstDay; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month, -i));
    days.push({
      day: d.getUTCDate(),
      month: d.getUTCMonth(),
      year: d.getUTCFullYear(),
      isCurrentMonth: false
    });
  }

  // Current month days.
  for (let i = 1; i <= daysInMonth+1; i++) {
    days.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true
    });
  }

  // Padding for next month
  const remainingCells = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(Date.UTC(year, month + 1, i));
    days.push({
      day: d.getUTCDate(),
      month: d.getUTCMonth(),
      year: d.getUTCFullYear(),
      isCurrentMonth: false
    });
  }

  return days;
});

// WATCHES

/** If you disable picker, panel will close. */
watch(() => props.disabled, () => {
  if (props.disabled) isCalendarVisible.value = false;
});

// FUNCTIONS.

/** Toggle visibility of date picker panel. */
const toggleDatePickerVisibility = async () => {
  if (isCalendarVisible.value) {
    isCalendarVisible.value = false;
  } else {
    // If selected date is null, set viewDate to current date (as in system date of computer).
    viewDate.value = selDateTime.value ? new Date(selDateTime.value) : new Date();
    isCalendarVisible.value = true;

    await nextTick();

    // Adjust picker position if needed to prevent window overflow.
    if (calendarContainerRef.value) {
      const rect = calendarContainerRef.value.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        containerStyle.value = { left: 'auto', right: '0' };
      } else {
        containerStyle.value = { left: '0', right: 'auto' };
      }
    }
  }
};

/**
 * Change current month. TODO: for some retarded reason +1 (one month forward) is not working, wtf?
 * @param delta How to change month.
 */
const changeMonth = (delta: number) => {
  console.warn(`changeMonth() called. Delta=${delta}, current month: ${viewDate.value.getUTCMonth()} / ${viewDate.value.getMonth()}`);
  const newDateTime = new Date(Date.UTC(viewDate.value.getUTCFullYear(), viewDate.value.getUTCMonth() + delta, 1));
  viewDate.value = newDateTime;
};

/**
 * Change current year.
 * @param delta How to change year.
 */
const changeYear = (delta: number) => {
  console.warn(`changeYear() called. Delta=${delta}, current date: ${viewDate.value.getUTCMonth()}`);
  const newDateTime = new Date(Date.UTC(viewDate.value.getUTCFullYear() + delta, viewDate.value.getUTCMonth(), 1));
  viewDate.value = newDateTime;
};

//

/**
 * Converts pickable day to Date (only year, month, day).
 * @param pickableDay Pickable day.
 * @returns Date.
 */
const pickableDayToDate = (pickableDay: DatePick): Date => {
  return new Date(Date.UTC(pickableDay.year, pickableDay.month, pickableDay.day, 0, 0, 0, 0));
}

/**
 * Select day.
 * @param pickableDay Date.
 */
const selectDay = (pickableDay: DatePick) => {
  if (props.disabled) return;

  const newDate = pickableDayToDate(pickableDay);
  if (!canPick(newDate)) return;

  if (TimeUtils.formatUTCDate(selDateTime.value) === TimeUtils.formatUTCDate(newDate)) {
    // Deselect date.
    selDateTime.value = null;
  } else {
    // Select new date without touching time.
    const prevDateTime = selDateTime.value;
    if (prevDateTime) {
      newDate.setUTCHours(prevDateTime.getUTCHours());
      newDate.setUTCMinutes(prevDateTime.getUTCMinutes());
      newDate.setUTCSeconds(prevDateTime.getUTCSeconds());
      newDate.setUTCMilliseconds(prevDateTime.getUTCMilliseconds());
    }
    selDateTime.value = newDate;
  }
  isCalendarVisible.value = false;
};

const canPick = (date: Date): boolean => {
  if (props.dateTimeMin != null && date < props.dateTimeMin) return false;
  if (props.dateTimeMax != null && date > props.dateTimeMax) return false;
  return true;
}

//

/**
 * Find out class of day cell in calendar grid.
 * @param pickableDay Date.
 */
const resolveDayClass = (pickableDay: DatePick) => {
  return {
    'not-current': !pickableDay.isCurrentMonth,
    'today': isToday(pickableDay),
    'selected': isDaySelected(pickableDay),
    'disabled': isDayDisabled(pickableDay)
  }
};

/**
 * Check if given date is today.
 * @param pickableDay Date.
 */
const isToday = (pickableDay: DatePick): boolean => {
  const today = new Date();
  return (
    pickableDay.day === today.getUTCDate() &&
    pickableDay.month === today.getUTCMonth() &&
    pickableDay.year === today.getUTCFullYear()
  );
};

/**
 * Check if given date is selected.
 * @param pickableDay Date.
 */
const isDaySelected = (pickableDay: DatePick): boolean => {
  if (!selDateTime.value) return false;
  return (
    pickableDay.day === selDateTime.value.getUTCDate() &&
    pickableDay.month === selDateTime.value.getUTCMonth() &&
    pickableDay.year === selDateTime.value.getUTCFullYear()
  );
};

/**
 * Check if given date cannot be picked.
 * @param pickableDay Date.
 */
const isDayDisabled = (pickableDay: DatePick): boolean => {
  const givenDay = pickableDayToDate(pickableDay);
  return !canPick(givenDay);
};

//

/** Hide panel. */
const hidePanel = () => {
  isCalendarVisible.value = false;
};
</script>

<template>
  <div class="picker" ref="pickerRef">
    <input
      :id="`datepicker_${ident}`"
      :data-testid="`datepicker_${ident}`"
      type="text"
      class="picker-input-date"
      :class="{ disabled: disabled }"
      :value="displayDateValue"
      :placeholder="placeholderDateValue"
      :disabled="disabled"
      readonly
      autocomplete="off"
      @click="toggleDatePickerVisibility" />

    <!-- Date picker panel. -->
    <div v-if="isCalendarVisible" class="calendar-container" ref="calendarContainerRef" :style="containerStyle">
      <div class="calendar-header">
        <div class="header-nav">
          <div class="header-navbtn" :data-testid="`datepicker_${ident}_yearMinus`" @click="changeYear(-1)">⏪</div>
          <div class="header-navbtn" :data-testid="`datepicker_${ident}_monthMinus`" @click="changeMonth(-1)">◀️</div>
        </div>
        <div class="header-title">
          {{ headerText }}
        </div>
        <div class="header-nav">
          <div class="header-navbtn" :data-testid="`datepicker_${ident}_monthPlus`" @click="changeMonth(1)">▶️</div>
          <div class="header-navbtn" :data-testid="`datepicker_${ident}_yearPlus`" @click="changeYear(1)">⏩</div>
        </div>
      </div>

      <div class="calendar-grid">
        <div v-for="day in daysOfWeek" :key="day" class="weekday">{{ t('dateTimePicker.dayOfWeek.'+day) }}</div>
        <div v-for="(pickableDay, index) in calendarDays"
          :key="index"
          class="day"
          :class="resolveDayClass(pickableDay)"
          :data-testid="`datepicker_${ident}_${index}`"
          @click="selectDay(pickableDay)">
          {{ pickableDay.day }}
        </div>
      </div>
    </div>
  </div>

</template>

<style scoped>
.picker {
  display: inline-block;
  position: relative;
  width: var(--datetimepicker-date-width);
  user-select: none;
}

/** Date input field. **/

.picker-input-date {
  width: var(--datetimepicker-date-width);
  cursor: pointer;
  caret-color: transparent;
  user-select: none;
}
.picker-input-date::selection {
  background: transparent; /** Prevents highlight when you double-click. */
}

.picker-input-date.disabled {
  cursor: default;
}

.picker-general.err .picker-input-date {
  color: var(--input-err-color);
  background: var(--input-err-background);
  border: var(--input-err-border);
}

/** Calendar panel to pick date. **/

.calendar-container {
  position: absolute;
  top: 100%;
  left: 0;

  margin: var(--datetimepicker-calendar-offset);
  padding: var(--spacing-sm);
  min-width: 280px;

  background: var(--datetimepicker-calendar-background);
  border: var(--datetimepicker-calendar-border);
  border-radius: var(--datetimepicker-calendar-border-radius);
  box-shadow: var(--datetimepicker-calendar-shadow);

  z-index: 1000;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.header-nav {
  display: flex;
}

.header-title {
  display: flex;
  gap: var(--spacing-xs);
  font-weight: bold;
}

.header-navbtn {
  filter: var(--datetimepicker-navbtn-filter);

  cursor: pointer;
}

.header-navbtn:hover {
  filter: var(--datetimepicker-navbtn-hover-filter);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
}

.weekday {
  font-weight: bold;
  font-size: 0.8em;
  padding-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
}

.day {
  margin: 1px;

  border-radius: 5px;

  color: var(--datetimepicker-day-color);
  cursor: pointer;
}

.day.not-current {
  color: var(--datetimepicker-day-notcurrent-color);
}

.day.today {
  color: var(--datetimepicker-day-today-color);
  background: var(--datetimepicker-day-today-background);
  box-shadow: var(--datetimepicker-day-today-shadow);
}

.day.selected {
  color: var(--datetimepicker-day-selected-color);
  background: var(--datetimepicker-day-selected-background);
}

.day:hover {
  color: var(--datetimepicker-day-hover-color);
  background: var(--datetimepicker-day-hover-background);
}

.day.today:not(.disabled):hover {
  color: var(--datetimepicker-day-hover-color);
  background: var(--datetimepicker-day-hover-background);
}

.day.disabled {
  border-radius: 0px;

  color: var(--datetimepicker-day-disabled-color);
  background: var(--datetimepicker-day-disabled-background);
  box-shadow: var(--datetimepicker-day-disabled-shadow);

  cursor: default;
}
</style>
