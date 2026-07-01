import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import type { TableMetaResp } from '@/code/data/features/common/type.ts';

import TablePaginer from '@/components/common/table/TablePaginer.vue';

//

/** Convenience function to create component. */
function createComponent(currPage: number, meta: TableMetaResp, isDisabled?: boolean) {
  return mount(TablePaginer, {
      props: {
        currPage, tableId: '', meta, isDisabled
      }
    });
}

//

function createTableMetaLarge(page: number): TableMetaResp {
  return {
      pageCount: 3,
      entryCount: 25,

      pageSize: 10,
      page: page,
      sortBy: 'name',
      sortOrder: 'ASC',
    };
}

function createTableMetaMedium(page: number): TableMetaResp {
  return {
      pageCount: 2,
      entryCount: 8,

      pageSize: 5,
      page: page,
      sortBy: 'name',
      sortOrder: 'ASC',
    };
}

function createTableMetaSmall(): TableMetaResp {
  return {
      pageCount: 1,
      entryCount: 4,

      pageSize: 10,
      page: 1,
      sortBy: 'name',
      sortOrder: 'ASC',
    };
}

function createTableMetaZero(): TableMetaResp {
  return {
      pageCount: 0,
      entryCount: 0,

      pageSize: 10,
      page: 1,
      sortBy: 'name',
      sortOrder: 'ASC',
    };
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of TablePaginer component. */
describe('TablePaginer', () => {
  describe('has correct presentation', () => {
    it('only one page', async () => {
      // Check how it looks for provided table metadata. Currently on first page.

      // Arrange&Act: Create component.
      const tablePaginer = createComponent(0, createTableMetaSmall(), false);

      // Assert: State of buttons.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      expect(navButtons).toHaveLength(4);
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);

      const input = tablePaginer.find('input');
      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('1'); // we are on first page

      const pageNumber = tablePaginer.find('[data-testid="paginer__pageNumber"]');
      expect(pageNumber.text()).toBe('1'); // there is only one page in total
    });

    //

    it('two pages, first page', async () => {
      // Check how it looks for provided table metadata. Currently on first page.

      // Arrange&Act: Create component.
      const tablePaginer = createComponent(0, createTableMetaMedium(0), false);

      // Assert: State of buttons.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      expect(navButtons).toHaveLength(4);
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn']);

      const input = tablePaginer.find('input');
      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('1'); // we are on first page

      const pageNumber = tablePaginer.find('[data-testid="paginer__pageNumber"]');
      expect(pageNumber.text()).toBe('2'); // there are two pages in total
    });

    it('two pages, second page', async () => {
      // Check how it looks for provided table metadata. Currently on second page.

      // Arrange&Act: Create component.
      const tablePaginer = createComponent(1, createTableMetaMedium(1), false);

      // Assert: State of buttons.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      expect(navButtons).toHaveLength(4);
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);

      const input = tablePaginer.find('input');
      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('2'); // we are on second page

      const pageNumber = tablePaginer.find('[data-testid="paginer__pageNumber"]');
      expect(pageNumber.text()).toBe('2'); // there are two pages in total
    });

    //

    it('for first page', async () => {
      // Check how it looks for provided table metadata. Currently on first page.

      // Arrange&Act: Create component.
      const tablePaginer = createComponent(0, createTableMetaLarge(0), false);

      // Assert: State of buttons.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      expect(navButtons).toHaveLength(4);
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn']);

      const input = tablePaginer.find('input');
      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('1'); // we are on first page

      const pageNumber = tablePaginer.find('[data-testid="paginer__pageNumber"]');
      expect(pageNumber.text()).toBe('3'); // there are three pages in total
    });

    it('for middle page', async () => {
      // Check how it looks for provided table metadata. Currently on middle page.

      // Arrange&Act: Create component.
      const tablePaginer = createComponent(1, createTableMetaLarge(1), false);

      // Assert: State of buttons.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      expect(navButtons).toHaveLength(4);
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn']);

      const input = tablePaginer.find('input');
      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('2'); // we are on second page

      const pageNumber = tablePaginer.find('[data-testid="paginer__pageNumber"]');
      expect(pageNumber.text()).toBe('3'); // there are three pages in total
    });

    it('for last page', async () => {
      // Check how it looks for provided table metadata. Currently on last page.

      // Arrange&Act: Create component.
      const tablePaginer = createComponent(2, createTableMetaLarge(2), false);

      // Assert: State of buttons.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      expect(navButtons).toHaveLength(4);
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);

      const input = tablePaginer.find('input');
      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('3'); // we are on third page

      const pageNumber = tablePaginer.find('[data-testid="paginer__pageNumber"]');
      expect(pageNumber.text()).toBe('3'); // there are three pages in total
    });

    it('for no pages', async () => {
      // Check how it looks for provided table metadata.

      // Arrange&Act: Create component.
      const tablePaginer = createComponent(0, createTableMetaZero(), false);

      // Assert: State of buttons.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      expect(navButtons).toHaveLength(4);
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);

      const input = tablePaginer.find('input');
      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(true);
      expect(input.element.value).toBe('1');

      const pageNumber = tablePaginer.find('[data-testid="paginer__pageNumber"]');
      expect(pageNumber.text()).toBe('0'); // there are no pages in total
    });

    it('when disabled', async () => {
      // Check how it looks for provided table metadata. Currently on middle page. Component is disabled as a whole.

      // Arrange&Act: Create component.
      const tablePaginer = createComponent(1, createTableMetaLarge(1), true);

      // Assert: State of buttons.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      expect(navButtons).toHaveLength(4);
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);

      // Assert: State of page indicator.
      const input = tablePaginer.find('input');
      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(true);
      expect(input.element.value).toBe('2'); // we are on second page

      const pageNumber = tablePaginer.find('[data-testid="paginer__pageNumber"]');
      expect(pageNumber.text()).toBe('3'); // there are three pages in total

      // Act: Try to click on disabled buttons.
      await navButtons[0]?.trigger('click'); // go to first page
      await nextTick();
      await navButtons[1]?.trigger('click'); // go to next page
      await nextTick();
      await navButtons[2]?.trigger('click'); // go to previous page
      await nextTick();
      await navButtons[3]?.trigger('click'); // go to last page
      await nextTick();

      // Assert: model never emitted anything.
      expect(tablePaginer.emitted('update:currPage')).toBeUndefined();
    });
  });

  describe('press navigation button that', () => {
    it('goes to first page', async () => {
      // Check actions and their results.

      // Arrange: Create component. We are on last page.
      const tablePaginer = createComponent(2, createTableMetaLarge(2), false);

      // Act: Click on navigation button.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      await navButtons[0]?.trigger('click'); // go to first page
      await nextTick();

      // Assert: model emitted correct value.
      expect(tablePaginer.emitted('update:currPage')).toHaveLength(1);
      expect(tablePaginer.emitted('update:currPage')?.[0]?.[0]).toBe(0);

      // Assert: State of buttons.
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn']);

      // Assert: State of page indicator.
      const input = tablePaginer.find('input');
      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('1'); // we are on first page now
    });

    it('goes to previous page', async () => {
      // Check actions and their results.

      // Arrange: Create component. We are on last page.
      const tablePaginer = createComponent(2, createTableMetaLarge(2), false);

      // Act: Click on navigation button.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      await navButtons[1]?.trigger('click'); // go to previous page
      await nextTick();

      // Assert: model emitted correct value.
      expect(tablePaginer.emitted('update:currPage')).toHaveLength(1);
      expect(tablePaginer.emitted('update:currPage')?.[0]?.[0]).toBe(1);

      // Assert: State of buttons.
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn']);

      // Assert: State of page indicator.
      const input = tablePaginer.find('input');
      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('2'); // we are on second page now
    });

    it('goes to next page', async () => {
      // Check actions and their results.

      // Arrange: Create component. We are on first page.
      const tablePaginer = createComponent(0, createTableMetaLarge(0), false);

      // Act: Click on navigation button.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      await navButtons[2]?.trigger('click'); // go to next page
      await nextTick();

      // Assert: model emitted correct value.
      expect(tablePaginer.emitted('update:currPage')).toHaveLength(1);
      expect(tablePaginer.emitted('update:currPage')?.[0]?.[0]).toBe(1);

      // Assert: State of buttons.
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn']);

      // Assert: State of page indicator.
      const input = tablePaginer.find('input');
      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('2'); // we are on second page now
    });

    it('goes to last page', async () => {
      // Check actions and their results.

      // Arrange: Create component. We are on first page.
      const tablePaginer = createComponent(0, createTableMetaLarge(0), false);

      // Act: Click on navigation button.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      await navButtons[3]?.trigger('click'); // go to last page
      await nextTick();

      // Assert: model emitted correct value.
      expect(tablePaginer.emitted('update:currPage')).toHaveLength(1);
      expect(tablePaginer.emitted('update:currPage')?.[0]?.[0]).toBe(2);

      // Assert: State of buttons.
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);

      // Assert: State of page indicator.
      const input = tablePaginer.find('input');
      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('3'); // we are on third page now
    });
  });

  describe('edit input with current page number', () => {
    it('from middle to last page', async () => {
      // Try to change page to third page via input. Currently on middle page.

      // Arrange: Create component.
      const tablePaginer = createComponent(1, createTableMetaLarge(1), false);

      // Act: Fill input and confirm.
      const input = tablePaginer.find('input');
      await input.setValue('3');
      await input.trigger('keyup', {key: 'Enter'});
      await nextTick();

      // Assert: model emitted correct value.
      expect(tablePaginer.emitted('update:currPage')).toHaveLength(1);
      expect(tablePaginer.emitted('update:currPage')?.[0]?.[0]).toBe(2);

      // Assert: State of buttons.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);

      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('3'); // we are on third page
    });

    it('too small', async () => {
      // Try changing page to too small value (outside range) via input. Currently on middle page.

      // Arrange: Create component.
      const tablePaginer = createComponent(1, createTableMetaLarge(1), false);

      // Act: Fill input and confirm.
      const input = tablePaginer.find('input');
      await input.setValue('-1'); // outside range: too small
      await input.trigger('keyup', {key: 'Enter'});
      await nextTick();

      // Assert: model emitted correct value.
      expect(tablePaginer.emitted('update:currPage')).toHaveLength(1);
      expect(tablePaginer.emitted('update:currPage')?.[0]?.[0]).toBe(0);

      // Assert: State of buttons.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn']);

      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('1'); // we are on first page
    });

    it('too large', async () => {
      // Try changing page to too large value (outside range) via input. Currently on middle page.

      // Arrange: Create component.
      const tablePaginer = createComponent(1, createTableMetaLarge(1), false);

      // Act: Fill input and confirm.
      const input = tablePaginer.find('input');
      await input.setValue('666'); // outside range: too large
      await input.trigger('keyup', {key: 'Enter'});
      await nextTick();

      // Assert: model emitted correct value.
      expect(tablePaginer.emitted('update:currPage')).toHaveLength(1);
      expect(tablePaginer.emitted('update:currPage')?.[0]?.[0]).toBe(2);

      // Assert: State of buttons.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn', 'disabled']);

      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('3'); // we are on last page
    });

    it('to invalid value', async () => {
      // Try to enter invalid data (not a number) in input. Currently on middle page.

      // Arrange: Create component.
      const tablePaginer = createComponent(1, createTableMetaLarge(1), false);

      // Act: Fill input and confirm.
      const input = tablePaginer.find('input');
      await input.setValue('aaa'); // invalid input: not a number!
      await input.trigger('keyup', {key: 'Enter'});
      await nextTick();

      // Assert: model never emitted anything.
      expect(tablePaginer.emitted('update:currPage')).toBeUndefined();

      // Assert: State of buttons.
      const navButtons = tablePaginer.findAll('.table-paginer-navbtn');
      expect(navButtons[0]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[1]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[2]?.classes()).toEqual(['table-paginer-navbtn']);
      expect(navButtons[3]?.classes()).toEqual(['table-paginer-navbtn']);

      expect(input.exists()).toBe(true);
      expect(input.element.disabled).toBe(false);
      expect(input.element.value).toBe('2'); // we are still on second page
    });
  });
});
