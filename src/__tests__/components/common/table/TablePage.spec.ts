/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import type { ColumnData, RowMeta, TableMetaResp } from '@/code/data/features/common/type.ts';
import { EnColumnKind } from '@/code/data/features/common/const.ts';

import TablePage from '@/components/common/table/TablePage.vue';
import TablePaginer from '@/components/common/table/TablePaginer.vue';
import TableRow from '@/components/common/table/TableRow.vue';

//

interface TestEntry {
  id: number;
  name: string;
  [key: string]: any;
}

interface TestForm {
  name: string;
  [key: string]: any;
}

/** Convenience function to create component. */
function createComponent(modelValue: TestEntry|null, formEntry: TestForm|null, currPage: number, currSortBy: string|null, currSortOrder: string|null,
    tableId: string, columns: ColumnData[], data: TestEntry[], meta: TableMetaResp, resolveRowMeta: (entry: Record<string, any>|null) => RowMeta|null,
    isLoading: boolean, canSpin: boolean, canSelect: boolean, inlineEdit: boolean, addNewEntry: boolean, empty: string) {
  return mount(TablePage, {
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue, formEntry, currPage, currSortBy, currSortOrder,
      tableId, columns, data, meta, resolveRowMeta,
      isLoading, canSpin, canSelect, inlineEdit, addNewEntry, empty
    }
  });
}

//

function genColumns(): ColumnData[] {
  return [
    {
      name: 'id',
      defSort: '',
      translation: 'test.table.column.id',
      visible: false,
      editable: false,
      kind: EnColumnKind.Data
    },
    {
      name: 'createdAt',
      defSort: 'DESC',
      translation: 'test.table.column.createdAt',
      visible: true,
      editable: false,
      kind: EnColumnKind.Data
    },
    {
      name: 'name',
      defSort: 'DESC',
      translation: 'test.table.column.name',
      visible: true,
      editable: true,
      kind: EnColumnKind.Data
    },
    {
      name: 'value',
      defSort: 'ASC',
      translation: 'test.table.column.value',
      visible: true,
      editable: true,
      kind: EnColumnKind.Data
    },
    {
      name: 'options',
      defSort: '',
      translation: 'test.table.column.options',
      visible: true,
      editable: false,
      kind: EnColumnKind.Custom
    }
  ];
}

function genData(page: number): TestEntry[] {
  if (page === 0)
    return [
      {
        id: 40,
        name: 'AA',
        value: 'BB'
      },
      {
        id: 41,
        name: 'config',
        value: 'true'
      },
    ];
  if (page === 1)
    return [
      {
        id: 42,
        name: 'Entry Name',
        value: 'Entry Value'
      },
      {
        id: 43,
        name: 'ZX83',
        value: '0'
      },
    ];
  if (page === 2)
    return [
      {
        id: 44,
        name: 'O E',
        value: 'V X'
      }
    ];
  return [];
}

function genMetaData(page: number, sortBy: string, sortOrder: string): TableMetaResp {
  return {
    pageCount: 3,
    entryCount: 5,

    pageSize: 2,
    page: page,
    sortBy: sortBy,
    sortOrder: sortOrder,
  };
}

function genResolveRowMeta(): (entry: Record<string, any>|null) => RowMeta|null {
 return vi.fn<(entry: Record<string, any>|null) => RowMeta|null>();
}

function generateAll(isEmpty: boolean, page: number, sortBy: string, sortOrder: string): { columns: ColumnData[], data: TestEntry[], metadata: TableMetaResp, resolveRowMeta: (entry: Record<string, any>|null) => RowMeta|null } {
  const columns = genColumns();
  const data = genData(isEmpty ? -1 : page);
  const metadata = genMetaData(isEmpty ? 0 : page, sortBy, sortOrder);
  const resolveRowMeta = genResolveRowMeta();
  return { columns, data, metadata, resolveRowMeta };
}


// ////////////////////////////////////////////////////////////////////////////

/** Tests of TablePage component. */
describe('TablePage', () => {
  describe('empty', () => {
    it('presents properly', async () => {
      // Ensure empty table looks correctly.

      // Arrange: Generate data for table.
      const { columns, data, metadata, resolveRowMeta } = generateAll(true, 0, 'createdAt', 'DESC');

      // Act: Create table.
      const tablePage = createComponent(null, null, 0, 'createdAt', 'DESC', '',
        columns, data, metadata, resolveRowMeta,
        false, true, true, false, false, 'test.table.page.empty');

      // Assert: All visible column headers are shown correctly.
      const columnHeaders = tablePage.findAll('.table-header-cell');
      expect(columnHeaders).toHaveLength(4);
      expect(columnHeaders[0]?.text()).toBe('Created');
      expect(columnHeaders[0]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(columnHeaders[0]?.find('span').classes()).toEqual(['arrow-desc']); // current sort
      expect(columnHeaders[1]?.text()).toBe('Name');
      expect(columnHeaders[1]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(columnHeaders[1]?.find('span').classes()).toEqual(['arrow-desc', 'potential']);
      expect(columnHeaders[2]?.text()).toBe('Value');
      expect(columnHeaders[2]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(columnHeaders[2]?.find('span').classes()).toEqual(['arrow-asc', 'potential']);
      expect(columnHeaders[3]?.text()).toBe('Options');
      expect(columnHeaders[3]?.classes()).toEqual(['table-header-cell']); // options column is not sortable
      expect(columnHeaders[3]?.find('span').exists()).toBe(false);

      // Assert: No rows present.
      const rowCmps = tablePage.findAllComponents(TableRow);
      expect(rowCmps).toHaveLength(0);

      // Assert: Text for empty table is visible.
      const tableEmpty = tablePage.find('.table-empty');
      expect(tableEmpty.text()).toBe('⚠️ No entries to show. ⚠️');

      // Assert: Table paginers are still visible, but disabled.
      const paginers = tablePage.findAllComponents(TablePaginer);
      expect(paginers).toHaveLength(2);
      expect(paginers[0]?.props('isDisabled')).toBe(true);
      expect(paginers[1]?.props('isDisabled')).toBe(true);
    });
  });

  describe('filled', () => {
    it('presents properly as is', async () => {
      // Ensure filled table looks correctly.

      // Arrange: Generate data for table.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      // Act: Create table.
      const tablePage = createComponent(null, null, 0, 'name', 'DESC', 'customTableId',
        columns, data, metadata, resolveRowMeta,
        false, true, true, false, false, 'test.table.page.empty');

      // Assert: All visible column headers are shown correctly.
      const columnHeaders = tablePage.findAll('.table-header-cell');
      expect(columnHeaders).toHaveLength(4);
      expect(columnHeaders[0]?.text()).toBe('Created');
      expect(columnHeaders[0]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(columnHeaders[0]?.find('span').classes()).toEqual(['arrow-desc', 'potential']);
      expect(columnHeaders[1]?.text()).toBe('Name');
      expect(columnHeaders[1]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(columnHeaders[1]?.find('span').classes()).toEqual(['arrow-desc']); // current sort
      expect(columnHeaders[2]?.text()).toBe('Value');
      expect(columnHeaders[2]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(columnHeaders[2]?.find('span').classes()).toEqual(['arrow-asc', 'potential']);
      expect(columnHeaders[3]?.text()).toBe('Options');
      expect(columnHeaders[3]?.classes()).toEqual(['table-header-cell']); // options column is not sortable
      expect(columnHeaders[3]?.find('span').exists()).toBe(false);

      // Assert: Rows are present.
      const rows = tablePage.findAll('.table-row');
      expect(rows).toHaveLength(2);
      expect(rows[0]?.classes()).toEqual(['table-row', 'odd']);
      expect(rows[1]?.classes()).toEqual(['table-row']);

      // Assert: Row components are present and in valid state.
      const rowCmps = tablePage.findAllComponents(TableRow as unknown as VueWrapper);
      expect(rowCmps).toHaveLength(2);
      // Assert: row 1 has correct data
      expect(rowCmps[0]?.props('modelValue')).toBeNull();
      expect(rowCmps[0]?.props('formEntry')).toBeNull();
      expect(rowCmps[0]?.props('tableId')).toBe('customTableId');
      expect(rowCmps[0]?.props('columns')).toStrictEqual(columns);
      expect(rowCmps[0]?.props('rowIndex')).toBe(0);
      expect(rowCmps[0]?.props('entry')).toStrictEqual(data[0]);
      expect(rowCmps[0]?.props('inlineEdit')).toBe(false);
      // Assert: row 2 has correct data
      expect(rowCmps[1]?.props('modelValue')).toBeNull();
      expect(rowCmps[1]?.props('formEntry')).toBeNull();
      expect(rowCmps[1]?.props('tableId')).toBe('customTableId');
      expect(rowCmps[1]?.props('columns')).toStrictEqual(columns);
      expect(rowCmps[1]?.props('rowIndex')).toBe(1);
      expect(rowCmps[1]?.props('entry')).toStrictEqual(data[1]);
      expect(rowCmps[1]?.props('inlineEdit')).toBe(false);

      // Assert: Text for empty table is not present.
      const tableEmpty = tablePage.find('.table-empty');
      expect(tableEmpty.exists()).toBe(false);

      // Assert: Table paginers are enabled.
      const paginers = tablePage.findAllComponents(TablePaginer);
      expect(paginers).toHaveLength(2);
      expect(paginers[0]?.props('isDisabled')).toBe(false);
      expect(paginers[1]?.props('isDisabled')).toBe(false);
    });

    it('selects entry', async () => {
      // Ensure filled table with selected row looks correctly.

      // Arrange: Generate data for table.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      // Arrange: Create table.
      const tablePage = createComponent(data[0]!, null, 0, 'name', 'DESC', 'customTableId',
        columns, data, metadata, resolveRowMeta,
        false, true, true, false, false, 'test.table.page.empty');

      // Act: Select row.
      const rows = tablePage.findAll('.table-row');
      expect(rows).toHaveLength(2);
      await rows[1]?.trigger('click');
      await nextTick();

      // Assert: Selected row data updated correctly.
      expect(tablePage.emitted('update:modelValue')).toHaveLength(1);
      expect(tablePage.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual(data[1]);

      // Assert: Rows are present and selected column is visible.
      expect(rows[0]?.classes()).toEqual(['table-row', 'odd']);
      expect(rows[1]?.classes()).toEqual(['table-row', 'selected']);

      // Assert: Row components are present and in valid state.
      const rowCmps = tablePage.findAllComponents(TableRow as unknown as VueWrapper);
      expect(rowCmps).toHaveLength(2);
      // Assert: row 1 has correct data
      expect(rowCmps[0]?.props('modelValue')).toStrictEqual(data[1]);
      expect(rowCmps[0]?.props('formEntry')).toBeNull();
      expect(rowCmps[0]?.props('tableId')).toBe('customTableId');
      expect(rowCmps[0]?.props('columns')).toStrictEqual(columns);
      expect(rowCmps[0]?.props('rowIndex')).toBe(0);
      expect(rowCmps[0]?.props('entry')).toStrictEqual(data[0]);
      expect(rowCmps[0]?.props('inlineEdit')).toBe(false);
      // Assert: row 2 has correct data
      expect(rowCmps[1]?.props('modelValue')).toStrictEqual(data[1]);
      expect(rowCmps[1]?.props('formEntry')).toBeNull();
      expect(rowCmps[1]?.props('tableId')).toBe('customTableId');
      expect(rowCmps[1]?.props('columns')).toStrictEqual(columns);
      expect(rowCmps[1]?.props('rowIndex')).toBe(1);
      expect(rowCmps[1]?.props('entry')).toStrictEqual(data[1]);
      expect(rowCmps[1]?.props('inlineEdit')).toBe(false);

      // Assert: Text for empty table is not present.
      const tableEmpty = tablePage.find('.table-empty');
      expect(tableEmpty.exists()).toBe(false);

      // Assert: Table paginers are enabled.
      const paginers = tablePage.findAllComponents(TablePaginer);
      expect(paginers).toHaveLength(2);
      expect(paginers[0]?.props('isDisabled')).toBe(false);
      expect(paginers[1]?.props('isDisabled')).toBe(false);
    });

    it('cannot select entry', async () => {
      // Ensure filled table looks correctly after failed selection try.

      // Arrange: Generate data for table.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      // Arrange: Create table.
      const tablePage = createComponent(null, null, 0, 'name', 'DESC', 'customTableId',
        columns, data, metadata, resolveRowMeta,
        false, true, false, false, false, 'test.table.page.empty');

      // Act: Try to select row.
      const rows = tablePage.findAll('.table-row');
      expect(rows).toHaveLength(2);
      await rows[1]?.trigger('click');
      await nextTick();

      // Assert: Selected row data updated correctly.
      expect(tablePage.emitted('update:modelValue')).toBeUndefined();

      // Assert: Rows are present and selected column is visible.
      expect(rows[0]?.classes()).toEqual(['table-row', 'unselectable', 'odd']);
      expect(rows[1]?.classes()).toEqual(['table-row', 'unselectable']);

      // Assert: Row components are present and in valid state.
      const rowCmps = tablePage.findAllComponents(TableRow as unknown as VueWrapper);
      expect(rowCmps).toHaveLength(2);
      // Assert: row 1 has correct data
      expect(rowCmps[0]?.props('modelValue')).toBeNull();
      expect(rowCmps[0]?.props('formEntry')).toBeNull();
      expect(rowCmps[0]?.props('tableId')).toBe('customTableId');
      expect(rowCmps[0]?.props('columns')).toStrictEqual(columns);
      expect(rowCmps[0]?.props('rowIndex')).toBe(0);
      expect(rowCmps[0]?.props('entry')).toStrictEqual(data[0]);
      expect(rowCmps[0]?.props('inlineEdit')).toBe(false);
      // Assert: row 2 has correct data
      expect(rowCmps[1]?.props('modelValue')).toBeNull();
      expect(rowCmps[1]?.props('formEntry')).toBeNull();
      expect(rowCmps[1]?.props('tableId')).toBe('customTableId');
      expect(rowCmps[1]?.props('columns')).toStrictEqual(columns);
      expect(rowCmps[1]?.props('rowIndex')).toBe(1);
      expect(rowCmps[1]?.props('entry')).toStrictEqual(data[1]);
      expect(rowCmps[1]?.props('inlineEdit')).toBe(false);

      // Assert: Text for empty table is not present.
      const tableEmpty = tablePage.find('.table-empty');
      expect(tableEmpty.exists()).toBe(false);

      // Assert: Table paginers are enabled.
      const paginers = tablePage.findAllComponents(TablePaginer);
      expect(paginers).toHaveLength(2);
      expect(paginers[0]?.props('isDisabled')).toBe(false);
      expect(paginers[1]?.props('isDisabled')).toBe(false);
    });
  });

  describe('change', () => {
    it('current page', async () => {
      // Ensure table changes page correctly.

      // Arrange: Generate data for table.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      // Arrange: Create table.
      const tablePage = createComponent(null, null, 0, 'name', 'DESC', 'customTableId',
        columns, data, metadata, resolveRowMeta,
        false, true, true, false, false, 'test.table.page.empty');

      // Act: Click on next page button.
      const paginers = tablePage.findAllComponents(TablePaginer);
      const buttons = paginers[0]?.findAll('.table-paginer-navbtn');
      buttons![2]?.trigger('click'); // next page button
      await nextTick();

      // Assert: Page changed correctly (component that uses <TablePage> watches for change in currPage to reload it).
      expect(tablePage.emitted('update:currPage')).toHaveLength(1);
      expect(tablePage.emitted('update:currPage')?.[0]?.[0]).toBe(1);
    });

    it('sorting order of current column', async () => {
      // Ensure table changes sorting order of current column correctly.

      // Arrange: Generate data for table.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'createdAt', 'ASC');

      // Arrange: Create table.
      const tablePage = createComponent(null, null, 0, 'createdAt', 'ASC', 'customTableId',
        columns, data, metadata, resolveRowMeta,
        false, true, true, false, false, 'test.table.page.empty');

      // Act: Click on header of 'createdAt' column. Note we already sort by this column, so we only change direction.
      const columnHeaders = tablePage.findAll('.table-header-cell');
      expect(columnHeaders).toHaveLength(4);
      columnHeaders[0]?.trigger('click'); // 'createdAt' column
      await nextTick();

      // Assert: Sorting changed correctly (component that uses <TablePage> watches for change in currSortBy/currSortOrder to reload it).
      expect(tablePage.emitted('update:currSortBy')).toBeUndefined(); // no change here
      expect(tablePage.emitted('update:currSortOrder')).toHaveLength(1);
      expect(tablePage.emitted('update:currSortOrder')?.[0]?.[0]).toBe('DESC');

      // Assert: All visible column headers are shown correctly after change.
      expect(columnHeaders[0]?.text()).toBe('Created');
      expect(columnHeaders[0]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(columnHeaders[0]?.find('span').classes()).toEqual(['arrow-desc']); // current sort
      expect(columnHeaders[1]?.text()).toBe('Name');
      expect(columnHeaders[1]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(columnHeaders[1]?.find('span').classes()).toEqual(['arrow-desc', 'potential']);
      expect(columnHeaders[2]?.text()).toBe('Value');
      expect(columnHeaders[2]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(columnHeaders[2]?.find('span').classes()).toEqual(['arrow-asc', 'potential']);
      expect(columnHeaders[3]?.text()).toBe('Options');
      expect(columnHeaders[3]?.classes()).toEqual(['table-header-cell']); // options column is not sortable
      expect(columnHeaders[3]?.find('span').exists()).toBe(false);
    });

    it('column to be sorted', async () => {
      // Ensure table changes column to be sorted correctly.

      // Arrange: Generate data for table.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      // Arrange: Create table.
      const tablePage = createComponent(null, null, 0, 'name', 'DESC', 'customTableId',
        columns, data, metadata, resolveRowMeta,
        false, true, true, false, false, 'test.table.page.empty');

      // Act: Click on header of 'value' column.
      const columnHeaders = tablePage.findAll('.table-header-cell');
      expect(columnHeaders).toHaveLength(4);
      columnHeaders[2]?.trigger('click'); // 'value' column
      await nextTick();

      // Assert: Sorting changed correctly (component that uses <TablePage> watches for change in currSortBy/currSortOrder to reload it).
      expect(tablePage.emitted('update:currSortBy')).toHaveLength(1);
      expect(tablePage.emitted('update:currSortBy')?.[0]?.[0]).toBe('value');
      expect(tablePage.emitted('update:currSortOrder')).toHaveLength(1);
      expect(tablePage.emitted('update:currSortOrder')?.[0]?.[0]).toBe('ASC');

      // Assert: All visible column headers are shown correctly after change.
      expect(columnHeaders[0]?.text()).toBe('Created');
      expect(columnHeaders[0]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(columnHeaders[0]?.find('span').classes()).toEqual(['arrow-desc', 'potential']);
      expect(columnHeaders[1]?.text()).toBe('Name');
      expect(columnHeaders[1]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(columnHeaders[1]?.find('span').classes()).toEqual(['arrow-desc', 'potential']);
      expect(columnHeaders[2]?.text()).toBe('Value');
      expect(columnHeaders[2]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(columnHeaders[2]?.find('span').classes()).toEqual(['arrow-asc']); // current sort
      expect(columnHeaders[3]?.text()).toBe('Options');
      expect(columnHeaders[3]?.classes()).toEqual(['table-header-cell']); // options column is not sortable
      expect(columnHeaders[3]?.find('span').exists()).toBe(false);
    });
  });
});
