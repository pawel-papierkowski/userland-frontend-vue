import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import type { ColumnData, RowMeta } from '@/code/data/features/common/type.ts';
import { EnColumnKind } from '@/code/data/features/common/const.ts';

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

/** Convenience function to create component. Version with slots. */
function createComponentWithSlots(slots: Record<string, string>, modelValue: TestEntry|null, formEntry: TestForm|null, tableId: string, columns: ColumnData[], rowIndex: number, entry: TestEntry|null, inlineEdit?: boolean, rowMeta?: RowMeta|null) {
  return mount(TableRow, {
      props: {
        modelValue, formEntry,
        tableId, columns, rowIndex, entry, inlineEdit, rowMeta
      },
      slots
    });
}

//

function createEntry(): TestEntry {
  return {
      id: 42,
      name: 'Entry Name',
      value: 'Entry Value'
    };
}

function createForm(): TestForm {
  return {
      name: 'Form Name',
      value: 'Form Value'
    };
}

/** Create test data for entire row. */
function createData(): {testEntry: TestEntry, testForm: TestForm, columns: ColumnData[]} {
    const testEntry: TestEntry = createEntry();
    const testForm: TestForm = createForm();
    const columns: ColumnData[] = [
      {
        name: 'id',
        defSort: '',
        translation: 'test.table.column.id',
        visible: false,
        editable: false,
        kind: EnColumnKind.Data
      },
      {
        name: 'name',
        defSort: 'ASC',
        translation: 'test.table.column.name',
        visible: true,
        editable: false,
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
    return { testEntry, testForm, columns };
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of TableRow component. */
describe('TableRow', () => {
  it('correct for typical columns, not selected row, inline edit false', async () => {
    // Simple case: show cells in row.

    // Arrange: Prepare data for row.
    const { testEntry, testForm, columns } = createData();

    // Act: Create component.
    const tableRow = createComponentWithSlots({ column_options: 'OPTIONS' }, null, testForm, 'testTable', columns, 0, testEntry, false, null);

    // Assert: Cells in row are present and correct.
    const cells = tableRow.findAll('.table-cell');
    expect(cells).toHaveLength(3); // column 'id' is hidden, so only 3 columns visible
    expect(cells[0]?.text()).toBe('Entry Name');
    expect(cells[1]?.text()).toBe('Entry Value');
    expect(cells[2]?.text()).toBe('OPTIONS');
  });

  it('correct for typical columns, selected row, inline edit true', async () => {
    // Simple case: show editable cells in row.

    // Arrange: Prepare data for row.
    const { testEntry, testForm, columns } = createData();

    // Act: Create component.
    const tableRow = createComponentWithSlots({ column_options: 'OPTIONS' }, testEntry, testForm, 'testTable', columns, 0, testEntry, true, null);

    // Assert: Cells in row are present and correct.
    const cells = tableRow.findAll('.table-cell');
    expect(cells).toHaveLength(3); // column 'id' is hidden, so only 3 columns visible
    expect(cells[0]?.text()).toBe('Entry Name'); // column 'name' is not editable

    expect(cells[1]?.text()).toBe(''); // column 'value' is editable, so it has input element by default
    const inputInCell = cells[1]?.find('input');
    expect(inputInCell?.exists()).toBe(true);
    expect(inputInCell?.classes()).toEqual([]); // no field metadata
    expect(inputInCell?.element.value).toBe('Form Value'); // content from testForm

    expect(cells[2]?.text()).toBe('OPTIONS'); // column 'options' is fully custom
  });
});
