import { describe, it, expect } from 'vitest';
import { DOMWrapper, mount } from '@vue/test-utils';

import i18n from '@/code/lang/i18n.ts';

import RadioBox from '@/components/base/inputs/RadioBox.vue';

//

/** Convenience function to create component. */
function createComponent(
  modelValue: number | string | null,
  id: string,
  options: (number | string | null)[],
  disabled: boolean,
  invalid: boolean,
  langPrefix?: string,
) {
  const component = mount(RadioBox, {
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue,
      id,
      options,
      disabled,
      invalid,
      langPrefix,
    },
  });
  return component;
}

/**
 * Options for test radiobox.
 * @returns Array of options.
 */
function createOptions(): (number | string | null)[] {
  return [null, 'one', 'two', 'three'];
}

/**
 * Test state of all option elements.
 * @param optionElements Option elements.
 * @param expectedCount Expected count of option elements.
 * @param expectedMark Expected index of mark (option element that is selected).
 */
function testOptions(optionElements: DOMWrapper<Element>[], expectedCount: number, expectedMark: number) {
  expect(optionElements).toHaveLength(expectedCount);

  for (let i = 0; i < expectedCount; i++) {
    const classes = expectedMark === i ? ['radiobox-inside', 'mark'] : ['radiobox-inside'];
    expect(optionElements[i]?.find('.radiobox-inside').classes()).toEqual(classes);
  }
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of RadioBox component. */
describe('RadioBox', () => {
  describe('general tests', () => {
    it('shows correctly translated options with langPrefix', async () => {
      // Check if radiobox is constructed correctly.

      // Arrange&Act: set up radiobox.
      const radioBox = createComponent(null, 'someRadioBox', createOptions(), false, false, 'test.radioBox');

      // Assert: Radiobox has correct data-testid attribute.
      expect(radioBox.attributes('data-testid')).toBe('radiobox_someRadioBox');

      // Assert: options are present.
      const optionElements = radioBox.findAll('.radiobox-option');

      // Assert: All options are shown correctly and first option is marked as selected.
      expect(optionElements[0]?.find('.radiobox-label').text()).toBe('Option UNSELECTED (null)');
      expect(optionElements[0]?.find('.radiobox-inside').classes()).toEqual(['radiobox-inside', 'mark']);
      expect(optionElements[0]?.attributes('data-testid')).toBe('radiobox_someRadioBox_0');

      expect(optionElements[1]?.find('.radiobox-label').text()).toBe('Option One');
      expect(optionElements[1]?.find('.radiobox-inside').classes()).toEqual(['radiobox-inside']);
      expect(optionElements[1]?.attributes('data-testid')).toBe('radiobox_someRadioBox_1');

      expect(optionElements[2]?.find('.radiobox-label').text()).toBe('Option Two');
      expect(optionElements[2]?.find('.radiobox-inside').classes()).toEqual(['radiobox-inside']);
      expect(optionElements[2]?.attributes('data-testid')).toBe('radiobox_someRadioBox_2');

      expect(optionElements[3]?.find('.radiobox-label').text()).toBe('Option Three');
      expect(optionElements[3]?.find('.radiobox-inside').classes()).toEqual(['radiobox-inside']);
      expect(optionElements[3]?.attributes('data-testid')).toBe('radiobox_someRadioBox_3');
    });

    it('shows raw options without langPrefix', async () => {
      // Ensure options are shown as raw values when no langPrefix is provided.

      // Arrange&Act: Set up radiobox without langPrefix.
      const radioBox = createComponent(null, '', createOptions(), false, false);

      // Assert: Options show raw values (null renders as empty string in Vue templates).
      const optionElements = radioBox.findAll('.radiobox-option');
      expect(optionElements[0]?.find('.radiobox-label').text()).toBe('');
      expect(optionElements[1]?.find('.radiobox-label').text()).toBe('one');
      expect(optionElements[2]?.find('.radiobox-label').text()).toBe('two');
      expect(optionElements[3]?.find('.radiobox-label').text()).toBe('three');
    });

    it('is correctly selected', async () => {
      // Check if radiobox correctly changes selection.

      // Arrange: Set up radiobox.
      const radioBox = createComponent('one', '', createOptions(), false, false, 'test.radioBox');

      // Assert: correct option is marked as selected.
      const optionElements = radioBox.findAll('.radiobox-option');
      testOptions(optionElements, 4, 1);

      // Act: Click on one of options.
      await radioBox.find('[data-testid="radiobox__2"]').trigger('click');

      // Assert: Model emitted correct value.
      expect(radioBox.emitted('update:modelValue')).toHaveLength(1);
      expect(radioBox.emitted('update:modelValue')?.[0]?.[0]).toBe('two');

      // Assert: Correct option is marked as selected.
      testOptions(optionElements, 4, 2);
    });

    it('is disabled', async () => {
      // Ensure nothing happens when we click on disabled radiobox and disabled radiobox is visually distinct.

      // Arrange: Set up disabled radiobox.
      const radioBox = createComponent(null, '', createOptions(), true, false, 'test.radioBox');

      // Assert: Correct option is marked as selected.
      const optionElements = radioBox.findAll('.radiobox-option');
      testOptions(optionElements, 4, 0);

      // Act: Click on one of options.
      await radioBox.find('[data-testid="radiobox__2"]').trigger('click');

      // Assert: Model never emitted anything.
      expect(radioBox.emitted('update:modelValue')).toBeUndefined();

      // Assert: Correct option is marked as selected (same as before click).
      testOptions(optionElements, 4, 0); // user tried to set 2

      // Assert: CSS classes are correctly assigned, ensuring component is visually disabled.
      expect(radioBox.find('.radiobox').classes()).toStrictEqual(['radiobox', 'disabled']);
    });

    it('is invalid', async () => {
      // Ensure radiobox marked as invalid is visually distinct and fully functional.

      // Arrange: Set up invalid radiobox.
      const radioBox = createComponent('three', '', createOptions(), false, true, 'test.radioBox');

      // Assert: CSS classes are correctly assigned, ensuring component is visually invalid.
      expect(radioBox.find('.radiobox').classes()).toStrictEqual(['radiobox', 'err']);

      // Assert: Correct option is marked as selected.
      const optionElements = radioBox.findAll('.radiobox-option');
      testOptions(optionElements, 4, 3);

      // Act: Click on one of options.
      await radioBox.find('[data-testid="radiobox__0"]').trigger('click');

      // Assert: Model emitted correct value.
      expect(radioBox.emitted('update:modelValue')).toHaveLength(1);
      expect(radioBox.emitted('update:modelValue')?.[0]?.[0]).toBe(null);

      // Assert: Correct option is marked as selected.
      testOptions(optionElements, 4, 0);
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Accessibility tests

  describe('accessibility', () => {
    it('has correct ARIA attributes', async () => {
      // Ensure radiobox has correct ARIA roles and attributes.

      // Arrange&Act: Set up radiobox.
      const radioBox = createComponent('two', 'someRadioBox', createOptions(), false, false, 'test.radioBox');

      // Assert: Container has role radiogroup.
      expect(radioBox.find('.radiobox').attributes('role')).toBe('radiogroup');

      // Assert: Every option has role radio and correct aria-checked.
      const options = radioBox.findAll('.radiobox-option');
      expect(options).toHaveLength(4);
      options.forEach((opt) => {
        expect(opt.attributes('role')).toBe('radio');
      });
      // Assert: aria-checked is true for selected option 'two' (index 2).
      expect(options[0]?.attributes('aria-checked')).toBe('false');
      expect(options[1]?.attributes('aria-checked')).toBe('false');
      expect(options[2]?.attributes('aria-checked')).toBe('true');
      expect(options[3]?.attributes('aria-checked')).toBe('false');

      // Assert: tabindex follows roving pattern — only selected option (index 2) has tabindex 0.
      expect(options[0]?.attributes('tabindex')).toBe('-1');
      expect(options[1]?.attributes('tabindex')).toBe('-1');
      expect(options[2]?.attributes('tabindex')).toBe('0');
      expect(options[3]?.attributes('tabindex')).toBe('-1');
    });

    it('disabled radiobox has all options non-focusable', async () => {
      // Ensure disabled radiobox sets tabindex="-1" on all options.

      // Arrange&Act: Set up disabled radiobox.
      const radioBox = createComponent('one', '', createOptions(), true, false, 'test.radioBox');

      // Assert: All options have tabindex -1.
      const options = radioBox.findAll('.radiobox-option');
      options.forEach((opt) => {
        expect(opt.attributes('tabindex')).toBe('-1');
      });
    });

    it('keyboard: ArrowRight/ArrowDown navigates forward', async () => {
      // Ensure ArrowRight and ArrowDown move selection to next option.

      // Arrange&Act: Set up radiobox with 'one' selected (index 1).
      const radioBox = createComponent('one', '', createOptions(), false, false, 'test.radioBox');
      const options = radioBox.findAll('.radiobox-option');

      // Assert: Initial selection is 'one' (index 1).
      expect(options[1]?.attributes('aria-checked')).toBe('true');

      // Act: Press ArrowDown.
      await radioBox.find('.radiobox').trigger('keydown', { key: 'ArrowDown' });

      // Assert: Selection moved to 'two' (index 2).
      expect(options[1]?.attributes('aria-checked')).toBe('false');
      expect(options[2]?.attributes('aria-checked')).toBe('true');
      expect(options[2]?.attributes('tabindex')).toBe('0');
      // Assert: Model emitted correct value.
      expect(radioBox.emitted('update:modelValue')).toHaveLength(1);
      expect(radioBox.emitted('update:modelValue')?.[0]?.[0]).toBe('two');

      // Act: Press ArrowRight.
      await radioBox.find('.radiobox').trigger('keydown', { key: 'ArrowRight' });

      // Assert: Selection moved to 'three' (index 3).
      expect(options[2]?.attributes('aria-checked')).toBe('false');
      expect(options[3]?.attributes('aria-checked')).toBe('true');
      expect(options[3]?.attributes('tabindex')).toBe('0');
      expect(radioBox.emitted('update:modelValue')).toHaveLength(2);
      expect(radioBox.emitted('update:modelValue')?.[1]?.[0]).toBe('three');
    });

    it('keyboard: ArrowLeft/ArrowUp navigates backward', async () => {
      // Ensure ArrowLeft and ArrowUp move selection to previous option.

      // Arrange&Act: Set up radiobox with 'two' selected (index 2).
      const radioBox = createComponent('two', '', createOptions(), false, false, 'test.radioBox');
      const options = radioBox.findAll('.radiobox-option');

      // Assert: Initial selection is 'two' (index 2).
      expect(options[2]?.attributes('aria-checked')).toBe('true');

      // Act: Press ArrowUp.
      await radioBox.find('.radiobox').trigger('keydown', { key: 'ArrowUp' });

      // Assert: Selection moved to 'one' (index 1).
      expect(options[2]?.attributes('aria-checked')).toBe('false');
      expect(options[1]?.attributes('aria-checked')).toBe('true');
      expect(options[1]?.attributes('tabindex')).toBe('0');
      expect(radioBox.emitted('update:modelValue')).toHaveLength(1);
      expect(radioBox.emitted('update:modelValue')?.[0]?.[0]).toBe('one');

      // Act: Press ArrowLeft.
      await radioBox.find('.radiobox').trigger('keydown', { key: 'ArrowLeft' });

      // Assert: Selection moved to null (index 0).
      expect(options[1]?.attributes('aria-checked')).toBe('false');
      expect(options[0]?.attributes('aria-checked')).toBe('true');
      expect(options[0]?.attributes('tabindex')).toBe('0');
      expect(radioBox.emitted('update:modelValue')).toHaveLength(2);
      expect(radioBox.emitted('update:modelValue')?.[1]?.[0]).toBe(null);
    });

    it('keyboard: wraps around at boundaries', async () => {
      // Ensure arrow key navigation wraps around at first and last option.

      // Arrange&Act: Set up radiobox with null selected (index 0, first option).
      const radioBox = createComponent(null, '', createOptions(), false, false, 'test.radioBox');
      const options = radioBox.findAll('.radiobox-option');

      // Assert: Initial selection is null (index 0).
      expect(options[0]?.attributes('aria-checked')).toBe('true');

      // Act: Press ArrowUp (wrap to last).
      await radioBox.find('.radiobox').trigger('keydown', { key: 'ArrowUp' });

      // Assert: Selection wrapped to last option 'three' (index 3).
      expect(options[0]?.attributes('aria-checked')).toBe('false');
      expect(options[3]?.attributes('aria-checked')).toBe('true');
      expect(options[3]?.attributes('tabindex')).toBe('0');

      // Act: Press ArrowDown (wrap to first).
      await radioBox.find('.radiobox').trigger('keydown', { key: 'ArrowDown' });

      // Assert: Selection wrapped back to null (index 0).
      expect(options[3]?.attributes('aria-checked')).toBe('false');
      expect(options[0]?.attributes('aria-checked')).toBe('true');
      expect(options[0]?.attributes('tabindex')).toBe('0');
    });

    it('keyboard: disabled ignores keyboard events', async () => {
      // Ensure arrow keys are ignored when radiobox is disabled.

      // Arrange&Act: Set up disabled radiobox with 'one' selected.
      const radioBox = createComponent('one', '', createOptions(), true, false, 'test.radioBox');
      const options = radioBox.findAll('.radiobox-option');

      // Assert: Initial selection is 'one'.
      expect(options[1]?.attributes('aria-checked')).toBe('true');

      // Act: Press ArrowDown.
      await radioBox.find('.radiobox').trigger('keydown', { key: 'ArrowDown' });

      // Assert: Selection unchanged.
      expect(options[1]?.attributes('aria-checked')).toBe('true');
      expect(options[2]?.attributes('aria-checked')).toBe('false');
      // Assert: Model never emitted.
      expect(radioBox.emitted('update:modelValue')).toBeUndefined();

      // Act: Press ArrowUp.
      await radioBox.find('.radiobox').trigger('keydown', { key: 'ArrowUp' });

      // Assert: Selection unchanged.
      expect(options[1]?.attributes('aria-checked')).toBe('true');
      expect(options[0]?.attributes('aria-checked')).toBe('false');
      // Assert: Model still never emitted.
      expect(radioBox.emitted('update:modelValue')).toBeUndefined();
    });

    it('click focuses and selects option', async () => {
      // Ensure clicking an option updates selection and tabindex.

      // Arrange&Act: Set up radiobox with 'one' selected.
      const radioBox = createComponent('one', '', createOptions(), false, false, 'test.radioBox');
      const options = radioBox.findAll('.radiobox-option');

      // Assert: 'one' (index 1) is selected with tabindex 0.
      expect(options[1]?.attributes('aria-checked')).toBe('true');
      expect(options[1]?.attributes('tabindex')).toBe('0');
      expect(options[2]?.attributes('tabindex')).toBe('-1');

      // Act: Click on 'three' (index 3).
      await options[3]?.trigger('click');

      // Assert: 'three' is now selected with tabindex 0.
      expect(options[1]?.attributes('aria-checked')).toBe('false');
      expect(options[1]?.attributes('tabindex')).toBe('-1');
      expect(options[3]?.attributes('aria-checked')).toBe('true');
      expect(options[3]?.attributes('tabindex')).toBe('0');
      // Assert: Model emitted correct value.
      expect(radioBox.emitted('update:modelValue')).toHaveLength(1);
      expect(radioBox.emitted('update:modelValue')?.[0]?.[0]).toBe('three');
    });
  });
});
