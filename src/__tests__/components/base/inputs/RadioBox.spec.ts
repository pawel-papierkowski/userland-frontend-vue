import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import i18n from '@/code/lang/i18n.ts';

import RadioBox from '@/components/base/inputs/RadioBox.vue';

//

/** Convenience function to create component. */
function createComponent(
  initialModel: number | string | null,
  options: (number | string | null)[],
  disabled?: boolean,
  langPrefix?: string,
) {
  const component = mount(RadioBox, {
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue: initialModel,
      options: options,
      disabled: disabled,
      langPrefix: langPrefix,
    },
  });
  return component;
}

/** Options for test radiobox. */
function createOptions(): (number | string | null)[] {
  return [null, 'one', 'two', 'three'];
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of RadioBox component. */
describe('RadioBox', () => {
  it('has correct presentation', async () => {
    // Check if radio box is constructed correctly.

    // Arrange and Act: set up radio box.
    const radioBox = createComponent(null, createOptions(), false, 'test.radioBox');

    // Assert: options are present.
    const optionElements = radioBox.findAll('.radiobox-option');
    expect(optionElements).toHaveLength(4);

    // Assert: all options are shown correctly and first option is marked as selected.
    expect(optionElements[0]?.find('.radiobox-label').text()).toBe('Option UNSELECTED (null)');
    expect(optionElements[0]?.find('.radiobox-inside').classes()).toEqual(['radiobox-inside', 'mark']);
    expect(optionElements[1]?.find('.radiobox-label').text()).toBe('Option One');
    expect(optionElements[1]?.find('.radiobox-inside').classes()).toEqual(['radiobox-inside']);
    expect(optionElements[2]?.find('.radiobox-label').text()).toBe('Option Two');
    expect(optionElements[2]?.find('.radiobox-inside').classes()).toEqual(['radiobox-inside']);
    expect(optionElements[3]?.find('.radiobox-label').text()).toBe('Option Three');
    expect(optionElements[3]?.find('.radiobox-inside').classes()).toEqual(['radiobox-inside']);
  });

  it('is correctly selected', async () => {
    // Check if radio box correctly changes selection.

    // Arrange: set up radio box.
    const radioBox = createComponent(null, createOptions(), false, 'test.radioBox');

    // Act: click on one of options.
    await radioBox.find('[data-testid="radiobox_2"]').trigger('click');

    // Assert: model emitted correct value.
    expect(radioBox.emitted('update:modelValue')).toHaveLength(1);
    expect(radioBox.emitted('update:modelValue')?.[0]?.[0]).toBe('two');

    // Assert: correct option is marked as selected.
    const optionElements = radioBox.findAll('.radiobox-option');
    expect(optionElements[0]?.find('.radiobox-inside').classes()).toEqual(['radiobox-inside']);
    expect(optionElements[1]?.find('.radiobox-inside').classes()).toEqual(['radiobox-inside']);
    expect(optionElements[2]?.find('.radiobox-inside').classes()).toEqual(['radiobox-inside', 'mark']);
    expect(optionElements[3]?.find('.radiobox-inside').classes()).toEqual(['radiobox-inside']);
  });

  it('is disabled', async () => {
    // Check if radio box correctly ignores user input when disabled.

    // Arrange: set up disabled radio box.
    const radioBox = createComponent(null, createOptions(), true, 'test.radioBox');

    // Act: click on one of options.
    await radioBox.find('[data-testid="radiobox_2"]').trigger('click');

    // Assert: model never emitted anything.
    expect(radioBox.emitted('update:modelValue')).toBeUndefined();

    // Assert: correct option is marked as selected (same as before click).
    const optionElements = radioBox.findAll('.radiobox-option');
    expect(optionElements[0]?.find('.radiobox-inside').classes()).toEqual(['radiobox-inside', 'mark']);
  });
});
