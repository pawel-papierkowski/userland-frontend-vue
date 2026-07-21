import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import TimePicker from '@/components/base/inputs/datetimepicker/TimePicker.vue';

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
function createComponent(modelValue: Date | null, id: string, allowNull: boolean, disabled: boolean, invalid: boolean) {
  return mount(TimePicker, {
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue,
      id,
      allowNull,
      disabled,
      invalid,
    },
  });
}

//

/**
 * Verify state of clock panel.
 * @param timePicker Time picker.
 * @param currHour Which hour is marked as current.
 * @param currMinute Which minute is marked as current.
 * @param selHour Which hour is marked as selected.
 * @param selMinute Which minute is marked as selected.
 * @param focusHour Which hour is keyboard-focused.
 * @param focusMinute Which minute is keyboard-focused.
 */
function verifyPanel(
  timePicker: VueWrapper,
  ident: string,
  currHour: number | null,
  currMinute: number | null,
  selHour: number | null,
  selMinute: number | null,
  focusHour: number | null,
  focusMinute: number | null,
) {
  const hourElements = timePicker.findAll('.time-hour');
  expect(hourElements).toHaveLength(24);
  const minuteElements = timePicker.findAll('.time-minute');
  expect(minuteElements).toHaveLength(60);

  for (let i = 0; i < 24; i++) {
    const hourCss = ['time-item', 'time-hour'];
    const hourElement = timePicker.find(`[data-testid="timepicker_${ident}_h${i}"]`);
    if (currHour !== null && currHour === i) hourCss.push('curr');
    if (selHour !== null && selHour === i) hourCss.push('selected');
    if (focusHour !== null && focusHour === i) hourCss.push('focused');

    expect(hourElement.classes(), `Hour ${i} elem classes are wrong`).toEqual(hourCss);
  }

  for (let i = 0; i < 60; i++) {
    const minuteCss = ['time-item', 'time-minute'];
    const minuteElement = timePicker.find(`[data-testid="timepicker_${ident}_m${i}"]`);
    if (currMinute !== null && currMinute === i) minuteCss.push('curr');
    if (selMinute !== null && selMinute === i) minuteCss.push('selected');
    if (focusMinute !== null && focusMinute === i) minuteCss.push('focused');

    expect(minuteElement.classes(), `Minute ${i} elem classes are wrong`).toEqual(minuteCss);
  }
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of TimePicker component. */
describe('TimePicker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // mock scrollIntoView()
    Element.prototype.scrollIntoView = vi.fn<() => void>();
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
      createComponent(null, '', false, false, false);

      // Assert: OnClickOutside was called once.
      expect(mockOnClickOutside).toHaveBeenCalledOnce();
    });

    it('has correct presentation when null in general', async () => {
      // Ensures component looks correct when current value is null.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Create the component.
      const timePicker = createComponent(null, '', false, false, false);

      // Assert: Input is empty.
      expect(timePicker.find('.picker-input-time').attributes('value')).toBeUndefined();

      // Assert: Ensure panel is not present.
      expect(timePicker.find('.clock-container').exists()).toBe(false);

      // Assert: Model has correct value.
      const model = timePicker.props('modelValue') as Date | null;
      expect(model).toBe(null);

      // Assert: TimePicker has correct placeholder value.
      expect(timePicker.find('input').attributes('placeholder')).toBe('🕜 hh:mm');
    });

    it('has correct presentation when null and with panel opened', async () => {
      // Ensures component looks correct when panel is opened.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Arrange: Create the component.
      const timePicker = createComponent(null, 'someTimePicker', false, false, false);

      // Act: Open clock panel.
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Assert: Ensure panel is present.
      expect(timePicker.find('.clock-container').exists()).toBe(true);

      // Assert: TimePicker has correct data-testid attribute.
      expect(timePicker.find('input').attributes('data-testid')).toBe('timepicker_someTimePicker');

      // Assert: Panel shows scrollers with hours and minutes. Only current time is marked.
      // Focus ring is on hour column (the active column on open).
      verifyPanel(timePicker, 'someTimePicker', 4, 7, null, null, null, null); // note same time as in arrange
    });

    //

    it('has correct presentation when set in general', async () => {
      // Ensures component looks correct when current value is set.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const someDate: Date = new Date('2026-05-22T17:50:00Z');

      // Act: Create the component.
      const timePicker = createComponent(someDate, '', false, false, false);

      // Assert: Input is filled.
      expect(timePicker.find('.picker-input-time').attributes('value')).toContain('🕜 17:50');

      // Assert: Ensure panel is not present.
      expect(timePicker.find('.clock-container').exists()).toBe(false);

      // Assert: Model has correct value.
      const model = timePicker.props('modelValue') as Date | null;
      expect(model?.getUTCFullYear()).toBe(2026); // date is untouched
      expect(model?.getUTCMonth()).toBe(4); // reminder that months are 0 indexed
      expect(model?.getUTCDate()).toBe(22);
      expect(model?.getUTCHours()).toBe(17);
      expect(model?.getUTCMinutes()).toBe(50);
      expect(model?.getUTCSeconds()).toBe(0);
      expect(model?.getUTCMilliseconds()).toBe(0);
    });

    it('has correct presentation when set and with panel opened', async () => {
      // Ensures component looks correct when panel is opened.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const someDate: Date = new Date('2026-05-22T16:30:00Z');

      // Arrange: Create the component.
      const timePicker = createComponent(someDate, '', false, false, false);

      // Act: Open clock panel.
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Assert: Ensure panel is present.
      expect(timePicker.find('.clock-container').exists()).toBe(true);

      // Assert: Panel shows scrollers with hours and minutes. Both current and selected time is marked.
      // Focus ring is on hour column (the active column on open).
      verifyPanel(timePicker, '', 4, 7, 16, 30, null, null); // note same time as in arrange
    });

    //

    it('selects time', async () => {
      // Ensures component correctly selects time.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Arrange: Create the component.
      const timePicker = createComponent(null, '', false, false, false);

      // Act: Open clock panel.
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: Select hour and minute.
      await timePicker.find('[data-testid="timepicker__h8"]').trigger('click');
      await nextTick();
      await timePicker.find('[data-testid="timepicker__m51"]').trigger('click');
      await nextTick();

      // Assert: date&time from component is correct.
      const emitted = timePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(2);
      const result = emitted?.at(-1)![0] as Date;
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(4); // reminder that months are 0 indexed
      expect(result.getUTCDate()).toBe(21);
      expect(result.getUTCHours()).toBe(8);
      expect(result.getUTCMinutes()).toBe(51);
      expect(result.getUTCSeconds()).toBe(0);
      expect(result.getUTCMilliseconds()).toBe(0);
    });

    it('re-selecting same hour deselects time if allowNull is true', async () => {
      // Ensure clicking the already-selected hour still emits an update if allowNull === true. It allows unselecting time.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Arrange: Create the component.
      const timePicker = createComponent(null, '', true, false, false);

      // Act: Open clock panel.
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: Select hour 8.
      await timePicker.find('[data-testid="timepicker__h8"]').trigger('click');
      await nextTick();

      // Assert: One emission so far. Time was established.
      const emitted = timePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result1 = emitted?.at(-1)![0] as Date;
      expect(result1.getUTCFullYear()).toBe(2026);
      expect(result1.getUTCMonth()).toBe(4); // reminder that months are 0 indexed
      expect(result1.getUTCDate()).toBe(21);
      expect(result1.getUTCHours()).toBe(8);
      expect(result1.getUTCMinutes()).toBe(7);
      expect(result1.getUTCSeconds()).toBe(0);
      expect(result1.getUTCMilliseconds()).toBe(0);

      // Act: Click the same hour again.
      await timePicker.find('[data-testid="timepicker__h8"]').trigger('click');
      await nextTick();

      // Assert: Second emission. Time was deselected.
      expect(emitted).toHaveLength(2);
      const result2 = emitted?.at(-1)![0] as null;
      expect(result2).toBeNull();
    });

    it('re-selecting same hour does nothing if allowNull is false', async () => {
      // Ensure clicking the already-selected hour does nothing if allowNull === false.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Arrange: Create the component.
      const timePicker = createComponent(null, '', false, false, false);

      // Act: Open clock panel.
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: Select hour 8.
      await timePicker.find('[data-testid="timepicker__h8"]').trigger('click');
      await nextTick();

      // Assert: One emission so far. Time was established.
      const emitted = timePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result1 = emitted?.at(-1)![0] as Date;
      expect(result1.getUTCFullYear()).toBe(2026);
      expect(result1.getUTCMonth()).toBe(4); // reminder that months are 0 indexed
      expect(result1.getUTCDate()).toBe(21);
      expect(result1.getUTCHours()).toBe(8);
      expect(result1.getUTCMinutes()).toBe(7);
      expect(result1.getUTCSeconds()).toBe(0);
      expect(result1.getUTCMilliseconds()).toBe(0);

      // Act: Click the same hour again.
      await timePicker.find('[data-testid="timepicker__h8"]').trigger('click');
      await nextTick();

      // Assert: No new emissions generated.
      expect(emitted).toHaveLength(1);
    });

    //

    it('is disabled', async () => {
      // Ensures component behaves correctly when disabled.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const someDate: Date = new Date('2026-05-22T17:50:00Z'); // UTC

      // Arrange: Create the component.
      const timePicker = createComponent(someDate, '', false, true, false);

      // Assert: CSS classes are correctly assigned, ensuring component is visually disabled.
      expect(timePicker.find('.picker-input-time').classes()).toStrictEqual(['picker-input-time', 'disabled']);

      // Act: Try to open clock panel.
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Assert: Ensure panel is NOT present, as component is disabled.
      expect(timePicker.find('.clock-container').exists()).toBe(false);
    });

    it('closes panel when disabled while open', async () => {
      // Ensure the panel closes when the picker is disabled while open.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Arrange: Create the component.
      const timePicker = createComponent(null, '', false, false, false);

      // Act: Open panel.
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Assert: Panel is opened.
      expect(timePicker.find('.clock-container').exists()).toBe(true);

      // Act: Set disabled to true.
      await timePicker.setProps({ disabled: true });
      await nextTick();

      // Assert: Panel is now closed.
      expect(timePicker.find('.clock-container').exists()).toBe(false);
    });

    it('is invalid', async () => {
      // Ensure timepicker marked as invalid is visually distinct and fully functional.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-06-01T17:34:00Z'));

      // Arrange: Create the component.
      const timePicker = createComponent(null, '', false, false, true);

      // Assert: CSS classes are correctly assigned, ensuring component is visually invalid.
      expect(timePicker.find('.picker-input-time').classes()).toStrictEqual(['picker-input-time', 'err']);

      // Act: Open clock panel.
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: Select hour and minute.
      await timePicker.find('[data-testid="timepicker__h10"]').trigger('click');
      await nextTick();
      await timePicker.find('[data-testid="timepicker__m33"]').trigger('click');
      await nextTick();

      // Assert: date&time from component is correct.
      const emitted = timePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(2);
      const result = emitted?.at(-1)![0] as Date;
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(5); // reminder that months are 0 indexed
      expect(result.getUTCDate()).toBe(1);
      expect(result.getUTCHours()).toBe(10);
      expect(result.getUTCMinutes()).toBe(33);
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
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Create the component (panel starts hidden).
      const timePicker = createComponent(null, 'test', false, false, false);
      const input = timePicker.find('.picker-input-time');

      // Assert: Correct static ARIA attributes.
      expect(input.attributes('role')).toBe('combobox');
      expect(input.attributes('aria-haspopup')).toBe('listbox');

      // Assert: Aria-expanded is false when panel is hidden.
      expect(input.attributes('aria-expanded')).toBe('false');

      // Assert: Aria-controls matches panel id convention.
      expect(input.attributes('aria-controls')).toBe('timepicker_test_panel');

      // Assert: Aria-label is present with placeholder text.
      expect(input.attributes('aria-label')).toBe('hh:mm');

      // Assert: Aria-disabled is not present when not disabled.
      expect(input.attributes('aria-disabled')).toBeUndefined();
    });

    it('input aria-expanded reflects panel visibility', async () => {
      // Ensures aria-expanded toggles correctly when panel opens/closes.

      // Arrange: Set up date/time and create component.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, '', false, false, false);
      const input = timePicker.find('.picker-input-time');

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
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Create component with disabled=true.
      const timePicker = createComponent(null, '', false, true, false);
      const input = timePicker.find('.picker-input-time');

      // Assert: Aria-disabled is present and set to "true".
      expect(input.attributes('aria-disabled')).toBe('true');
    });

    it('clock panel has correct aria attributes', async () => {
      // Ensures the clock panel (dialog) has proper ARIA attributes.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Arrange: Create the component and open panel.
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: Locate the clock panel.
      const panel = timePicker.find('.clock-container');

      // Assert: Panel has correct ARIA attributes.
      expect(panel.attributes('role')).toBe('dialog');
      expect(panel.attributes('aria-modal')).toBe('true');
      expect(panel.attributes('aria-label')).toBe('hh:mm');

      // Assert: Panel id matches what input's aria-controls points to.
      expect(panel.attributes('id')).toBe('timepicker_test_panel');
    });

    it('hour column and header have correct aria attributes', async () => {
      // Ensures the hour listbox is properly labeled and header is hidden from AT.

      // Arrange: Set up date/time and open panel.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, '', false, false, false);
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: Locate hour column.
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;

      // Assert: Column has listbox role and aria-label.
      expect(hourColumn.attributes('role')).toBe('listbox');
      expect(hourColumn.attributes('aria-label')).toBe('Hour');

      // Assert: Column header is hidden from accessibility tree.
      const hourHeader = hourColumn.find('.column-header');
      expect(hourHeader.attributes('aria-hidden')).toBe('true');
    });

    it('minute column and header have correct aria attributes', async () => {
      // Ensures the minute listbox is properly labeled and header is hidden from AT.

      // Arrange: Set up date/time and open panel.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, '', false, false, false);
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: Locate minute column.
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;

      // Assert: Column has listbox role and aria-label.
      expect(minuteColumn.attributes('role')).toBe('listbox');
      expect(minuteColumn.attributes('aria-label')).toBe('Minute');

      // Assert: Column header is hidden from accessibility tree.
      const minuteHeader = minuteColumn.find('.column-header');
      expect(minuteHeader.attributes('aria-hidden')).toBe('true');
    });

    it('hour items have role option with aria-selected and aria-label', async () => {
      // Ensures each hour item has correct ARIA attributes when no time is selected.

      // Arrange: Set up date/time and open panel (no time selected).
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: Check specific hour items.
      const hour5 = timePicker.find('[data-testid="timepicker_test_h5"]');
      const hour14 = timePicker.find('[data-testid="timepicker_test_h14"]');

      // Assert: Each hour item has option role.
      expect(hour5.attributes('role')).toBe('option');
      expect(hour14.attributes('role')).toBe('option');

      // Assert: Aria-selected is false when no time is selected.
      expect(hour5.attributes('aria-selected')).toBe('false');
      expect(hour14.attributes('aria-selected')).toBe('false');

      // Assert: Aria-label includes the value and unit label.
      expect(hour5.attributes('aria-label')).toBe('5 Hour');
      expect(hour14.attributes('aria-label')).toBe('14 Hour');
    });

    it('minute items have role option with aria-selected and aria-label', async () => {
      // Ensures each minute item has correct ARIA attributes when no time is selected.

      // Arrange: Set up date/time and open panel (no time selected).
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: Check specific minute items.
      const minute3 = timePicker.find('[data-testid="timepicker_test_m3"]');
      const minute45 = timePicker.find('[data-testid="timepicker_test_m45"]');

      // Assert: Each minute item has option role.
      expect(minute3.attributes('role')).toBe('option');
      expect(minute45.attributes('role')).toBe('option');

      // Assert: Aria-selected is false when no time is selected.
      expect(minute3.attributes('aria-selected')).toBe('false');
      expect(minute45.attributes('aria-selected')).toBe('false');

      // Assert: Aria-label includes the value and unit label.
      expect(minute3.attributes('aria-label')).toBe('3 Minute');
      expect(minute45.attributes('aria-label')).toBe('45 Minute');
    });

    it('aria-selected reflects the selected hour', async () => {
      // Ensures aria-selected is true on the selected hour and false on others.

      // Arrange: Set up date/time and open panel.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: Select hour 14.
      await timePicker.find('[data-testid="timepicker_test_h14"]').trigger('click');
      await nextTick();

      // Assert: Selected hour 14 has aria-selected="true".
      const selectedHour = timePicker.find('[data-testid="timepicker_test_h14"]');
      expect(selectedHour.attributes('aria-selected')).toBe('true');

      // Assert: Other hours remain aria-selected="false".
      const otherHour = timePicker.find('[data-testid="timepicker_test_h5"]');
      expect(otherHour.attributes('aria-selected')).toBe('false');

      // Assert: The selected hour's aria-label is still correct.
      expect(selectedHour.attributes('aria-label')).toBe('14 Hour');
    });

    it('aria-selected reflects the selected minute', async () => {
      // Ensures aria-selected is true on the selected minute and false on others.

      // Arrange: Set up date/time and open panel.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: Select minute 33.
      await timePicker.find('[data-testid="timepicker_test_m33"]').trigger('click');
      await nextTick();

      // Assert: Selected minute 33 has aria-selected="true".
      const selectedMinute = timePicker.find('[data-testid="timepicker_test_m33"]');
      expect(selectedMinute.attributes('aria-selected')).toBe('true');

      // Assert: Other minutes remain aria-selected="false".
      const otherMinute = timePicker.find('[data-testid="timepicker_test_m3"]');
      expect(otherMinute.attributes('aria-selected')).toBe('false');

      // Assert: The selected minute's aria-label is still correct.
      expect(selectedMinute.attributes('aria-label')).toBe('33 Minute');
    });

    it('aria-selected updates when time is deselected via allowNull', async () => {
      // Ensures aria-selected returns to false when time is deselected.

      // Arrange: Set up date/time and open panel with allowNull.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', true, false, false);
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: Select and then deselect hour 14.
      await timePicker.find('[data-testid="timepicker_test_h14"]').trigger('click');
      await nextTick();
      await timePicker.find('[data-testid="timepicker_test_h14"]').trigger('click');
      await nextTick();

      // Assert: Previously selected hour now has aria-selected="false".
      const deselectedHour = timePicker.find('[data-testid="timepicker_test_h14"]');
      expect(deselectedHour.attributes('aria-selected')).toBe('false');
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Keyboard navigation tests

  describe('keyboard', () => {
    it('Enter on input opens the panel', async () => {
      // Ensures pressing Enter on the input opens the clock panel.

      // Arrange: Set up date/time and create component.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      const input = timePicker.find('.picker-input-time');

      // Act: Press Enter on the input.
      await input.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Panel is now visible.
      expect(timePicker.find('.clock-container').exists()).toBe(true);
    });

    it('Space on input opens the panel', async () => {
      // Ensures pressing Space on the input opens the clock panel.

      // Arrange: Set up date/time and create component.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, '', false, false, false);
      const input = timePicker.find('.picker-input-time');

      // Act: Press Space on the input.
      await input.trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: Panel is now visible.
      expect(timePicker.find('.clock-container').exists()).toBe(true);
    });

    it('ArrowDown on input opens the panel', async () => {
      // Ensures pressing ArrowDown on the input opens the clock panel.

      // Arrange: Set up date/time and create component.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, '', false, false, false);
      const input = timePicker.find('.picker-input-time');

      // Act: Press ArrowDown on the input.
      await input.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Panel is now visible.
      expect(timePicker.find('.clock-container').exists()).toBe(true);
    });

    it('Escape on input closes the panel', async () => {
      // Ensures pressing Escape on the input closes the panel when open.

      // Arrange: Set up date/time and create component.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, '', false, false, false);
      const input = timePicker.find('.picker-input-time');

      // Arrange: Open the panel first.
      await input.trigger('click');
      await nextTick();
      expect(timePicker.find('.clock-container').exists()).toBe(true);

      // Act: Press Escape on the input.
      await input.trigger('keydown', { key: 'Escape' });
      await nextTick();

      // Assert: Panel is now closed.
      expect(timePicker.find('.clock-container').exists()).toBe(false);
    });

    it('initial focused class reflects the selected time', async () => {
      // Ensures the keyboard-focus starts on the currently selected time.

      // Arrange: Set up date/time with a selected time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const someDate: Date = new Date('2026-05-22T16:30:00Z');

      // Act: Open the panel via keyboard.
      const timePicker = createComponent(someDate, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Selected hour 16 has the focused class (hour is the active column on open).
      expect(timePicker.find('[data-testid="timepicker_test_h16"]').classes()).toContain('focused');

      // Assert: Minute column does NOT show focus ring until navigated to.
      expect(timePicker.find('[data-testid="timepicker_test_m30"]').classes()).not.toContain('focused');

      // Assert: Other items do not have the focused class.
      expect(timePicker.find('[data-testid="timepicker_test_h4"]').classes()).not.toContain('focused');
      expect(timePicker.find('[data-testid="timepicker_test_m7"]').classes()).not.toContain('focused');
    });

    it('initial focused class reflects current time when no selection', async () => {
      // Ensures the keyboard-focus starts on the current time when no time is selected.

      // Arrange: Set up date/time with no selection.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Open the panel via keyboard.
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Current hour 4 has the focused class (hour is the active column on open).
      expect(timePicker.find('[data-testid="timepicker_test_h4"]').classes()).toContain('focused');

      // Assert: Minute column does NOT show focus ring until navigated to.
      expect(timePicker.find('[data-testid="timepicker_test_m7"]').classes()).not.toContain('focused');
    });

    it('ArrowDown on hour listbox navigates to next hour', async () => {
      // Ensures ArrowDown moves focus to the next hour.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Act: Press ArrowDown in the hour column.
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;
      await hourColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Hour 5 is now focused, hour 4 is not.
      expect(timePicker.find('[data-testid="timepicker_test_h5"]').classes()).toContain('focused');
      expect(timePicker.find('[data-testid="timepicker_test_h4"]').classes()).not.toContain('focused');
    });

    it('ArrowUp on hour listbox navigates to previous hour', async () => {
      // Ensures ArrowUp moves focus to the previous hour.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Act: Press ArrowUp in the hour column.
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;
      await hourColumn.trigger('keydown', { key: 'ArrowUp' });
      await nextTick();

      // Assert: Hour 3 is now focused, hour 4 is not.
      expect(timePicker.find('[data-testid="timepicker_test_h3"]').classes()).toContain('focused');
      expect(timePicker.find('[data-testid="timepicker_test_h4"]').classes()).not.toContain('focused');
    });

    it('ArrowDown on minute listbox navigates to next minute', async () => {
      // Ensures ArrowDown moves focus to the next minute.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;

      // Arrange: First switch to minute column (as user would with Tab/ArrowRight).
      await minuteColumn.trigger('focus');
      await nextTick();

      // Act: Press ArrowDown in the minute column.
      await minuteColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Minute 8 is now focused.
      expect(timePicker.find('[data-testid="timepicker_test_m8"]').classes()).toContain('focused');
      expect(timePicker.find('[data-testid="timepicker_test_m7"]').classes()).not.toContain('focused');
    });

    it('ArrowUp on minute listbox navigates to previous minute', async () => {
      // Ensures ArrowUp moves focus to the previous minute.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;

      // Arrange: First switch to minute column (as user would with Tab/ArrowRight).
      await minuteColumn.trigger('focus');
      await nextTick();

      // Act: Press ArrowUp in the minute column.
      await minuteColumn.trigger('keydown', { key: 'ArrowUp' });
      await nextTick();

      // Assert: Minute 6 is now focused.
      expect(timePicker.find('[data-testid="timepicker_test_m6"]').classes()).toContain('focused');
      expect(timePicker.find('[data-testid="timepicker_test_m7"]').classes()).not.toContain('focused');
    });

    it('Arrow wraps at hour boundaries', async () => {
      // Ensures ArrowUp at hour 0 wraps to 23, and ArrowDown at hour 23 wraps to 0.

      // Arrange: Set up with hour 0 selected initially.
      vi.setSystemTime(new Date('2026-05-21T00:07:00Z'));
      const someDate: Date = new Date('2026-05-22T00:30:00Z');
      const timePicker = createComponent(someDate, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;

      // Act: Press ArrowUp at hour 0.
      await hourColumn.trigger('keydown', { key: 'ArrowUp' });
      await nextTick();

      // Assert: Wraps to hour 23.
      expect(timePicker.find('[data-testid="timepicker_test_h23"]').classes()).toContain('focused');
      expect(timePicker.find('[data-testid="timepicker_test_h0"]').classes()).not.toContain('focused');

      // Act: Press ArrowDown twice from 23 → 0.
      await hourColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      await hourColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Wraps to hour 1 then... wait, 23→0→1 so two downs from 23 = 1.
      expect(timePicker.find('[data-testid="timepicker_test_h1"]').classes()).toContain('focused');
    });

    it('Arrow wraps at minute boundaries', async () => {
      // Ensures ArrowUp at minute 0 wraps to 59, and ArrowDown at minute 59 wraps to 0.

      // Arrange: Set up with minute 0 selected initially.
      vi.setSystemTime(new Date('2026-05-21T04:00:00Z'));
      const someDate: Date = new Date('2026-05-22T16:00:00Z');
      const timePicker = createComponent(someDate, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;

      // Arrange: First switch to minute column.
      await minuteColumn.trigger('focus');
      await nextTick();

      // Act: Press ArrowUp at minute 0.
      await minuteColumn.trigger('keydown', { key: 'ArrowUp' });
      await nextTick();

      // Assert: Wraps to minute 59.
      expect(timePicker.find('[data-testid="timepicker_test_m59"]').classes()).toContain('focused');
      expect(timePicker.find('[data-testid="timepicker_test_m0"]').classes()).not.toContain('focused');

      // Act: Press ArrowDown twice from 59 → 0 → 1.
      await minuteColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      await minuteColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Minute 1 is now focused.
      expect(timePicker.find('[data-testid="timepicker_test_m1"]').classes()).toContain('focused');
    });

    it('ArrowRight moves from hour to minute column', async () => {
      // Ensures ArrowRight key switches focus from hour listbox to minute listbox.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Arrange: Verify initial state is hour-focused.
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;
      expect(hourColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_h4');
      expect(minuteColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_m7');

      // Act: Press ArrowRight.
      await hourColumn.trigger('keydown', { key: 'ArrowRight' });
      await nextTick();

      // Assert: Minute column now has focus — aria-activedescendant unchanged for minute.
      expect(minuteColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_m7');
    });

    it('ArrowLeft moves from minute to hour column', async () => {
      // Ensures ArrowLeft key switches focus from minute listbox to hour listbox.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;

      // Act: Press ArrowLeft in the minute column.
      await minuteColumn.trigger('keydown', { key: 'ArrowLeft' });
      await nextTick();

      // Assert: Hour column now has focus.
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;
      expect(hourColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_h4');
    });

    it('Tab switches between hour and minute columns', async () => {
      // Ensures Tab switches from hour to minute, and Tab in minute switches back to hour.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;

      // Act: Press Tab in hour column.
      await hourColumn.trigger('keydown', { key: 'Tab' });
      await nextTick();

      // Assert: Minute column receives focus.
      expect(minuteColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_m7');

      // Act: Press Tab in minute column.
      await minuteColumn.trigger('keydown', { key: 'Tab' });
      await nextTick();

      // Assert: Hour column receives focus again.
      expect(hourColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_h4');
    });

    it('Enter selects hour and moves focus to minute column', async () => {
      // Ensures pressing Enter on a focused hour selects it and jumps to minute column.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;

      // Arrange: Navigate from hour 4 to hour 14.
      for (let i = 0; i < 10; i++) {
        await hourColumn.trigger('keydown', { key: 'ArrowDown' });
        await nextTick();
      }

      // Act: Press Enter to select hour 14.
      await hourColumn.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Hour 14 is selected.
      const emitted = timePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result = emitted?.at(-1)![0] as Date;
      expect(result.getUTCHours()).toBe(14);

      // Assert: Minute column now has focus.
      expect(minuteColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_m7');
    });

    it('Enter on same hour with allowNull deselects time and closes panel', async () => {
      // Ensures pressing Enter on the already-selected hour (allowNull=true) clears
      // the selection and closes the panel.

      // Arrange: Set up with a preselected time and allowNull.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const someDate: Date = new Date('2026-05-22T14:30:00Z');
      const timePicker = createComponent(someDate, 'test', true, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;

      // Arrange: Verify hour 14 is both selected and focused.
      expect(timePicker.find('[data-testid="timepicker_test_h14"]').classes()).toContain('selected');
      expect(timePicker.find('[data-testid="timepicker_test_h14"]').classes()).toContain('focused');

      // Act: Press Enter on already-selected hour 14 (same-hour toggle via allowNull).
      await hourColumn.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Time was deselected (model value is null).
      const emitted = timePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result = emitted?.at(-1)![0] as null;
      expect(result).toBeNull();

      // Assert: Panel is closed after deselection.
      expect(timePicker.find('.clock-container').exists()).toBe(false);
    });

    it('Enter on same minute with allowNull closes panel', async () => {
      // Ensures pressing Enter on the already-selected minute (allowNull=true) closes the panel
      // without deselecting date. This is more intuitive behavior than nulling result.

      // Arrange: Set up with a preselected time and allowNull.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const someDate: Date = new Date('2026-05-22T14:30:00Z');
      const timePicker = createComponent(someDate, 'test', true, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Arrange: Switch to minute column.
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;
      await hourColumn.trigger('keydown', { key: 'ArrowRight' });
      await nextTick();

      // Assert: Verify minute 30 is both selected and focused.
      expect(timePicker.find('[data-testid="timepicker_test_m30"]').classes()).toContain('selected');
      expect(timePicker.find('[data-testid="timepicker_test_m30"]').classes()).toContain('focused');

      // Act: Press Enter on already-selected minute 30.
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;
      await minuteColumn.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Time was NOT deselected.
      const emitted = timePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result = emitted?.at(-1)![0] as Date;
      expect(result.getUTCHours()).toBe(14);
      expect(result.getUTCMinutes()).toBe(30);

      // Assert: Panel is closed.
      expect(timePicker.find('.clock-container').exists()).toBe(false);
    });

    it('Space on minute selects time and closes panel', async () => {
      // Ensures pressing Space on a focused minute selects it and closes the panel.

      // Arrange: Set up date/time and open panel with a pre-selected hour.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const someDate: Date = new Date('2026-05-22T14:30:00Z');
      const timePicker = createComponent(someDate, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;

      // Arrange: Navigate to minute 45.
      for (let i = 0; i < 15; i++) {
        await minuteColumn.trigger('keydown', { key: 'ArrowDown' });
        await nextTick();
      }

      // Act: Press Space to select minute 45.
      await minuteColumn.trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: Minute 45 is selected and panel is closed.
      const emitted = timePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result = emitted?.at(-1)![0] as Date;
      expect(result.getUTCMinutes()).toBe(45);
      expect(timePicker.find('.clock-container').exists()).toBe(false);
    });

    it('Enter on minute selects time and closes panel', async () => {
      // Ensures pressing Enter on a focused minute selects it and closes the panel.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;

      // Arrange: First select hour 8 via Enter.
      await hourColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      await hourColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      await hourColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      await hourColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      await hourColumn.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Arrange: Navigate to minute 33.
      for (let i = 0; i < 26; i++) {
        await minuteColumn.trigger('keydown', { key: 'ArrowDown' });
        await nextTick();
      }

      // Act: Press Enter on minute 33.
      await minuteColumn.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Result has hour 8 and minute 33, and panel is closed.
      const emitted = timePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(2);
      const result = emitted?.at(-1)![0] as Date;
      expect(result.getUTCHours()).toBe(8);
      expect(result.getUTCMinutes()).toBe(33);
      expect(timePicker.find('.clock-container').exists()).toBe(false);
    });

    it('Escape in hour column closes panel', async () => {
      // Ensures Escape in the hour column closes the panel.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      expect(timePicker.find('.clock-container').exists()).toBe(true);

      // Act: Press Escape in the hour column.
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;
      await hourColumn.trigger('keydown', { key: 'Escape' });
      await nextTick();

      // Assert: Panel is closed.
      expect(timePicker.find('.clock-container').exists()).toBe(false);
    });

    it('Escape in minute column closes panel', async () => {
      // Ensures Escape in the minute column closes the panel.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, '', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Act: Press Escape in the minute column.
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;
      await minuteColumn.trigger('keydown', { key: 'Escape' });
      await nextTick();

      // Assert: Panel is closed.
      expect(timePicker.find('.clock-container').exists()).toBe(false);
    });

    it('Home and End on hour column jump to first and last hour', async () => {
      // Ensures Home jumps to hour 0 and End jumps to hour 23.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;

      // Act: Press Home to jump to hour 0.
      await hourColumn.trigger('keydown', { key: 'Home' });
      await nextTick();

      // Assert: Hour 0 is focused.
      expect(timePicker.find('[data-testid="timepicker_test_h0"]').classes()).toContain('focused');

      // Act: Press End to jump to hour 23.
      await hourColumn.trigger('keydown', { key: 'End' });
      await nextTick();

      // Assert: Hour 23 is focused.
      expect(timePicker.find('[data-testid="timepicker_test_h23"]').classes()).toContain('focused');
    });

    it('Home and End on minute column jump to first and last minute', async () => {
      // Ensures Home jumps to minute 0 and End jumps to minute 59.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;

      // Arrange: First switch to minute column.
      await minuteColumn.trigger('focus');
      await nextTick();

      // Act: Press Home to jump to minute 0.
      await minuteColumn.trigger('keydown', { key: 'Home' });
      await nextTick();

      // Assert: Minute 0 is focused.
      expect(timePicker.find('[data-testid="timepicker_test_m0"]').classes()).toContain('focused');

      // Act: Press End to jump to minute 59.
      await minuteColumn.trigger('keydown', { key: 'End' });
      await nextTick();

      // Assert: Minute 59 is focused.
      expect(timePicker.find('[data-testid="timepicker_test_m59"]').classes()).toContain('focused');
    });

    //

    it('Open panel via click, select hour via keyboard', async () => {
      // If you open panel via click, there is no visible focus.
      // If you press key, focus appears, but nothing else happens.

      // Arrange: Set up date/time and open panel via mouse.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;

      // Assert: No focus present.
      expect(timePicker.find('[data-testid="timepicker_test_h4"]').classes()).not.toContain('focused');
      expect(timePicker.find('[data-testid="timepicker_test_m7"]').classes()).not.toContain('focused');
      expect(hourColumn.attributes('aria-activedescendant')).toBeUndefined();
      expect(minuteColumn.attributes('aria-activedescendant')).toBeUndefined();

      // Act: Press arrow button. Note focus will appear, but we will NOT move down.
      await hourColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Act: Press Enter to select hour. Since we have focus, it works normally.
      await hourColumn.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Hour 4 is selected. Note it did NOT move to 5, that's correct behavior! Why?
      // Focus was invisible (since we opened panel via mouse click), so press of key shows focus first and do nothing else.
      // Only next key press will do something.
      const emitted = timePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result = emitted?.at(-1)![0] as Date;
      expect(result.getUTCHours()).toBe(4);

      // Assert: Minute column now has focus.
      expect(timePicker.find('[data-testid="timepicker_test_h4"]').classes()).not.toContain('focused');
      expect(timePicker.find('[data-testid="timepicker_test_m7"]').classes()).toContain('focused');
      expect(hourColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_h4');
      expect(minuteColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_m7');
    });

    it('Open panel via click, switch columns via keyboard', async () => {
      // If you open panel via click, there is no visible focus.
      // If you press key, focus appears, but nothing else happens.

      // Arrange: Set up date/time and open panel via mouse.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;

      // Assert: No focus present.
      expect(timePicker.find('[data-testid="timepicker_test_h4"]').classes()).not.toContain('focused');
      expect(timePicker.find('[data-testid="timepicker_test_m7"]').classes()).not.toContain('focused');
      expect(hourColumn.attributes('aria-activedescendant')).toBeUndefined();
      expect(minuteColumn.attributes('aria-activedescendant')).toBeUndefined();

      // Act: Press tab button. Note focus will appear, but we will NOT switch to minutes column.
      await hourColumn.trigger('keydown', { key: 'Tab' });
      await nextTick();

      // Assert: Focus present on hours column.
      expect(timePicker.find('[data-testid="timepicker_test_h4"]').classes()).toContain('focused');
      expect(timePicker.find('[data-testid="timepicker_test_m7"]').classes()).not.toContain('focused');
      expect(hourColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_h4');
      expect(minuteColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_m7');

      // Act: Press Enter to select hour.
      await hourColumn.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Hour 4 is selected.
      const emitted = timePicker.emitted('update:modelValue');
      expect(emitted).toHaveLength(1);
      const result = emitted?.at(-1)![0] as Date;
      expect(result.getUTCHours()).toBe(4);

      // Assert: Minute column now has focus.
      expect(timePicker.find('[data-testid="timepicker_test_h4"]').classes()).not.toContain('focused');
      expect(timePicker.find('[data-testid="timepicker_test_m7"]').classes()).toContain('focused');
      expect(hourColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_h4');
      expect(minuteColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_m7');
    });

    //

    it('keyboard navigation updates aria-activedescendant on hour column', async () => {
      // Ensures the hour listbox aria-activedescendant attribute follows keyboard focus.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const hourColumn = timePicker.findAll('.clock-column').at(0)!;

      // Assert: Initial active descendant points to hour 4.
      expect(hourColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_h4');

      // Act: Navigate down twice.
      await hourColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      await hourColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Active descendant now points to hour 6.
      expect(hourColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_h6');
    });

    it('keyboard navigation updates aria-activedescendant on minute column', async () => {
      // Ensures the minute listbox aria-activedescendant attribute follows keyboard focus.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      const minuteColumn = timePicker.findAll('.clock-column').at(1)!;

      // Assert: Initial active descendant points to minute 7.
      expect(minuteColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_m7');

      // Act: Navigate down three times.
      await minuteColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      await minuteColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();
      await minuteColumn.trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Active descendant now points to minute 10.
      expect(minuteColumn.attributes('aria-activedescendant')).toBe('timepicker_test_opt_m10');
    });

    it('option elements have unique id matching aria-activedescendant pattern', async () => {
      // Ensures hour and minute option elements have correct id attributes.

      // Arrange: Set up date/time and open panel via keyboard.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const timePicker = createComponent(null, 'test', false, false, false);
      await timePicker.find('.picker-input-time').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Option ids follow the correct pattern.
      expect(timePicker.find('[data-testid="timepicker_test_h4"]').attributes('id')).toBe('timepicker_test_opt_h4');
      expect(timePicker.find('[data-testid="timepicker_test_h14"]').attributes('id')).toBe('timepicker_test_opt_h14');
      expect(timePicker.find('[data-testid="timepicker_test_m7"]').attributes('id')).toBe('timepicker_test_opt_m7');
      expect(timePicker.find('[data-testid="timepicker_test_m33"]').attributes('id')).toBe('timepicker_test_opt_m33');
    });
  });
});
