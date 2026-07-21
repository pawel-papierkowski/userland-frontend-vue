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
  id: string,
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
      id,
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

  describe('general', () => {
    it('registers onClickOutside on mount', () => {
      // Ensure the component wires up VueUse's onClickOutside on mount.
      // Note: The actual DOM event cannot be reliably tested in jsdom environment,
      // but the hidePanel behavior is covered by the "closes panel when disabled" test.

      // Arrange: Reset mock.
      mockOnClickOutside.mockClear();

      // Act: Create the component.
      createComponent(null, '', false, false, false, false);

      // Assert: OnClickOutside was called once.
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

      // Assert: Model has correct value.
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

      // Act: Move one month forward.
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

      // Assert: Model has correct value.
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

  // ////////////////////////////////////////////////////////////////////////////
  // Accessibility tests

  describe('accessibility', () => {
    it('input has correct aria attributes when panel is hidden', () => {
      // Ensures the input element has proper ARIA roles and attributes when closed.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-02-21T12:10:00Z'));

      // Act: Create the component (panel starts hidden).
      const datePicker = createComponent(null, 'test', false, false, false, false);
      const input = datePicker.find('.picker-input-date');

      // Assert: Correct static ARIA attributes.
      expect(input.attributes('role')).toBe('combobox');
      expect(input.attributes('aria-haspopup')).toBe('dialog');

      // Assert: Aria-expanded is false when panel is hidden.
      expect(input.attributes('aria-expanded')).toBe('false');

      // Assert: Aria-controls matches panel id convention.
      expect(input.attributes('aria-controls')).toBe('datepicker_test_panel');

      // Assert: Aria-label is present with placeholder text (date format).
      expect(input.attributes('aria-label')).toBe('YYYY-MM-DD');

      // Assert: Aria-disabled is not present when not disabled.
      expect(input.attributes('aria-disabled')).toBeUndefined();
    });

    it('input aria-expanded reflects panel visibility', async () => {
      // Ensures aria-expanded toggles correctly when panel opens/closes.

      // Arrange: Set up date/time and create component.
      vi.setSystemTime(new Date('2026-02-21T12:10:00Z'));
      const datePicker = createComponent(null, '', false, false, false, false);
      const input = datePicker.find('.picker-input-date');

      // Act: Open panel.
      await input.trigger('click');
      await nextTick();

      // Assert: Aria-expanded is true when panel is visible.
      expect(input.attributes('aria-expanded')).toBe('true');

      // Act: Close panel by clicking again.
      await input.trigger('click');
      await nextTick();

      // Assert: Aria-expanded is false when panel is hidden.
      expect(input.attributes('aria-expanded')).toBe('false');
    });

    it('input has aria-disabled when disabled', () => {
      // Ensures the input has aria-disabled when the component is disabled.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-02-21T12:10:00Z'));

      // Act: Create component with disabled=true.
      const datePicker = createComponent(null, '', false, true, false, false);
      const input = datePicker.find('.picker-input-date');

      // Assert: Aria-disabled is present and set to "true".
      expect(input.attributes('aria-disabled')).toBe('true');
    });

    it('calendar dialog has correct aria attributes', async () => {
      // Ensures the calendar panel (dialog) has proper ARIA attributes.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-02-21T12:10:00Z'));

      // Arrange: Create the component and open panel.
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Act: Locate the calendar panel.
      const panel = datePicker.find('.calendar-container');

      // Assert: Panel has correct ARIA attributes.
      expect(panel.attributes('role')).toBe('dialog');
      expect(panel.attributes('aria-modal')).toBe('true');
      expect(panel.attributes('aria-label')).toBe('YYYY-MM-DD');

      // Assert: Panel id matches what input's aria-controls points to.
      expect(panel.attributes('id')).toBe('datepicker_test_panel');
    });

    it('calendar grid has correct aria attributes', async () => {
      // Ensures the calendar grid has proper ARIA roles and labels.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-02-21T12:10:00Z'));

      // Arrange: Create the component and open panel.
      const datePicker = createComponent(null, '', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Act: Locate the calendar grid.
      const grid = datePicker.find('.calendar-grid');

      // Assert: Grid has grid role and the header text as aria-label.
      expect(grid.attributes('role')).toBe('grid');
      expect(grid.attributes('aria-label')).toBe('2026 February');
    });

    it('day cells have role gridcell and correct aria-label', async () => {
      // Ensures each day cell has proper ARIA attributes.

      // Arrange: Set up date/time to show February 2026.
      vi.setSystemTime(new Date('2026-02-21T12:10:00Z'));

      // Arrange: Create the component and open panel.
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Act: Check specific day cells.
      // February 2026 has 6 padding cells from January (Dec 26-31 at indices 0-5).
      // Index 6 = Feb 1, index 11 = Feb 6, index 33 = Feb 28.
      // Padding cells from next month: index 34 = Mar 1, etc.
      const cellJan26 = datePicker.find('[data-testid="datepicker_test_0"]');
      const cellFeb1 = datePicker.find('[data-testid="datepicker_test_6"]');
      const cellFeb6 = datePicker.find('[data-testid="datepicker_test_11"]');
      const cellFeb28 = datePicker.find('[data-testid="datepicker_test_33"]');

      // Assert: Each day cell has gridcell role.
      expect(cellJan26.attributes('role')).toBe('gridcell');
      expect(cellFeb1.attributes('role')).toBe('gridcell');
      expect(cellFeb6.attributes('role')).toBe('gridcell');
      expect(cellFeb28.attributes('role')).toBe('gridcell');

      // Assert: Aria-label includes full date (year, month name, day).
      expect(cellJan26.attributes('aria-label')).toBe('2026 January 26');
      expect(cellFeb1.attributes('aria-label')).toBe('2026 February 1');
      expect(cellFeb6.attributes('aria-label')).toBe('2026 February 6');
      expect(cellFeb28.attributes('aria-label')).toBe('2026 February 28');

      // Assert: Aria-selected is false when no date is selected.
      expect(cellFeb1.attributes('aria-selected')).toBe('false');
      expect(cellFeb6.attributes('aria-selected')).toBe('false');

      // Assert: Aria-disabled is not set when no date constraints.
      expect(cellFeb1.attributes('aria-disabled')).toBeUndefined();
    });

    it('aria-selected reflects the selected date', async () => {
      // Ensures aria-selected is true on the selected day cell and false on others.

      // Arrange: Set up date/time with a selected date (June 2026, day 15 selected).
      // June 1, 2026 is a Sunday, no padding from prev month.
      // June 15 is at index 14.
      vi.setSystemTime(new Date('2026-07-03T12:10:00Z'));
      const someDate: Date = new Date('2026-06-15T19:30:00Z');

      // Act: Create component and open panel.
      const datePicker = createComponent(someDate, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Assert: Selected day cell (June 15, index 14) has aria-selected="true".
      const selectedCell = datePicker.find('[data-testid="datepicker_test_14"]');
      expect(selectedCell.attributes('aria-selected')).toBe('true');
      expect(selectedCell.attributes('aria-label')).toBe('2026 June 15');

      // Assert: Other days have aria-selected="false".
      const otherCell = datePicker.find('[data-testid="datepicker_test_0"]');
      expect(otherCell.attributes('aria-selected')).toBe('false');
    });

    it('aria-disabled reflects disabled date cells via min/max constraints', async () => {
      // Ensures aria-disabled is present on out-of-range date cells.

      // Arrange: Set up date/time with min/max constraints.
      vi.setSystemTime(new Date('2027-01-28T12:10:00Z'));
      const someDate: Date = new Date('2027-01-10T00:00:00Z');
      const minDate: Date = new Date('2027-01-04T00:00:00Z');
      const maxDate: Date = new Date('2027-01-22T00:00:00Z');

      // Act: Create component and open panel.
      const datePicker = createComponent(someDate, 'test', false, false, false, false, minDate, maxDate);
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();

      // Assert: Day before minDate (index 4 = Jan 1, 2027) has aria-disabled="true".
      const disabledCell = datePicker.find('[data-testid="datepicker_test_4"]');
      expect(disabledCell.attributes('aria-disabled')).toBe('true');

      // Assert: Day within range (index 9 = Jan 6, 2027) has no aria-disabled.
      const enabledCell = datePicker.find('[data-testid="datepicker_test_9"]');
      expect(enabledCell.attributes('aria-disabled')).toBeUndefined();
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Keyboard navigation tests

  describe('keyboard', () => {
    it('Enter on input opens the panel', async () => {
      // Ensures pressing Enter on the input opens the calendar panel.

      // Arrange: Set up date/time and create component.
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      const input = datePicker.find('.picker-input-date');

      // Act: Press Enter on the input.
      await input.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Panel is now visible.
      expect(datePicker.find('.calendar-container').exists()).toBe(true);
    });

    it('Space on input opens the panel', async () => {
      // Ensures pressing Space on the input opens the calendar panel.

      // Arrange: Set up date/time and create component.
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      const input = datePicker.find('.picker-input-date');

      // Act: Press Space on the input.
      await input.trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: Panel is now visible.
      expect(datePicker.find('.calendar-container').exists()).toBe(true);
    });

    it('ArrowDown on input opens the panel', async () => {
      // Ensures pressing ArrowDown on the input opens the calendar panel.

      // Arrange: Set up date/time and create component.
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      const input = datePicker.find('.picker-input-date');

      // Act: Press ArrowDown on the input.
      await input.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Panel is now visible.
      expect(datePicker.find('.calendar-container').exists()).toBe(true);
    });

    it('Escape on input closes the panel', async () => {
      // Ensures pressing Escape on the input closes the panel when open.

      // Arrange: Set up date/time and create component.
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      const input = datePicker.find('.picker-input-date');

      // Arrange: Open the panel first.
      await input.trigger('click');
      await nextTick();
      expect(datePicker.find('.calendar-container').exists()).toBe(true);

      // Act: Press Escape on the input.
      await input.trigger('keydown', { key: 'Escape' });
      await nextTick();

      // Assert: Panel is now closed.
      expect(datePicker.find('.calendar-container').exists()).toBe(false);
    });

    it('initial focused class reflects the selected date on keyboard open', async () => {
      // Ensures the keyboard-focus starts on the currently selected date.

      // Arrange: Set up date/time with a selected date (June 15, 2026).
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const someDate: Date = new Date('2026-06-15T19:30:00Z');

      // Act: Open the panel via keyboard.
      const datePicker = createComponent(someDate, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Selected day (June 15, index 14) has the focused class.
      expect(datePicker.find('[data-testid="datepicker_test_14"]').classes()).toContain('focused');

      // Assert: Other days do not have the focused class.
      expect(datePicker.find('[data-testid="datepicker_test_0"]').classes()).not.toContain('focused');
      expect(datePicker.find('[data-testid="datepicker_test_7"]').classes()).not.toContain('focused');
    });

    it('initial focused class reflects current date when no selection', async () => {
      // Ensures the keyboard-focus starts on the current date when no date is selected.

      // Arrange: Set up date/time with no selection.
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));

      // Act: Open the panel via keyboard.
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Current day (June 3, index 2) has the focused class.
      expect(datePicker.find('[data-testid="datepicker_test_2"]').classes()).toContain('focused');

      // Assert: Other days do not have the focused class.
      expect(datePicker.find('[data-testid="datepicker_test_1"]').classes()).not.toContain('focused');
      expect(datePicker.find('[data-testid="datepicker_test_3"]').classes()).not.toContain('focused');
    });

    it('ArrowRight on grid navigates to next day', async () => {
      // Ensures ArrowRight moves focus to the next day.

      // Arrange: Set up date/time and open panel via keyboard (focus on June 3, index 2).
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Act: Press ArrowRight in the grid.
      await grid.trigger('keydown', { key: 'ArrowRight' });
      await nextTick();

      // Assert: June 4 (index 3) is now focused, June 3 (index 2) is not.
      expect(datePicker.find('[data-testid="datepicker_test_3"]').classes()).toContain('focused');
      expect(datePicker.find('[data-testid="datepicker_test_2"]').classes()).not.toContain('focused');
    });

    it('ArrowLeft on grid navigates to previous day', async () => {
      // Ensures ArrowLeft moves focus to the previous day.

      // Arrange: Set up date/time and open panel via keyboard (focus on June 3, index 2).
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Act: Press ArrowLeft in the grid.
      await grid.trigger('keydown', { key: 'ArrowLeft' });
      await nextTick();

      // Assert: June 2 (index 1) is now focused, June 3 (index 2) is not.
      expect(datePicker.find('[data-testid="datepicker_test_1"]').classes()).toContain('focused');
      expect(datePicker.find('[data-testid="datepicker_test_2"]').classes()).not.toContain('focused');
    });

    it('ArrowDown on grid navigates forward one week', async () => {
      // Ensures ArrowDown moves focus seven days forward.

      // Arrange: Set up date/time and open panel via keyboard (focus on June 3, index 2).
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Act: Press ArrowDown in the grid.
      await grid.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: June 10 (index 9) is now focused, June 3 (index 2) is not.
      expect(datePicker.find('[data-testid="datepicker_test_9"]').classes()).toContain('focused');
      expect(datePicker.find('[data-testid="datepicker_test_2"]').classes()).not.toContain('focused');
    });

    it('ArrowUp on grid navigates backward one week', async () => {
      // Ensures ArrowUp moves focus seven days backward.

      // Arrange: Set up date/time and open panel via keyboard (focus on June 3, index 2).
      vi.setSystemTime(new Date('2026-06-10T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Act: Press ArrowUp in the grid.
      await grid.trigger('keydown', { key: 'ArrowUp' });
      await nextTick();

      // Assert: June 3 (index 2) is now focused, June 10 (index 9) is not.
      expect(datePicker.find('[data-testid="datepicker_test_2"]').classes()).toContain('focused');
      expect(datePicker.find('[data-testid="datepicker_test_9"]').classes()).not.toContain('focused');
    });

    it('Arrow navigates across month boundary', async () => {
      // Ensures ArrowRight from last day of month navigates to first day of next month
      // and updates the view.

      // Arrange: Set up date/time to show June 2026 (Jun 1 is Monday).
      vi.setSystemTime(new Date('2026-06-01T12:10:00Z'));
      const someDate: Date = new Date('2026-06-30T00:00:00Z');
      const datePicker = createComponent(someDate, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Act: Press ArrowRight to go from June 30 to July 1.
      await grid.trigger('keydown', { key: 'ArrowRight' });
      await nextTick();

      // Assert: Header now shows July.
      expect(datePicker.find('.header-title').text()).toBe('2026 July');

      // Assert: The focused day is July 1 (identified by its aria-label).
      const julyFirstCell = datePicker.find('[aria-label="2026 July 1"]');
      expect(julyFirstCell.classes()).toContain('focused');
    });

    it('Home navigates to first day of current month', async () => {
      // Ensures Home jumps to the first day of the current month.

      // Arrange: Set up date/time and open panel via keyboard (focus on June 15, index 14).
      vi.setSystemTime(new Date('2026-06-15T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Act: Press Home to jump to day 1.
      await grid.trigger('keydown', { key: 'Home' });
      await nextTick();

      // Assert: June 1 (index 0) is focused.
      expect(datePicker.find('[data-testid="datepicker_test_0"]').classes()).toContain('focused');
    });

    it('End navigates to last day of current month', async () => {
      // Ensures End jumps to the last day of the current month.

      // Arrange: Set up date/time and open panel via keyboard (focus on June 15, index 14).
      vi.setSystemTime(new Date('2026-06-15T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Act: Press End to jump to day 30.
      await grid.trigger('keydown', { key: 'End' });
      await nextTick();

      // Assert: June 30 (index 29) is focused.
      expect(datePicker.find('[data-testid="datepicker_test_29"]').classes()).toContain('focused');
    });

    it('PageDown navigates to next month', async () => {
      // Ensures PageDown moves to the next month.

      // Arrange: Set up date/time and open panel via keyboard (focus on June 15, index 14).
      vi.setSystemTime(new Date('2026-06-15T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Act: Press PageDown.
      await grid.trigger('keydown', { key: 'PageDown' });
      await nextTick();

      // Assert: Header now shows July.
      expect(datePicker.find('.header-title').text()).toBe('2026 July');
    });

    it('PageUp navigates to previous month', async () => {
      // Ensures PageUp moves to the previous month.

      // Arrange: Set up date/time and open panel via keyboard (focus on June 15, index 14).
      vi.setSystemTime(new Date('2026-06-15T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Act: Press PageUp.
      await grid.trigger('keydown', { key: 'PageUp' });
      await nextTick();

      // Assert: Header now shows May.
      expect(datePicker.find('.header-title').text()).toBe('2026 May');
    });

    it('Enter selects focused date and closes panel', async () => {
      // Ensures pressing Enter on a focused date selects it and closes the panel.

      // Arrange: Set up date/time and open panel via keyboard (focus on June 3, index 2).
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Arrange: Navigate to June 5 (index 4).
      await grid.trigger('keydown', { key: 'ArrowRight' });
      await nextTick();
      await grid.trigger('keydown', { key: 'ArrowRight' });
      await nextTick();

      // Act: Press Enter to select June 5.
      await grid.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Date is selected and panel closed.
      const emitted = datePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result = emitted?.at(-1)![0] as Date;
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(5); // reminder: zero-indexed
      expect(result.getUTCDate()).toBe(5);
      expect(datePicker.find('.calendar-container').exists()).toBe(false);
    });

    it('Space selects focused date and closes panel', async () => {
      // Ensures pressing Space on a focused date selects it and closes the panel.

      // Arrange: Set up date/time and open panel via keyboard (focus on June 3, index 2).
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Arrange: Navigate to June 8 (index 7).
      for (let i = 0; i < 5; i++) {
        await grid.trigger('keydown', { key: 'ArrowRight' });
        await nextTick();
      }

      // Act: Press Space to select June 8.
      await grid.trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: Date is selected and panel closed.
      const emitted = datePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result = emitted?.at(-1)![0] as Date;
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(5); // reminder: zero-indexed
      expect(result.getUTCDate()).toBe(8);
      expect(datePicker.find('.calendar-container').exists()).toBe(false);
    });

    it('Enter on already-selected date with allowNull deselects and closes', async () => {
      // Ensures pressing Enter on the already-selected date with allowNull=true
      // clears the selection and closes the panel.

      // Arrange: Set up with a preselected date and allowNull.
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const someDate: Date = new Date('2026-06-15T14:30:00Z');
      const datePicker = createComponent(someDate, 'test', true, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Arrange: Verify June 15 is both selected and focused.
      expect(datePicker.find('[data-testid="datepicker_test_14"]').classes()).toContain('selected');
      expect(datePicker.find('[data-testid="datepicker_test_14"]').classes()).toContain('focused');

      // Act: Press Enter on already-selected date.
      await grid.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Date was deselected (model value is null).
      const emitted = datePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result = emitted?.at(-1)![0] as null;
      expect(result).toBeNull();

      // Assert: Panel is closed after deselection.
      expect(datePicker.find('.calendar-container').exists()).toBe(false);
    });

    it('Enter on already-selected date with allowNull=false does nothing', async () => {
      // Ensures pressing Enter on the already-selected date with allowNull=false
      // does not change selection nor close the panel.

      // Arrange: Set up with a preselected date and allowNull=false.
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const someDate: Date = new Date('2026-06-15T14:30:00Z');
      const datePicker = createComponent(someDate, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Arrange: Verify June 15 is both selected and focused.
      expect(datePicker.find('[data-testid="datepicker_test_14"]').classes()).toContain('selected');
      expect(datePicker.find('[data-testid="datepicker_test_14"]').classes()).toContain('focused');

      // Act: Press Enter on already-selected date.
      await grid.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: No new emissions generated and panel stays open.
      const emitted = datePicker.emitted('update:modelValue');
      expect(emitted).toBeUndefined();
      expect(datePicker.find('.calendar-container').exists()).toBe(true);
    });

    it('Escape in grid closes panel', async () => {
      // Ensures Escape in the grid closes the panel.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      expect(datePicker.find('.calendar-container').exists()).toBe(true);

      // Act: Press Escape in the grid.
      const grid = datePicker.find('.calendar-grid');
      await grid.trigger('keydown', { key: 'Escape' });
      await nextTick();

      // Assert: Panel is closed.
      expect(datePicker.find('.calendar-container').exists()).toBe(false);
    });

    it('click-open panel has no focus until first key press', async () => {
      // If you open panel via click, there is no visible focus.
      // If you press a navigation key, focus appears without moving.

      // Arrange: Set up date/time and open panel via mouse click.
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('click');
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Assert: No focus present initially.
      expect(datePicker.find('[data-testid="datepicker_test_3"]').classes()).not.toContain('focused');
      expect(grid.attributes('aria-activedescendant')).toBeUndefined();

      // Act: Press a navigation key. Focus appears but does not move.
      await grid.trigger('keydown', { key: 'ArrowRight' });
      await nextTick();

      // Assert: Focus present on June 3 (the initial date), NOT on June 4.
      expect(datePicker.find('[data-testid="datepicker_test_3"]').classes()).not.toContain('focused');
      expect(datePicker.find('[data-testid="datepicker_test_2"]').classes()).toContain('focused');
      expect(grid.attributes('aria-activedescendant')).toBe('datepicker_test_cell_2');
    });

    it('keyboard navigation updates aria-activedescendant on grid', async () => {
      // Ensures the grid's aria-activedescendant attribute follows keyboard focus.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const grid = datePicker.find('.calendar-grid');

      // Assert: Initial active descendant points to June 3 (index 2).
      expect(grid.attributes('aria-activedescendant')).toBe('datepicker_test_cell_2');

      // Act: Navigate right twice.
      await grid.trigger('keydown', { key: 'ArrowRight' });
      await nextTick();
      await grid.trigger('keydown', { key: 'ArrowRight' });
      await nextTick();

      // Assert: Active descendant now points to June 5 (index 4).
      expect(grid.attributes('aria-activedescendant')).toBe('datepicker_test_cell_4');
    });

    it('day cells have correct id matching aria-activedescendant pattern', async () => {
      // Ensures day cells have the correct id attributes.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-06-03T12:10:00Z'));
      const datePicker = createComponent(null, 'test', false, false, false, false);
      await datePicker.find('.picker-input-date').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Cell IDs follow the correct pattern.
      expect(datePicker.find('[data-testid="datepicker_test_2"]').attributes('id')).toBe('datepicker_test_cell_2');
      expect(datePicker.find('[data-testid="datepicker_test_14"]').attributes('id')).toBe('datepicker_test_cell_14');
      expect(datePicker.find('[data-testid="datepicker_test_29"]').attributes('id')).toBe('datepicker_test_cell_29');
    });
  });
});
