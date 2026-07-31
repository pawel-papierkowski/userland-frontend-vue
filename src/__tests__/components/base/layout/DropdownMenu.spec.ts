import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, h } from 'vue';

import DropdownMenu from '@/components/base/layout/DropdownMenu.vue';

//

/** Convenience function to create component. */
function createComponent(slots: Record<string, string>, id: string) {
  return mount(DropdownMenu, {
    props: {
      id,
    },
    slots,
  });
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of DropdownMenu component. */
describe('DropdownMenu', () => {
  describe('general', () => {
    it('presents itself correctly', async () => {
      // By default, only trigger area is visible.

      // Arrange&Act: Create component.
      const dropdownMenu = createComponent({ trigger: 'OPTION', content: 'MENU' }, 'myDropDown');

      // Assert: Only trigger area is visible.
      expect(dropdownMenu.find('.dropdown').exists()).toBe(true);
      expect(dropdownMenu.find('.dropdown').text()).toBe('OPTION');
      expect(dropdownMenu.find('.dropdown-slot').exists()).toBe(false);
    });

    it('clicking on trigger area shows content area', async () => {
      // We click twice and ensure state of component is correct.

      // Arrange: Create component.
      const dropdownMenu = createComponent({ trigger: 'OPTION', content: 'MENU' }, 'myDropDown');

      // Act: Click for first time.
      dropdownMenu.find('.dropdown').trigger('click');
      await nextTick();

      // Assert: Both trigger and content areas are visible.
      expect(dropdownMenu.find('.dropdown').exists()).toBe(true);
      expect(dropdownMenu.find('.dropdown').text()).toBe('OPTION');
      expect(dropdownMenu.find('.dropdown-slot').exists()).toBe(true);
      expect(dropdownMenu.find('.dropdown-slot').text()).toBe('MENU');

      // Act: Click again.
      dropdownMenu.find('.dropdown-slot').trigger('click');
      await nextTick();

      // Assert: Content area is again hidden.
      expect(dropdownMenu.find('.dropdown').exists()).toBe(true);
      expect(dropdownMenu.find('.dropdown').text()).toBe('OPTION');
      expect(dropdownMenu.find('.dropdown-slot').exists()).toBe(false);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Accessibility tests

  describe('accessibility', () => {
    it('trigger has button role and tabindex', () => {
      // Verify the trigger element exposes role="button" and is keyboard-focusable.

      // Arrange&Act: Create component.
      const dropdownMenu = createComponent({ trigger: 'OPTION', content: 'MENU' }, 'myDropDown');
      const trigger = dropdownMenu.find('[role="button"]');

      // Assert: Trigger has correct ARIA attributes.
      expect(trigger.exists()).toBe(true);
      expect(trigger.attributes('role')).toBe('button');
      expect(trigger.attributes('tabindex')).toBe('0');
    });

    it('trigger has aria-haspopup and dynamic aria-expanded', async () => {
      // Ensure the trigger communicates the dropdown nature and its current state.

      // Arrange: Create component.
      const dropdownMenu = createComponent({ trigger: 'OPTION', content: 'MENU' }, 'myDropDown');
      const trigger = dropdownMenu.find('[role="button"]');

      // Assert: Closed state by default.
      expect(trigger.attributes('aria-haspopup')).toBe('true');
      expect(trigger.attributes('aria-expanded')).toBe('false');

      // Act: Open the dropdown via click.
      await trigger.trigger('click');
      await nextTick();

      // Assert: Open state.
      expect(trigger.attributes('aria-expanded')).toBe('true');
    });

    it('trigger has aria-controls referencing content id', async () => {
      // The aria-controls attribute should match the id of the content element.

      // Arrange: Create component with an id for ARIA bindings.
      const dropdownMenu = createComponent({ trigger: 'OPTION', content: 'MENU' }, 'myDropDown');
      const trigger = dropdownMenu.find('[role="button"]');
      const controlsId = trigger.attributes('aria-controls');

      // Assert: Aria-controls is set.
      expect(controlsId).toBe('dropdownmenu-content-myDropDown');

      // Act: Open to verify the content element carries the matching id.
      await trigger.trigger('click');
      await nextTick();

      // Assert: Content id matches.
      expect(dropdownMenu.find('.dropdown-slot').attributes('id')).toBe(controlsId);
    });

    it('content has tabindex -1 when open', async () => {
      // The content wrapper must be programmatically focusable (not tab-focusable).

      // Arrange&Act: Open the dropdown.
      const dropdownMenu = createComponent({ trigger: 'OPTION', content: 'MENU' }, 'myDropDown');
      await dropdownMenu.find('[role="button"]').trigger('click');
      await nextTick();

      // Assert: Tabindex is -1.
      expect(dropdownMenu.find('.dropdown-slot').attributes('tabindex')).toBe('-1');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Keyboard navigation tests

  describe('keyboard', () => {
    it('Enter opens the dropdown', async () => {
      // Pressing Enter on the trigger should open the content area.

      // Arrange: Create component.
      const dropdownMenu = createComponent({ trigger: 'OPTION', content: 'MENU' }, 'myDropDown');

      // Act: Press Enter on trigger.
      await dropdownMenu.find('[role="button"]').trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Content is visible.
      expect(dropdownMenu.find('.dropdown-slot').exists()).toBe(true);
      expect(dropdownMenu.find('.dropdown-slot').text()).toBe('MENU');
    });

    it('Space opens the dropdown', async () => {
      // Pressing Space on the trigger should open the content area.

      // Arrange: Create component.
      const dropdownMenu = createComponent({ trigger: 'OPTION', content: 'MENU' }, 'myDropDown');

      // Act: Press Space on trigger.
      await dropdownMenu.find('[role="button"]').trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: Content is visible.
      expect(dropdownMenu.find('.dropdown-slot').exists()).toBe(true);
      expect(dropdownMenu.find('.dropdown-slot').text()).toBe('MENU');
    });

    it('Enter toggles the dropdown closed', async () => {
      // Pressing Enter on the trigger when open should close the content area.

      // Arrange: Open the dropdown first.
      const dropdownMenu = createComponent({ trigger: 'OPTION', content: 'MENU' }, 'myDropDown');
      await dropdownMenu.find('[role="button"]').trigger('keydown', { key: 'Enter' });
      await nextTick();
      expect(dropdownMenu.find('.dropdown-slot').exists()).toBe(true);

      // Act: Press Enter again.
      await dropdownMenu.find('[role="button"]').trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Content is hidden.
      expect(dropdownMenu.find('.dropdown-slot').exists()).toBe(false);
    });

    it('Escape closes the dropdown', async () => {
      // Pressing Escape on the content area should close the dropdown.

      // Arrange: Open the dropdown via click.
      const dropdownMenu = createComponent({ trigger: 'OPTION', content: 'MENU' }, 'myDropDown');
      await dropdownMenu.find('[role="button"]').trigger('click');
      await nextTick();
      expect(dropdownMenu.find('.dropdown-slot').exists()).toBe(true);

      // Act: Press Escape on content.
      await dropdownMenu.find('.dropdown-slot').trigger('keydown', { key: 'Escape' });
      await nextTick();

      // Assert: Content is hidden.
      expect(dropdownMenu.find('.dropdown-slot').exists()).toBe(false);
    });

    it('focus moves to first focusable element inside content on open', async () => {
      // When opened via keyboard, focus should land on the first focusable
      // element inside the content slot, not on the content wrapper.

      // Arrange: Create component with a button in content slot, attached to
      // the document so document.activeElement tracking works in jsdom.
      const dropdownMenu = mount(DropdownMenu, {
        attachTo: document.body,
        props: { id: 'myDropDown' },
        slots: {
          trigger: 'OPTION',
          content: h('button', 'CLICK ME'),
        },
      });

      // Act: Open via keyboard.
      await dropdownMenu.find('[role="button"]').trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: The button inside content received focus (not the wrapper).
      const buttonEl = dropdownMenu.find('button').element;
      expect(document.activeElement).toBe(buttonEl);
    });
  });
});
