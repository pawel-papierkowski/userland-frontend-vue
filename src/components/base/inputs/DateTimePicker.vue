<script setup lang="ts">
/** This is date&time picker. Uses Date class for both input and output. Features:
 * - Can pick date, time or both date and time.
 * - Accept null (not set) value.
 * - Input is not editable.
 */

import { ref, computed } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

import { TimeUtils } from '@/code/utils/TimeUtils';
import type { DatePick } from '@/code/data/general/datetime-types.ts';

const { t } = useI18n();

const currDateTime = defineModel<Date | null>({ required: true }); // Date and time.

const props = withDefaults(defineProps<{
  ident: string; // Used for identification.
  mode: 'date' | 'time' | 'datetime'; // Mode of operation.
  dateTimeMin?: Date|null; // If not null, defines earliest allowed date.
  dateTimeMax?: Date|null; // If not null, defines latest allowed date.
}>(), {
  dateTimeMin: null,
  dateTimeMax: null
});

const isPickerVisible = ref(false);
const pickerRef = ref(null);
const viewDate = ref(new Date()); // Date used for viewing month/year in picker.

onClickOutside(pickerRef, () => {
  isPickerVisible.value = false;
});

/** Compute currently displayed date value in date input. */
const displayDateValue = computed(() => {
  return TimeUtils.formatDate(currDateTime.value);
});

/** Compute current month name. */
const currentMonthName = computed(() => {
  const monthIx = viewDate.value.getMonth();
  return t('dateTimePicker.month.'+monthIx);
});

/** Compute current year. */
const currentYear = computed(() => viewDate.value.getFullYear());

const daysOfWeek = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** Recalculate days shown in calendar. */
const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth();

  const firstDay = TimeUtils.getFirstDayOfMonth(year, month);
  const daysInMonth = TimeUtils.getDaysInMonth(year, month);

  const days: DatePick[] = [];

  // Padding for previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
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
    const d = new Date(year, month + 1, i);
    days.push({
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      isCurrentMonth: false
    });
  }

  return days;
});

/** Toggle visibility of picker panel. */
const togglePicker = () => {
  if (isPickerVisible.value) {
    isPickerVisible.value = false;
  } else {
    // If null, set viewDate to current date
    viewDate.value = currDateTime.value ? new Date(currDateTime.value) : new Date();
    isPickerVisible.value = true;
  }
};

/**
 * Change current month.
 * @param delta How to change month.
 */
const changeMonth = (delta: number) => {
  const newDateTime = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + delta, 1);
  viewDate.value = newDateTime;
};

/**
 * Change current year.
 * @param delta How to change year.
 */
const changeYear = (delta: number) => {
  const newDateTime = new Date(viewDate.value.getFullYear() + delta, viewDate.value.getMonth(), 1);
  viewDate.value = newDateTime;
};

//

/**
 * Converts pickable day to Date (only year, month, day).
 * @param pickableDay Pickable day.
 * @returns Date.
 */
const pickableDayToDate = (pickableDay: DatePick): Date => {
  return new Date(pickableDay.year, pickableDay.month, pickableDay.day, 0, 0, 0, 0);
}

/**
 * Select day.
 * @param pickableDay Date.
 */
const selectDay = (pickableDay: DatePick) => {
  const newDate = pickableDayToDate(pickableDay);
  if (!canPick(newDate)) return;

  currDateTime.value = newDate;
  isPickerVisible.value = false;
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
const resolveClass = (pickableDay: DatePick) => {
  return {
    'not-current': !pickableDay.isCurrentMonth,
    'today': isToday(pickableDay),
    'selected': isSelected(pickableDay),
    'disabled': isDisabled(pickableDay)
  }
};

/**
 * Check if given date is today.
 * @param pickableDay Date.
 */
const isToday = (pickableDay: DatePick): boolean => {
  const today = new Date();
  return (
    pickableDay.day === today.getDate() &&
    pickableDay.month === today.getMonth() &&
    pickableDay.year === today.getFullYear()
  );
};

/**
 * Check if given date is selected.
 * @param pickableDay Date.
 */
const isSelected = (pickableDay: DatePick): boolean => {
  if (!currDateTime.value) return false;
  return (
    pickableDay.day === currDateTime.value.getDate() &&
    pickableDay.month === currDateTime.value.getMonth() &&
    pickableDay.year === currDateTime.value.getFullYear()
  );
};

/**
 * Check if given date cannot be picked.
 * @param pickableDay Date.
 */
const isDisabled = (pickableDay: DatePick): boolean => {
  const givenDay = pickableDayToDate(pickableDay);
  return !canPick(givenDay);
};
</script>

<template>
  <div class="picker" ref="pickerRef">
    <input
      :id="ident"
      :data-testid="ident"
      type="text"
      class="picker-input"
      :value="displayDateValue"
      readonly
      autocomplete="off"
      @click="togglePicker"
      :placeholder="t('dateTimePicker.placeholder')"
    />

    <div v-if="isPickerVisible" class="picker-container">
      <div class="picker-header">
        <div class="header-nav">
          <div class="header-navbtn" @click="changeYear(-1)">⏪</div>
          <div class="header-navbtn" @click="changeMonth(-1)">◀️</div>
        </div>
        <div class="header-title">
          <span class="year">{{ currentYear }}</span>
          <span class="month">{{ currentMonthName }}</span>
        </div>
        <div class="header-nav">
          <div class="header-navbtn" @click="changeMonth(1)">▶️</div>
          <div class="header-navbtn" @click="changeYear(1)">⏩</div>
        </div>
      </div>

      <div class="calendar-grid">
        <div v-for="day in daysOfWeek" :key="day" class="weekday">{{ t('dateTimePicker.dayOfWeek.'+day) }}</div>
        <div
          v-for="(pickableDay, index) in calendarDays"
          :key="index"
          class="day"
          :class="resolveClass(pickableDay)"
          @click="selectDay(pickableDay)"
        >
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
  width: 120px;
  user-select: none;
}

.picker-input {
  width: 120px;
  cursor: pointer;
  caret-color: transparent;
  user-select: none;
}
.picker-input::selection {
  background: transparent; /** Prevents highlight when you double-click. */
}

.picker-container {
  position: absolute;
  top: 100%;
  left: 0;

  margin-top: 2px;
  margin-left: 2px;
  padding: var(--spacing-sm);
  min-width: 280px;

  background: var(--datetimepicker-background);
  border: var(--datetimepicker-border);
  border-radius: var(--datetimepicker-border-radius);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  z-index: 1000;
}

.picker-header {
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
  gap: 5px;
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
  padding-bottom: 5px;
  color: var(--color-primary);
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

.day.selected {
  color: var(--datetimepicker-day-selected-color);
  background: var(--datetimepicker-day-selected-background);
}

.day.today {
  color: var(--datetimepicker-day-today-color);
  background: var(--datetimepicker-day-today-background);
  box-shadow: var(--datetimepicker-day-today-shadow);
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
