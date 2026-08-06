import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import type { TableMetaResp } from '@/code/data/features/common/type.ts';

import TablePaginer from '@/components/common/table/TablePaginer.vue';

//

const tableId = 'T';

/** Convenience function to create component. */
function createComponent(currPage: number, meta: TableMetaResp, isDisabled?: boolean) {
  return mount(TablePaginer, {
    props: {
      currPage,
      tableId,
      meta,
      isDisabled,
    },
  });
}

//

function createTableMetaLarge(page: number): TableMetaResp {
  return {
    pageCount: 3,
    entryCount: 25,
    pageSize: 10,
    page,
    sortBy: 'name',
    sortOrder: 'ASC',
  };
}

function createTableMetaMedium(page: number): TableMetaResp {
  return {
    pageCount: 2,
    entryCount: 8,
    pageSize: 5,
    page,
    sortBy: 'name',
    sortOrder: 'ASC',
  };
}

function createTableMetaSmall(): TableMetaResp {
  return {
    pageCount: 1,
    entryCount: 4,
    pageSize: 10,
    page: 0,
    sortBy: 'name',
    sortOrder: 'ASC',
  };
}

function createTableMetaZero(): TableMetaResp {
  return {
    pageCount: 0,
    entryCount: 0,
    pageSize: 10,
    page: 0,
    sortBy: 'name',
    sortOrder: 'ASC',
  };
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of TablePaginer component. */
describe('TablePaginer', () => {
  // //////////////////////////////////////////////////////////////////////////
  // Presentation

  describe('presentation', () => {
    it('renders root with data-testid', () => {
      // Arrange&Act: Create component.
      const wrapper = createComponent(0, createTableMetaLarge(0), false);

      // Assert: Root has correct data-testid.
      const root = wrapper.find('[data-testid="T_paginer"]');
      expect(root.exists()).toBe(true);
    });

    it('shows all buttons and input disabled for single page', () => {
      // Arrange&Act: Create component on single-page meta.
      const wrapper = createComponent(0, createTableMetaSmall(), false);

      // Assert: All nav buttons are disabled.
      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      expect(navButtons).toHaveLength(4);
      navButtons.forEach((btn) => {
        expect(btn.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      });

      // Assert: Input shows page 1, not disabled (user can type same page).
      const input = wrapper.find('input');
      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('1');

      // Assert: Page count shows 1.
      const pageNumber = wrapper.find('[data-testid="T_paginer_pageNumber"]');
      expect(pageNumber.text()).toBe('1');
    });

    it('shows prev buttons disabled on first page (2 pages)', () => {
      // Arrange&Act: On first page of two total.
      const wrapper = createComponent(0, createTableMetaMedium(0), false);

      // Assert: Prev buttons disabled, next buttons enabled.
      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn']);

      const input = wrapper.find('input');
      expect(input.element.value).toBe('1');

      const pageNumber = wrapper.find('[data-testid="T_paginer_pageNumber"]');
      expect(pageNumber.text()).toBe('2');
    });

    it('shows next buttons disabled on last page (2 pages)', () => {
      // Arrange&Act: On last page of two total.
      const wrapper = createComponent(1, createTableMetaMedium(1), false);

      // Assert: Prev buttons enabled, next buttons disabled.
      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);

      const input = wrapper.find('input');
      expect(input.element.value).toBe('2');

      const pageNumber = wrapper.find('[data-testid="T_paginer_pageNumber"]');
      expect(pageNumber.text()).toBe('2');
    });

    it('shows correct state for first of three pages', () => {
      // Arrange&Act: On first of three pages.
      const wrapper = createComponent(0, createTableMetaLarge(0), false);

      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn']);

      const input = wrapper.find('input');
      expect(input.element.value).toBe('1');

      const pageNumber = wrapper.find('[data-testid="T_paginer_pageNumber"]');
      expect(pageNumber.text()).toBe('3');
    });

    it('shows all buttons enabled for middle of three pages', () => {
      // Arrange&Act: On middle of three pages.
      const wrapper = createComponent(1, createTableMetaLarge(1), false);

      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      navButtons.forEach((btn) => {
        expect(btn.classes()).toEqual(['table-paginer-navbtn']);
      });

      const input = wrapper.find('input');
      expect(input.element.value).toBe('2');

      const pageNumber = wrapper.find('[data-testid="T_paginer_pageNumber"]');
      expect(pageNumber.text()).toBe('3');
    });

    it('shows next buttons disabled on last of three pages', () => {
      // Arrange&Act: On last of three pages.
      const wrapper = createComponent(2, createTableMetaLarge(2), false);

      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);

      const input = wrapper.find('input');
      expect(input.element.value).toBe('3');

      const pageNumber = wrapper.find('[data-testid="T_paginer_pageNumber"]');
      expect(pageNumber.text()).toBe('3');
    });

    it('shows everything disabled for zero pages', () => {
      // Arrange&Act: Meta with no pages.
      const wrapper = createComponent(0, createTableMetaZero(), false);

      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      navButtons.forEach((btn) => {
        expect(btn.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      });

      const input = wrapper.find('input');
      expect(input.element.disabled).toBe(true);
      expect(input.element.value).toBe('1');

      const pageNumber = wrapper.find('[data-testid="T_paginer_pageNumber"]');
      expect(pageNumber.text()).toBe('0');
    });

    it('shows everything disabled when isDisabled is true', () => {
      // Arrange&Act: Component disabled, on middle of three pages.
      const wrapper = createComponent(1, createTableMetaLarge(1), true);

      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      navButtons.forEach((btn) => {
        expect(btn.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      });

      const input = wrapper.find('input');
      expect(input.element.disabled).toBe(true);
      expect(input.element.value).toBe('2');

      const pageNumber = wrapper.find('[data-testid="T_paginer_pageNumber"]');
      expect(pageNumber.text()).toBe('3');
    });

    it('does not emit on button clicks when disabled', async () => {
      // Arrange: Component disabled.
      const wrapper = createComponent(1, createTableMetaLarge(1), true);

      // Act: Click all nav buttons.
      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      for (const btn of navButtons) {
        await btn.trigger('click');
        await nextTick();
      }

      // Assert: No emits.
      expect(wrapper.emitted('update:currPage')).toBeUndefined();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Navigation buttons

  describe('navigation buttons', () => {
    it('goes to first page', async () => {
      // Arrange: On last page.
      const wrapper = createComponent(2, createTableMetaLarge(2), false);

      // Act: Click first-page button.
      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      await navButtons[0]?.trigger('click');
      await nextTick();

      // Assert: Emitted page 0.
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(0);

      // Assert: Prev buttons now disabled.
      expect(navButtons[0]?.classes()).toContain('disabled');
      expect(navButtons[1]?.classes()).toContain('disabled');

      // Assert: Input shows page 1.
      expect(wrapper.find('input').element.value).toBe('1');
    });

    it('goes to previous page', async () => {
      // Arrange: On last page.
      const wrapper = createComponent(2, createTableMetaLarge(2), false);

      // Act: Click prev-page button.
      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      await navButtons[1]?.trigger('click');
      await nextTick();

      // Assert: Emitted page 1.
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(1);

      // Assert: All buttons now enabled (middle page).
      expect(navButtons[0]?.classes()).not.toContain('disabled');
      expect(navButtons[1]?.classes()).not.toContain('disabled');
      expect(navButtons[2]?.classes()).not.toContain('disabled');
      expect(navButtons[3]?.classes()).not.toContain('disabled');

      expect(wrapper.find('input').element.value).toBe('2');
    });

    it('goes to next page', async () => {
      // Arrange: On first page.
      const wrapper = createComponent(0, createTableMetaLarge(0), false);

      // Act: Click next-page button.
      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      await navButtons[2]?.trigger('click');
      await nextTick();

      // Assert: Emitted page 1.
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(1);

      expect(navButtons[0]?.classes()).not.toContain('disabled');
      expect(navButtons[1]?.classes()).not.toContain('disabled');

      expect(wrapper.find('input').element.value).toBe('2');
    });

    it('goes to last page', async () => {
      // Arrange: On first page.
      const wrapper = createComponent(0, createTableMetaLarge(0), false);

      // Act: Click last-page button.
      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      await navButtons[3]?.trigger('click');
      await nextTick();

      // Assert: Emitted page 2.
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(2);

      // Assert: Next buttons now disabled.
      expect(navButtons[2]?.classes()).toContain('disabled');
      expect(navButtons[3]?.classes()).toContain('disabled');

      expect(wrapper.find('input').element.value).toBe('3');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Keyboard navigation

  describe('keyboard navigation', () => {
    it('Enter on first-page button goes to first page', async () => {
      // Arrange: On last page so prev buttons are enabled.
      const wrapper = createComponent(2, createTableMetaLarge(2), false);
      const navButtons = wrapper.findAll('.table-paginer-navbtn');

      // Assert: First-page button has tabindex 0 (focusable).
      expect(navButtons[0]?.attributes('tabindex')).toBe('0');

      // Act: Press Enter.
      await navButtons[0]?.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Emitted page 0.
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(0);
    });

    it('Enter on prev-page button goes to previous page', async () => {
      // Arrange: On last page so prev buttons are enabled.
      const wrapper = createComponent(2, createTableMetaLarge(2), false);
      const navButtons = wrapper.findAll('.table-paginer-navbtn');

      // Assert: Prev-page button has tabindex 0.
      expect(navButtons[1]?.attributes('tabindex')).toBe('0');

      // Act: Press Enter.
      await navButtons[1]?.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Emitted page 1.
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(1);
    });

    it('Enter on next-page button goes to next page', async () => {
      // Arrange: On first page so next buttons are enabled.
      const wrapper = createComponent(0, createTableMetaLarge(0), false);
      const navButtons = wrapper.findAll('.table-paginer-navbtn');

      // Assert: Next-page button has tabindex 0.
      expect(navButtons[2]?.attributes('tabindex')).toBe('0');

      // Act: Press Enter.
      await navButtons[2]?.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Emitted page 1.
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(1);
    });

    it('Enter on last-page button goes to last page', async () => {
      // Arrange: On first page so next buttons are enabled.
      const wrapper = createComponent(0, createTableMetaLarge(0), false);
      const navButtons = wrapper.findAll('.table-paginer-navbtn');

      // Assert: Last-page button has tabindex 0.
      expect(navButtons[3]?.attributes('tabindex')).toBe('0');

      // Act: Press Enter.
      await navButtons[3]?.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: Emitted page 2.
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(2);
    });

    it('Space on next-page button also navigates forward', async () => {
      // Arrange: On first page so next buttons are enabled.
      const wrapper = createComponent(0, createTableMetaLarge(0), false);
      const navButtons = wrapper.findAll('.table-paginer-navbtn');

      // Act: Press Space instead of Enter.
      await navButtons[2]?.trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: Emitted page 1 (same as Enter).
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(1);
    });

    it('disabled buttons have tabindex -1 and ignore keyboard', async () => {
      // Arrange: On first page so prev buttons are disabled.
      const wrapper = createComponent(0, createTableMetaLarge(0), false);
      const navButtons = wrapper.findAll('.table-paginer-navbtn');

      // Assert: Prev buttons have tabindex -1 (not focusable).
      expect(navButtons[0]?.attributes('tabindex')).toBe('-1');
      expect(navButtons[1]?.attributes('tabindex')).toBe('-1');

      // Act: Try to use keyboard on disabled prev buttons.
      await navButtons[0]?.trigger('keydown', { key: 'Enter' });
      await navButtons[0]?.trigger('keydown', { key: ' ' });
      await navButtons[1]?.trigger('keydown', { key: 'Enter' });
      await navButtons[1]?.trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: No page change emitted.
      expect(wrapper.emitted('update:currPage')).toBeUndefined();
    });

    it('irrelevant keys do nothing', async () => {
      // Arrange: On middle page, all buttons enabled.
      const wrapper = createComponent(1, createTableMetaLarge(1), false);
      const navButtons = wrapper.findAll('.table-paginer-navbtn');

      // Act: Press irrelevant keys on all buttons.
      for (const btn of navButtons) {
        await btn.trigger('keydown', { key: 'a' });
        await btn.trigger('keydown', { key: 'ArrowDown' });
        await btn.trigger('keydown', { key: 'Escape' });
        await btn.trigger('keydown', { key: 'Tab' });
      }
      await nextTick();

      // Assert: No page change emitted.
      expect(wrapper.emitted('update:currPage')).toBeUndefined();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Input field

  describe('input field', () => {
    it('jumps to valid page on Enter', async () => {
      // Arrange: On middle page.
      const wrapper = createComponent(1, createTableMetaLarge(1), false);
      const input = wrapper.find('input');

      // Act: Type a valid page number and press Enter.
      await input.setValue('3');
      await input.trigger('keyup', { key: 'Enter' });
      await nextTick();

      // Assert: Emitted correct zero-indexed page.
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(2);

      // Assert: Next buttons disabled (we're on last page).
      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      expect(navButtons[2]?.classes()).toContain('disabled');
      expect(navButtons[3]?.classes()).toContain('disabled');

      expect(input.element.value).toBe('3');
    });

    it('jumps to valid page on blur', async () => {
      // Arrange: On middle page.
      const wrapper = createComponent(1, createTableMetaLarge(1), false);
      const input = wrapper.find('input');

      // Act: Type a valid page number and blur.
      await input.setValue('3');
      await input.trigger('blur');
      await nextTick();

      // Assert: Emitted correct zero-indexed page.
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(2);

      expect(input.element.value).toBe('3');
    });

    it('clamps too-small value to first page', async () => {
      // Arrange: On middle page.
      const wrapper = createComponent(1, createTableMetaLarge(1), false);
      const input = wrapper.find('input');

      // Act: Type negative value.
      await input.setValue('-1');
      await input.trigger('keyup', { key: 'Enter' });
      await nextTick();

      // Assert: Clamped to page 0.
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(0);

      expect(input.element.value).toBe('1');

      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      expect(navButtons[0]?.classes()).toContain('disabled');
      expect(navButtons[1]?.classes()).toContain('disabled');
    });

    it('clamps too-large value to last page', async () => {
      // Arrange: On middle page.
      const wrapper = createComponent(1, createTableMetaLarge(1), false);
      const input = wrapper.find('input');

      // Act: Type oversized value.
      await input.setValue('666');
      await input.trigger('keyup', { key: 'Enter' });
      await nextTick();

      // Assert: Clamped to last page.
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(2);

      expect(input.element.value).toBe('3');

      const navButtons = wrapper.findAll('.table-paginer-navbtn');
      expect(navButtons[2]?.classes()).toContain('disabled');
      expect(navButtons[3]?.classes()).toContain('disabled');
    });

    it('reverts to current page on invalid input', async () => {
      // Arrange: On middle page.
      const wrapper = createComponent(1, createTableMetaLarge(1), false);
      const input = wrapper.find('input');

      // Act: Type non-numeric value.
      await input.setValue('aaa');
      await input.trigger('keyup', { key: 'Enter' });
      await nextTick();

      // Assert: No emit, value reverted.
      expect(wrapper.emitted('update:currPage')).toBeUndefined();
      expect(input.element.value).toBe('2');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Slots

  describe('slots', () => {
    it('renders paginer_options slot content', () => {
      // The paginer provides a slot for additional option controls.

      // Arrange&Act: Create component with slot content.
      const wrapper = mount(TablePaginer, {
        props: {
          currPage: 0,
          tableId,
          meta: createTableMetaLarge(0),
          isDisabled: false,
        },
        slots: {
          paginer_options: '<div class="test-option">OPTION</div>',
        },
      });

      // Assert: Slot content is rendered inside the options container.
      const optionsContainer = wrapper.find('.table-paginer-options');
      expect(optionsContainer.exists()).toBe(true);
      expect(optionsContainer.find('.test-option').exists()).toBe(true);
      expect(optionsContainer.find('.test-option').text()).toBe('OPTION');
    });
  });
});
