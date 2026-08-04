import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

import CheckBox from '@/components/base/inputs/CheckBox.vue';

//

/** Convenience function to create component. */
function createComponent(
  modelValue: boolean | null,
  id: string,
  allowNull: boolean,
  disabled: boolean,
  invalid: boolean,
) {
  return mount(CheckBox, {
    props: {
      modelValue,
      id,
      allowNull,
      disabled,
      invalid,
    },
  });
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of CheckBox component. */
describe('CheckBox', () => {
  describe('general', () => {
    it('has correct presentation', async () => {
      // Check if checkbox is constructed correctly.

      // Arrange&Act: Create check box that has custom ident.
      const checkBox = createComponent(false, 'someCheckbox', false, false, false);

      // Assert: Checkbox is initialized to false.
      expect(checkBox.find('.checkbox-inside').text()).toBe('');
      // Assert: CSS classes are correctly assigned.
      expect(checkBox.find('.checkbox').classes()).toStrictEqual(['checkbox']);

      // Assert: Checkbox has correct data-testid attribute.
      expect(checkBox.attributes('data-testid')).toBe('someCheckbox');
    });

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
      // Assert: Checkbox shows it is set (model === true).
      expect(checkBox.find('.checkbox-inside').text()).toBe('✔');

      // Act: Click again (true -> false).
      await checkBox.find('.checkbox').trigger('click');

      // Assert: Model emitted correct value.
      expect(checkBox.emitted('update:modelValue')).toHaveLength(2);
      expect(checkBox.emitted('update:modelValue')?.[1]?.[0]).toBe(false);
      // Assert: Checkbox shows it is set (model === false).
      expect(checkBox.find('.checkbox-inside').text()).toBe('');

      // Act: Click for third time (false -> true).
      await checkBox.find('.checkbox').trigger('click');

      // Assert: Model emitted correct value.
      expect(checkBox.emitted('update:modelValue')).toHaveLength(3);
      expect(checkBox.emitted('update:modelValue')?.[2]?.[0]).toBe(true);
      // Assert: Checkbox shows it is set (model === true).
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
      // Assert: Checkbox shows it is set (model === true).
      expect(checkBox.find('.checkbox-inside').text()).toBe('✔');

      // Act: Click again (true -> false).
      await checkBox.find('.checkbox').trigger('click');

      // Assert: Model emitted correct value.
      expect(checkBox.emitted('update:modelValue')).toHaveLength(2);
      expect(checkBox.emitted('update:modelValue')?.[1]?.[0]).toBe(false);
      // Assert: Checkbox shows it is set (model === false).
      expect(checkBox.find('.checkbox-inside').text()).toBe('');

      // Act: Click for third time (false -> null)
      await checkBox.find('.checkbox').trigger('click');

      // Assert: Model emitted correct value.
      expect(checkBox.emitted('update:modelValue')).toHaveLength(3);
      expect(checkBox.emitted('update:modelValue')?.[2]?.[0]).toBe(null);
      // Assert: Checkbox shows it is set (model === null).
      expect(checkBox.find('.checkbox-inside').text()).toBe('◼');

      // Act: Click for last time (null -> true).
      await checkBox.find('.checkbox').trigger('click');

      // Assert: Model emitted correct value.
      expect(checkBox.emitted('update:modelValue')).toHaveLength(4);
      expect(checkBox.emitted('update:modelValue')?.[3]?.[0]).toBe(true);
      // Assert: Checkbox shows it is set (model === true).
      expect(checkBox.find('.checkbox-inside').text()).toBe('✔');
    });

    //

    it('cycles when paired <label> is clicked', async () => {
      // Verifies that clicking a <label for="id"> cycles the checkbox value,
      // and that pressing Space after the label click cycles it again.

      // Arrange: Mount CheckBox inside a wrapper with a paired <label>.
      const wrapper = mount({
        template: `
          <div>
            <label for="testCb">Test Label</label>
            <CheckBox id="testCb" v-model="value" />
          </div>
        `,
        components: { CheckBox },
        setup() {
          const value = ref<boolean | null>(null);
          return { value };
        },
      });
      await nextTick();

      const checkBox = wrapper.findComponent(CheckBox);

      // Assert: Checkbox is initialized to null (no symbol visible).
      expect(checkBox.find('.checkbox-inside').text()).toBe('◼');

      // Act: Click the <label>. The browser clicks on the hidden <button> (labelable),
      // which bubbles up to the wrapper and triggers cycle().
      await wrapper.find('label').trigger('click');
      await nextTick();

      // Assert: Value changed to true.
      expect(checkBox.emitted('update:modelValue')).toHaveLength(1);
      expect(checkBox.emitted('update:modelValue')?.[0]?.[0]).toBe(true);
      expect(checkBox.find('.checkbox-inside').text()).toBe('✔');

      // Act: Press Space on the hidden button (which has focus after label click).
      // The keydown bubbles to the wrapper's @keydown handler and triggers cycle again.
      await wrapper.find('#testCb').trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: Value changed to false.
      expect(checkBox.emitted('update:modelValue')).toHaveLength(2);
      expect(checkBox.emitted('update:modelValue')?.[1]?.[0]).toBe(false);
      expect(checkBox.find('.checkbox-inside').text()).toBe('');
    });

    //

    it('is disabled', async () => {
      // Ensure nothing happens when we click on disabled checkbox and disabled checkbox is visually distinct.

      // Arrange&Act: Create check box that is disabled.
      const checkBox = createComponent(true, '', false, true, false);

      // Assert: CSS classes are correctly assigned, ensuring component is visually disabled.
      expect(checkBox.find('.checkbox').classes()).toStrictEqual(['checkbox', 'disabled']);

      // Assert: Checkbox is initialized to true.
      expect(checkBox.find('.checkbox-inside').text()).toBe('✔');

      // Act: Click once, will not emit anything.
      await checkBox.find('.checkbox').trigger('click');

      // Assert: Model never emitted anything.
      expect(checkBox.emitted('update:modelValue')).toBeUndefined();
      // Assert: Checkbox shows it is set (model === true).
      expect(checkBox.find('.checkbox-inside').text()).toBe('✔');
    });

    it('is invalid', async () => {
      // Ensure checkbox marked as invalid is visually distinct and fully functional.

      // Arrange&Act: Create check box that is invalid.
      const checkBox = createComponent(false, '', false, false, true);

      // Assert: CSS classes are correctly assigned, ensuring component is visually invalid.
      expect(checkBox.find('.checkbox').classes()).toStrictEqual(['checkbox', 'err']);

      // Assert: Checkbox is initialized to false.
      expect(checkBox.find('.checkbox-inside').text()).toBe('');

      // Act: Click once. Visually invalid checkbox is still fully functional.
      await checkBox.find('.checkbox').trigger('click');

      // Assert: Model emitted correct value.
      expect(checkBox.emitted('update:modelValue')).toHaveLength(1);
      expect(checkBox.emitted('update:modelValue')?.[0]?.[0]).toBe(true);
      // Assert: Checkbox shows it is set (model === true).
      expect(checkBox.find('.checkbox-inside').text()).toBe('✔');
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Accessibility tests

  describe('accessibility', () => {
    it('has correct ARIA attributes', async () => {
      // Ensure checkbox has correct ARIA roles and attributes.

      // Arrange&Act: Create checkbox with null value.
      const checkBox = createComponent(null, 'someCheckbox', false, false, false);

      // Assert: Root has role checkbox.
      expect(checkBox.find('.checkbox').attributes('role')).toBe('checkbox');
      // Assert: Aria-checked reflects null as 'mixed'.
      expect(checkBox.find('.checkbox').attributes('aria-checked')).toBe('mixed');
      // Assert: Aria-disabled is not present when enabled.
      expect(checkBox.find('.checkbox').attributes('aria-disabled')).toBeUndefined();
      // Assert: Tabindex is 0 when enabled.
      expect(checkBox.find('.checkbox').attributes('tabindex')).toBe('0');

      // Act: Click to set true.
      await checkBox.find('.checkbox').trigger('click');

      // Assert: Aria-checked reflects true.
      expect(checkBox.find('.checkbox').attributes('aria-checked')).toBe('true');

      // Act: Click to set false.
      await checkBox.find('.checkbox').trigger('click');

      // Assert: Aria-checked reflects false.
      expect(checkBox.find('.checkbox').attributes('aria-checked')).toBe('false');
    });

    it('disabled checkbox has aria-disabled', async () => {
      // Ensure disabled checkbox sets aria-disabled.

      // Arrange&Act: Create check box that is disabled.
      const checkBox = createComponent(true, '', false, true, false);

      // Assert: Aria-disabled is present and true on the checkbox element.
      expect(checkBox.find('.checkbox').attributes('aria-disabled')).toBe('true');
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Keyboard navigation tests

  describe('keyboard', () => {
    it('responds to keyboard', async () => {
      // Ensure Space and Enter keys cycle the checkbox value, and other keys do nothing.

      // Arrange&Act: Create check box with null value and allowNull enabled.
      const checkBox = createComponent(null, '', true, false, false);

      // Assert: Checkbox starts at null.
      expect(checkBox.find('.checkbox-inside').text()).toBe('◼');

      // Act: Press Space (null -> true).
      await checkBox.find('.checkbox').trigger('keydown', { key: ' ' });

      // Assert: Model updated to true.
      expect(checkBox.emitted('update:modelValue')).toHaveLength(1);
      expect(checkBox.emitted('update:modelValue')?.[0]?.[0]).toBe(true);
      expect(checkBox.find('.checkbox-inside').text()).toBe('✔');

      // Act: Press Enter (true -> false).
      await checkBox.find('.checkbox').trigger('keydown', { key: 'Enter' });

      // Assert: Model updated to false.
      expect(checkBox.emitted('update:modelValue')).toHaveLength(2);
      expect(checkBox.emitted('update:modelValue')?.[1]?.[0]).toBe(false);
      expect(checkBox.find('.checkbox-inside').text()).toBe('');

      // Act: Press irrelevant key.
      await checkBox.find('.checkbox').trigger('keydown', { key: 'a' });

      // Assert: Number of emits unchanged.
      expect(checkBox.emitted('update:modelValue')).toHaveLength(2);
      expect(checkBox.find('.checkbox-inside').text()).toBe('');
    });

    it('disabled ignores keyboard', async () => {
      // Ensure Space and Enter keys are ignored when checkbox is disabled.

      // Arrange&Act: Create disabled check box.
      const checkBox = createComponent(false, '', true, true, false);

      // Assert: Checkbox is initialized to false.
      expect(checkBox.find('.checkbox-inside').text()).toBe('');

      // Act: Press Space.
      await checkBox.find('.checkbox').trigger('keydown', { key: ' ' });

      // Assert: Model never emitted.
      expect(checkBox.emitted('update:modelValue')).toBeUndefined();

      // Act: Press Enter.
      await checkBox.find('.checkbox').trigger('keydown', { key: 'Enter' });

      // Assert: Model still never emitted.
      expect(checkBox.emitted('update:modelValue')).toBeUndefined();
    });

    it('can be focused via Tab from previous field', async () => {
      // Verifies that pressing Tab to focus the checkbox (e.g. after tabbing
      // through a form) correctly focuses the checkbox element, and keyboard
      // interaction works after focus arrives.
      // Uses an <input> as the previous field.

      // Arrange: Mount a wrapper with an <input> followed by a <CheckBox>.
      const wrapper = mount({
        template: `
          <div>
            <input id="prevField" type="text" />
            <CheckBox id="testCb" v-model="value" />
          </div>
        `,
        components: { CheckBox },
        setup() {
          const value = ref<boolean | null>(null);
          return { value };
        },
      });
      await nextTick();

      const checkBox = wrapper.findComponent(CheckBox);
      const input = wrapper.find('input');
      const checkboxEl = checkBox.find('.checkbox');

      // Assert: Checkbox has tabindex 0, so it is reachable via Tab.
      expect(checkboxEl.attributes('tabindex')).toBe('0');

      // Act: Focus the <input> (user tabs through the form).
      await input.trigger('focus');
      await nextTick();

      // Act: Simulate Tab press moving focus to the checkbox root element.
      // (In jsdom, Tab keydown does not change focus, so we focus directly.)
      await checkboxEl.trigger('focus');
      await nextTick();

      // Act: Press Space to cycle the value.
      await checkboxEl.trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: Checkbox responded to keyboard (value changed from null to true).
      expect(checkBox.emitted('update:modelValue')).toHaveLength(1);
      expect(checkBox.emitted('update:modelValue')?.[0]?.[0]).toBe(true);
    });
  });
});
