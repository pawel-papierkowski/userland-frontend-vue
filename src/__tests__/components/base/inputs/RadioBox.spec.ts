import { describe, it, expect } from 'vitest';
import { DOMWrapper, mount } from '@vue/test-utils';

import i18n from '@/code/lang/i18n.ts';

import RadioBox from '@/components/base/inputs/RadioBox.vue';

//

/** Convenience function to create component. */
function createComponent(
  modelValue: number | string | null,
  ident: string,
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
      ident,
      options,
      disabled,
      invalid,
      langPrefix,
    },
  });
  return component;
}

/** Options for test radiobox. */
function createOptions(): (number | string | null)[] {
  return [null, 'one', 'two', 'three'];
}

function testOptions(optionElements: DOMWrapper<Element>[], expectedCount: number, expectedMark: number) {
  expect(optionElements).toHaveLength(expectedCount);

  for (let i=0; i<expectedCount; i++) {
    const classes = expectedMark === i ? ['radiobox-inside', 'mark'] : ['radiobox-inside'];
    expect(optionElements[i]?.find('.radiobox-inside').classes()).toEqual(classes);
  }
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of RadioBox component. */
describe('RadioBox', () => {
  describe('general tests', () => {
    it('has correct presentation', async () => {
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

      // Assert: CSS classes are correctly assigned, ensuring component is visually invalid.
      expect(radioBox.find('.radiobox').classes()).toStrictEqual(['radiobox', 'disabled']);
    });

    it('is invalid', async () => {
      // Ensure radiobox marked as invalid is visually distinct and fully functional.

      // Arrange: Set up disabled radiobox.
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

  //describe('accessibility', () => {
  // TODO LATER
  //});
});
