import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import ComboBox from '@/components/base/inputs/ComboBox.vue';

//

/** Convenience function to create component. */
function createComponent(
  modelValue: number | string | null,
  ident: string,
  options: (number | string | null)[],
  disabled: boolean,
  invalid: boolean,
  langPrefix: string,
  placeholder?: string,
) {
  return mount(ComboBox, {
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
      placeholder,
    },
  });
}

/** Options for test combobox. */
function createOptions(): (number | string | null)[] {
  return [null, 'a', 'b', 'c'];
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of ComboBox component. */
describe('ComboBox', () => {
  it('has correct presentation', async () => {
    // Check if combobox is constructed correctly.

    // Arrange&Act: Set up combo box.
    const comboBox = createComponent('b', 'someCombobox', createOptions(), false, false, 'test.comboBox');

    // Assert: Combobox has correct data-testid attribute.
    expect(comboBox.attributes('data-testid')).toBe('combobox_someCombobox');
    // Assert: Combobox main field is present and shows selected option (in this case 'b')
    expect(comboBox.find('.combobox-selected-text').text()).toBe('Option B');
    // Assert: Options are hidden, as user did not click on combobox yet.
    expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');

    // Act: Open options.
    await comboBox.find('.combobox-selected').trigger('click');
    await nextTick();

    // Assert: Options are now visible.
    expect(comboBox.find('.combobox-options').attributes('style')).toContain('');

    // Assert: Options are present.
    const optionElements = comboBox.findAll('.combobox-option');
    expect(optionElements).toHaveLength(4);

    // Assert: All options are shown correctly.
    expect(optionElements[0]?.text()).toBe('-'); // default placeholder, as we did not provide any
    expect(optionElements[0]?.attributes('data-testid')).toBe('combobox_someCombobox_0');
    expect(optionElements[1]?.text()).toBe('Option A');
    expect(optionElements[1]?.attributes('data-testid')).toBe('combobox_someCombobox_1');
    expect(optionElements[2]?.text()).toBe('Option B');
    expect(optionElements[2]?.attributes('data-testid')).toBe('combobox_someCombobox_2');
    expect(optionElements[3]?.text()).toBe('Option C');
    expect(optionElements[3]?.attributes('data-testid')).toBe('combobox_someCombobox_3');
  });

  it('is correctly selected', async () => {
    // Check if combobox correctly selects option.

    // Arrange&Act: Set up combo box.
    const comboBox = createComponent(null, '', createOptions(), false, false, 'test.comboBox', 'test.comboBox.null');

    // Assert: Combobox main field is present and shows selected option (in this case null, thats it unselected)
    expect(comboBox.find('.combobox-selected-text').text()).toBe('Option UNSELECTED (null)');

    // Act: Open options.
    await comboBox.find('.combobox-selected').trigger('click');
    await nextTick();

    // Act: Click on one of options.
    await comboBox.find('[data-testid="combobox__1"]').trigger('click');
    await nextTick();

    // Assert: Model emitted correct value.
    expect(comboBox.emitted('update:modelValue')).toHaveLength(1);
    expect(comboBox.emitted('update:modelValue')?.[0]?.[0]).toBe('a');

    // Assert: Options are hidden, as user already selected option.
    expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');

    // Assert: Combobox main field is present and shows selected option (in this case 'a')
    expect(comboBox.find('.combobox-selected-text').text()).toBe('Option A');
  });

  //

  it('is disabled', async () => {
    // Check if combobox behaves correctly when disabled and disabled combobox is visually distinct.

    // Arrange&Act: set up disabled combo box.
    const comboBox = createComponent(null, '', createOptions(), true, false, 'test.comboBox', 'test.comboBox.null');

    // Act: Try to open options.
    await comboBox.find('.combobox-selected').trigger('click');
    await nextTick();

    // Assert: Model never emitted anything.
    expect(comboBox.emitted('update:modelValue')).toBeUndefined();

    // Assert: Options are still hidden, as combobox is disabled and won't open options.
    expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');
    // Assert: CSS classes are correctly assigned, ensuring component is visually disabled.
    expect(comboBox.find('.combobox').classes()).toStrictEqual(['combobox', 'disabled']);
  });

  it('is invalid', async () => {
    // Ensure combobox marked as invalid is visually distinct and fully functional.

    // Arrange&Act: Set up combo box marked as invalid.
    const comboBox = createComponent(null, '', createOptions(), false, true, 'test.comboBox', 'test.comboBox.null');

    // Assert: Options are hidden, as user did not click on combobox yet.
    expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');

    // Act: Open options.
    await comboBox.find('.combobox-selected').trigger('click');
    await nextTick();

    // Assert: Options are shown, as combobox visually marked as invalid is still fully functional.
    expect(comboBox.find('.combobox-options').attributes('style')).toContain('');

    // Act: Click on one of options.
    await comboBox.find('[data-testid="combobox__3"]').trigger('click');
    await nextTick();

    // Assert: Model emitted correct value.
    expect(comboBox.emitted('update:modelValue')).toHaveLength(1);
    expect(comboBox.emitted('update:modelValue')?.[0]?.[0]).toBe('c');

    // Assert: Options are now hidden again, as user already selected option.
    expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');

    // Assert: Combobox main field is present and shows selected option (in this case 'c')
    expect(comboBox.find('.combobox-selected-text').text()).toBe('Option C');

    // Assert: CSS classes are correctly assigned, ensuring component is visually invalid.
    expect(comboBox.find('.combobox').classes()).toStrictEqual(['combobox', 'err']);
  });
});
