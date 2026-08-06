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

const tableId = 'customTableId';

//

/** Convenience function to create component. */
function createComponent(
  modelValue: TestEntry | null,
  formEntry: TestForm | null,
  currPage: number,
  currSortBy: string | null,
  currSortOrder: string | null,
  tableId: string,
  columns: ColumnData[],
  data: TestEntry[],
  meta: TableMetaResp,
  resolveRowMeta: (entry: Record<string, any> | null) => RowMeta | null,
  isLoading: boolean,
  canSpin: boolean,
  canSelect: boolean,
  inlineEdit: boolean,
  addNewEntry: boolean,
  empty: string,
  descr?: string,
) {
  return mount(TablePage, {
    global: {
      plugins: [i18n],
    },
    props: {
      modelValue,
      formEntry,
      currPage,
      currSortBy,
      currSortOrder,
      tableId,
      columns,
      data,
      meta,
      resolveRowMeta,
      isLoading,
      canSpin,
      canSelect,
      inlineEdit,
      addNewEntry,
      empty,
      descr,
    },
  });
}

//

/**
 * Generate columns. Contains visible and not visible columns, also data and custom columns.
 * @returns Columns.
 */
function genColumns(): ColumnData[] {
  return [
    {
      name: 'id',
      defSort: '',
      translation: 'test.table.column.id',
      visible: false,
      editable: false,
      kind: EnColumnKind.Data,
    },
    {
      name: 'createdAt',
      defSort: 'DESC',
      translation: 'test.table.column.createdAt',
      visible: true,
      editable: false,
      kind: EnColumnKind.Data,
    },
    {
      name: 'name',
      defSort: 'DESC',
      translation: 'test.table.column.name',
      visible: true,
      editable: true,
      kind: EnColumnKind.Data,
    },
    {
      name: 'value',
      defSort: 'ASC',
      translation: 'test.table.column.value',
      visible: true,
      editable: true,
      kind: EnColumnKind.Data,
    },
    {
      name: 'options',
      defSort: '',
      translation: 'test.table.column.options',
      visible: true,
      editable: false,
      kind: EnColumnKind.Custom,
    },
  ];
}

/**
 * Generate paged data. 2 records per page, 5 records in total.
 * @param page Page number.
 * @returns Generated records for given page.
 */
function genDataPaged(page: number): TestEntry[] {
  if (page === 0)
    return [
      { id: 40, name: 'AA', value: 'BB' },
      { id: 41, name: 'config', value: 'true' },
    ];
  if (page === 1)
    return [
      { id: 42, name: 'Entry Name', value: 'Entry Value' },
      { id: 43, name: 'ZX83', value: '0' },
    ];
  if (page === 2) return [{ id: 44, name: 'O E', value: 'V X' }];
  return [];
}

function genMetaData(page: number, sortBy: string, sortOrder: string): TableMetaResp {
  return {
    pageCount: 3,
    entryCount: 5,
    pageSize: 2,
    page,
    sortBy,
    sortOrder,
  };
}

function genResolveRowMeta(): (entry: Record<string, any> | null) => RowMeta | null {
  return vi.fn<(entry: Record<string, any> | null) => RowMeta | null>();
}

function generateAll(
  isEmpty: boolean,
  page: number,
  sortBy: string,
  sortOrder: string,
): {
  columns: ColumnData[];
  data: TestEntry[];
  metadata: TableMetaResp;
  resolveRowMeta: (entry: Record<string, any> | null) => RowMeta | null;
} {
  const columns = genColumns();
  const data = genDataPaged(isEmpty ? -1 : page);
  const metadata = genMetaData(isEmpty ? 0 : page, sortBy, sortOrder);
  const resolveRowMeta = genResolveRowMeta();
  return { columns, data, metadata, resolveRowMeta };
}

//

/**
 * Generate data. 3 records in total.
 * @returns Generated records.
 */
function genData3(): TestEntry[] {
  return [
    { id: 40, name: 'AA', value: 'BB' },
    { id: 41, name: 'config', value: 'true' },
    { id: 42, name: 'ZZ', value: '0' },
  ];
}

/**
 * Generate data. 5 records in total.
 * @returns Generated records.
 */
function genData5(): TestEntry[] {
  return [
    { id: 40, name: 'AA', value: 'BB' },
    { id: 41, name: 'config', value: 'true' },
    { id: 42, name: 'ZZ', value: '0' },
    { id: 43, name: 'yy', value: '666' },
    { id: 44, name: 'jj', value: '13' },
  ];
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of TablePage component. */
describe('TablePage', () => {
  // //////////////////////////////////////////////////////////////////////////
  // Empty state

  describe('empty', () => {
    it('shows empty message and disabled paginers when no data', () => {
      // Arrange: Generate empty data.
      const { columns, data, metadata, resolveRowMeta } = generateAll(true, 0, 'createdAt', 'DESC');

      // Act: Create table.
      const wrapper = createComponent(
        null,
        null,
        0,
        'createdAt',
        'DESC',
        tableId,
        columns,
        data,
        metadata,
        resolveRowMeta,
        false,
        true,
        true,
        false,
        false,
        'test.table.page.empty',
      );

      // Assert: Root has data-testid.
      const root = wrapper.find('[data-testid="customTableId"]');
      expect(root.exists()).toBe(true);

      // Assert: Column headers.
      const columnHeaders = wrapper.findAll('.table-header-cell');
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

      // Assert: No rows.
      const rowCmps = wrapper.findAllComponents(TableRow);
      expect(rowCmps).toHaveLength(0);

      // Assert: Empty message.
      const tableEmpty = wrapper.find('.table-empty');
      expect(tableEmpty.text()).toBe('⚠️ No entries to show. ⚠️');

      // Assert: Paginers disabled.
      const paginers = wrapper.findAllComponents(TablePaginer);
      expect(paginers).toHaveLength(2);
      expect(paginers[0]?.props('isDisabled')).toBe(true);
      expect(paginers[1]?.props('isDisabled')).toBe(true);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Filled state

  describe('filled', () => {
    it('renders rows with correct headers and enabled paginers', () => {
      // Arrange: Page 0 data, sorted by name DESC.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      // Act: Create table.
      const wrapper = createComponent(
        null,
        null,
        0,
        'name',
        'DESC',
        tableId,
        columns,
        data,
        metadata,
        resolveRowMeta,
        false,
        true,
        true,
        false,
        false,
        'test.table.page.empty',
      );

      // Assert: Column headers with sort markers.
      const columnHeaders = wrapper.findAll('.table-header-cell');
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

      // Assert: Two rows with correct classes.
      const rows = wrapper.findAll('.table-row');
      expect(rows).toHaveLength(2);
      expect(rows[0]?.classes()).toEqual(['table-row', 'odd']);
      expect(rows[1]?.classes()).toEqual(['table-row']);

      // Assert: Row components have correct props.
      const rowCmps = wrapper.findAllComponents(TableRow as unknown as VueWrapper);
      expect(rowCmps).toHaveLength(2);
      // Assert: Row 1 has correct data
      expect(rowCmps[0]?.props('modelValue')).toBeNull();
      expect(rowCmps[0]?.props('formEntry')).toBeNull();
      expect(rowCmps[0]?.props('tableId')).toBe('customTableId');
      expect(rowCmps[0]?.props('columns')).toStrictEqual(columns);
      expect(rowCmps[0]?.props('rowIndex')).toBe(0);
      expect(rowCmps[0]?.props('entry')).toStrictEqual(data[0]);
      expect(rowCmps[0]?.props('inlineEdit')).toBe(false);
      // Assert: Row 2 has correct data
      expect(rowCmps[1]?.props('modelValue')).toBeNull();
      expect(rowCmps[1]?.props('formEntry')).toBeNull();
      expect(rowCmps[1]?.props('tableId')).toBe('customTableId');
      expect(rowCmps[1]?.props('columns')).toStrictEqual(columns);
      expect(rowCmps[1]?.props('rowIndex')).toBe(1);
      expect(rowCmps[1]?.props('entry')).toStrictEqual(data[1]);
      expect(rowCmps[1]?.props('inlineEdit')).toBe(false);

      // Assert: ResolveRowMeta was called for each row.
      expect(resolveRowMeta).toHaveBeenCalledTimes(2);
      expect(resolveRowMeta).toHaveBeenCalledWith(data[0]);
      expect(resolveRowMeta).toHaveBeenCalledWith(data[1]);

      // Assert: No empty message.
      expect(wrapper.find('.table-empty').exists()).toBe(false);

      // Assert: Paginers enabled.
      const paginers = wrapper.findAllComponents(TablePaginer);
      expect(paginers).toHaveLength(2);
      expect(paginers[0]?.props('isDisabled')).toBe(false);
      expect(paginers[1]?.props('isDisabled')).toBe(false);
    });

    it('selects a row on click and emits update:modelValue', async () => {
      // Arrange: Filled table with no selection.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      const wrapper = createComponent(
        data[0]!,
        null,
        0,
        'name',
        'DESC',
        tableId,
        columns,
        data,
        metadata,
        resolveRowMeta,
        false,
        true,
        true,
        false,
        false,
        'test.table.page.empty',
      );

      // Act: Click on second row.
      const rows = wrapper.findAll('.table-row');
      expect(rows).toHaveLength(2);
      await rows[1]?.trigger('click');
      await nextTick();

      // Assert: Selected row emitted.
      expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual(data[1]);

      // Assert: Second row has 'selected' class.
      expect(rows[0]?.classes()).toEqual(['table-row', 'odd']);
      expect(rows[1]?.classes()).toEqual(['table-row', 'selected']);

      // Assert: Row components reflect new selection.
      const rowCmps = wrapper.findAllComponents(TableRow as unknown as VueWrapper);
      expect(rowCmps).toHaveLength(2);
      // Assert: Row 1 has correct data
      expect(rowCmps[0]?.props('modelValue')).toStrictEqual(data[1]);
      expect(rowCmps[0]?.props('formEntry')).toBeNull();
      expect(rowCmps[0]?.props('tableId')).toBe('customTableId');
      expect(rowCmps[0]?.props('columns')).toStrictEqual(columns);
      expect(rowCmps[0]?.props('rowIndex')).toBe(0);
      expect(rowCmps[0]?.props('entry')).toStrictEqual(data[0]);
      expect(rowCmps[0]?.props('inlineEdit')).toBe(false);
      // Assert: Row 2 has correct data
      expect(rowCmps[1]?.props('modelValue')).toStrictEqual(data[1]);
      expect(rowCmps[1]?.props('formEntry')).toBeNull();
      expect(rowCmps[1]?.props('tableId')).toBe('customTableId');
      expect(rowCmps[1]?.props('columns')).toStrictEqual(columns);
      expect(rowCmps[1]?.props('rowIndex')).toBe(1);
      expect(rowCmps[1]?.props('entry')).toStrictEqual(data[1]);
      expect(rowCmps[1]?.props('inlineEdit')).toBe(false);

      // Assert: Text for empty table is not present.
      const tableEmpty = wrapper.find('.table-empty');
      expect(tableEmpty.exists()).toBe(false);

      // Assert: Table paginers are enabled.
      const paginers = wrapper.findAllComponents(TablePaginer);
      expect(paginers).toHaveLength(2);
      expect(paginers[0]?.props('isDisabled')).toBe(false);
      expect(paginers[1]?.props('isDisabled')).toBe(false);
    });

    it('deselects when clicking the already-selected row', async () => {
      // Arrange: First row pre-selected.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      const wrapper = createComponent(
        data[0]!,
        null,
        0,
        'name',
        'DESC',
        tableId,
        columns,
        data,
        metadata,
        resolveRowMeta,
        false,
        true,
        true,
        false,
        false,
        'test.table.page.empty',
      );

      // Act: Click the already-selected row.
      const rows = wrapper.findAll('.table-row');
      expect(rows).toHaveLength(2);
      await rows[0]?.trigger('click');
      await nextTick();

      // Assert: Emitted null (deselected).
      expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBeNull();

      // Assert: No row has 'selected' class.
      expect(rows[0]?.classes()).toEqual(['table-row', 'odd']);
      expect(rows[1]?.classes()).toEqual(['table-row']);
    });

    it('does not select when canSelect is false', async () => {
      // Arrange: CanSelect disabled.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      const wrapper = createComponent(
        null,
        null,
        0,
        'name',
        'DESC',
        tableId,
        columns,
        data,
        metadata,
        resolveRowMeta,
        false,
        true,
        false,
        false,
        false,
        'test.table.page.empty',
      );

      // Act: Try to click a row.
      const rows = wrapper.findAll('.table-row');
      expect(rows).toHaveLength(2);
      await rows[1]?.trigger('click');
      await nextTick();

      // Assert: No emit.
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();

      // Assert: Rows have 'unselectable' class.
      expect(rows[0]?.classes()).toEqual(['table-row', 'unselectable', 'odd']);
      expect(rows[1]?.classes()).toEqual(['table-row', 'unselectable']);

      // Assert: Row components are present and in valid state.
      const rowCmps = wrapper.findAllComponents(TableRow as unknown as VueWrapper);
      expect(rowCmps).toHaveLength(2);
      // Assert: Row 1 has correct data
      expect(rowCmps[0]?.props('modelValue')).toBeNull();
      expect(rowCmps[0]?.props('formEntry')).toBeNull();
      expect(rowCmps[0]?.props('tableId')).toBe('customTableId');
      expect(rowCmps[0]?.props('columns')).toStrictEqual(columns);
      expect(rowCmps[0]?.props('rowIndex')).toBe(0);
      expect(rowCmps[0]?.props('entry')).toStrictEqual(data[0]);
      expect(rowCmps[0]?.props('inlineEdit')).toBe(false);
      // Assert: Row 2 has correct data
      expect(rowCmps[1]?.props('modelValue')).toBeNull();
      expect(rowCmps[1]?.props('formEntry')).toBeNull();
      expect(rowCmps[1]?.props('tableId')).toBe('customTableId');
      expect(rowCmps[1]?.props('columns')).toStrictEqual(columns);
      expect(rowCmps[1]?.props('rowIndex')).toBe(1);
      expect(rowCmps[1]?.props('entry')).toStrictEqual(data[1]);
      expect(rowCmps[1]?.props('inlineEdit')).toBe(false);

      // Assert: Text for empty table is not present.
      const tableEmpty = wrapper.find('.table-empty');
      expect(tableEmpty.exists()).toBe(false);

      // Assert: Table paginers are enabled.
      const paginers = wrapper.findAllComponents(TablePaginer);
      expect(paginers).toHaveLength(2);
      expect(paginers[0]?.props('isDisabled')).toBe(false);
      expect(paginers[1]?.props('isDisabled')).toBe(false);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Loading state

  describe('loading', () => {
    it('shows spinner and hides rows when isLoading is true', () => {
      // Arrange: Loading state with data present.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      // Act: Create table in loading state.
      const wrapper = createComponent(
        null,
        null,
        0,
        'name',
        'DESC',
        tableId,
        columns,
        data,
        metadata,
        resolveRowMeta,
        true,
        true,
        true,
        false,
        false,
        'test.table.page.empty',
      );

      // Assert: Spinner is visible.
      const spinner = wrapper.find('[data-testid="spinner"]');
      expect(spinner.exists()).toBe(true);

      // Assert: No rows rendered.
      expect(wrapper.findAllComponents(TableRow)).toHaveLength(0);

      // Assert: No empty message.
      expect(wrapper.find('.table-empty').exists()).toBe(false);
    });

    it('provides accessible label on the loading spinner', () => {
      // Arrange: Loading state with a description.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      // Act: Create table in loading state with descr prop.
      const wrapper = createComponent(
        null,
        null,
        0,
        'name',
        'DESC',
        tableId,
        columns,
        data,
        metadata,
        resolveRowMeta,
        true,
        true,
        true,
        false,
        false,
        'test.table.page.empty',
        'Loading table...',
      );

      // Assert: Spinner has aria-label from descr prop.
      const spinner = wrapper.find('[data-testid="spinner"]');
      expect(spinner.attributes('aria-label')).toBe('Loading table...');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Add-new-entry row

  describe('addNewEntry', () => {
    it('renders an extra row with null entry when addNewEntry and inlineEdit are true', () => {
      // Arrange: Empty data with addNewEntry enabled.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      // Act: Create table with addNewEntry and inlineEdit.
      const wrapper = createComponent(
        null,
        null,
        0,
        'name',
        'DESC',
        tableId,
        columns,
        data,
        metadata,
        resolveRowMeta,
        false,
        true,
        true,
        true,
        true,
        'test.table.page.empty',
      );

      // Assert: Three rows (one extra for new entry, plus the two data rows).
      const rows = wrapper.findAll('.table-row');
      expect(rows).toHaveLength(3);

      // Assert: Row components include one with null entry.
      const rowCmps = wrapper.findAllComponents(TableRow as unknown as VueWrapper);
      expect(rowCmps).toHaveLength(3);
      expect(rowCmps[0]?.props('entry')).toBeNull();
      expect(rowCmps[0]?.props('rowIndex')).toBe(-1);
      expect(rowCmps[1]?.props('entry')).toStrictEqual(data[0]);
      expect(rowCmps[2]?.props('entry')).toStrictEqual(data[1]);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Inline edit

  describe('inline edit', () => {
    it('disables paginer and sorting when a row is selected during inline edit', async () => {
      // Arrange: Table with inline edit enabled, row pre-selected.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      const wrapper = createComponent(
        data[0]!,
        null,
        0,
        'name',
        'DESC',
        tableId,
        columns,
        data,
        metadata,
        resolveRowMeta,
        false,
        true,
        true,
        true,
        false,
        'test.table.page.empty',
      );

      // Assert: Column headers are NOT sortable (inline edit + selection).
      const columnHeaders = wrapper.findAll('.table-header-cell');
      expect(columnHeaders[0]?.classes()).toEqual(['table-header-cell']); // no 'sortable'

      // Assert: Paginers are disabled.
      const paginers = wrapper.findAllComponents(TablePaginer);
      expect(paginers[0]?.props('isDisabled')).toBe(true);
      expect(paginers[1]?.props('isDisabled')).toBe(true);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Change events

  describe('change', () => {
    it('emits update:currPage when navigating pages', async () => {
      // Arrange: Filled table on first page.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      const wrapper = createComponent(
        null,
        null,
        0,
        'name',
        'DESC',
        tableId,
        columns,
        data,
        metadata,
        resolveRowMeta,
        false,
        true,
        true,
        false,
        false,
        'test.table.page.empty',
      );

      // Act: Click next-page button in the first paginer.
      const paginers = wrapper.findAllComponents(TablePaginer);
      const buttons = paginers[0]?.findAll('.table-paginer-navbtn');
      await buttons![2]?.trigger('click');
      await nextTick();

      // Assert: Page changed.
      expect(wrapper.emitted('update:currPage')).toHaveLength(1);
      expect(wrapper.emitted('update:currPage')?.[0]?.[0]).toBe(1);
    });

    it('toggles sort order when clicking the current sort column', async () => {
      // Arrange: Sorted by createdAt ASC.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'createdAt', 'ASC');

      const wrapper = createComponent(
        null,
        null,
        0,
        'createdAt',
        'ASC',
        tableId,
        columns,
        data,
        metadata,
        resolveRowMeta,
        false,
        true,
        true,
        false,
        false,
        'test.table.page.empty',
      );

      // Act: Click header of the current sort column.
      const columnHeaders = wrapper.findAll('.table-header-cell');
      await columnHeaders[0]?.trigger('click');
      await nextTick();

      // Assert: Sort order toggled to DESC.
      expect(wrapper.emitted('update:currSortBy')).toBeUndefined();
      expect(wrapper.emitted('update:currSortOrder')).toHaveLength(1);
      expect(wrapper.emitted('update:currSortOrder')?.[0]?.[0]).toBe('DESC');

      // Assert: Sort marker updated.
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

    it('changes sort column when clicking a different column header', async () => {
      // Arrange: Sorted by name DESC.
      const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

      const wrapper = createComponent(
        null,
        null,
        0,
        'name',
        'DESC',
        tableId,
        columns,
        data,
        metadata,
        resolveRowMeta,
        false,
        true,
        true,
        false,
        false,
        'test.table.page.empty',
      );

      // Act: Click header of 'value' column.
      const columnHeaders = wrapper.findAll('.table-header-cell');
      expect(columnHeaders).toHaveLength(4);
      await columnHeaders[2]?.trigger('click');
      await nextTick();

      // Assert: Sort column changed to 'value' with its default sort (ASC).
      expect(wrapper.emitted('update:currSortBy')).toHaveLength(1);
      expect(wrapper.emitted('update:currSortBy')?.[0]?.[0]).toBe('value');
      expect(wrapper.emitted('update:currSortOrder')).toHaveLength(1);
      expect(wrapper.emitted('update:currSortOrder')?.[0]?.[0]).toBe('ASC');

      // Assert: Sort marker updated on 'value', potential on old column.
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

  // //////////////////////////////////////////////////////////////////////////
  // Keyboard navigation

  describe('keyboard navigation', () => {
    describe('column headers', () => {
      it('sortable column headers have tabindex 0, non-sortable have -1', () => {
        // Arrange: Filled table.
        const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'createdAt', 'DESC');

        const wrapper = createComponent(
          null,
          null,
          0,
          'createdAt',
          'DESC',
          tableId,
          columns,
          data,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        // Assert: Sortable columns are focusable.
        const columnHeaders = wrapper.findAll('.table-header-cell');
        // Index 0: createdAt (sortable, defSort='DESC').
        expect(columnHeaders[0]?.attributes('tabindex')).toBe('0');
        // Index 1: name (sortable, defSort='DESC').
        expect(columnHeaders[1]?.attributes('tabindex')).toBe('0');
        // Index 2: value (sortable, defSort='ASC').
        expect(columnHeaders[2]?.attributes('tabindex')).toBe('0');
        // Index 3: options (not sortable, defSort='').
        expect(columnHeaders[3]?.attributes('tabindex')).toBe('-1');
      });

      it('Enter on current sort column toggles sort order', async () => {
        // Arrange: Sorted by createdAt ASC.
        const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'createdAt', 'ASC');

        const wrapper = createComponent(
          null,
          null,
          0,
          'createdAt',
          'ASC',
          tableId,
          columns,
          data,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        // Act: Press Enter on the current sort column header.
        const columnHeaders = wrapper.findAll('.table-header-cell');
        await columnHeaders[0]?.trigger('keydown', { key: 'Enter' });
        await nextTick();

        // Assert: Sort order toggled to DESC.
        expect(wrapper.emitted('update:currSortBy')).toBeUndefined();
        expect(wrapper.emitted('update:currSortOrder')).toHaveLength(1);
        expect(wrapper.emitted('update:currSortOrder')?.[0]?.[0]).toBe('DESC');

        // Assert: Sort marker updated.
        expect(columnHeaders[0]?.find('span').classes()).toEqual(['arrow-desc']);
      });

      it('Space on current sort column also toggles sort order', async () => {
        // Arrange: Sorted by createdAt ASC.
        const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'createdAt', 'ASC');

        const wrapper = createComponent(
          null,
          null,
          0,
          'createdAt',
          'ASC',
          tableId,
          columns,
          data,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        // Act: Press Space on the current sort column header.
        const columnHeaders = wrapper.findAll('.table-header-cell');
        await columnHeaders[0]?.trigger('keydown', { key: ' ' });
        await nextTick();

        // Assert: Sort order toggled to DESC.
        expect(wrapper.emitted('update:currSortBy')).toBeUndefined();
        expect(wrapper.emitted('update:currSortOrder')).toHaveLength(1);
        expect(wrapper.emitted('update:currSortOrder')?.[0]?.[0]).toBe('DESC');
      });

      it('Enter/Space on a different column changes sort column', async () => {
        // Arrange: Sorted by name DESC.
        const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

        const wrapper = createComponent(
          null,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        // Act: Press Enter on 'value' column header.
        const columnHeaders = wrapper.findAll('.table-header-cell');
        await columnHeaders[2]?.trigger('keydown', { key: 'Enter' });
        await nextTick();

        // Assert: Sort column changed to 'value' with its default sort (ASC).
        expect(wrapper.emitted('update:currSortBy')).toHaveLength(1);
        expect(wrapper.emitted('update:currSortBy')?.[0]?.[0]).toBe('value');
        expect(wrapper.emitted('update:currSortOrder')).toHaveLength(1);
        expect(wrapper.emitted('update:currSortOrder')?.[0]?.[0]).toBe('ASC');

        // Assert: Sort marker updated.
        expect(columnHeaders[2]?.find('span').classes()).toEqual(['arrow-asc']);
      });

      it('non-sortable column ignores keyboard', async () => {
        // Arrange: Sorted by createdAt ASC.
        const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'createdAt', 'ASC');

        const wrapper = createComponent(
          null,
          null,
          0,
          'createdAt',
          'ASC',
          tableId,
          columns,
          data,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        // Act: Press Enter and Space on non-sortable 'options' header.
        const columnHeaders = wrapper.findAll('.table-header-cell');
        await columnHeaders[3]?.trigger('keydown', { key: 'Enter' });
        await columnHeaders[3]?.trigger('keydown', { key: ' ' });
        await nextTick();

        // Assert: No sort change emitted.
        expect(wrapper.emitted('update:currSortBy')).toBeUndefined();
        expect(wrapper.emitted('update:currSortOrder')).toBeUndefined();
      });

      it('irrelevant keys do nothing on sortable headers', async () => {
        // Arrange: Sorted by createdAt ASC.
        const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'createdAt', 'ASC');

        const wrapper = createComponent(
          null,
          null,
          0,
          'createdAt',
          'ASC',
          tableId,
          columns,
          data,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        // Act: Press irrelevant keys on a sortable header.
        const columnHeaders = wrapper.findAll('.table-header-cell');
        await columnHeaders[0]?.trigger('keydown', { key: 'a' });
        await columnHeaders[0]?.trigger('keydown', { key: 'Tab' });
        await columnHeaders[0]?.trigger('keydown', { key: 'ArrowDown' });
        await columnHeaders[0]?.trigger('keydown', { key: 'Escape' });
        await nextTick();

        // Assert: No sort change emitted.
        expect(wrapper.emitted('update:currSortBy')).toBeUndefined();
        expect(wrapper.emitted('update:currSortOrder')).toBeUndefined();
      });

      it('keyboard sorting is disabled during inline edit with selection', async () => {
        // Arrange: Table with inline edit enabled, row pre-selected.
        const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

        const wrapper = createComponent(
          data[0]!,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          true,
          false,
          'test.table.page.empty',
        );

        // Assert: Column headers have tabindex -1 (not focusable).
        const columnHeaders = wrapper.findAll('.table-header-cell');
        expect(columnHeaders[0]?.attributes('tabindex')).toBe('-1');

        // Act: Press Enter on a sortable header.
        await columnHeaders[0]?.trigger('keydown', { key: 'Enter' });
        await nextTick();

        // Assert: No sort change emitted.
        expect(wrapper.emitted('update:currSortBy')).toBeUndefined();
        expect(wrapper.emitted('update:currSortOrder')).toBeUndefined();
      });
    });

    //

    describe('table rows', () => {
      it('rows can be tabbed through when rows are selectable', async () => {
        // Arrange: Filled table with no selection and 3 rows.
        const { columns, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');
        const data3: TestEntry[] = genData3();

        // Act: Create component.
        const wrapper = createComponent(
          null,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data3,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(3);

        // Assert: Tabindex attribute has correct value.
        for (const row of rows) {
          expect(row.attributes('tabindex')).toBe('0');
        }
      });

      it('rows cannot be tabbed through when rows are not selectable', async () => {
        // Arrange: Filled table with no selection and 3 rows.
        const { columns, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');
        const data3: TestEntry[] = genData3();

        // Act: Create component.
        const wrapper = createComponent(
          null,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data3,
          metadata,
          resolveRowMeta,
          false,
          true,
          false,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(3);

        // Assert: Tabindex attribute has correct value.
        for (const row of rows) {
          expect(row.attributes('tabindex')).toBe('-1');
        }
      });

      //

      it('ArrowDown on any row with no selection focuses first row', async () => {
        // Arrange: Filled table with no selection and 3 rows.
        const { columns, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');
        const data3: TestEntry[] = genData3();

        const wrapper = createComponent(
          null,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data3,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(3);

        // Spy on each row's focus method.
        const rowFocus = rows.map((r) => vi.spyOn(r.element as HTMLElement, 'focus'));

        // Act: Press ArrowDown on the third row.
        await rows[2]!.trigger('keydown', { key: 'ArrowDown' });
        await nextTick();

        // Assert: ArrowDown on the last row wraps around to the first row.
        expect(rowFocus[0]).toHaveBeenCalledTimes(1);
      });

      it('ArrowUp on any row with no selection focuses last row', async () => {
        // Arrange: Filled table with no selection and 3 rows.
        const { columns, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');
        const data3: TestEntry[] = genData3();

        const wrapper = createComponent(
          null,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data3,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(3);

        const rowFocus = rows.map((r) => vi.spyOn(r.element as HTMLElement, 'focus'));

        // Act: Press ArrowUp on the first row.
        await rows[0]!.trigger('keydown', { key: 'ArrowUp' });
        await nextTick();

        // Assert: ArrowUp on the first row wraps around to the last row.
        expect(rowFocus[2]).toHaveBeenCalledTimes(1);
      });

      it('ArrowDown on any row with selection focuses on next row', async () => {
        // Arrange: Table with pre-selected row.
        const { columns, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');
        const data5: TestEntry[] = genData5(); // middle row selected

        const wrapper = createComponent(
          data5[2]!,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data5,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(5);

        const rowFocus = rows.map((r) => vi.spyOn(r.element as HTMLElement, 'focus'));

        // Act: Press ArrowDown on first row.
        await rows[0]!.trigger('keydown', { key: 'ArrowDown' });
        await nextTick();

        // Assert: Focus jumps to the second row.
        expect(rowFocus[1]).toHaveBeenCalledTimes(1);
      });

      it('ArrowUp on any row with selection focuses last row', async () => {
        // Arrange: Table with pre-selected row.
        const { columns, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');
        const data5: TestEntry[] = genData5(); // middle row selected

        const wrapper = createComponent(
          data5[2]!,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data5,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(5);

        const rowFocus = rows.map((r) => vi.spyOn(r.element as HTMLElement, 'focus'));

        // Act: Press ArrowUp on first row.
        await rows[0]!.trigger('keydown', { key: 'ArrowUp' });
        await nextTick();

        // Assert: Focus jumps to the last row.
        expect(rowFocus[4]).toHaveBeenCalledTimes(1);
      });

      it('consecutive ArrowDown moves to next row and wraps at last', async () => {
        // Arrange: 3 rows, no selection.
        const { columns, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');
        const data3: TestEntry[] = genData3();

        const wrapper = createComponent(
          null,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data3,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(3);

        const rowFocus = rows.map((r) => vi.spyOn(r.element as HTMLElement, 'focus'));

        // Act: ArrowDown on row 0 → move to row 1.
        await rows[0]!.trigger('keydown', { key: 'ArrowDown' });
        await nextTick();
        expect(rowFocus[1]).toHaveBeenCalledTimes(1);

        // Act: ArrowDown on row 1 → move to row 2.
        await rows[1]!.trigger('keydown', { key: 'ArrowDown' });
        await nextTick();
        expect(rowFocus[2]).toHaveBeenCalledTimes(1);

        // Act: ArrowDown on row 2 → wraps to row 0.
        await rows[2]!.trigger('keydown', { key: 'ArrowDown' });
        await nextTick();
        expect(rowFocus[0]).toHaveBeenCalledTimes(1);

        // Act: ArrowDown on row 0 → move to row 1 again.
        await rows[0]!.trigger('keydown', { key: 'ArrowDown' });
        await nextTick();
        expect(rowFocus[1]).toHaveBeenCalledTimes(2);
      });

      it('consecutive ArrowUp moves to previous row and wraps at first', async () => {
        // Arrange: 3 rows, no selection.
        const { columns, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');
        const data3: TestEntry[] = genData3();

        const wrapper = createComponent(
          null,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data3,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(3);

        const rowFocus = rows.map((r) => vi.spyOn(r.element as HTMLElement, 'focus'));

        // Act: ArrowUp on row 2 → move to row 1.
        await rows[2]!.trigger('keydown', { key: 'ArrowUp' });
        await nextTick();
        expect(rowFocus[1]).toHaveBeenCalledTimes(1);

        // Act: ArrowUp on row 1 → move to row 0.
        await rows[1]!.trigger('keydown', { key: 'ArrowUp' });
        await nextTick();
        expect(rowFocus[0]).toHaveBeenCalledTimes(1);

        // Act: ArrowUp on row 0 → wraps to row 2.
        await rows[0]!.trigger('keydown', { key: 'ArrowUp' });
        await nextTick();
        expect(rowFocus[2]).toHaveBeenCalledTimes(1);

        // Act: ArrowUp on row 2 → move to row 1 again.
        await rows[2]!.trigger('keydown', { key: 'ArrowUp' });
        await nextTick();
        expect(rowFocus[1]).toHaveBeenCalledTimes(2);
      });

      it('Enter on a row toggles selection', async () => {
        // Arrange: 2 rows, no selection.
        const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

        const wrapper = createComponent(
          null,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(2);

        // Act: Press Enter on second row.
        await rows[1]!.trigger('keydown', { key: 'Enter' });
        await nextTick();

        // Assert: Selected row emitted.
        expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual(data[1]);

        // Act: Press Enter on same row again.
        await rows[1]!.trigger('keydown', { key: 'Enter' });
        await nextTick();

        // Assert: Deselected (emitted null).
        expect(wrapper.emitted('update:modelValue')).toHaveLength(2);
        expect(wrapper.emitted('update:modelValue')?.[1]?.[0]).toBeNull();
      });

      it('Space on a row toggles selection', async () => {
        // Arrange: 2 rows, no selection.
        const { columns, data, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');

        const wrapper = createComponent(
          null,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(2);

        // Act: Press Space on first row.
        await rows[0]!.trigger('keydown', { key: ' ' });
        await nextTick();

        // Assert: Selected row emitted.
        expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual(data[0]);
      });

      it('ArrowDown after Tab moves from the row that has focus, not from tracked index', async () => {
        // Arrange: 3 rows, no selection.
        // This test verifies that when Tab changes focus, the next arrow press
        // moves from the row that actually has focus, not from a stale tracked index.
        const { columns, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');
        const data3: TestEntry[] = genData3();

        const wrapper = createComponent(
          null,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data3,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(3);

        const rowFocus = rows.map((r) => vi.spyOn(r.element as HTMLElement, 'focus'));

        // Establish a focusedRowIndex: ArrowDown on row 0 → moves to row 1.
        await rows[0]!.trigger('keydown', { key: 'ArrowDown' });
        await nextTick();
        expect(rowFocus[1]).toHaveBeenCalledTimes(1);

        // Now focusedRowIndex = 1. Simulate Tab: user tabs to row 2.
        // Press ArrowDown on row 2.
        await rows[2]!.trigger('keydown', { key: 'ArrowDown' });
        await nextTick();

        // entryIndex is 2 (the row with actual focus), not 1 (the stale tracked index).
        // target = 2 + 1 = 3 → wraps to 0 → focus row 0.
        expect(rowFocus[0]).toHaveBeenCalledTimes(1);
      });

      it('ArrowUp after Tab moves from the row that has focus, not from tracked index', async () => {
        // Arrange: 3 rows, no selection.
        const { columns, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');
        const data3: TestEntry[] = genData3();

        const wrapper = createComponent(
          null,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data3,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(3);

        const rowFocus = rows.map((r) => vi.spyOn(r.element as HTMLElement, 'focus'));

        // Establish a focusedRowIndex: ArrowDown on row 0 → moves to row 1.
        await rows[0]!.trigger('keydown', { key: 'ArrowDown' });
        await nextTick();
        expect(rowFocus[1]).toHaveBeenCalledTimes(1);

        // Now focusedRowIndex = 1. Simulate Tab: user tabs to row 2.
        // Press ArrowUp on row 2.
        await rows[2]!.trigger('keydown', { key: 'ArrowUp' });
        await nextTick();

        // entryIndex is 2 (the row with actual focus), not 1 (the stale tracked index).
        // target = 2 - 1 = 1 → focus row 1 → CORRECT (row above row 2).
        expect(rowFocus[1]).toHaveBeenCalledTimes(2);
      });

      it('ArrowDown on first row (tabbed from paginer) moves to second row', async () => {
        // Arrange: 3 rows, no selection.
        // This test covers the bug where tabbing from paginer to the first row
        // and pressing ArrowDown would stay on the first row instead of moving down.
        const { columns, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');
        const data3: TestEntry[] = genData3();

        const wrapper = createComponent(
          null,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data3,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(3);

        const rowFocus = rows.map((r) => vi.spyOn(r.element as HTMLElement, 'focus'));

        // Act: User is on first row (tabbed from paginer). Press ArrowDown.
        await rows[0]!.trigger('keydown', { key: 'ArrowDown' });
        await nextTick();

        // Assert: Focus moves to second row, not stuck on first.
        expect(rowFocus[1]).toHaveBeenCalledTimes(1);
      });

      it('ArrowUp on first row (tabbed from paginer) wraps to last row', async () => {
        // Arrange: 3 rows, no selection.
        const { columns, metadata, resolveRowMeta } = generateAll(false, 0, 'name', 'DESC');
        const data3: TestEntry[] = genData3();

        const wrapper = createComponent(
          null,
          null,
          0,
          'name',
          'DESC',
          tableId,
          columns,
          data3,
          metadata,
          resolveRowMeta,
          false,
          true,
          true,
          false,
          false,
          'test.table.page.empty',
        );

        const rows = wrapper.findAll('.table-row');
        expect(rows).toHaveLength(3);

        const rowFocus = rows.map((r) => vi.spyOn(r.element as HTMLElement, 'focus'));

        // Act: User is on first row (tabbed from paginer). Press ArrowUp.
        await rows[0]!.trigger('keydown', { key: 'ArrowUp' });
        await nextTick();

        // Assert: Focus wraps to last row.
        expect(rowFocus[2]).toHaveBeenCalledTimes(1);
      });
    });
  });
});
