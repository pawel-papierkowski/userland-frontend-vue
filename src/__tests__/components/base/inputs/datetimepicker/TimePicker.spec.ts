import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import TimePicker from '@/components/base/inputs/datetimepicker/TimePicker.vue';

//

/** Convenience function to create component. */
function createComponent(modelValue: Date | null, ident: string, disabled: boolean, invalid: boolean) {
  return mount(TimePicker, {
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue, ident, disabled, invalid,
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
 */
function verifyPanel(
  timePicker: VueWrapper,
  ident: string,
  currHour: number | null,
  currMinute: number | null,
  selHour: number | null,
  selMinute: number | null,
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

    expect(hourElement.classes(), `Hour ${i} elem classes are wrong`).toEqual(hourCss);
  }

  for (let i = 0; i < 60; i++) {
    const minuteCss = ['time-item', 'time-minute'];
    const minuteElement = timePicker.find(`[data-testid="timepicker_${ident}_m${i}"]`);
    if (currMinute !== null && currMinute === i) minuteCss.push('curr');
    if (selMinute !== null && selMinute === i) minuteCss.push('selected');

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

  describe('general tests', () => {
    it('has correct presentation when null in general', async () => {
      // Ensures component looks correct when current value is null.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Create the component.
      const timePicker = createComponent(null, '', false, false);

      // Assert: Input is empty.
      expect(timePicker.find('.picker-input-time').attributes('value')).toBeUndefined();

      // Assert: Ensure panel is not present.
      expect(timePicker.find('.clock-container').exists()).toBe(false);

      // Assert: model has correct value.
      const model = timePicker.props('modelValue') as Date | null;
      expect(model).toBe(null);
    });

    it('has correct presentation when null and with panel opened', async () => {
      // Ensures component looks correct when panel is opened.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Arrange: Create the component.
      const timePicker = createComponent(null, 'someTimePicker', false, false);

      // Act: Open clock panel.
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Assert: Ensure panel is present.
      expect(timePicker.find('.clock-container').exists()).toBe(true);

      // Assert: TimePicker has correct data-testid attribute.
      expect(timePicker.find('input').attributes('data-testid')).toBe('timepicker_someTimePicker');

      // Assert: Panel shows scrollers with hours and minutes. Only current time is marked.
      verifyPanel(timePicker, 'someTimePicker', 4, 7, null, null); // note same time as in arrange
    });

    //

    it('has correct presentation when set in general', async () => {
      // Ensures component looks correct when current value is set.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const someDate: Date = new Date('2026-05-22T17:50:00Z');

      // Act: Create the component.
      const timePicker = createComponent(someDate, '', false, false);

      // Assert: Input is filled.
      expect(timePicker.find('.picker-input-time').attributes('value')).toContain('🕜 17:50');

      // Assert: Ensure panel is not present.
      expect(timePicker.find('.clock-container').exists()).toBe(false);

      // Assert: model has correct value.
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
      const timePicker = createComponent(someDate, '', false, false);

      // Act: Open clock panel.
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Assert: Ensure panel is present.
      expect(timePicker.find('.clock-container').exists()).toBe(true);

      // Assert: Panel shows scrollers with hours and minutes. Both current and selected time is marked.
      verifyPanel(timePicker, '', 4, 7, 16, 30); // note same time as in arrange
    });

    //

    it('selects time', async () => {
      // Ensures component correctly selects time.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Arrange: Create the component.
      const timePicker = createComponent(null, '', false, false);

      // Act: Open clock panel.
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: select hour and minute.
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

    it('is disabled', async () => {
      // Ensures component behaves correctly when disabled.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));
      const someDate: Date = new Date('2026-05-22T17:50:00Z'); // UTC

      // Arrange: Create the component.
      const timePicker = createComponent(someDate, '', true, false);

      // Assert: CSS classes are correctly assigned, ensuring component is visually disabled.
      expect(timePicker.find('.picker-input-time').classes()).toStrictEqual(['picker-input-time', 'disabled']);

      // Act: Try to open clock panel.
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Assert: Ensure panel is NOT present, as component is disabled.
      expect(timePicker.find('.clock-container').exists()).toBe(false);
    });

    it('is invalid', async () => {
      // Ensure timepicker marked as invalid is visually distinct and fully functional.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-06-01T17:34:00Z'));

      // Arrange: Create the component.
      const timePicker = createComponent(null, '', false, true);

      // Assert: CSS classes are correctly assigned, ensuring component is visually invalid.
      expect(timePicker.find('.picker-input-time').classes()).toStrictEqual(['picker-input-time', 'err']);

      // Act: Open clock panel.
      await timePicker.find('.picker-input-time').trigger('click');
      await nextTick();

      // Act: select hour and minute.
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
});
