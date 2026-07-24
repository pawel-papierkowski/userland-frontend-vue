import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

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

    it('closes date panel when tabbing out in date mode', async () => {
      // Ensure date panel closes when user tabs out of the date picker entirely in date-only mode
      // (no TimePicker present). Tabbing out means focus moves to an element outside the picker.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Create the component with date mode (only DatePicker is shown).
      const dateTimePicker = createComponent(null, 'testDt', 'date', false, false, false, false);
      await nextTick();

      // Act: Click on date input to open calendar panel.
      const dateInput = dateTimePicker.find('#datepicker_testDt');
      await dateInput.trigger('click');
      await nextTick();

      // Assert: Calendar panel is visible.
      expect(dateTimePicker.find('.calendar-container').exists()).toBe(true);

      // Act: Simulate Tab out of the picker by dispatching focusout on the picker wrapper
      // with relatedTarget pointing outside the DatePicker.
      const pickerDate = dateTimePicker.find('.picker-date');
      const event = new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: document.body,
      });
      pickerDate.element.dispatchEvent(event);
      await nextTick();

      // Assert: Calendar panel is now closed.
      expect(dateTimePicker.find('.calendar-container').exists()).toBe(false);
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Auto-open on focus tests

  describe('auto-open on focus', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // mock scrollIntoView() - jsdom does not implement it.
      Element.prototype.scrollIntoView = vi.fn<() => void>();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('opens calendar panel when tabbing to date input in datetime mode', async () => {
      // Ensures that when the user Tabs to the date input, the calendar panel opens automatically.
      // Uses an <input> as the previous field (simulating Tab from another component).

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Mount a wrapper with an <input> before the DateTimePicker.
      const wrapper = mount({
        template: `
          <div>
            <input id="prevField" type="text" />
            <DateTimePicker id="testDt" mode="datetime" v-model="value" />
          </div>
        `,
        components: { DateTimePicker },
        setup() {
          const value = ref<Date | null>(null);
          return { value };
        },
      }, {
        global: { plugins: [i18n] },
      });
      await nextTick();

      const dateInput = wrapper.find('#datepicker_testDt');

      // Assert: Panel is initially closed.
      expect(wrapper.find('.calendar-container').exists()).toBe(false);

      // Act: Focus the previous field.
      await wrapper.find('input').trigger('focus');
      await nextTick();

      // Act: Focus the date input (simulates Tab from previous field).
      await dateInput.trigger('focus');
      await nextTick();

      // Assert: Calendar panel is now open.
      expect(wrapper.find('.calendar-container').exists()).toBe(true);
    });

    it('opens clock panel when tabbing to time input in datetime mode', async () => {
      // Ensures that when the user Tabs to the time input, the clock panel opens automatically.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Mount a wrapper with an <input> before the DateTimePicker.
      const wrapper = mount({
        template: `
          <div>
            <input id="prevField" type="text" />
            <DateTimePicker id="testDt" mode="datetime" v-model="value" />
          </div>
        `,
        components: { DateTimePicker },
        setup() {
          const value = ref<Date | null>(null);
          return { value };
        },
      }, {
        global: { plugins: [i18n] },
      });
      await nextTick();

      const timeInput = wrapper.find('#timepicker_ttestDt');

      // Assert: Panel is initially closed.
      expect(wrapper.find('.clock-container').exists()).toBe(false);

      // Act: Focus the previous field.
      await wrapper.find('input').trigger('focus');
      await nextTick();

      // Act: Focus the time input (simulates Tab from previous field).
      await timeInput.trigger('focus');
      await nextTick();

      // Assert: Clock panel is now open.
      expect(wrapper.find('.clock-container').exists()).toBe(true);
    });

    it('opens calendar panel when tabbing to date input in date mode', async () => {
      // Ensures that when the user Tabs to the date input in date-only mode,
      // the calendar panel opens automatically.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Mount a wrapper with an <input> before the DateTimePicker.
      const wrapper = mount({
        template: `
          <div>
            <input id="prevField" type="text" />
            <DateTimePicker id="testDt" mode="datetime" v-model="value" />
          </div>
        `,
        components: { DateTimePicker },
        setup() {
          const value = ref<Date | null>(null);
          return { value };
        },
      }, {
        global: { plugins: [i18n] },
      });
      await nextTick();

      const dateInput = wrapper.find('#datepicker_testDt');

      // Assert: Panel is initially closed.
      expect(wrapper.find('.calendar-container').exists()).toBe(false);

      // Act: Focus the previous field.
      await wrapper.find('input').trigger('focus');
      await nextTick();

      // Act: Focus the date input (simulates Tab from previous field).
      await dateInput.trigger('focus');
      await nextTick();

      // Assert: Calendar panel is now open.
      expect(wrapper.find('.calendar-container').exists()).toBe(true);
    });

    it('opens clock panel when tabbing to time input in time mode', async () => {
      // Ensures that when the user Tabs to the time input in time-only mode,
      // the clock panel opens automatically.

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Mount a wrapper with an <input> before the DateTimePicker.
      const wrapper = mount({
        template: `
          <div>
            <input id="prevField" type="text" />
            <DateTimePicker id="testDt" mode="time" v-model="value" />
          </div>
        `,
        components: { DateTimePicker },
        setup() {
          const value = ref<Date | null>(null);
          return { value };
        },
      }, {
        global: { plugins: [i18n] },
      });
      await nextTick();

      const timeInput = wrapper.find('#timepicker_testDt');

      // Assert: Panel is initially closed.
      expect(wrapper.find('.clock-container').exists()).toBe(false);

      // Act: Focus the previous field.
      await wrapper.find('input').trigger('focus');
      await nextTick();

      // Act: Focus the time input (simulates Tab from previous field).
      await timeInput.trigger('focus');
      await nextTick();

      // Assert: Clock panel is now open.
      expect(wrapper.find('.clock-container').exists()).toBe(true);
    });

    it('click on date input still toggles panel', async () => {
      // Ensure that clicking the date input still correctly toggles the panel
      // (auto-open on focus from Tab does not interfere).

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Create the component.
      const dateTimePicker = createComponent(null, 'testDt', 'datetime', false, false, false, false);
      await nextTick();

      const dateInput = dateTimePicker.find('#datepicker_testDt');

      // Assert: Panel is initially closed.
      expect(dateTimePicker.find('.calendar-container').exists()).toBe(false);

      // Act: Click on date input (should open).
      await dateInput.trigger('click');
      await nextTick();

      // Assert: Calendar panel is now open.
      expect(dateTimePicker.find('.calendar-container').exists()).toBe(true);

      // Act: Click on date input again (should close).
      await dateInput.trigger('click');
      await nextTick();

      // Assert: Calendar panel is now closed.
      expect(dateTimePicker.find('.calendar-container').exists()).toBe(false);
    });

    it('click on time input still toggles panel', async () => {
      // Ensure that clicking the time input still correctly toggles the panel
      // (auto-open on focus from Tab does not interfere).

      // Arrange: Set up date/time.
      vi.setSystemTime(new Date('2026-05-21T04:07:00Z'));

      // Act: Create the component.
      const dateTimePicker = createComponent(null, 'testDt', 'datetime', false, false, false, false);
      await nextTick();

      const timeInput = dateTimePicker.find('#timepicker_ttestDt');

      // Assert: Panel is initially closed.
      expect(dateTimePicker.find('.clock-container').exists()).toBe(false);

      // Act: Click on time input (should open).
      await timeInput.trigger('click');
      await nextTick();

      // Assert: Clock panel is now open.
      expect(dateTimePicker.find('.clock-container').exists()).toBe(true);

      // Act: Click on time input again (should close).
      await timeInput.trigger('click');
      await nextTick();

      // Assert: Clock panel is now closed.
      expect(dateTimePicker.find('.clock-container').exists()).toBe(false);
    });
  });
});
