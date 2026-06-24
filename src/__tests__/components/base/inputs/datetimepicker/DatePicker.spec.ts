import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import DatePicker from '@/components/base/inputs/datetimepicker/DatePicker.vue';

//

/** Boilerplate code. */
function createComponent(initialModel: Date|null, disabled?: boolean, dateTimeMin?: Date|null, dateTimeMax?: Date|null) {
  return mount(DatePicker, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: initialModel,
        disabled: disabled,
        dateTimeMin: dateTimeMin,
        dateTimeMax: dateTimeMax,
      }
    });
}

//

/** Tests of DatePicker component. */
describe('DatePicker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  //

  it('has correct presentation when null', async () => {
    // Ensures component looks correct when current value is null.

    // Arrange & Act: Create the component.
    const datePicker = createComponent(null, false);

    // Assert: Input is empty.
    expect(datePicker.find('.picker-input-date').attributes('value')).toBeUndefined();

    // Assert: Ensure panel is not present.
    expect(datePicker.find('.calendar-container').exists()).toBe(false);
  });

  //

  it('has correct presentation when set in general', async () => {
    // Ensures component looks correct when current value is set.

    // Arrange & Act: Create the component.
    const someDate: Date = new Date('2026-05-22T23:50:00Z'); // UTC
    const datePicker = createComponent(someDate, false);

    // Assert: Input is filled. Note it shows date in local timezone.
    expect(datePicker.find('.picker-input-date').attributes('value')).toBe('📅 2026-05-23');

    // Assert: Ensure panel is not present.
    expect(datePicker.find('.calendar-container').exists()).toBe(false);
  });

  it('has correct presentation when set and with panel opened', async () => {
    // Ensures component looks correct when panel is opened.

    // Arrange: Set up date/time.
    vi.setSystemTime(new Date('2026-05-21T12:10:00Z'));
    const someDate: Date = new Date('2026-05-22T19:30:00Z'); // UTC

    // Act: Create the component.
    const datePicker = createComponent(someDate, false);

    // Act: Open calendar panel.
    await datePicker.find('.picker-input-date').trigger('click');
    await nextTick();

    // Assert: Ensure panel is present.
    expect(datePicker.find('.calendar-container').exists()).toBe(true);

    // Assert: Panel shows calendar with all days for given month (May).

    // Assert: Correct day is shown as selected.

    // Assert: Correct day is shown as current.

  });

  //

  it('selects date', async () => {
    // Ensures component correctly selects date.

    // TODO
  });

  it('is disabled', async () => {
    // Ensures component behaves correctly when disabled.

    // Arrange & Act: Create the component.
    const someDate: Date = new Date('2026-05-22T23:50:00Z'); // UTC
    const datePicker = createComponent(someDate, true);

    // Act: Open calendar panel.
    await datePicker.find('.picker-input-date').trigger('click');
    await nextTick();

    // Assert: Ensure panel is NOT present, as component is disabled.
    expect(datePicker.find('.calendar-container').exists()).toBe(false);
  });
});
