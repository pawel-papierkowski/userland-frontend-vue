import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import CheckBox from '@/components/base/inputs/CheckBox.vue';

//

/** Convenience function to create component. */
function createComponent(modelValue: boolean | null, ident: string, allowNull: boolean, disabled: boolean, invalid: boolean) {
  return mount(CheckBox, {
    props: {
      modelValue, ident, allowNull, disabled, invalid,
    },
  });
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of CheckBox component. */
describe('CheckBox', () => {
  it('cycle true/false', async () => {
    // Ensure checkbox properly cycles (true -> false -> true) when null value is not allowed.
    // Note that programmatically setting null is stil possible even with allowNull === false. This is fine.
    // allowNull === false impacts only user actions.

    // Arrange&Act: Create check box.
    const checkBox = createComponent(null, '', false, false, false);

    // Assert: Checkbox is initialized to null. Note null value was set programmatically.
    expect(checkBox.find('.checkbox-inside').text()).toBe('◼');

    // Act: Click once (null -> true).
    await checkBox.find('.checkbox').trigger('click');

    // Assert: Model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(1);
    expect(checkBox.emitted('update:modelValue')?.[0]?.[0]).toBe(true);
    expect(checkBox.find('.checkbox-inside').text()).toBe('✔');

    // Act: Click again (true -> false).
    await checkBox.find('.checkbox').trigger('click');

    // Assert: Model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(2);
    expect(checkBox.emitted('update:modelValue')?.[1]?.[0]).toBe(false);
    expect(checkBox.find('.checkbox-inside').text()).toBe('');

    // Act: Click for third time (false -> true).
    await checkBox.find('.checkbox').trigger('click');

    // Assert: Model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(3);
    expect(checkBox.emitted('update:modelValue')?.[2]?.[0]).toBe(true);
    expect(checkBox.find('.checkbox-inside').text()).toBe('✔');
  });

  it('cycle null/true/false', async () => {
    // Ensure checkbox properly cycles (true -> false -> null -> true) when null value is allowed.

    // Arrange&Act: Create check box.
    const checkBox = createComponent(null, '', true, false, false);

    // Assert: Checkbox is initialized to null.
    expect(checkBox.find('.checkbox-inside').text()).toBe('◼');

    // Act: Click once (null -> true).
    await checkBox.find('.checkbox').trigger('click');

    // Assert: Model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(1);
    expect(checkBox.emitted('update:modelValue')?.[0]?.[0]).toBe(true);
    expect(checkBox.find('.checkbox-inside').text()).toBe('✔');

    // Act: Click again (true -> false).
    await checkBox.find('.checkbox').trigger('click');

    // Assert: Model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(2);
    expect(checkBox.emitted('update:modelValue')?.[1]?.[0]).toBe(false);
    expect(checkBox.find('.checkbox-inside').text()).toBe('');

    // Act: Click for third time (false -> null)
    await checkBox.find('.checkbox').trigger('click');

    // Assert: Model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(3);
    expect(checkBox.emitted('update:modelValue')?.[2]?.[0]).toBe(null);
    expect(checkBox.find('.checkbox-inside').text()).toBe('◼');

    // Act: Click for last time (null -> true).
    await checkBox.find('.checkbox').trigger('click');

    // Assert: Model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(4);
    expect(checkBox.emitted('update:modelValue')?.[3]?.[0]).toBe(true);
    expect(checkBox.find('.checkbox-inside').text()).toBe('✔');
  });

  it('is disabled', async () => {
    // Ensure nothing happens when we click on disabled checkbox.

    // Arrange&Act: Create check box that is disabled.
    const checkBox = createComponent(true, '', false, true, false);

    // Assert: Checkbox is initialized to true.
    expect(checkBox.find('.checkbox-inside').text()).toBe('✔');

    // Act: Click once, will not emit anything.
    await checkBox.find('.checkbox').trigger('click');

    // Assert: Model never emitted anything.
    expect(checkBox.emitted('update:modelValue')).toBeUndefined();
    // Assert: Checkbox shows it is set (model === true).
    expect(checkBox.find('.checkbox-inside').text()).toBe('✔');
    // Assert: CSS classes are correctly assigned, ensuring component is visually disabled.
    expect(checkBox.find('.checkbox').classes()).toStrictEqual(['checkbox', 'disabled']);
  });

  it('is invalid', async () => {
    // Ensure invalid checkbox is visually distinct.

    // Arrange&Act: Create check box that is disabled.
    const checkBox = createComponent(false, '', false, false, true);

    // Assert: Checkbox is initialized to false.
    expect(checkBox.find('.checkbox-inside').text()).toBe('');

    // Act: Click once.
    await checkBox.find('.checkbox').trigger('click');

    // Assert: Model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(1);
    expect(checkBox.emitted('update:modelValue')?.[0]?.[0]).toBe(true);
    expect(checkBox.find('.checkbox-inside').text()).toBe('✔');

    // Assert: Checkbox shows it is set (model === true).
    expect(checkBox.find('.checkbox-inside').text()).toBe('✔');

    // Assert: CSS classes are correctly assigned, ensuring component is visually invalid.
    expect(checkBox.find('.checkbox').classes()).toStrictEqual(['checkbox', 'err']);
  });
});
