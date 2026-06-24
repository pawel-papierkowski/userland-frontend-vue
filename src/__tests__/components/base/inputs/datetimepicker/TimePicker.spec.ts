import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import TimePicker from '@/components/base/inputs/datetimepicker/TimePicker.vue';

//

/** Boilerplate code. */
function createComponent(initialModel: Date|null, disabled?: boolean) {
  return mount(TimePicker, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: initialModel,
        disabled: disabled,
      }
    });
}

function verifyTime(timePicker: VueWrapper, currHour: number|null, currMinute: number|null, selHour: number|null, selMinute: number|null) {
  const hourElements = timePicker.findAll('.time-hour');
  expect(hourElements).toHaveLength(24);
  const minuteElements = timePicker.findAll('.time-minute');
  expect(minuteElements).toHaveLength(60);

  for (let i=0; i<24; i++) {
    const hourCss = ['time-item', 'time-hour'];
    const hourElement = timePicker.find(`[data-testid="timepicker__h${i}"]`);
    if (currHour && currHour === i) hourCss.push('curr');
    if (selHour && selHour === i) hourCss.push('selected');

    expect(hourElement.classes(), `Hour ${i} elem classes are wrong`).toEqual(hourCss);
  }

  for (let i=0; i<60; i++) {
    const minuteCss = ['time-item', 'time-minute'];
    const minuteElement = timePicker.find(`[data-testid="timepicker__m${i}"]`);
    if (currMinute && currMinute === i) minuteCss.push('curr');
    if (selMinute && selMinute === i) minuteCss.push('selected');

    expect(minuteElement.classes(), `Minute ${i} elem classes are wrong`).toEqual(minuteCss);
  }
}

//

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

  it('has correct presentation when null in general', async () => {
    // Ensures component looks correct when current value is null.

    // Arrange & Act: Create the component.
    const timePicker = createComponent(null, false);

    // Assert: Input is empty.
    expect(timePicker.find('.picker-input-time').attributes('value')).toBeUndefined();

    // Assert: Ensure panel is not present.
    expect(timePicker.find('.clock-container').exists()).toBe(false);
  });

  it('has correct presentation when set in general', async () => {
    // Ensures component looks correct when current value is set.

    // Arrange & Act: Create the component.
    const someDate: Date = new Date('2026-05-22T17:50:00Z'); // UTC
    const timePicker = createComponent(someDate, false);

    // Assert: Input is filled. Note it shows time in local timezone.
    expect(timePicker.find('.picker-input-time').attributes('value')).toContain('🕜 19:50');

    // Assert: Ensure panel is not present.
    expect(timePicker.find('.clock-container').exists()).toBe(false);
  });

  //

  it('has correct presentation when null and with panel opened', async () => {
    // Ensures component looks correct when panel is opened.

    // Arrange: Set up date/time.
    vi.setSystemTime(new Date('2026-05-21T04:07:00Z')); // UTC

    // Arrange: Create the component.
    const timePicker = createComponent(null, false);

    // Act: Open clock panel.
    await timePicker.find('.picker-input-time').trigger('click');
    await nextTick();

    // Assert: Ensure panel is present.
    expect(timePicker.find('.clock-container').exists()).toBe(true);

    // Assert: Panel shows scrollers with hours and minutes.
    verifyTime(timePicker, 6, 7, null, null); // note local time
  });

  it('has correct presentation when set and with panel opened', async () => {
    // Ensures component looks correct when panel is opened.

    // Arrange: Set up date/time.
    vi.setSystemTime(new Date('2026-05-21T04:07:00Z')); // UTC
    const someDate: Date = new Date('2026-05-22T16:30:00Z'); // UTC

    // Arrange: Create the component.
    const timePicker = createComponent(someDate, false);

    // Act: Open clock panel.
    await timePicker.find('.picker-input-time').trigger('click');
    await nextTick();

    // Assert: Ensure panel is present.
    expect(timePicker.find('.clock-container').exists()).toBe(true);

    // Assert: Panel shows scrollers with hours and minutes.
    verifyTime(timePicker, null, null, 18, 30); // note local time
    //verifyTime(timePicker, 6, 7, 18, 30); // note local time
  });

  //

  it('selects time', async () => {
    // Ensures component correctly selects time.

    // TODO
  });

  it('is disabled', async () => {
    // Ensures component behaves correctly when disabled.

    // Arrange: Create the component.
    const someDate: Date = new Date('2026-05-22T17:50:00Z'); // UTC
    const timePicker = createComponent(someDate, true);

    // Act: Open clock panel.
    await timePicker.find('.picker-input-time').trigger('click');
    await nextTick();

    // Assert: Ensure panel is NOT present, as component is disabled.
    expect(timePicker.find('.clock-container').exists()).toBe(false);
  });
});
