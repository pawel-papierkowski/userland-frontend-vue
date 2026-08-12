import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

import TextBox from '@/components/base/inputs/TextBox.vue';

//

/** Convenience function to create component. */
function createComponent(
  modelValue: string | null,
  id: string,
  autocomplete: string,
  allowPaste: boolean,
  placeholder: string,
  disabled: boolean,
  invalid: boolean,
) {
  return mount(TextBox, {
    props: {
      modelValue,
      id,
      autocomplete,
      allowPaste,
      placeholder,
      disabled,
      invalid,
    },
  });
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of TextBox component. */
describe('TextBox', () => {

  // ////////////////////////////////////////////////////////////////////////////
  // Presentation

  describe('presentation', () => {
    it('has correct presentation for standard state', async () => {
      // Ensures component shows correctly for standard state.

      // Arrange&Act: Create textbox.
      const textBox = createComponent('Text in TextBox', 'someTextBox', 'off', true, 'Type here', false, false);

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
      const textBox = createComponent('Text in TextBox', '', '', true, '', true, false);

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
      const textBox = createComponent(null, '', 'on', true, '', false, true);

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
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Usage

  describe('usage', () => {
    it('typing changes model value', async () => {
      // Ensures component behaves correctly when user types something in input.

      // Arrange: Create textbox and set focus.
      const textBox = createComponent(null, 'someTextBox', 'off', true, 'Type here', false, false);

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

    it('allows pasting text into <input> when allowPaste is true', async () => {
      // Ensures pasted text is accepted when pasting is allowed (default behavior).

      // Arrange: Create textbox with pasting allowed.
      const textBox = createComponent(null, 'someTextBox', 'off', true, 'Type here', false, false);
      const input = textBox.find('input');

      // Act: Capture paste event and trigger it on <input>.
      let pasteEvent: Event | undefined;
      input.element.addEventListener('paste', (event: Event) => {
        pasteEvent = event;
      });
      await input.trigger('paste');

      // Assert: Paste event was not prevented, so pasted text is accepted.
      expect(pasteEvent?.defaultPrevented).toBe(false);
    });

    it('prevents pasting text into <input> when allowPaste is false', async () => {
      // Ensures pasted text is rejected when pasting is disabled.

      // Arrange: Create textbox with pasting disallowed.
      const textBox = createComponent(null, 'someTextBox', 'off', false, 'Type here', false, false);
      const input = textBox.find('input');

      // Act: Capture paste event and trigger it on <input>.
      let pasteEvent: Event | undefined;
      input.element.addEventListener('paste', (event: Event) => {
        pasteEvent = event;
      });
      await input.trigger('paste');

      // Assert: Paste event was prevented, so pasted text is rejected.
      expect(pasteEvent?.defaultPrevented).toBe(true);
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Navigation

  describe('navigation', () => {
    it('clicking <label for> makes <input id> active', async () => {
      // Verifies that clicking a <label for="id"> makes <input id> active.
      // In jsdom, the synthetic click from <label> reaches the <input>, but
      // jsdom does not focus the <input> as a result (real browsers do).
      // So we verify the click arrives on the <input> (proving the label→input
      // association) and separately verify focusability.

      // Arrange: Mount TextBox inside a wrapper with a paired <label>.
      const wrapper = mount(
        {
          template: `
          <div>
            <label for="testTb">Test Label</label>
            <TextBox id="testTb" v-model="value" />
          </div>
        `,
          components: { TextBox },
          setup() {
            const value = ref<string | null>(null);
            return { value };
          },
        },
        {
          global: {},
          attachTo: document.body,
        },
      );
      await nextTick();

      const textBox = wrapper.findComponent(TextBox);
      const input = textBox.find('input');
      const label = wrapper.find('label');

      // Assert: <label> points to the correct <input> id.
      expect(input.attributes('id')).toBe('testTb');
      expect(label.attributes('for')).toBe('testTb');

      // Act: Click the <label>. In real browsers this also focuses the <input>.
      // In jsdom, the synthetic click reaches the input (verified below) but
      // does not trigger focus — that requires calling .focus() directly.
      let clickReceived = false;
      input.element.addEventListener('click', () => {
        clickReceived = true;
      });
      await label.trigger('click');
      await nextTick();

      // Assert: The synthetic click arrived at the <input>.
      expect(clickReceived).toBe(true);

      // Act: Manually focus the <input> (what a real browser does on click).
      input.element.focus();
      await nextTick();

      // Assert: Input is now active element.
      expect(document.activeElement).toBe(input.element);
    });

    it('is focusable via Tab navigation', async () => {
      // Verifies the TextBox <input> is focusable (has tabindex="0" when
      // not disabled), which means Tab navigation can reach it.

      // Arrange: Create enabled textbox.
      let textBox = createComponent(null, 'enabledTb', '', true, '', false, false);
      let input = textBox.find('input');

      // Assert: Enabled input has tabindex="0" (reachable via Tab).
      expect(input.attributes('tabindex')).toBe('0');

      // Arrange: Create disabled textbox.
      textBox = createComponent(null, 'disabledTb', '', true, '', true, false);
      input = textBox.find('input');

      // Assert: Disabled input has tabindex="-1" (skipped by Tab).
      expect(input.attributes('tabindex')).toBe('-1');
    });
  });
});
