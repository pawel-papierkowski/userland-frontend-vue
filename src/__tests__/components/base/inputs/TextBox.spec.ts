import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import TextBox from '@/components/base/inputs/TextBox.vue';

//

/** Convenience function to create component. */
function createComponent(
  modelValue: string | null,
  id: string,
  autocomplete: string,
  placeholder: string,
  disabled: boolean,
  invalid: boolean,
) {
  return mount(TextBox, {
    props: {
      modelValue,
      id,
      autocomplete,
      placeholder,
      disabled,
      invalid,
    },
  });
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of TextBox component. */
describe('TextBox', () => {
  it('has correct presentation for standard state', async () => {
    // Ensures component shows correctly for standard state.

    // Arrange&Act: Create textbox.
    const textBox = createComponent('Text in TextBox', 'someTextBox', 'off', 'Type here', false, false);

    // Assert: Input state is correct.
    const input = textBox.find('input');
    expect(input.classes()).toStrictEqual([]);
    expect(input.element.value).toBe('Text in TextBox');
    expect(input.attributes('type')).toBe('text');
    expect(input.attributes('autocomplete')).toBe('off');
    expect(input.attributes('placeholder')).toBe('Type here');
    expect(input.attributes('disabled')).toBeUndefined();
    expect(input.attributes('tabindex')).toBe('0');

    // Assert: Textbox has correct data-testid attribute.
    expect(textBox.attributes('data-testid')).toBe('textbox_someTextBox');
  });

  it('has correct presentation for disabled state', async () => {
    // Ensures component shows correctly for disabled state.

    // Arrange&Act: Create textboxx.
    const textBox = createComponent('Text in TextBox', '', '', '', true, false);

    // Assert: Input state is correct.
    const input = textBox.find('input');
    expect(input.classes()).toStrictEqual([]);
    expect(input.element.value).toBe('Text in TextBox');
    expect(input.attributes('type')).toBe('text');
    expect(input.attributes('autocomplete')).toBe('');
    expect(input.attributes('placeholder')).toBe('');
    expect(input.attributes('disabled')).toBeDefined();
    expect(input.attributes('tabindex')).toBe('-1'); // disabled component is skipped when finding next component to focus on

    // Assert: Textbox has correct data-testid attribute.
    expect(textBox.attributes('data-testid')).toBe('textbox_');
  });

  it('has correct presentation for invalid state', async () => {
    // Ensures component shows correctly for invalid state.

    // Arrange&Act: Create textboxx.
    const textBox = createComponent(null, '', 'on', '', false, true);

    // Assert: Input state is correct.
    const input = textBox.find('input');
    expect(input.classes()).toStrictEqual(['err']);
    expect(input.element.value).toBe(''); // null value is treated as empty string here
    expect(input.attributes('type')).toBe('text');
    expect(input.attributes('autocomplete')).toBe('on');
    expect(input.attributes('placeholder')).toBe('');
    expect(input.attributes('disabled')).toBeUndefined();
    expect(input.attributes('tabindex')).toBe('0');

    // Assert: Textbox has correct data-testid attribute.
    expect(textBox.attributes('data-testid')).toBe('textbox_');
  });

  //

  it('typing changes model value', async () => {
    // Ensures component behaves correctly when user types something in input.

    // Arrange: Create textbox and set focus.
    const textBox = createComponent(null, 'someTextBox', 'off', 'Type here', false, false);

    // Act: Type something in <input>.
    const input = textBox.find('input');
    await input.setValue('A');

    // Assert: Input state is correct.
    expect(input.element.value).toBe('A');

    // Assert: Emitted correct value.
    const emitted = textBox.emitted('update:modelValue');
    expect(emitted).toHaveLength(1);
    const result = emitted?.at(-1)![0] as string;
    expect(result).toBe('A');
  });
});
