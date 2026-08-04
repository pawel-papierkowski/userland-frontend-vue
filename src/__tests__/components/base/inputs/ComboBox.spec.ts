import { describe, it, expect } from 'vitest';
import { DOMWrapper, mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import ComboBox from '@/components/base/inputs/ComboBox.vue';

//

/** Convenience function to create component. */
function createComponent(
  modelValue: number | string | null,
  id: string,
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
      id,
      options,
      disabled,
      invalid,
      langPrefix,
      placeholder,
    },
  });
}

/** Options for test combobox that includes null. */
function createOptions(): (number | string | null)[] {
  return [null, 'a', 'b', 'c'];
}

/** Options for test combobox without null. */
function createOptionsNoNull(): (number | string | null)[] {
  return ['a', 'b', 'c', 'd'];
}

/**
 * Verify all entries for highlight.
 * @param highlighted -1 if none highlighted, otherwise index of option that should have highlight.
 */
function verifyHighlight(options: DOMWrapper<Element>[], highlighted: number) {
  let ix = 0;
  for (const option of options) {
    const expectedClasses: string[] = ['combobox-option'];
    if (ix === highlighted) expectedClasses.push('highlighted');

    expect(option.classes(), `Option ${ix} has invalid classes`).toStrictEqual(expectedClasses);
    ix++;
  }
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of ComboBox component. */
describe('ComboBox', () => {
  describe('general', () => {
    it('has correct presentation without null', async () => {
      // Check if combobox is constructed correctly.

      // Arrange&Act: Set up combobox.
      const comboBox = createComponent('b', 'someCombobox', createOptionsNoNull(), false, false, 'test.comboBox');

      // Assert: Combobox has correct data-testid attribute.
      expect(comboBox.attributes('data-testid')).toBe('someCombobox');
      // Assert: Combobox main field is present and shows selected option (in this case 'b')
      expect(comboBox.find('.combobox-selected-text').text()).toBe('Option B');
      // Assert: Options are hidden, as user did not click on combobox yet.
      expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');

      // Act: Open options.
      await comboBox.find('.combobox-selected').trigger('click');
      await nextTick();

      // Assert: Options are now visible.
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');

      // Assert: Options are present.
      const options = comboBox.findAll('.combobox-option');
      expect(options).toHaveLength(4);
      verifyHighlight(options, 1); // highlight is already present on list
      expect(comboBox.attributes('aria-activedescendant')).toBe('someCombobox_option_1');

      // Assert: All options are shown correctly.
      expect(options[0]?.text()).toBe('Option A');
      expect(options[0]?.attributes('data-testid')).toBe('someCombobox_0');
      expect(options[1]?.text()).toBe('Option B'); // selected and highlighted option
      expect(options[1]?.attributes('data-testid')).toBe('someCombobox_1');
      expect(options[2]?.text()).toBe('Option C');
      expect(options[2]?.attributes('data-testid')).toBe('someCombobox_2');
      expect(options[3]?.text()).toBe('Option D');
      expect(options[3]?.attributes('data-testid')).toBe('someCombobox_3');
    });

    it('has correct presentation with null', async () => {
      // Check if combobox is constructed correctly. Combobox can handle selection of null value if present in list
      // of options.

      // Arrange&Act: Set up combobox.
      const comboBox = createComponent(null, 'someCombobox', createOptions(), false, false, 'test.comboBox');

      // Assert: Combobox has correct data-testid attribute.
      expect(comboBox.attributes('data-testid')).toBe('someCombobox');
      // Assert: Combobox main field is present and shows selected option (in this case '-' for null)
      expect(comboBox.find('.combobox-selected-text').text()).toBe('-');
      // Assert: Options are hidden, as user did not click on combobox yet.
      expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');

      // Act: Open options.
      await comboBox.find('.combobox-selected').trigger('click');
      await nextTick();

      // Assert: Options are now visible.
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');

      // Assert: Options are present.
      const options = comboBox.findAll('.combobox-option');
      expect(options).toHaveLength(4);
      verifyHighlight(options, 0); // highlight is already present on list, as null case is included
      expect(comboBox.attributes('aria-activedescendant')).toBe('someCombobox_option_0');

      // Assert: All options are shown correctly.
      expect(options[0]?.text()).toBe('-'); // selected and highlighted option
      expect(options[0]?.attributes('data-testid')).toBe('someCombobox_0');
      expect(options[1]?.text()).toBe('Option A');
      expect(options[1]?.attributes('data-testid')).toBe('someCombobox_1');
      expect(options[2]?.text()).toBe('Option B');
      expect(options[2]?.attributes('data-testid')).toBe('someCombobox_2');
      expect(options[3]?.text()).toBe('Option C');
      expect(options[3]?.attributes('data-testid')).toBe('someCombobox_3');
    });

    it('is correctly selected via mouse', async () => {
      // Check if combobox correctly selects option via mouse.

      // Arrange&Act: Set up combobox.
      const comboBox = createComponent(null, 'someCombobox', createOptions(), false, false, 'test.comboBox', 'test.comboBox.null');

      // Assert: Combobox main field is present and shows selected option (in this case null, that's it, unselected).
      expect(comboBox.find('.combobox-selected-text').text()).toBe('Option UNSELECTED (null)');

      // Act: Open options.
      await comboBox.find('.combobox-selected').trigger('click');
      await nextTick();

      // Act: Click on one of options.
      await comboBox.find('[data-testid="someCombobox_1"]').trigger('click');
      await nextTick();

      // Assert: Model emitted correct value.
      expect(comboBox.emitted('update:modelValue')).toHaveLength(1);
      expect(comboBox.emitted('update:modelValue')?.[0]?.[0]).toBe('a');

      // Assert: Options are hidden, as user already selected option.
      expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');

      // Assert: Combobox main field is present and shows selected option (in this case 'a')
      expect(comboBox.find('.combobox-selected-text').text()).toBe('Option A');
    });

    it('mouseenter highlights option', async () => {
      // Ensure hovering over an option updates the highlighted index.

      // Arrange: Create combobox.
      const comboBox = createComponent(null, 'someCombobox', createOptions(), false, false, 'test.comboBox');

      // Act: Open combobox.
      await comboBox.find('.combobox-selected').trigger('click');
      await nextTick();

      // Act: Hover over third option.
      await comboBox.findAll('.combobox-option')[2]?.trigger('mouseenter');
      await nextTick();

      // Assert: Third option is highlighted.
      const options = comboBox.findAll('.combobox-option');
      verifyHighlight(options, 2);
      // Assert: Aria-activedescendant updated.
      expect(comboBox.attributes('aria-activedescendant')).toBe('someCombobox_option_2');
    });

    it('opens when paired <label> is clicked', async () => {
      // Verifies that clicking a <label for="id"> opens the combobox list.

      // Arrange: Mount ComboBox inside a wrapper with a paired <label>.
      const wrapper = mount({
        template: `
          <div>
            <label for="testCb">Test Label</label>
            <ComboBox
              id="testCb"
              v-model="value"
              :options="options"
              langPrefix="test.comboBox"
            />
          </div>
        `,
        components: { ComboBox },
        setup() {
          const value = ref<string | number | null>(null);
          return { value, options: createOptions() };
        },
      }, {
        global: { plugins: [i18n] },
      });
      await nextTick();

      const comboBox = wrapper.findComponent(ComboBox);

      // Assert: Options are initially hidden.
      expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');

      // Act: Click the <label>. The browser clicks on the hidden <button> (labelable),
      // which triggers handleClick → opens the list.
      await wrapper.find('label').trigger('click');
      await nextTick();

      // Assert: Options are now visible.
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');
    });

    //

    it('is disabled', async () => {
      // Check if combobox behaves correctly when disabled and disabled combobox is visually distinct.

      // Arrange&Act: Set up disabled combobox.
      const comboBox = createComponent(null, '', createOptions(), true, false, 'test.comboBox', 'test.comboBox.null');

      // Assert: CSS classes are correctly assigned, ensuring component is visually disabled.
      expect(comboBox.find('.combobox').classes()).toStrictEqual(['combobox', 'disabled']);

      // Act: Try to open options.
      await comboBox.find('.combobox-selected').trigger('click');
      await nextTick();

      // Assert: Model never emitted anything.
      expect(comboBox.emitted('update:modelValue')).toBeUndefined();

      // Assert: Options are still hidden, as combobox is disabled and won't open options.
      expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');
    });

    it('is invalid', async () => {
      // Ensure combobox marked as invalid is visually distinct and fully functional.

      // Arrange&Act: Set up combobox marked as invalid.
      const comboBox = createComponent(null, 'someCombobox', createOptions(), false, true, 'test.comboBox', 'test.comboBox.null');

      // Assert: CSS classes are correctly assigned, ensuring component is visually invalid.
      expect(comboBox.find('.combobox').classes()).toStrictEqual(['combobox', 'err']);

      // Assert: Options are hidden, as user did not click on combobox yet.
      expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');

      // Act: Open options.
      await comboBox.find('.combobox-selected').trigger('click');
      await nextTick();

      // Assert: Options are shown, as combobox visually marked as invalid is still fully functional.
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');

      // Act: Click on one of options.
      await comboBox.find('[data-testid="someCombobox_3"]').trigger('click');
      await nextTick();

      // Assert: Model emitted correct value.
      expect(comboBox.emitted('update:modelValue')).toHaveLength(1);
      expect(comboBox.emitted('update:modelValue')?.[0]?.[0]).toBe('c');

      // Assert: Options are now hidden again, as user already selected option.
      expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');

      // Assert: Combobox main field is present and shows selected option (in this case 'c')
      expect(comboBox.find('.combobox-selected-text').text()).toBe('Option C');
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Accessibility tests

  describe('accessibility', () => {
    it('has correct ARIA attributes', async () => {
      // Ensure combobox has correct ARIA roles and attributes.

      // Arrange&Act: Set up combobox.
      const comboBox = createComponent('b', 'someCombobox', createOptions(), false, false, 'test.comboBox');

      // Assert: Root has role combobox.
      expect(comboBox.attributes('role')).toBe('combobox');
      // Assert: Aria-expanded starts as false.
      expect(comboBox.attributes('aria-expanded')).toBe('false');
      // Assert: Aria-haspopup is listbox.
      expect(comboBox.attributes('aria-haspopup')).toBe('listbox');
      // Assert: Aria-controls is set.
      expect(comboBox.attributes('aria-controls')).toBe('listbox_someCombobox');
      // Assert: Aria-activedescendant is not set when no option is highlighted.
      expect(comboBox.attributes('aria-activedescendant')).toBeUndefined();
      // Assert: Aria-disabled is not present when enabled.
      expect(comboBox.attributes('aria-disabled')).toBeUndefined();

      // Assert: Options container has role listbox.
      expect(comboBox.find('.combobox-options').attributes('role')).toBe('listbox');

      // Assert: Every option has role option and aria-selected.
      const options = comboBox.findAll('.combobox-option');
      expect(options).toHaveLength(4);
      options.forEach((opt, _) => {
        expect(opt.attributes('role')).toBe('option');
      });
      // Assert: Option 'b' (index 2) is selected.
      expect(options[0]?.attributes('aria-selected')).toBe('false');
      expect(options[1]?.attributes('aria-selected')).toBe('false');
      expect(options[2]?.attributes('aria-selected')).toBe('true');
      expect(options[3]?.attributes('aria-selected')).toBe('false');

      // Act: Open options to verify aria-expanded changes.
      await comboBox.find('.combobox-selected').trigger('click');
      await nextTick();

      // Assert: Aria-expanded reflects open state.
      expect(comboBox.attributes('aria-expanded')).toBe('true');
    });

    it('disabled combobox has aria-disabled', async () => {
      // Ensure disabled combobox sets aria-disabled.

      // Arrange&Act: Set up disabled combobox.
      const comboBox = createComponent(null, '', createOptions(), true, false, 'test.comboBox');

      // Assert: Aria-disabled is present and true.
      expect(comboBox.attributes('aria-disabled')).toBe('true');
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Keyboard navigation tests

  describe('keyboard', () => {
    it('ArrowDown opens and navigates down', async () => {
      // Ensure ArrowDown opens combobox and highlights first option, as nothing is selected.
      // Subsequent presses moves highlight down.

      // Arrange&Act: Set up combobox. Note we have null selected and NO null option.
      const comboBox = createComponent(null, 'someCombobox', createOptionsNoNull(), false, false, 'test.comboBox');

      // Act: Press ArrowDown on root combobox.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Options are now visible.
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');
      // Assert: First option is highlighted.
      const options = comboBox.findAll('.combobox-option');
      verifyHighlight(options, 0);
      expect(comboBox.attributes('aria-activedescendant')).toBe('someCombobox_option_0');

      // Act: Press ArrowDown again to move to next option.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Second option is now highlighted.
      verifyHighlight(options, 1);
      expect(comboBox.attributes('aria-activedescendant')).toBe('someCombobox_option_1');

      // Act: Navigate to last option.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Last option is highlighted.
      verifyHighlight(options, 3);
      expect(comboBox.attributes('aria-activedescendant')).toBe('someCombobox_option_3');

      // Act: Try to navigate past last option.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Wraps around to first option.
      verifyHighlight(options, 0);
      expect(comboBox.attributes('aria-activedescendant')).toBe('someCombobox_option_0');
    });

    it('ArrowDown opens and highlights selected option', async () => {
      // Ensure ArrowUp opens combobox and highlights selected option.

      // Arrange&Act: Set up combobox.
      const comboBox = createComponent('c', 'someCombobox', createOptionsNoNull(), false, false, 'test.comboBox');

      // Act: Press ArrowDown on root combobox.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Options are now visible.
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');
      // Assert: Selected option is highlighted.
      const options = comboBox.findAll('.combobox-option');
      verifyHighlight(options, 2);
      expect(comboBox.attributes('aria-activedescendant')).toBe('someCombobox_option_2');
    });

    it('ArrowUp opens and navigates up no selection', async () => {
      // Ensure ArrowUp opens combobox and highlights last option, as nothing is selected.
      // Subsequent presses moves highlight up.

      // Arrange&Act: Set up combobox. Note we have null selected and NO null option.
      const comboBox = createComponent(null, 'someCombobox', createOptionsNoNull(), false, false, 'test.comboBox');

      // Act: Press ArrowUp on root combobox.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowUp' });
      await nextTick();

      // Assert: Options are visible.
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');
      // Assert: Last option is highlighted.
      const options = comboBox.findAll('.combobox-option');
      verifyHighlight(options, 3);
      expect(comboBox.attributes('aria-activedescendant')).toBe('someCombobox_option_3');

      // Act: Press ArrowUp to move up.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowUp' });
      await nextTick();

      // Assert: Third option is now highlighted.
      verifyHighlight(options, 2);
      expect(comboBox.attributes('aria-activedescendant')).toBe('someCombobox_option_2');

      // Act: Try to navigate to first option.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowUp' });
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowUp' });
      await nextTick();
      verifyHighlight(options, 0);
      expect(comboBox.attributes('aria-activedescendant')).toBe('someCombobox_option_0');

      // Act: Try to navigate past first option.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowUp' });
      await nextTick();

      // Assert: Wraps around to last option.
      verifyHighlight(options, 3);
      expect(comboBox.attributes('aria-activedescendant')).toBe('someCombobox_option_3');
    });

    it('ArrowUp opens and highlights selected option', async () => {
      // Ensure ArrowUp opens combobox and highlights selected option.

      // Arrange&Act: Set up combobox.
      const comboBox = createComponent('b', 'someCombobox', createOptionsNoNull(), false, false, 'test.comboBox');

      // Act: Press ArrowUp on root combobox.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowUp' });
      await nextTick();

      // Assert: Options are visible.
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');
      // Assert: Selected option is highlighted.
      const options = comboBox.findAll('.combobox-option');
      verifyHighlight(options, 1);
      expect(comboBox.attributes('aria-activedescendant')).toBe('someCombobox_option_1');
    });

    it('Enter selects highlighted option', async () => {
      // Ensure Enter key selects the highlighted option.

      // Arrange&Act: Set up combobox.
      const comboBox = createComponent(null, '', createOptions(), false, false, 'test.comboBox');

      // Act: Open with ArrowDown and navigate to 'b'.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Act: Press Enter to select highlighted option.
      await comboBox.find('.combobox').trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Model emitted correct value 'b'.
      expect(comboBox.emitted('update:modelValue')).toHaveLength(1);
      expect(comboBox.emitted('update:modelValue')?.[0]?.[0]).toBe('b');
      // Assert: Options are hidden.
      expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');
      // Assert: Main field shows selected option.
      expect(comboBox.find('.combobox-selected-text').text()).toBe('Option B');
    });

    it('Space opens and highlights current selection', async () => {
      // Ensure Space key opens combobox and highlights currently selected option.
      // When pressed again, Space selects the highlighted option.

      // Arrange&Act: Set up combobox with 'a' selected.
      const comboBox = createComponent('a', '', createOptions(), false, false, 'test.comboBox');

      // Act: Press Space to open.
      await comboBox.find('.combobox').trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: Options are visible.
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');
      // Assert: Option 'a' (index 1) is highlighted as it is the current selection.
      const options = comboBox.findAll('.combobox-option');
      expect(options[1]?.classes()).toContain('highlighted');

      // Act: Navigate down to 'b' via ArrowDown.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Option 'b' (index 2) is highlighted.
      expect(options[2]?.classes()).toContain('highlighted');

      // Act: Press Space to select highlighted option 'b'.
      await comboBox.find('.combobox').trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: Model emitted correct value 'b'.
      expect(comboBox.emitted('update:modelValue')).toHaveLength(1);
      expect(comboBox.emitted('update:modelValue')?.[0]?.[0]).toBe('b');
      // Assert: Options are hidden.
      expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');
      // Assert: Main field shows selected option.
      expect(comboBox.find('.combobox-selected-text').text()).toBe('Option B');
    });

    it('Escape closes dropdown', async () => {
      // Ensure Escape key closes combobox dropdown.

      // Arrange&Act: Open combobox.
      const comboBox = createComponent(null, '', createOptions(), false, false, 'test.comboBox');

      // Act: Open via click.
      await comboBox.find('.combobox-selected').trigger('click');
      await nextTick();

      // Assert: Options are visible.
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');

      // Act: Press Escape.
      await comboBox.find('.combobox').trigger('keydown', { key: 'Escape' });
      await nextTick();

      // Assert: Options are hidden.
      expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');
      // Assert: Aria-activedescendant is cleared.
      expect(comboBox.attributes('aria-activedescendant')).toBeUndefined();
    });

    it('disabled combobox ignores keyboard events', async () => {
      // Ensure keyboard events are ignored on disabled combobox.

      // Arrange&Act: Set up disabled combobox.
      const comboBox = createComponent(null, '', createOptions(), true, false, 'test.comboBox');

      // Act: Try to open with ArrowDown.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Options are still hidden.
      expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');

      // Act: Try to open with Space.
      await comboBox.find('.combobox').trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: Options are still hidden.
      expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');
    });

    it('opens when Tab navigates from <input> to combobox', async () => {
      // Verifies that pressing Tab to focus the combobox (e.g. after tabbing
      // through a form) opens the list. Uses an <input> as the previous field.

      // Arrange: Mount a wrapper with an <input> followed by a <ComboBox>.
      const wrapper = mount({
        template: `
          <div>
            <input id="prevField" type="text" />
            <ComboBox
              id="testCb"
              v-model="value"
              :options="options"
              langPrefix="test.comboBox"
            />
          </div>
        `,
        components: { ComboBox },
        setup() {
          const value = ref<string | number | null>(null);
          return { value, options: createOptions() };
        },
      }, {
        global: { plugins: [i18n] },
      });
      await nextTick();

      const comboBox = wrapper.findComponent(ComboBox);
      const input = wrapper.find('input');

      // Assert: Options are initially hidden.
      expect(comboBox.find('.combobox-options').attributes('style')).toContain('display: none');

      // Act: Focus the <input> (user tabs through the form).
      await input.trigger('focus');
      await nextTick();

      // Act: Simulate Tab press moving focus to the combobox root element.
      // (In jsdom, Tab keydown does not change focus, so we focus directly.)
      //await input.trigger('keydown', { key: 'Tab' }); // does not work, unfortunately
      await comboBox.find('.combobox').trigger('focus');
      await nextTick();

      // Assert: Options are now visible (focus from Tab opened the list).
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');
      // Assert: Aria-expanded reflects open state.
      expect(comboBox.attributes('aria-expanded')).toBe('true');
    });
  });
});
