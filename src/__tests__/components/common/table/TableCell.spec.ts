/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import type { ColumnData, FieldMeta } from '@/code/data/features/common/type.ts';
import { EnColumnKind } from '@/code/data/features/common/const.ts';

import TableCell from '@/components/common/table/TableCell.vue';

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
function createComponent(modelValue: TestEntry|null, formEntry: TestForm|null, tableId: string, column: ColumnData, rowIndex: number, entry: TestEntry|null, inlineEdit?: boolean, fieldMeta?: FieldMeta|null) {
  return mount(TableCell, {
      props: {
        modelValue, formEntry,
        tableId, column, rowIndex, entry, inlineEdit, fieldMeta
      }
    });
}

/** Convenience function to create component. Version with slots. */
function createComponentWithSlots(slots: Record<string, string>, modelValue: TestEntry|null, formEntry: TestForm|null, tableId: string, column: ColumnData, rowIndex: number, entry: TestEntry|null, inlineEdit?: boolean, fieldMeta?: FieldMeta|null) {
  return mount(TableCell, {
      props: {
        modelValue, formEntry,
        tableId, column, rowIndex, entry, inlineEdit, fieldMeta
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

function createFieldMeta(): FieldMeta {
  return {
      css: 'err'
    };
}

/** Create test data for cell in 'name' column. */
function createDataName(): {testEntry: TestEntry, testForm: TestForm, column: ColumnData} {
    const testEntry: TestEntry = createEntry();
    const testForm: TestForm = createForm();
    const column: ColumnData = {
      name: 'name',
      defSort: 'ASC',
      translation: 'test.table.column.name',
      visible: true,
      editable: false,
      kind: EnColumnKind.Data
    };
    return { testEntry, testForm, column };
}

/** Create test data for cell in 'value' column. */
function createDataValue(): {testEntry: TestEntry, testForm: TestForm, column: ColumnData} {
    const testEntry: TestEntry = createEntry();
    const testForm: TestForm = createForm();
    const column: ColumnData = {
      name: 'value',
      defSort: 'ASC',
      translation: 'test.table.column.value',
      visible: true,
      editable: true,
      kind: EnColumnKind.Data
    };
    return { testEntry, testForm, column };
}

/** Create test data for cell in 'options' column. */
function createDataOptions(): {testEntry: TestEntry, testForm: TestForm, column: ColumnData} {
    const testEntry: TestEntry = createEntry();
    const testForm: TestForm = createForm();
    const column: ColumnData = {
      name: 'options',
      defSort: '',
      translation: 'test.table.column.options',
      visible: true,
      editable: false,
      kind: EnColumnKind.Custom
    };
    return { testEntry, testForm, column };
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of TableCell component. */
describe('TableCell', () => {
  it('correct for non-editable column, not selected row, inline edit false without slot', async () => {
    // Set up cell and check content for standard column.

    // Arrange: Prepare data for cell.
    const { testEntry, testForm, column } = createDataName();

    // Act: Create component.
    const tableCell = createComponent(null, testForm, 'testTable', column, 0, testEntry, false, null);

    // Assert: State of cell is correct.
    expect(tableCell.text()).toBe('Entry Name'); // content from testEntry

    // Assert: <input> should not be present.
    const inputInCell = tableCell.find('input');
    expect(inputInCell.exists()).toBe(false);
  });

  it('correct for non-editable column, not selected row, inline edit false with slot', async () => {
    // Set up cell and check content for standard column using custom slot.

    // Arrange: Prepare data for cell.
    const { testEntry, testForm, column } = createDataName();

    // Act: Create component.
    const tableCell = createComponentWithSlots({ column_name: 'Other Name' }, null, testForm, 'testTable', column, 0, testEntry, false, null);

    // Assert: State of cell is correct.
    expect(tableCell.text()).toBe('Other Name'); // content from slot assigned for this column
  });

  //

  it('correct for non-editable column, selected row, inline edit true', async () => {
    // Set up cell and check content for noneditable column while this row was selected.

    // Arrange: Prepare data for cell.
    const { testEntry, testForm, column } = createDataName();

    // Act: Create component.
    const tableCell = createComponent(testEntry, testForm, 'testTable', column, 0, testEntry, true, null);

    // Assert: State of cell is correct.
    expect(tableCell.text()).toBe('Entry Name'); // content from testEntry

    // Assert: <input> should not be present. While row was selected and inline edit is true, this column is not editable.
    const inputInCell = tableCell.find('input');
    expect(inputInCell.exists()).toBe(false);
  });

  //

  it('correct for editable column, not selected row, inline edit true', async () => {
    // Set up cell and check content for editable column, but this row was not selected.

    // Arrange: Prepare data for cell.
    const { testEntry, testForm, column } = createDataValue();

    // Act: Create component.
    const tableCell = createComponent(null, testForm, 'testTable', column, 0, testEntry, true, null);

    // Assert: State of cell is correct.
    expect(tableCell.text()).toBe('Entry Value'); // content from testEntry

    // Assert: <input> should not be present. While cell is editable and inline edit is true, it's row was not selected.
    const inputInCell = tableCell.find('input');
    expect(inputInCell.exists()).toBe(false);
  });

  it('correct for editable column, selected row, inline edit false', async () => {
    // Set up cell and check content for editable column and this row was selected, but inline edit is false.

    // Arrange: Prepare data for cell.
    const { testEntry, testForm, column } = createDataValue();

    // Act: Create component.
    const tableCell = createComponent(testEntry, testForm, 'testTable', column, 0, testEntry, false, null);

    // Assert: State of cell is correct.
    expect(tableCell.text()).toBe('Entry Value'); // content from testEntry

    // Assert: <input> should not be present. While cell is editable and it's row was selected, inline edit is false.
    const inputInCell = tableCell.find('input');
    expect(inputInCell.exists()).toBe(false);
  });

  it('correct for editable column, selected row, inline edit true, without field meta', async () => {
    // Set up cell and check content for editable column with default content (input).

    // Arrange: Prepare data for cell.
    const { testEntry, testForm, column } = createDataValue();

    // Act: Create component.
    const tableCell = createComponent(testEntry, testForm, 'testTable', column, 0, testEntry, true, null);

    // Assert: State of cell is correct.
    const inputInCell = tableCell.find('input');
    expect(inputInCell.exists()).toBe(true);
    expect(inputInCell.classes()).toEqual([]); // no field metadata
    expect(inputInCell.element.value).toBe('Form Value'); // content from testForm
  });

  it('correct for editable column, selected row, inline edit true, with field meta', async () => {
    // Set up cell and check content for editable column with default content (input) and field meta.

    // Arrange: Prepare data for cell.
    const { testEntry, testForm, column } = createDataValue();

    // Act: Create component.
    const tableCell = createComponent(testEntry, testForm, 'testTable', column, 0, testEntry, true, createFieldMeta());

    // Assert: State of cell is correct.
    const inputInCell = tableCell.find('input');
    expect(inputInCell.exists()).toBe(true);
    expect(inputInCell.classes()).toEqual(['err']); // from field metadata
    expect(inputInCell.element.value).toBe('Form Value'); // content from testForm
  });

  //

  it('correct for custom column', async () => {
    // Set up cell and check content for custom column.

    // Arrange: Prepare data for cell.
    const { testEntry, testForm, column } = createDataOptions();

    // Act: Create component.
    const tableCell = createComponentWithSlots({ column_options: 'OPTIONS' }, null, testForm, 'testTable', column, 0, testEntry, false, null);

    // Assert: State of cell is correct.
    expect(tableCell.text()).toBe('OPTIONS');
  });
});

