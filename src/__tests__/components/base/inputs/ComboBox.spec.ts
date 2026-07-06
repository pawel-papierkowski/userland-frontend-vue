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
  describe('general tests', () => {
    it('has correct presentation', async () => {
      // Check if combobox is constructed correctly.

      // Arrange&Act: Set up combobox.
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
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');

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

      // Arrange&Act: Set up combobox.
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
      const comboBox = createComponent(null, '', createOptions(), false, true, 'test.comboBox', 'test.comboBox.null');

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
      await comboBox.find('[data-testid="combobox__3"]').trigger('click');
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
      // Assert: aria-expanded starts as false.
      expect(comboBox.attributes('aria-expanded')).toBe('false');
      // Assert: aria-haspopup is listbox.
      expect(comboBox.attributes('aria-haspopup')).toBe('listbox');
      // Assert: aria-controls is set.
      expect(comboBox.attributes('aria-controls')).toBe('combobox-listbox_someCombobox');
      // Assert: aria-activedescendant is not set when no option is highlighted.
      expect(comboBox.attributes('aria-activedescendant')).toBeUndefined();
      // Assert: aria-disabled is not present when enabled.
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
      expect(options[2]?.attributes('aria-selected')).toBe('true');
      expect(options[0]?.attributes('aria-selected')).toBe('false');
      expect(options[1]?.attributes('aria-selected')).toBe('false');
      expect(options[3]?.attributes('aria-selected')).toBe('false');

      // Act: Open options to verify aria-expanded changes.
      await comboBox.find('.combobox-selected').trigger('click');
      await nextTick();

      // Assert: aria-expanded reflects open state.
      expect(comboBox.attributes('aria-expanded')).toBe('true');
    });

    it('disabled combobox has aria-disabled', async () => {
      // Ensure disabled combobox sets aria-disabled.

      // Arrange&Act: Set up disabled combobox.
      const comboBox = createComponent(null, '', createOptions(), true, false, 'test.comboBox');

      // Assert: aria-disabled is present and true.
      expect(comboBox.attributes('aria-disabled')).toBe('true');
    });

    it('keyboard: ArrowDown opens and navigates down', async () => {
      // Ensure ArrowDown opens combobox and moves highlight down.

      // Arrange&Act: Set up combobox.
      const comboBox = createComponent(null, '', createOptions(), false, false, 'test.comboBox');

      // Act: Press ArrowDown on root combobox.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Options are now visible.
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');
      // Assert: First option is highlighted.
      expect(comboBox.find('.combobox-option').classes()).toContain('highlighted');
      // Assert: aria-activedescendant points to first option.
      expect(comboBox.attributes('aria-activedescendant')).toBe('combobox__option_0');

      // Act: Press ArrowDown again to move to next option.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Second option is now highlighted.
      const options = comboBox.findAll('.combobox-option');
      expect(options[0]?.classes()).not.toContain('highlighted');
      expect(options[1]?.classes()).toContain('highlighted');
      expect(comboBox.attributes('aria-activedescendant')).toBe('combobox__option_1');

      // Act: Navigate to last option.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Last option is highlighted.
      expect(options[3]?.classes()).toContain('highlighted');

      // Act: Try to navigate past last option.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowDown' });
      await nextTick();

      // Assert: Stayed on last option (not wrapping around).
      expect(options[3]?.classes()).toContain('highlighted');
    });

    it('keyboard: ArrowUp opens and navigates up', async () => {
      // Ensure ArrowUp opens combobox and moves highlight up.

      // Arrange&Act: Set up combobox.
      const comboBox = createComponent(null, '', createOptions(), false, false, 'test.comboBox');

      // Act: Press ArrowUp on root combobox.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowUp' });
      await nextTick();

      // Assert: Options are visible and last option is highlighted.
      expect(comboBox.find('.combobox-options').attributes('style')).not.toContain('display: none');
      const options = comboBox.findAll('.combobox-option');
      expect(options[3]?.classes()).toContain('highlighted');

      // Act: Press ArrowUp to move up.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowUp' });
      await nextTick();

      // Assert: Third option is now highlighted.
      expect(options[2]?.classes()).toContain('highlighted');

      // Act: Try to navigate past first option.
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowUp' });
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowUp' });
      await comboBox.find('.combobox').trigger('keydown', { key: 'ArrowUp' });
      await nextTick();

      // Assert: Stayed on first option.
      expect(options[0]?.classes()).toContain('highlighted');
    });

    it('keyboard: Enter selects highlighted option', async () => {
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

    it('keyboard: Space opens and highlights current selection', async () => {
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

    it('keyboard: Escape closes dropdown', async () => {
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
      // Assert: aria-activedescendant is cleared.
      expect(comboBox.attributes('aria-activedescendant')).toBeUndefined();
    });

    it('keyboard: disabled combobox ignores keyboard events', async () => {
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

    it('mouseenter highlights option', async () => {
      // Ensure hovering over an option updates the highlighted index.

      // Arrange: Create combobox.
      const comboBox = createComponent(null, '', createOptions(), false, false, 'test.comboBox');

      // Act: Open combobox.
      await comboBox.find('.combobox-selected').trigger('click');
      await nextTick();

      // Act: Hover over third option.
      await comboBox.findAll('.combobox-option')[2]?.trigger('mouseenter');
      await nextTick();

      // Assert: Third option is highlighted.
      const options = comboBox.findAll('.combobox-option');
      expect(options[0]?.classes()).not.toContain('highlighted');
      expect(options[1]?.classes()).not.toContain('highlighted');
      expect(options[2]?.classes()).toContain('highlighted');
      expect(options[3]?.classes()).not.toContain('highlighted');
      // Assert: aria-activedescendant updated.
      expect(comboBox.attributes('aria-activedescendant')).toBe('combobox__option_2');
    });
  });
});
