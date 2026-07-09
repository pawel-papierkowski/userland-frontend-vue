import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

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
    const dateTimePicker = createComponent(null, 'someDateTime', 'datetime', false, true, false, false, minDate, maxDate);

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
    expect(timePicker.props('id')).toBe('someDateTime');
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
});
