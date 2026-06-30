import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import DropdownMenu from '@/components/base/layout/DropdownMenu.vue';

//

/** Convenience function to create component. */
function createComponent(slots: Record<string, string>) {
  return mount(DropdownMenu, {
    slots,
  });
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of DropdownMenu component. */
describe('DropdownMenu', () => {
  it('presents itself correctly', async () => {
    // By default, only trigger area is visible.

    // Arrange&Act: Create component.
    const dropdownMenu = createComponent({ trigger: 'OPTION', content: 'MENU' });

    // Assert: Only trigger area is visible.
    expect(dropdownMenu.find('.dropdown').exists()).toBe(true);
    expect(dropdownMenu.find('.dropdown').text()).toBe('OPTION');
    expect(dropdownMenu.find('.dropdown-slot').exists()).toBe(false);
  });

  it('clicking on trigger area shows content area', async () => {
    // We click twice and ensure state of component is correct.

    // Arrange: Create component.
    const dropdownMenu = createComponent({ trigger: 'OPTION', content: 'MENU' });

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
