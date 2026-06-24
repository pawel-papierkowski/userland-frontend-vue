import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import CheckBox from '@/components/base/inputs/CheckBox.vue';

//

/** Boilerplate code. */
function createComponent(initialModel: boolean|null, allowNull?: boolean, disabled?: boolean) {
  return mount(CheckBox, {
      props: {
        modelValue: initialModel,
        allowNull: allowNull,
        disabled: disabled,
      }
    });
}

//

/** Tests of CheckBox component. */
describe('CheckBox', () => {
  it('cycle true/false', async () => {
    // Ensure checkbox properly cycles (true -> false -> true) when null value is not allowed.
    // Note that programmatically setting null is stil possible even with allowNull === false.

    // Arrange: create check box.
    const checkBox = createComponent(null, false, false);

    // Act: click once (null -> true)
    await checkBox.find('.checkbox').trigger('click');

    // Assert: model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(1);
    expect(checkBox.emitted('update:modelValue')?.[0]?.[0]).toBe(true);
    expect(checkBox.find('.checkbox-inside').text()).toBe('✔');

    // Act: click again (true -> false)
    await checkBox.find('.checkbox').trigger('click');

    // Assert: model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(2);
    expect(checkBox.emitted('update:modelValue')?.[1]?.[0]).toBe(false);
    expect(checkBox.find('.checkbox-inside').text()).toBe('');

    // Act: click for third time (false -> true)
    await checkBox.find('.checkbox').trigger('click');

    // Assert: model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(3);
    expect(checkBox.emitted('update:modelValue')?.[2]?.[0]).toBe(true);
    expect(checkBox.find('.checkbox-inside').text()).toBe('✔');
  });

  it('cycle null/true/false', async () => {
    // Ensure checkbox properly cycles (true -> false -> null -> true) when null value is allowed.

    // Arrange: create check box.
    const checkBox = createComponent(null, true, false);

    // Act: click once (null -> true)
    await checkBox.find('.checkbox').trigger('click');

    // Assert: model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(1);
    expect(checkBox.emitted('update:modelValue')?.[0]?.[0]).toBe(true);
    expect(checkBox.find('.checkbox-inside').text()).toBe('✔');

    // Act: click again (true -> false)
    await checkBox.find('.checkbox').trigger('click');

    // Assert: model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(2);
    expect(checkBox.emitted('update:modelValue')?.[1]?.[0]).toBe(false);
    expect(checkBox.find('.checkbox-inside').text()).toBe('');

    // Act: click for third time (false -> null)
    await checkBox.find('.checkbox').trigger('click');

    // Assert: model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(3);
    expect(checkBox.emitted('update:modelValue')?.[2]?.[0]).toBe(null);
    expect(checkBox.find('.checkbox-inside').text()).toBe('◼');

    // Act: click for last time (null -> true)
    await checkBox.find('.checkbox').trigger('click');

    // Assert: model emitted correct value.
    expect(checkBox.emitted('update:modelValue')).toHaveLength(4);
    expect(checkBox.emitted('update:modelValue')?.[3]?.[0]).toBe(true);
    expect(checkBox.find('.checkbox-inside').text()).toBe('✔');
  });

  it('is disabled', async () => {
    // Ensure nothing happens when we click on disabled checkbox.

    // Arrange: create check box.
    const checkBox = createComponent(true, false, true);

    // Act: click once, will not emit anything
    await checkBox.find('.checkbox').trigger('click');

    // Assert: model never emitted anything.
    expect(checkBox.emitted('update:modelValue')).toBeUndefined();
    // Assert: checkbox shows it is set (model === true).
    expect(checkBox.find('.checkbox-inside').text()).toBe('✔');
  });
});
