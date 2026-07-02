/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
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
      const tableHeader = tablePage.findAll('.table-header-cell');
      expect(tableHeader).toHaveLength(4);
      expect(tableHeader[0]?.text()).toBe('Created');
      expect(tableHeader[0]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(tableHeader[0]?.find('span').classes()).toEqual(['arrow-desc']); // current sort
      expect(tableHeader[1]?.text()).toBe('Name');
      expect(tableHeader[1]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(tableHeader[1]?.find('span').classes()).toEqual(['arrow-desc', 'potential']);
      expect(tableHeader[2]?.text()).toBe('Value');
      expect(tableHeader[2]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(tableHeader[2]?.find('span').classes()).toEqual(['arrow-asc', 'potential']);
      expect(tableHeader[3]?.text()).toBe('Options');
      expect(tableHeader[3]?.classes()).toEqual(['table-header-cell']); // options column is not sortable
      expect(tableHeader[3]?.find('span').exists()).toBe(false);

      // Assert: No rows present.
      const rows = tablePage.findAllComponents(TableRow);
      expect(rows).toHaveLength(0);

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
      const tableHeader = tablePage.findAll('.table-header-cell');
      expect(tableHeader).toHaveLength(4);
      expect(tableHeader[0]?.text()).toBe('Created');
      expect(tableHeader[0]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(tableHeader[0]?.find('span').classes()).toEqual(['arrow-desc', 'potential']);
      expect(tableHeader[1]?.text()).toBe('Name');
      expect(tableHeader[1]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(tableHeader[1]?.find('span').classes()).toEqual(['arrow-desc']); // current sort
      expect(tableHeader[2]?.text()).toBe('Value');
      expect(tableHeader[2]?.classes()).toEqual(['table-header-cell', 'sortable']);
      expect(tableHeader[2]?.find('span').classes()).toEqual(['arrow-asc', 'potential']);
      expect(tableHeader[3]?.text()).toBe('Options');
      expect(tableHeader[3]?.classes()).toEqual(['table-header-cell']); // options column is not sortable
      expect(tableHeader[3]?.find('span').exists()).toBe(false);

      // Assert: Rows are present.
      const rows = tablePage.findAllComponents(TableRow);
      expect(rows).toHaveLength(2);
      // Assert: row 1 has correct data
      expect(rows[0]?.props('modelValue')).toBeNull();
      expect(rows[0]?.props('formEntry')).toBeNull();
      expect(rows[0]?.props('tableId')).toBe('customTableId');
      expect(rows[0]?.props('columns')).toStrictEqual(columns);
      expect(rows[0]?.props('rowIndex')).toBe(0);
      expect(rows[0]?.props('entry')).toStrictEqual(data[0]);
      expect(rows[0]?.props('inlineEdit')).toBe(false);
      // Assert: row 2 has correct data
      expect(rows[1]?.props('modelValue')).toBeNull();
      expect(rows[1]?.props('formEntry')).toBeNull();
      expect(rows[1]?.props('tableId')).toBe('customTableId');
      expect(rows[1]?.props('columns')).toStrictEqual(columns);
      expect(rows[1]?.props('rowIndex')).toBe(1);
      expect(rows[1]?.props('entry')).toStrictEqual(data[1]);
      expect(rows[1]?.props('inlineEdit')).toBe(false);

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
});
