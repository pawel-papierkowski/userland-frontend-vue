import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import ComboBox from '@/components/base/inputs/ComboBox.vue';

//

/** Convenience function to create component. */
function createComponent(
  modelValue: number | string | null,
  options: (number | string | null)[],
  disabled?: boolean,
  langPrefix?: string,
  placeholder?: string,
) {
  const component = mount(ComboBox, {
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue,
      options,
      disabled,
      langPrefix,
      placeholder,
    },
  });
  return component;
}

/** Options for test combobox. */
function createOptions(): (number | string | null)[] {
  return [null, 'a', 'b', 'c'];
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of ComboBox component. */
describe('ComboBox', () => {
  it('has correct presentation', async () => {
    // Check if combo box is constructed correctly.

    // Arrange and Act: set up combo box.
    const comboBox = createComponent('b', createOptions(), false, 'test.comboBox');

    // Assert: Options are hidden, as user did not click on combobox yet.
    //expect(comboBox.find('.combobox-options').element.style.display).toBe('none');
    expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');
    // Assert: Combobox main field is present and shows selected option (in this case 'b')
    expect(comboBox.find('.combobox-selected-text').text()).toBe('Option B');

    // Act: Open options.
    await comboBox.find('.combobox-selected').trigger('click');
    await nextTick();

    // Assert: Options are now visible.
    expect(comboBox.find('.combobox-options').attributes('style')).toContain('');

    // Assert: Options are present.
    const optionElements = comboBox.findAll('.combobox-option');
    expect(optionElements).toHaveLength(4);

    // Assert: all options are shown correctly.
    expect(optionElements[0]?.text()).toBe('-'); // default placeholder, as we did not provide any
    expect(optionElements[1]?.text()).toBe('Option A');
    expect(optionElements[2]?.text()).toBe('Option B');
    expect(optionElements[3]?.text()).toBe('Option C');
  });

  it('is correctly selected', async () => {
    // Check if combo box correctly selects option.

    // Arrange and Act: set up combo box.
    const comboBox = createComponent(null, createOptions(), false, 'test.comboBox', 'test.comboBox.null');

    // Assert: Combobox main field is present and shows selected option (in this case null, thats it unselected)
    expect(comboBox.find('.combobox-selected-text').text()).toBe('Option UNSELECTED (null)');

    // Act: Open options.
    await comboBox.find('.combobox-selected').trigger('click');
    await nextTick();

    // Act: Click on one of options.
    await comboBox.find('[data-testid="combobox_1"]').trigger('click');
    await nextTick();

    // Assert: model emitted correct value.
    expect(comboBox.emitted('update:modelValue')).toHaveLength(1);
    expect(comboBox.emitted('update:modelValue')?.[0]?.[0]).toBe('a');

    // Assert: Options are hidden, as user already selected option.
    expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');

    // Assert: Combobox main field is present and shows selected option (in this case 'a')
    expect(comboBox.find('.combobox-selected-text').text()).toBe('Option A');
  });

  it('is disabled', async () => {
    // Check if combo box behaves correctly when disabled.

    // Arrange and Act: set up disabled combo box.
    const comboBox = createComponent(null, createOptions(), true, 'test.comboBox', 'test.comboBox.null');

    // Act: Try to open options.
    await comboBox.find('.combobox-selected').trigger('click');
    await nextTick();

    // Assert: model never emitted anything.
    expect(comboBox.emitted('update:modelValue')).toBeUndefined();

    // Assert: Options are still hidden, as combobox is disabled and won't open options.
    expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');
  });
});
