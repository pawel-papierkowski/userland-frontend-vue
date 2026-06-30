import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import type { ColumnData, FieldMeta } from '@/code/data/features/common/type.ts';

import TableCell from '@/components/common/table/TableCell.vue';
import { EnColumnKind } from '@/code/data/features/common/const';

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

/** Create test data for cell. */
function createData(): {testEntry: TestEntry, testForm: TestForm, column: ColumnData} {
    const testEntry: TestEntry = {
      id: 42,
      name: 'Test Name',
      value: 'Test Value'
    };
    const testForm: TestForm = {
      name: 'Other Name',
      value: 'Other value'
    };
    const column: ColumnData = {
      name: 'value',
      defSort: 'ASC',
      translation: 'test.table.column.value',
      visible: true,
      editable: false,
      kind: EnColumnKind.Data
    }

    return {
      testEntry, testForm, column
    }
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of TableCell component. */
describe('TableCell', () => {
  it('presents itself correctly', async () => {
    // Set up cell and check content.

    // Arrange: Prepare data for cell.
    const { testEntry, testForm, column } = createData();

    // Act: Create component.
    const tableCell = createComponent(null, testForm, 'testTable', column, 0, testEntry, false, null);

    // Assert: State of cell is correct.
    // TODO
  });
});

