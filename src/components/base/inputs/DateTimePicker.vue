<script setup lang="ts">
/* This is date&time picker. Uses Date class for both input and output.

Features:
- Can pick date, time or both date and time.
- Accept null (not set) value.
- Input is not editable.

TODO: Right now it handles only date.

Properties:
- ident - Used for identification in form.
- mode - Mode of operation. Optional, default is datetime.
- disabled - If true, acts as disabled component (calendar panel does not show). Optional, default is false.
- dateTimeMin - If not null, defines earliest allowed date. Optional, default is null.
- dateTimeMax - If not null, defines latest allowed date. Optional, default is null.
*/

import { ref, computed, nextTick, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

import { TimeUtils } from '@/code/utils/TimeUtils';
import type { DatePick } from '@/code/data/general/datetime-types.ts';

const { t } = useI18n();

const currDateTime = defineModel<Date | null>({ required: true }); // Date and time. Null means it is unset.

const props = withDefaults(defineProps<{
  ident: string;
  mode?: 'date' | 'time' | 'datetime';
  disabled?: boolean,
  dateTimeMin?: Date|null;
  dateTimeMax?: Date|null;
}>(), {
  mode: 'datetime',
  disabled: false,
  dateTimeMin: null,
  dateTimeMax: null
});

const isCalendarVisible = ref(false);
const pickerRef = ref(null);
const calendarContainerRef = ref<HTMLElement | null>(null);
const viewDate = ref(new Date()); // Date used for viewing month/year in picker.

const containerStyle = ref({
  left: '0',
  right: 'auto'
});

onClickOutside(pickerRef, () => {
  isCalendarVisible.value = false;
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

/** If you disable picker, calendar panel will close. */
watch(() => props.disabled, () => {
  if (props.disabled) isCalendarVisible.value = false;
});

/** Toggle visibility of picker panel. */
const toggleVisibility = async () => {
  if (isCalendarVisible.value) {
    isCalendarVisible.value = false;
  } else {
    // If null, set viewDate to current date
    viewDate.value = currDateTime.value ? new Date(currDateTime.value) : new Date();
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

  if (TimeUtils.formatDate(currDateTime.value) === TimeUtils.formatDate(newDate)) {
    // Deselect.
    currDateTime.value = null;
  } else {
    // Select.
    currDateTime.value = newDate;
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
const resolveClass = (pickableDay: DatePick) => {
  return {
    'not-current': !pickableDay.isCurrentMonth,
    'today': isToday(pickableDay),
    'selected': isSelected(pickableDay),
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
const isDayDisabled = (pickableDay: DatePick): boolean => {
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
      :disabled="disabled"
      autocomplete="off"
      @click="toggleVisibility"
      :placeholder="t('dateTimePicker.placeholder')"
    />

    <div v-if="isCalendarVisible" class="calendar-container" ref="calendarContainerRef" :style="containerStyle">
      <div class="calendar-header">
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
  width: var(--datetimepicker-width);
  user-select: none;
}

.picker-input {
  width: var(--datetimepicker-width);
  cursor: pointer;
  caret-color: transparent;
  user-select: none;
}
.picker-input::selection {
  background: transparent; /** Prevents highlight when you double-click. */
}

.calendar-container {
  position: absolute;
  top: 100%;
  left: 0;

  margin: var(--datetimepicker-offset);
  padding: var(--spacing-sm);
  min-width: 280px;

  background: var(--datetimepicker-background);
  border: var(--datetimepicker-border);
  border-radius: var(--datetimepicker-border-radius);
  box-shadow: var(--datetimepicker-shadow);

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
