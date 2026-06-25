import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
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

/**
 * Verify state of calendar panel.
 * @param datePicker Date picker.
 * @param headerTitle Content of header title.
 * @param calendarState Expected calendar state as array of days in calendar table.
 */
function verifyPanel(datePicker: VueWrapper, headerTitle: string, calendarState: {day: string, class: string[]}[]) {
  const headerElement = datePicker.find('.header-title');
  expect(headerElement.text()).toEqual(headerTitle);

  const calendarSize = 42; // Calendar always have 42 cells (6 rows * 7 days).
  const dayElements = datePicker.findAll('.day');
  expect(dayElements).toHaveLength(calendarSize);
  expect(calendarState.length).toBe(calendarSize);

  for (let i=0; i<calendarSize; i++) {
    const dayElement = datePicker.find(`[data-testid="datepicker__${i}"]`);
    const calendarDay: {day: string, class: string[]}|null = calendarState[i] || null;

    expect(dayElement.text(), `Day elem ix=${i} text is wrong`).toEqual(calendarDay?.day);
    expect(dayElement.classes(), `Day elem ix=${i} classes are wrong`).toEqual(calendarDay?.class);
  }
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

  it('has correct presentation when null in general', async () => {
    // Ensures component looks correct when current value is null.

    // Arrange: Set up date/time.
    vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

    // Act: Create the component.
    const datePicker = createComponent(null, false);

    // Assert: Input is empty.
    expect(datePicker.find('.picker-input-date').attributes('value')).toBeUndefined();

    // Assert: Ensure panel is not present.
    expect(datePicker.find('.calendar-container').exists()).toBe(false);

    // Assert: model has correct value.
    const model = datePicker.props('modelValue') as Date|null;
    expect(model).toBe(null);
  });

  it('has correct presentation when null and with panel opened', async () => {
    // Ensures component looks correct when panel is opened.

    // Arrange: Set up date/time.
    vi.setSystemTime(new Date('2026-02-21T12:10:00Z'));

    // Act: Create the component.
    const datePicker = createComponent(null, false);

    // Act: Open calendar panel.
    await datePicker.find('.picker-input-date').trigger('click');
    await nextTick();

    // Assert: Ensure panel is present.
    expect(datePicker.find('.calendar-container').exists()).toBe(true);

    // Assert: Panel shows calendar with all days for given month (February).
    const calendarState: {day: string, class: string[]}[] = [
      {day: '26', class: ["day", "not-current"]},
      {day: '27', class: ["day", "not-current"]},
      {day: '28', class: ["day", "not-current"]},
      {day: '29', class: ["day", "not-current"]},
      {day: '30', class: ["day", "not-current"]},
      {day: '31', class: ["day", "not-current"]},
      {day: '1', class: ["day"]},
      {day: '2', class: ["day"]},
      {day: '3', class: ["day"]},
      {day: '4', class: ["day"]},
      {day: '5', class: ["day"]},
      {day: '6', class: ["day"]},
      {day: '7', class: ["day"]},
      {day: '8', class: ["day"]},
      {day: '9', class: ["day"]},
      {day: '10', class: ["day"]},
      {day: '11', class: ["day"]},
      {day: '12', class: ["day"]},
      {day: '13', class: ["day"]},
      {day: '14', class: ["day"]},
      {day: '15', class: ["day"]},
      {day: '16', class: ["day"]},
      {day: '17', class: ["day"]},
      {day: '18', class: ["day"]},
      {day: '19', class: ["day"]},
      {day: '20', class: ["day"]},
      {day: '21', class: ["day", "today"]},
      {day: '22', class: ["day"]},
      {day: '23', class: ["day"]},
      {day: '24', class: ["day"]},
      {day: '25', class: ["day"]},
      {day: '26', class: ["day"]},
      {day: '27', class: ["day"]},
      {day: '28', class: ["day"]},
      {day: '1', class: ["day", "not-current"]},
      {day: '2', class: ["day", "not-current"]},
      {day: '3', class: ["day", "not-current"]},
      {day: '4', class: ["day", "not-current"]},
      {day: '5', class: ["day", "not-current"]},
      {day: '6', class: ["day", "not-current"]},
      {day: '7', class: ["day", "not-current"]},
      {day: '8', class: ["day", "not-current"]},
    ];
    verifyPanel(datePicker, '2026 February', calendarState);
  });

  //

  it('has correct presentation when set in general', async () => {
    // Ensures component looks correct when current value is set.

    // Arrange: Set up date/time.
    vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
    const someDate: Date = new Date('2026-05-22T23:50:00Z');

    // Act: Create the component.
    const datePicker = createComponent(someDate, false);

    // Assert: Input is filled.
    expect(datePicker.find('.picker-input-date').attributes('value')).toBe('📅 2026-05-22');

    // Assert: Ensure panel is not present.
    expect(datePicker.find('.calendar-container').exists()).toBe(false);

    // Assert: model has correct value.
    const model = datePicker.props('modelValue') as Date|null;
    expect(model?.getUTCFullYear()).toBe(2026);
    expect(model?.getUTCMonth()).toBe(4); // reminder that months are 0 indexed
    expect(model?.getUTCDate()).toBe(22);
    expect(model?.getUTCHours()).toBe(23); // time is untouched
    expect(model?.getUTCMinutes()).toBe(50);
    expect(model?.getUTCSeconds()).toBe(0);
    expect(model?.getUTCMilliseconds()).toBe(0);
  });

  it('has correct presentation when set and with panel opened', async () => {
    // Ensures component looks correct when panel is opened.

    // Arrange: Set up date/time.
    vi.setSystemTime(new Date('2026-07-03T12:10:00Z'));
    const someDate: Date = new Date('2026-06-15T19:30:00Z');

    // Act: Create the component.
    const datePicker = createComponent(someDate, false);

    // Act: Open calendar panel.
    await datePicker.find('.picker-input-date').trigger('click');
    await nextTick();

    // Assert: Ensure panel is present.
    expect(datePicker.find('.calendar-container').exists()).toBe(true);

    // Assert: Panel shows calendar with all days for given month (June).
    const calendarState: {day:string, class: string[]}[] = [
      {day: '25', class: ["day", "not-current"]},
      {day: '26', class: ["day", "not-current"]},
      {day: '27', class: ["day", "not-current"]},
      {day: '28', class: ["day", "not-current"]},
      {day: '29', class: ["day", "not-current"]},
      {day: '30', class: ["day", "not-current"]},
      {day: '31', class: ["day", "not-current"]},
      {day: '1', class: ["day"]},
      {day: '2', class: ["day"]},
      {day: '3', class: ["day"]},
      {day: '4', class: ["day"]},
      {day: '5', class: ["day"]},
      {day: '6', class: ["day"]},
      {day: '7', class: ["day"]},
      {day: '8', class: ["day"]},
      {day: '9', class: ["day"]},
      {day: '10', class: ["day"]},
      {day: '11', class: ["day"]},
      {day: '12', class: ["day"]},
      {day: '13', class: ["day"]},
      {day: '14', class: ["day"]},
      {day: '15', class: ["day", "selected"]},
      {day: '16', class: ["day"]},
      {day: '17', class: ["day"]},
      {day: '18', class: ["day"]},
      {day: '19', class: ["day"]},
      {day: '20', class: ["day"]},
      {day: '21', class: ["day"]},
      {day: '22', class: ["day"]},
      {day: '23', class: ["day"]},
      {day: '24', class: ["day"]},
      {day: '25', class: ["day"]},
      {day: '26', class: ["day"]},
      {day: '27', class: ["day"]},
      {day: '28', class: ["day"]},
      {day: '29', class: ["day"]},
      {day: '30', class: ["day"]},
      {day: '1', class: ["day", "not-current"]},
      {day: '2', class: ["day", "not-current"]},
      {day: '3', class: ["day", "not-current", "today"]},
      {day: '4', class: ["day", "not-current"]},
      {day: '5', class: ["day", "not-current"]},
    ];
    verifyPanel(datePicker, '2026 June', calendarState);
  });

  //

  it('selects date', async () => {
    // Ensures component correctly selects date.

    // Arrange: Set up date/time.
    vi.setSystemTime(new Date('2026-02-21T12:10:00Z'));

    // Act: Create the component.
    const datePicker = createComponent(null, false);

    // Act: Open calendar panel.
    await datePicker.find('.picker-input-date').trigger('click');
    await nextTick();

    // Act: Change year. Now it is 2025-02.
    await datePicker.find('[data-testid="datepicker__yearMinus"]').trigger('click');
    await nextTick();

    // Act: Change month. Now it is 2025-03.
    await datePicker.find('[data-testid="datepicker__monthPlus"]').trigger('click');
    await nextTick();

    // Act: Select day. Now it is 2025-03-15.
    await datePicker.find('[data-testid="datepicker__19"]').trigger('click');
    await nextTick();

    // Assert: date&time from component is correct.
    const emitted = datePicker.emitted('update:modelValue');
    expect(emitted).toHaveLength(1);
    const result = emitted?.at(0)![0] as Date;
    expect(result.getUTCFullYear()).toBe(2025);
    expect(result.getUTCMonth()).toBe(2); // reminder that months are 0 indexed
    expect(result.getUTCDate()).toBe(15);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  it('has correct presentation with min/max and fails to select date', async () => {
    // Ensures component looks correct when panel is opened.

    // Arrange: Set up date/time.
    vi.setSystemTime(new Date('2027-01-28T12:10:00Z'));
    const someDate: Date = new Date('2027-01-10T00:00:00Z');
    const minDate: Date = new Date('2027-01-04T00:00:00Z');
    const maxDate: Date = new Date('2027-01-22T00:00:00Z');

    // Act: Create the component.
    const datePicker = createComponent(someDate, false, minDate, maxDate);

    // Act: Open calendar panel.
    await datePicker.find('.picker-input-date').trigger('click');
    await nextTick();

    // Act: Select day outside allowed range. Selection should fail.
    await datePicker.find('[data-testid="datepicker__5"]').trigger('click');
    await nextTick();

    // Assert: date&time from component was not changed.
    const emitted = datePicker.emitted('update:modelValue');
    expect(emitted).toBeUndefined();

    // Assert: Panel shows calendar with all days for given month (June).
    const calendarState: {day:string, class: string[]}[] = [
      {day: '28', class: ["day", "not-current", "disabled"]},
      {day: '29', class: ["day", "not-current", "disabled"]},
      {day: '30', class: ["day", "not-current", "disabled"]},
      {day: '31', class: ["day", "not-current", "disabled"]},
      {day: '1', class: ["day", "disabled"]},
      {day: '2', class: ["day", "disabled"]}, // tried to select that date
      {day: '3', class: ["day", "disabled"]},
      {day: '4', class: ["day"]},
      {day: '5', class: ["day"]},
      {day: '6', class: ["day"]},
      {day: '7', class: ["day"]},
      {day: '8', class: ["day"]},
      {day: '9', class: ["day"]},
      {day: '10', class: ["day", "selected"]},
      {day: '11', class: ["day"]},
      {day: '12', class: ["day"]},
      {day: '13', class: ["day"]},
      {day: '14', class: ["day"]},
      {day: '15', class: ["day"]},
      {day: '16', class: ["day"]},
      {day: '17', class: ["day"]},
      {day: '18', class: ["day"]},
      {day: '19', class: ["day"]},
      {day: '20', class: ["day"]},
      {day: '21', class: ["day"]},
      {day: '22', class: ["day"]},
      {day: '23', class: ["day", "disabled"]},
      {day: '24', class: ["day", "disabled"]},
      {day: '25', class: ["day", "disabled"]},
      {day: '26', class: ["day", "disabled"]},
      {day: '27', class: ["day", "disabled"]},
      {day: '28', class: ["day", "today", "disabled"]},
      {day: '29', class: ["day", "disabled"]},
      {day: '30', class: ["day", "disabled"]},
      {day: '31', class: ["day", "disabled"]},
      {day: '1', class: ["day", "not-current", "disabled"]},
      {day: '2', class: ["day", "not-current", "disabled"]},
      {day: '3', class: ["day", "not-current", "disabled"]},
      {day: '4', class: ["day", "not-current", "disabled"]},
      {day: '5', class: ["day", "not-current", "disabled"]},
      {day: '6', class: ["day", "not-current", "disabled"]},
      {day: '7', class: ["day", "not-current", "disabled"]},
    ];
    verifyPanel(datePicker, '2027 January', calendarState);
  });

  //

  it('is disabled', async () => {
    // Ensures component behaves correctly when disabled.

    // Arrange: Set up date/time.
    vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
    const someDate: Date = new Date('2026-05-22T23:50:00Z');

    // Arrange: Create the component.
    const datePicker = createComponent(someDate, true);

    // Act: Try to open calendar panel.
    await datePicker.find('.picker-input-date').trigger('click');
    await nextTick();

    // Assert: Ensure panel is NOT present, as component is disabled.
    expect(datePicker.find('.calendar-container').exists()).toBe(false);
  });
});
