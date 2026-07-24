<script setup lang="ts">
/** Dedicated date picker. Do not use it directly. Use DateTimePicker with attribute mode="date".
 * Note it is timezone-agnostic. You are one to adjust result to timezone etc. as needed.
 *
 * Features:
 * - Can select date.
 * - Can disable or mark as invalid. You also can constraint selectable dates to specified min/max range.
 * - Accept null (not set) value.
 * - Input field is not editable. You set value via calendar panel.
 * - Keyboard navigation via arrows (open panel or change day/month), enter/space (pick date) and esc (close panel).
 * - Supports WAI-ARIA.
 *
 * Models:
 * - v-model - Currently selected date and time. Null means it is unset. Note it is processed as-is.
 *   You are one to adjust result to timezone etc. when setting or after getting result.
 *
 * Properties:
 * - id - Used for identification and id attribute in focusable element (so <label> etc. work properly). Optional.
 * - allowNull - If true, allow deselecting date. Optional, default is false.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 * - invalid - If true, shows component as having invalid state. Visual only. Optional, default is false.
 * - showWeeks - If true, show week numbers. Optional, default is false.
 * - dateTimeMin - If not null, defines earliest allowed date. Optional, default is null.
 * - dateTimeMax - If not null, defines latest allowed date. Optional, default is null.
 */
import { ref, computed, nextTick, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

import { TimeUtils } from '@/code/utils/TimeUtils.ts';
import { NavUtils } from '@/code/utils/NavUtils.ts';
import { EnCalendarCellType } from '@/code/data/general/datetime-types.ts';
import type { CalendarCell } from '@/code/data/general/datetime-types.ts';

const { t } = useI18n();

/** Currently selected date and time. Null means it is unset. */
const selDateTime = defineModel<Date | null>({ required: true });

const props = withDefaults(
  defineProps<{
    /** Used for identification and id attribute in focusable element (so <label> etc. work properly). Optional. */
    id?: string;
    /** If true, allow deselecting date. Optional, default is false. */
    allowNull?: boolean;
    /** If true, acts as disabled component (calendar panel does not show). Optional, default is false. */
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
    allowNull: false,
    disabled: false,
    invalid: false,
    showWeeks: false,
    dateTimeMin: null,
    dateTimeMax: null,
  },
);

const isCalendarVisible = ref(false);
const pickerRef = ref<HTMLElement | null>(null);
const calendarContainerRef = ref<HTMLElement | null>(null);
const viewDate = ref(new Date()); // Date used for viewing month/year in calendar.
const focusedDate = ref<Date | null>(null); // Date under keyboard focus within the calendar grid.
const calendarGridRef = ref<HTMLElement | null>(null); // Ref for the calendar grid element (for keyboard focus).

const containerStyle = ref({
  left: '0',
  right: 'auto',
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
  return viewDate.value.getUTCFullYear() + ' ' + t('dateTimePicker.month.' + monthIx);
});

/** Shortcuts for days of week used in lang keys. */
const daysOfWeek = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// COMPUTED

/** Find out amount of columns needed for calendar. */
const gridColumns = computed(() => (props.showWeeks ? 8 : 7));
/** Find out grid style. */
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gridColumns.value || 7}, 1fr)`,
}));

/** Compute ID of the focused cell for aria-activedescendant. */
const activeDescendantId = computed(() => {
  if (!focusedDate.value) return undefined;
  const index = calendarCells.value.findIndex(
    (cell) =>
      cell.type === EnCalendarCellType.Date &&
      cell.day === focusedDate.value!.getUTCDate() &&
      cell.month === focusedDate.value!.getUTCMonth() &&
      cell.year === focusedDate.value!.getUTCFullYear(),
  );
  return index >= 0 ? `datepicker_${props.id}_cell_${index}` : undefined;
});

/** Recalculate cells shown in calendar. */
const calendarCells = computed(() => {
  return calcCalendarCells();
});

// WATCHES

/** If you disable picker, panel will close. */
watch(
  () => props.disabled,
  () => {
    if (props.disabled) hidePanel();
  },
);

// FUNCTIONS.

/** Handle click. */
const handleClick = async (viaKeyboard: boolean) => {
  if (props.disabled) return;
  toggleDatePickerVisibility(viaKeyboard);
};

/** Toggle visibility of date picker panel. */
const toggleDatePickerVisibility = async (viaKeyboard: boolean) => {
  if (isCalendarVisible.value) {
    hidePanel();
  } else {
    // If selected date is null, set viewDate to current date (as in system date of computer).
    viewDate.value = selDateTime.value ? new Date(selDateTime.value) : new Date();
    isCalendarVisible.value = true;

    // Initialize keyboard focus state.
    if (viaKeyboard) {
      setupFocus(true);
    }

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

    // Move keyboard focus into the grid so user can navigate immediately.
    calendarGridRef.value?.focus();
  }
};

//

/**
 * Calculate cells for calendar.
 * @returns Array of cells for entire calendar.
 */
const calcCalendarCells = (): CalendarCell[] => {
  const cells: CalendarCell[] = calcDays();

  if (props.showWeeks) {
    // insert week number cells, always six weeks
    for (let i = 0; i < 6; i++) {
      const dayIx = i * 8; // always at monday, will be used for splicing at end
      const firstDayOfWeek: CalendarCell = cells[dayIx]!;
      // Show week number properly at week common for both years depending on which year is in focus.
      // For example, last week of December will be (usually) 53th week, while first week of January (exactly same week as last week of December)
      // is always 1st week.
      const dayOfWeekIx = viewDate.value.getUTCFullYear() === firstDayOfWeek.year ? dayIx : dayIx + 6;
      const lastDayOfWeek: CalendarCell = cells[dayOfWeekIx]!;

      const weekNumber = TimeUtils.getWeekNumber(lastDayOfWeek.year, lastDayOfWeek.month, lastDayOfWeek.day);
      const weekCell: CalendarCell = {
        testid: `datepicker_${props.id}_w${weekNumber}`,
        type: EnCalendarCellType.Week,
        day: weekNumber,
        month: 0,
        year: 0,
        isCurrentMonth: false,
      };
      cells.splice(dayIx, 0, weekCell);
    }
  }
  return cells;
};

/**
 * Calculate days for calendar.
 * @returns Array of cells for entire calendar.
 */
const calcDays = (): CalendarCell[] => {
  const year = viewDate.value.getUTCFullYear();
  const month = viewDate.value.getUTCMonth();

  const firstDay = TimeUtils.getUTCFirstDayOfMonth(year, month);
  const daysInMonth = TimeUtils.getUTCDaysInMonth(year, month);

  const days: CalendarCell[] = [];
  let ix = 0;

  // Padding for previous month. Note that if month has first day on monday, entire previous week will be shown.
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month, -i));
    days.push({
      testid: `datepicker_${props.id}_${ix}`,
      type: EnCalendarCellType.Date,
      day: d.getUTCDate(),
      month: d.getUTCMonth(),
      year: d.getUTCFullYear(),
      isCurrentMonth: false,
    });
    ix++;
  }

  // Current month days.
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      testid: `datepicker_${props.id}_${ix}`,
      type: EnCalendarCellType.Date,
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
    });
    ix++;
  }

  // Padding for next month
  const remainingCells = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(Date.UTC(year, month + 1, i));
    days.push({
      testid: `datepicker_${props.id}_${ix}`,
      type: EnCalendarCellType.Date,
      day: d.getUTCDate(),
      month: d.getUTCMonth(),
      year: d.getUTCFullYear(),
      isCurrentMonth: false,
    });
    ix++;
  }

  return days;
};

//

/**
 * Change current month.
 * @param delta How to change month.
 */
const changeMonth = (delta: number) => {
  const newDateTime = new Date(Date.UTC(viewDate.value.getUTCFullYear(), viewDate.value.getUTCMonth() + delta, 1));
  viewDate.value = newDateTime;
};

/**
 * Change current year.
 * @param delta How to change year.
 */
const changeYear = (delta: number) => {
  const newDateTime = new Date(Date.UTC(viewDate.value.getUTCFullYear() + delta, viewDate.value.getUTCMonth(), 1));
  viewDate.value = newDateTime;
};

//

/**
 * Converts pickable day to Date (only year, month, day).
 * @param pickableDay Pickable day.
 * @returns Date.
 */
const calendarCellToDate = (pickableDay: CalendarCell): Date => {
  return new Date(Date.UTC(pickableDay.year, pickableDay.month, pickableDay.day, 0, 0, 0, 0));
};

/**
 * Select a specific date (shared by click and keyboard).
 * @param date Date to select.
 */
const selectDate = (date: Date) => {
  if (props.disabled) return;
  if (!canPick(date)) return;

  const newDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));

  if (
    selDateTime.value &&
    selDateTime.value.getUTCFullYear() === newDate.getUTCFullYear() &&
    selDateTime.value.getUTCMonth() === newDate.getUTCMonth() &&
    selDateTime.value.getUTCDate() === newDate.getUTCDate()
  ) {
    // Selected same date again, deselect date.
    if (props.allowNull) selDateTime.value = null;
    else return;
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
  // Hide calendar panel.
  isCalendarVisible.value = false;
};

/**
 * User clicks cell in calendar.
 * @param calendarCell Calendar cell that was clicked.
 */
const selectCell = (calendarCell: CalendarCell) => {
  if (calendarCell.type !== EnCalendarCellType.Date) return;
  selectDate(calendarCellToDate(calendarCell));
};

const canPick = (date: Date): boolean => {
  if (props.dateTimeMin != null && date < props.dateTimeMin) return false;
  if (props.dateTimeMax != null && date > props.dateTimeMax) return false;
  return true;
};

//

/**
 * Find out class of calendar cell in calendar grid.
 * @param calendarCell Calendar cell.
 */
const resolveCellClass = (calendarCell: CalendarCell) => {
  if (calendarCell.type === EnCalendarCellType.Week) return { weekNum: true };
  return {
    day: true,
    'not-current': !calendarCell.isCurrentMonth,
    today: isToday(calendarCell),
    selected: isDaySelected(calendarCell),
    disabled: isDayDisabled(calendarCell),
    focused: isFocused(calendarCell),
  };
};

/**
 * Check if given date is today.
 * @param calendarCell Calendar cell. Must be Date.
 */
const isToday = (calendarCell: CalendarCell): boolean => {
  if (calendarCell.type !== EnCalendarCellType.Date) return false;
  const today = new Date();
  return (
    calendarCell.day === today.getUTCDate() &&
    calendarCell.month === today.getUTCMonth() &&
    calendarCell.year === today.getUTCFullYear()
  );
};

/**
 * Check if given date is selected.
 * @param calendarCell Calendar cell. Must be Date.
 */
const isDaySelected = (calendarCell: CalendarCell): boolean => {
  if (calendarCell.type !== EnCalendarCellType.Date) return false;
  if (!selDateTime.value) return false;
  return (
    calendarCell.day === selDateTime.value.getUTCDate() &&
    calendarCell.month === selDateTime.value.getUTCMonth() &&
    calendarCell.year === selDateTime.value.getUTCFullYear()
  );
};

/**
 * Check if given date cannot be picked.
 * @param calendarCell Calendar cell. Must be Date.
 */
const isDayDisabled = (calendarCell: CalendarCell): boolean => {
  if (calendarCell.type !== EnCalendarCellType.Date) return false;
  const givenDay = calendarCellToDate(calendarCell);
  return !canPick(givenDay);
};

/**
 * Check if given date is keyboard-focused.
 * @param calendarCell Calendar cell. Must be Date.
 */
const isFocused = (calendarCell: CalendarCell): boolean => {
  if (!focusedDate.value || calendarCell.type !== EnCalendarCellType.Date) return false;
  return (
    calendarCell.day === focusedDate.value.getUTCDate() &&
    calendarCell.month === focusedDate.value.getUTCMonth() &&
    calendarCell.year === focusedDate.value.getUTCFullYear()
  );
};

// KEYBOARD HANDLERS

/** Handle keyboard on the input. */
const onInputKeydown = (e: KeyboardEvent) => {
  if (props.disabled) return;

  if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
    e.preventDefault();
    if (!isCalendarVisible.value) toggleDatePickerVisibility(true);
  } else if (e.key === 'Escape' && isCalendarVisible.value) {
    e.preventDefault();
    hidePanel();
  }
};

/**
 * Set up focus values.
 * @param force If true, will override focused value. If false, will set focused value only if null.
 */
const setupFocus = (force: boolean) => {
  if (force || focusedDate.value === null)
    focusedDate.value = selDateTime.value ? new Date(selDateTime.value) : new Date();
};

/**
 * If navigation moves to a different month, update viewDate to show that month.
 * @param date The date to ensure is visible.
 */
const ensureViewShows = (date: Date) => {
  const viewYear = viewDate.value.getUTCFullYear();
  const viewMonth = viewDate.value.getUTCMonth();
  if (date.getUTCFullYear() !== viewYear || date.getUTCMonth() !== viewMonth) {
    viewDate.value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }
};

/** Handle keyboard on the calendar grid. */
const onGridKeydown = (e: KeyboardEvent) => {
  if (props.disabled) return;

  // If no focus is set yet (panel opened via click), set it now without doing anything else.
  if (focusedDate.value === null) {
    if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key === 'PageUp' ||
      e.key === 'PageDown' ||
      e.key === 'Enter' ||
      e.key === ' '
    ) {
      e.preventDefault();
      setupFocus(false);
      return;
    }
  }

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      shiftFocus(-1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      shiftFocus(1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      shiftFocus(-7);
      break;
    case 'ArrowDown':
      e.preventDefault();
      shiftFocus(7);
      break;
    case 'Home':
      e.preventDefault();
      focusedDate.value = new Date(Date.UTC(viewDate.value.getUTCFullYear(), viewDate.value.getUTCMonth(), 1));
      break;
    case 'End':
      e.preventDefault();
      focusedDate.value = new Date(
        Date.UTC(
          viewDate.value.getUTCFullYear(),
          viewDate.value.getUTCMonth(),
          TimeUtils.getUTCDaysInMonth(viewDate.value.getUTCFullYear(), viewDate.value.getUTCMonth()),
        ),
      );
      break;
    case 'PageUp':
      e.preventDefault();
      changeMonth(-1);
      if (focusedDate.value) {
        const newDate = new Date(focusedDate.value);
        newDate.setUTCMonth(newDate.getUTCMonth() - 1);
        focusedDate.value = newDate;
      }
      break;
    case 'PageDown':
      e.preventDefault();
      changeMonth(1);
      if (focusedDate.value) {
        const newDate = new Date(focusedDate.value);
        newDate.setUTCMonth(newDate.getUTCMonth() + 1);
        focusedDate.value = newDate;
      }
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      keyPressSelectDate();
      break;
    case 'Escape':
      e.preventDefault();
      hidePanelAndRefocus();
      break;
  }
};

/**
 * Helper to shift focusedDate by a number of days.
 * @param days Number of days to move by.
 */
const shiftFocus = (days: number) => {
  const newDate = new Date(focusedDate.value!);
  newDate.setUTCDate(newDate.getUTCDate() + days);
  ensureViewShows(newDate);
  focusedDate.value = newDate;
};

//

/** React on selecting date via key press. */
const keyPressSelectDate = () => {
  if (focusedDate.value) {
    const prevDateTime = selDateTime.value;
    selectDate(focusedDate.value);
    nextTick(() => {
      // Only close and refocus if the selection actually changed (or was cleared).
      if (selDateTime.value !== prevDateTime) hidePanelAndFocusNext();
    });
  }
};

// UTILITIES.

/** Hide panel. Also removes focus. */
const hidePanel = () => {
  isCalendarVisible.value = false;
  focusedDate.value = null;
};

/** Hide panel and return focus to the input. */
const hidePanelAndRefocus = () => {
  hidePanel();
  nextTick(() => {
    const inputEl = document.getElementById(`datepicker_${props.id}`);
    inputEl?.focus();
  });
};

/** Hide panel and move focus to the next focusable element on page. */
const hidePanelAndFocusNext = () => {
  hidePanel();
  nextTick(() => {
    const inputEl = document.getElementById(`datepicker_${props.id}`);
    NavUtils.FocusNext(inputEl);
  });
};
</script>

<template>
  <div class="picker-date" ref="pickerRef">
    <input
      :id="`datepicker_${id}`"
      type="text"
      :data-testid="`datepicker_${id}`"
      class="picker-input-date"
      :class="{ disabled: disabled, err: invalid }"
      :value="displayDateValue"
      :placeholder="placeholderDateValue"
      :disabled="disabled"
      readonly
      autocomplete="off"
      role="combobox"
      :tabindex="disabled ? -1 : 0"
      aria-haspopup="dialog"
      :aria-expanded="isCalendarVisible"
      :aria-controls="`datepicker_${id}_panel`"
      :aria-label="t('dateTimePicker.placeholder.date')"
      :aria-disabled="disabled || undefined"
      @click="handleClick(false)"
      @keydown="onInputKeydown"
    />

    <!-- Date picker: calendar panel. -->
    <div
      v-if="isCalendarVisible"
      :id="`datepicker_${id}_panel`"
      class="calendar-container"
      ref="calendarContainerRef"
      role="dialog"
      :aria-label="t('dateTimePicker.placeholder.date')"
      aria-modal="true"
      :style="containerStyle"
    >
      <div class="calendar-header">
        <div class="header-nav">
          <div
            class="header-navbtn"
            :data-testid="`datepicker_${id}_yearMinus`"
            :aria-label="`${t('dateTimePicker.yearMinus')}`"
            @click="changeYear(-1)"
          >
            ⏪
          </div>
          <div
            class="header-navbtn"
            :data-testid="`datepicker_${id}_monthMinus`"
            :aria-label="`${t('dateTimePicker.monthMinus')}`"
            @click="changeMonth(-1)"
          >
            ◀️
          </div>
        </div>
        <div class="header-title" aria-live="polite">
          {{ headerText }}
        </div>
        <div class="header-nav">
          <div
            class="header-navbtn"
            :data-testid="`datepicker_${id}_monthPlus`"
            :aria-label="`${t('dateTimePicker.monthPlus')}`"
            @click="changeMonth(1)"
          >
            ▶️
          </div>
          <div
            class="header-navbtn"
            :data-testid="`datepicker_${id}_yearPlus`"
            :aria-label="`${t('dateTimePicker.yearPlus')}`"
            @click="changeYear(1)"
          >
            ⏩
          </div>
        </div>
      </div>

      <div
        class="calendar-grid"
        ref="calendarGridRef"
        tabindex="0"
        :style="gridStyle"
        role="grid"
        :aria-label="headerText"
        :aria-activedescendant="activeDescendantId"
        @keydown="onGridKeydown"
      >
        <!-- This row shows days of week. -->
        <div v-if="showWeeks" aria-hidden="true"></div>
        <div v-for="day in daysOfWeek" :key="day" class="weekday" aria-hidden="true">
          {{ t('dateTimePicker.dayOfWeek.' + day) }}
        </div>

        <div
          v-for="(calendarCell, index) in calendarCells"
          :key="index"
          :class="resolveCellClass(calendarCell)"
          :id="calendarCell.type === EnCalendarCellType.Date ? `datepicker_${id}_cell_${index}` : undefined"
          role="gridcell"
          :aria-selected="calendarCell.type === EnCalendarCellType.Date ? isDaySelected(calendarCell) : undefined"
          :aria-disabled="
            calendarCell.type === EnCalendarCellType.Date ? isDayDisabled(calendarCell) || undefined : undefined
          "
          :aria-label="
            calendarCell.type === EnCalendarCellType.Date
              ? `${calendarCell.year} ${t('dateTimePicker.month.' + calendarCell.month)} ${calendarCell.day}`
              : undefined
          "
          :data-testid="calendarCell.testid"
          @click="selectCell(calendarCell)"
        >
          {{ calendarCell.day }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker-date {
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
.picker-input-date:focus-visible {
  outline: var(--focus-outline);
  outline-offset: var(--focus-outline-offset);
}

.picker-input-date::selection {
  background: transparent; /** Prevents highlight when you double-click. */
}

.picker-input-date.disabled {
  cursor: default;
}

.picker.err .picker-input-date {
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

.picker.err .calendar-container {
  background: var(--datetimepicker-calendar-err-background);
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
  grid-template-columns: repeat(7, 1fr); /* Will be overridden. */
  text-align: center;
}

/** Suppress native focus ring on the grid container itself (we use aria-activedescendant). */
.calendar-grid:focus-visible {
  outline: none;
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

/** Keyboard-focus ring on the active day cell. */
.day.focused {
  outline: var(--focus-outline);
  outline-offset: var(--focus-outline-offset);
}

.weekNum {
  margin: 1px;

  border-radius: 5px;

  color: var(--datetimepicker-week-color);
  background: var(--datetimepicker-week-background);
}
</style>
