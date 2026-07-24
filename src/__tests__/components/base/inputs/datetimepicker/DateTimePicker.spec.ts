import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import DateTimePicker from '@/components/base/inputs/datetimepicker/DateTimePicker.vue';
import DatePicker from '@/components/base/inputs/datetimepicker/DatePicker.vue';
import TimePicker from '@/components/base/inputs/datetimepicker/TimePicker.vue';

//

/** Convenience function to create component. */
function createComponent(
  modelValue: Date | null,
  id: string,
  mode: 'date' | 'time' | 'datetime',
  allowNull: boolean,
  disabled: boolean,
  invalid: boolean,
  showWeeks: boolean,
  dateTimeMin?: Date | null,
  dateTimeMax?: Date | null,
) {
  return mount(DateTimePicker, {
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue,
      id,
      mode,
      allowNull,
      disabled,
      invalid,
      showWeeks,
      dateTimeMin,
      dateTimeMax,
    },
  });
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of DateTimePicker component. */
describe('DateTimePicker', () => {
  it('mode datetime', () => {
    // Ensure component shows DatePicker and TimePicker with correct params for 'datetime' mode.

    // Arrange: Set up date/time.
    vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
    const minDate: Date = new Date('2027-01-04T00:00:00Z');
    const maxDate: Date = new Date('2027-01-22T00:00:00Z');

    // Act: Create the component.
    const dateTimePicker = createComponent(
      null,
      'someDateTime',
      'datetime',
      false,
      true,
      false,
      false,
      minDate,
      maxDate,
    );

    // Assert: State of DatePicker is correct.
    const datePicker = dateTimePicker.findComponent(DatePicker);
    expect(datePicker.exists()).toBe(true);
    expect(datePicker.props('modelValue')).toBe(null);
    expect(datePicker.props('id')).toBe('someDateTime');
    expect(datePicker.props('allowNull')).toBe(false);
    expect(datePicker.props('disabled')).toBe(true);
    expect(datePicker.props('invalid')).toBe(false);
    expect(datePicker.props('showWeeks')).toBe(false);
    expect(datePicker.props('dateTimeMin')).toBe(minDate);
    expect(datePicker.props('dateTimeMax')).toBe(maxDate);

    // Assert: State of TimePicker is correct.
    const timePicker = dateTimePicker.findComponent(TimePicker);
    expect(timePicker.exists()).toBe(true);
    expect(timePicker.props('modelValue')).toBe(null);
    expect(timePicker.props('id')).toBe('tsomeDateTime'); // if both datePicker and timePicker are present, timePicker must have different id
    expect(timePicker.props('allowNull')).toBe(false);
    expect(timePicker.props('disabled')).toBe(true);
    expect(timePicker.props('invalid')).toBe(false);
  });

  it('mode date', () => {
    // Ensure component shows DatePicker and TimePicker with correct params for 'date' mode.

    // Arrange: Set up date/time.
    vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
    const someDate: Date = new Date('2027-01-10T00:00:00Z');

    // Act: Create the component.
    const dateTimePicker = createComponent(someDate, 'someDate', 'date', false, false, false, true);

    // Assert: State of DatePicker is correct.
    const datePicker = dateTimePicker.findComponent(DatePicker);
    expect(datePicker.exists()).toBe(true);
    expect(datePicker.props('modelValue')).toBe(someDate);
    expect(datePicker.props('id')).toBe('someDate');
    expect(datePicker.props('allowNull')).toBe(false);
    expect(datePicker.props('disabled')).toBe(false);
    expect(datePicker.props('invalid')).toBe(false);
    expect(datePicker.props('showWeeks')).toBe(true);
    expect(datePicker.props('dateTimeMin')).toBe(null);
    expect(datePicker.props('dateTimeMax')).toBe(null);

    // Assert: State of TimePicker is correct.
    const timePicker = dateTimePicker.findComponent(TimePicker);
    expect(timePicker.exists()).toBe(false);
  });

  it('mode time', () => {
    // Ensure component shows DatePicker and TimePicker with correct params for 'time' mode.

    // Arrange: Set up date/time.
    vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
    const someDate: Date = new Date('2027-01-10T00:00:00Z');

    // Act: Create the component.
    const dateTimePicker = createComponent(someDate, 'someTime', 'time', true, false, true, false);

    // Assert: State of DatePicker is correct.
    const datePicker = dateTimePicker.findComponent(DatePicker);
    expect(datePicker.exists()).toBe(false);

    // Assert: State of TimePicker is correct.
    const timePicker = dateTimePicker.findComponent(TimePicker);
    expect(timePicker.exists()).toBe(true);
    expect(timePicker.props('modelValue')).toBe(someDate);
    expect(timePicker.props('id')).toBe('someTime');
    expect(timePicker.props('allowNull')).toBe(true);
    expect(timePicker.props('disabled')).toBe(false);
    expect(timePicker.props('invalid')).toBe(true);
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Cross-panel coordination tests

  describe('cross-panel coordination', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // mock scrollIntoView() - jsdom does not implement it.
      Element.prototype.scrollIntoView = vi.fn<() => void>();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('closes date panel when time input receives focus', async () => {
      // Ensure date panel closes when user tabs from date picker to time picker.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Create the component with datetime mode.
      const dateTimePicker = createComponent(null, 'testDt', 'datetime', false, false, false, false);
      await nextTick();

      // Act: Click on date input to open calendar panel.
      const dateInput = dateTimePicker.find('#datepicker_testDt');
      await dateInput.trigger('click');
      await nextTick();

      // Assert: Calendar panel is visible.
      expect(dateTimePicker.find('.calendar-container').exists()).toBe(true);

      // Act: Focus the time input (simulates Tab from date picker).
      const timeInput = dateTimePicker.find('#timepicker_ttestDt');
      await timeInput.trigger('focusin');
      await nextTick();

      // Assert: Calendar panel is now closed.
      expect(dateTimePicker.find('.calendar-container').exists()).toBe(false);
    });

    it('closes time panel when date input receives focus', async () => {
      // Ensure time panel closes when user tabs from time picker to date picker.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Create the component with datetime mode.
      const dateTimePicker = createComponent(null, 'testDt', 'datetime', false, false, false, false);
      await nextTick();

      // Act: Click on time input to open clock panel.
      const timeInput = dateTimePicker.find('#timepicker_ttestDt');
      await timeInput.trigger('click');
      await nextTick();

      // Assert: Clock panel is visible.
      expect(dateTimePicker.find('.clock-container').exists()).toBe(true);

      // Act: Focus the date input (simulates Tab from time picker).
      const dateInput = dateTimePicker.find('#datepicker_testDt');
      await dateInput.trigger('focusin');
      await nextTick();

      // Assert: Clock panel is now closed.
      expect(dateTimePicker.find('.clock-container').exists()).toBe(false);
    });
  });
});
