import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import DatePicker from '@/components/base/inputs/datetimepicker/DatePicker.vue';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockOnClickOutside = vi.hoisted(() => vi.fn<(...args: any[]) => any>());

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    onClickOutside: mockOnClickOutside,
  };
});

//

/** Convenience function to create component. */
function createComponent(
  modelValue: Date | null,
  ident: string,
  allowNull: boolean,
  disabled: boolean,
  invalid: boolean,
  showWeeks: boolean,
  dateTimeMin?: Date | null,
  dateTimeMax?: Date | null,
) {
  return mount(DatePicker, {
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue,
      ident,
      allowNull,
      disabled,
      invalid,
      showWeeks,
      dateTimeMin,
      dateTimeMax,
    },
  });
}

//

/**
 * Verify state of calendar panel.
 * @param datePicker Date picker.
 * @param ident Ident of component.
 * @param headerTitle Content of header title.
 * @param calendarState Expected calendar state as array of days in calendar table.
 */
function verifyPanel(
  datePicker: VueWrapper,
  ident: string,
  headerTitle: string,
  calendarState?: { day: string; class: string[] }[],
  weekNums?: string[],
) {
  const headerElement = datePicker.find('.header-title');
  expect(headerElement.text()).toEqual(headerTitle);

  verifyDays(datePicker, ident, calendarState);
  verifyWeekNums(datePicker, weekNums);
}

/**
 * Verify day cells.
 * @param datePicker Date picker.
 * @param ident Ident of component.
 * @param calendarState State of all calendar days.
 */
function verifyDays(datePicker: VueWrapper, ident: string, calendarState?: { day: string; class: string[] }[]) {
  if (!calendarState) return;

  const calendarSize = 42; // Calendar always have 42 cells (6 rows * 7 days).
  const calendarHeader = datePicker.find('.header-title').text();
  const dayElements = datePicker.findAll('.day');
  expect(dayElements).toHaveLength(calendarSize);
  expect(calendarState.length).toBe(calendarSize);

  for (let i = 0; i < calendarSize; i++) {
    const dayElement = datePicker.find(`[data-testid="datepicker_${ident}_${i}"]`);
    const calendarDay: { day: string; class: string[] } | null = calendarState[i] || null;

    expect(dayElement.exists(), `Day elem ix=${i} should exist for ${calendarHeader}`).toBe(true);
    expect(dayElement.text(), `Day elem ix=${i} text is wrong for ${calendarHeader}`).toEqual(calendarDay?.day);
    expect(dayElement.classes(), `Day elem ix=${i} classes are wrong for ${calendarHeader}`).toEqual(
      calendarDay?.class,
    );
  }
}

/**
 * Verify week cells.
 * @param datePicker Date picker.
 * @param weekNums Week numbers that should be present in calendar.
 */
function verifyWeekNums(datePicker: VueWrapper, weekNums?: string[]) {
  const weekElements = datePicker.findAll('.weekNum');

  if (!weekNums) {
    expect(weekElements).toHaveLength(0);
    return;
  }

  expect(weekElements).toHaveLength(6); // Calendar panel always shows 6 weeks.

  for (const ix in weekNums) {
    const weekNum = weekNums[ix];
    //const weekNumElement = datePicker.find(`[data-testid="datepicker__w${weekNum}"]`);
    const weekNumElement = datePicker.find(`[data-testid="datepicker__w${weekNum}"]`);
    expect(weekNumElement.exists(), `Week number elem ix=${ix} (${weekNum}) should exist`).toBe(true);
    expect(weekNumElement.text(), `Week number ix=${ix} (${weekNum}) text is wrong`).toEqual(weekNum);
  }
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of DatePicker component. */
describe('DatePicker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  //

  describe('general tests', () => {
    it('registers onClickOutside on mount', () => {
      // Ensure the component wires up VueUse's onClickOutside on mount.
      // Note: The actual DOM event cannot be reliably tested in jsdom environment,
      // but the hidePanel behavior is covered by the "closes panel when disabled" test.

      // Arrange: Reset mock.
      mockOnClickOutside.mockClear();

      // Act: Create the component.
      createComponent(null, '', false, false, false, false);

      // Assert: onClickOutside was called once.
      expect(mockOnClickOutside).toHaveBeenCalledOnce();
    });

    it('has correct presentation when null in general', async () => {
      // Ensures component looks correct when current value is null.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Create the component.
      const datePicker = createComponent(null, '', false, false, false, false);

      // Assert: Input is empty.
      expect(datePicker.find('.picker-input-date').attributes('value')).toBeUndefined();

      // Assert: Ensure panel is not present.
      expect(datePicker.find('.calendar-container').exists()).toBe(false);

      // Assert: model has correct value.
      const model = datePicker.props('modelValue') as Date | null;
      expect(model).toBe(null);

      // Assert: DatePicker has correct placeholder value.
      expect(datePicker.find('input').attributes('placeholder')).toBe('📅 YYYY-MM-DD');
    });

    it('has correct presentation when null and with panel opened', async () => {
      // Ensures component looks correct when panel is opened.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-02-21T12:10:00Z'));

      // Act: Create the component.
      const datePicker = createComponent(null, 'someDatePicker', false, false, false, false);

      // Act: Open calendar panel.
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Assert: Ensure panel is present.
      expect(datePicker.find('.calendar-container').exists()).toBe(true);

      // Arrange: Data for next assert.
      const calendarState: { day: string; class: string[] }[] = [
        { day: '26', class: ['day', 'not-current'] },
        { day: '27', class: ['day', 'not-current'] },
        { day: '28', class: ['day', 'not-current'] },
        { day: '29', class: ['day', 'not-current'] },
        { day: '30', class: ['day', 'not-current'] },
        { day: '31', class: ['day', 'not-current'] },
        { day: '1', class: ['day'] },
        { day: '2', class: ['day'] },
        { day: '3', class: ['day'] },
        { day: '4', class: ['day'] },
        { day: '5', class: ['day'] },
        { day: '6', class: ['day'] },
        { day: '7', class: ['day'] },
        { day: '8', class: ['day'] },
        { day: '9', class: ['day'] },
        { day: '10', class: ['day'] },
        { day: '11', class: ['day'] },
        { day: '12', class: ['day'] },
        { day: '13', class: ['day'] },
        { day: '14', class: ['day'] },
        { day: '15', class: ['day'] },
        { day: '16', class: ['day'] },
        { day: '17', class: ['day'] },
        { day: '18', class: ['day'] },
        { day: '19', class: ['day'] },
        { day: '20', class: ['day'] },
        { day: '21', class: ['day', 'today'] },
        { day: '22', class: ['day'] },
        { day: '23', class: ['day'] },
        { day: '24', class: ['day'] },
        { day: '25', class: ['day'] },
        { day: '26', class: ['day'] },
        { day: '27', class: ['day'] },
        { day: '28', class: ['day'] },
        { day: '1', class: ['day', 'not-current'] },
        { day: '2', class: ['day', 'not-current'] },
        { day: '3', class: ['day', 'not-current'] },
        { day: '4', class: ['day', 'not-current'] },
        { day: '5', class: ['day', 'not-current'] },
        { day: '6', class: ['day', 'not-current'] },
        { day: '7', class: ['day', 'not-current'] },
        { day: '8', class: ['day', 'not-current'] },
      ];

      // Assert: TimePicker has correct data-testid attribute.
      expect(datePicker.find('input').attributes('data-testid')).toBe('datepicker_someDatePicker');
      // Assert: Panel shows calendar with all days for given month (February).
      verifyPanel(datePicker, 'someDatePicker', '2026 February', calendarState);
    });

    it('has correct presentation when week numbers visible and with panel opened', async () => {
      // Ensures component looks correct when panel is opened.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2025-12-14T12:10:00Z')); // last weeks of 2025

      // Act: Create the component.
      const datePicker = createComponent(null, '', false, false, false, true);

      // Act: Open calendar panel.
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Assert: Ensure panel is present.
      expect(datePicker.find('.calendar-container').exists()).toBe(true);

      // Arrange: Data for next assert. Note last week of December (simultaneously first week of January) is 53 here.
      const weekNums1: string[] = ['49', '50', '51', '52', '53', '2'];
      // Assert: Panel shows calendar with correct week numbers.
      verifyPanel(datePicker, '', '2025 December', undefined, weekNums1);

      // Act: move one month forward.
      await datePicker.find('[data-testid="datepicker__monthPlus"]').trigger('click');
      await nextTick();

      // Arrange: Data for next assert. Notice that same week that previously was 53th now is 1st, this is correct.
      const weekNums2: string[] = ['1', '2', '3', '4', '5', '6'];
      // Assert: Panel shows calendar with correct week numbers.
      verifyPanel(datePicker, '', '2026 January', undefined, weekNums2);
    });

    //

    it('has correct presentation when set in general', async () => {
      // Ensures component looks correct when current value is set.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const someDate: Date = new Date('2026-05-22T23:50:00Z');

      // Act: Create the component.
      const datePicker = createComponent(someDate, '', false, false, false, false);

      // Assert: Input is filled.
      expect(datePicker.find('.picker-input-date').attributes('value')).toBe('📅 2026-05-22');

      // Assert: Ensure panel is not present.
      expect(datePicker.find('.calendar-container').exists()).toBe(false);

      // Assert: model has correct value.
      const model = datePicker.props('modelValue') as Date | null;
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
      const datePicker = createComponent(someDate, '', false, false, false, false);

      // Act: Open calendar panel.
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Assert: Ensure panel is present.
      expect(datePicker.find('.calendar-container').exists()).toBe(true);

      // Arrange: Data for next assert.
      const calendarState: { day: string; class: string[] }[] = [
        { day: '1', class: ['day'] },
        { day: '2', class: ['day'] },
        { day: '3', class: ['day'] },
        { day: '4', class: ['day'] },
        { day: '5', class: ['day'] },
        { day: '6', class: ['day'] },
        { day: '7', class: ['day'] },
        { day: '8', class: ['day'] },
        { day: '9', class: ['day'] },
        { day: '10', class: ['day'] },
        { day: '11', class: ['day'] },
        { day: '12', class: ['day'] },
        { day: '13', class: ['day'] },
        { day: '14', class: ['day'] },
        { day: '15', class: ['day', 'selected'] },
        { day: '16', class: ['day'] },
        { day: '17', class: ['day'] },
        { day: '18', class: ['day'] },
        { day: '19', class: ['day'] },
        { day: '20', class: ['day'] },
        { day: '21', class: ['day'] },
        { day: '22', class: ['day'] },
        { day: '23', class: ['day'] },
        { day: '24', class: ['day'] },
        { day: '25', class: ['day'] },
        { day: '26', class: ['day'] },
        { day: '27', class: ['day'] },
        { day: '28', class: ['day'] },
        { day: '29', class: ['day'] },
        { day: '30', class: ['day'] },
        { day: '1', class: ['day', 'not-current'] },
        { day: '2', class: ['day', 'not-current'] },
        { day: '3', class: ['day', 'not-current', 'today'] },
        { day: '4', class: ['day', 'not-current'] },
        { day: '5', class: ['day', 'not-current'] },
        { day: '6', class: ['day', 'not-current'] },
        { day: '7', class: ['day', 'not-current'] },
        { day: '8', class: ['day', 'not-current'] },
        { day: '9', class: ['day', 'not-current'] },
        { day: '10', class: ['day', 'not-current'] },
        { day: '11', class: ['day', 'not-current'] },
        { day: '12', class: ['day', 'not-current'] },
      ];
      // Assert: Panel shows calendar with all days for given month (June).
      verifyPanel(datePicker, '', '2026 June', calendarState);
    });

    //

    it('selects date', async () => {
      // Ensures component correctly selects date.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-02-21T12:10:00Z'));

      // Act: Create the component.
      const datePicker = createComponent(null, '', false, false, false, false);

      // Act: Open calendar panel.
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Act: Change year. Now it is 2025-02.
      await datePicker.find('[data-testid="datepicker__yearMinus"]').trigger('click');
      await nextTick();

      // Act: Change month. Now it is 2025-01.
      await datePicker.find('[data-testid="datepicker__monthMinus"]').trigger('click');
      await nextTick();

      // Act: Select day. Now it is 2025-01-18.
      await datePicker.find('[data-testid="datepicker__19"]').trigger('click');
      await nextTick();

      // Assert: date&time from component is correct.
      const emitted = datePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result = emitted?.at(0)![0] as Date;
      expect(result.getUTCFullYear()).toBe(2025);
      expect(result.getUTCMonth()).toBe(0); // reminder that months are 0 indexed
      expect(result.getUTCDate()).toBe(18);
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
      const datePicker = createComponent(someDate, '', false, false, false, false, minDate, maxDate);

      // Act: Open calendar panel.
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Act: Select day outside allowed range. Selection should fail.
      await datePicker.find('[data-testid="datepicker__5"]').trigger('click');
      await nextTick();

      // Assert: date&time from component was not changed.
      const emitted = datePicker.emitted('update:modelValue');
      expect(emitted).toBeUndefined();

      // Arrange: Data for next assert.
      const calendarState: { day: string; class: string[] }[] = [
        { day: '28', class: ['day', 'not-current', 'disabled'] },
        { day: '29', class: ['day', 'not-current', 'disabled'] },
        { day: '30', class: ['day', 'not-current', 'disabled'] },
        { day: '31', class: ['day', 'not-current', 'disabled'] },
        { day: '1', class: ['day', 'disabled'] },
        { day: '2', class: ['day', 'disabled'] }, // tried to select that date
        { day: '3', class: ['day', 'disabled'] },
        { day: '4', class: ['day'] },
        { day: '5', class: ['day'] },
        { day: '6', class: ['day'] },
        { day: '7', class: ['day'] },
        { day: '8', class: ['day'] },
        { day: '9', class: ['day'] },
        { day: '10', class: ['day', 'selected'] },
        { day: '11', class: ['day'] },
        { day: '12', class: ['day'] },
        { day: '13', class: ['day'] },
        { day: '14', class: ['day'] },
        { day: '15', class: ['day'] },
        { day: '16', class: ['day'] },
        { day: '17', class: ['day'] },
        { day: '18', class: ['day'] },
        { day: '19', class: ['day'] },
        { day: '20', class: ['day'] },
        { day: '21', class: ['day'] },
        { day: '22', class: ['day'] },
        { day: '23', class: ['day', 'disabled'] },
        { day: '24', class: ['day', 'disabled'] },
        { day: '25', class: ['day', 'disabled'] },
        { day: '26', class: ['day', 'disabled'] },
        { day: '27', class: ['day', 'disabled'] },
        { day: '28', class: ['day', 'today', 'disabled'] },
        { day: '29', class: ['day', 'disabled'] },
        { day: '30', class: ['day', 'disabled'] },
        { day: '31', class: ['day', 'disabled'] },
        { day: '1', class: ['day', 'not-current', 'disabled'] },
        { day: '2', class: ['day', 'not-current', 'disabled'] },
        { day: '3', class: ['day', 'not-current', 'disabled'] },
        { day: '4', class: ['day', 'not-current', 'disabled'] },
        { day: '5', class: ['day', 'not-current', 'disabled'] },
        { day: '6', class: ['day', 'not-current', 'disabled'] },
        { day: '7', class: ['day', 'not-current', 'disabled'] },
      ];
      // Assert: Panel shows calendar with all days for given month (June).
      verifyPanel(datePicker, '', '2027 January', calendarState);
    });

    it('re-selecting same date deselects date if allowNull is true', async () => {
      // Ensure clicking the already-selected date still emits an update if allowNull === true. It allows unselecting date.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-02-21T12:10:00Z'));

      // Act: Create the component.
      const datePicker = createComponent(null, '', true, false, false, false);

      // Act: Open calendar panel.
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Act: Select day. Now it is 2026-02-18.
      await datePicker.find('[data-testid="datepicker__10"]').trigger('click');
      await nextTick();

      // Assert: date&time from component is correct.
      const emitted = datePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result = emitted?.at(0)![0] as Date;
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(1); // reminder that months are 0 indexed
      expect(result.getUTCDate()).toBe(5);
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
      expect(result.getUTCMilliseconds()).toBe(0);

      // Act: Open calendar panel, as it got hidden after selecting day.
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Act: Select same day again.
      await datePicker.find('[data-testid="datepicker__10"]').trigger('click');
      await nextTick();

      // Assert: Second emission. Date was deselected.
      expect(emitted).toHaveLength(2);
      const result2 = emitted?.at(-1)![0] as null;
      expect(result2).toBeNull();
    });

    it('re-selecting same date does nothing if allowNull is false', async () => {
      // Ensure clicking the already-selected date does nothing if allowNull === false.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-02-21T12:10:00Z'));

      // Act: Create the component.
      const datePicker = createComponent(null, '', false, false, false, false);

      // Act: Open calendar panel.
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Act: Select day. Now it is 2026-02-18.
      await datePicker.find('[data-testid="datepicker__10"]').trigger('click');
      await nextTick();

      // Assert: date&time from component is correct.
      const emitted = datePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result = emitted?.at(0)![0] as Date;
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(1); // reminder that months are 0 indexed
      expect(result.getUTCDate()).toBe(5);
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
      expect(result.getUTCMilliseconds()).toBe(0);

      // Act: Open calendar panel, as it got hidden after selecting day.
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Act: Select same day again.
      await datePicker.find('[data-testid="datepicker__10"]').trigger('click');
      await nextTick();

      // Assert: No new emissions generated.
      expect(emitted).toHaveLength(1);
    });

    //

    it('is disabled', async () => {
      // Ensures datepicker behaves correctly when disabled.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const someDate: Date = new Date('2026-05-22T23:50:00Z');

      // Arrange: Create the component.
      const datePicker = createComponent(someDate, '', false, true, false, false);

      // Assert: CSS classes are correctly assigned, ensuring component is visually disabled.
      expect(datePicker.find('.picker-input-date').classes()).toStrictEqual(['picker-input-date', 'disabled']);

      // Act: Try to open calendar panel.
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Assert: Ensure panel is NOT present, as component is disabled.
      expect(datePicker.find('.calendar-container').exists()).toBe(false);
    });

    it('closes panel when disabled while open', async () => {
      // Ensure the panel closes when the picker is disabled while open.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Arrange: Create the component.
      const datePicker = createComponent(null, '', false, false, false, false);

      // Act: Open calendar panel.
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Assert: Ensure panel is present.
      expect(datePicker.find('.calendar-container').exists()).toBe(true);

      // Act: Set disabled to true.
      await datePicker.setProps({ disabled: true });
      await nextTick();

      // Assert: Panel is now closed.
      expect(datePicker.find('.calendar-container').exists()).toBe(false);
    });

    it('is invalid', async () => {
      // Ensure datepicker marked as invalid is visually distinct and fully functional.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const someDate: Date = new Date('2026-05-22T00:01:00Z');

      // Arrange: Create the component.
      const datePicker = createComponent(someDate, '', false, false, true, false);

      // Assert: CSS classes are correctly assigned, ensuring component is visually invalid.
      expect(datePicker.find('.picker-input-date').classes()).toStrictEqual(['picker-input-date', 'err']);

      // Act: Try to open calendar panel.
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Assert: Ensure panel is present.
      expect(datePicker.find('.calendar-container').exists()).toBe(true);

      // Act: Change year. Now it is 2027-05.
      await datePicker.find('[data-testid="datepicker__yearPlus"]').trigger('click');
      await nextTick();

      // Act: Change month. Now it is 2027-06.
      await datePicker.find('[data-testid="datepicker__monthPlus"]').trigger('click');
      await nextTick();

      // Act: Select day. Now it is 2027-06-08.
      await datePicker.find('[data-testid="datepicker__8"]').trigger('click');
      await nextTick();

      // Assert: date&time from component is correct.
      const emitted = datePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result = emitted?.at(0)![0] as Date;
      expect(result.getUTCFullYear()).toBe(2027);
      expect(result.getUTCMonth()).toBe(5); // reminder that months are 0 indexed
      expect(result.getUTCDate()).toBe(8);
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(1);
      expect(result.getUTCSeconds()).toBe(0);
      expect(result.getUTCMilliseconds()).toBe(0);
    });
  });
});
