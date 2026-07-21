/* eslint-disable @typescript-eslint/no-explicit-any */
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

/** Convenience function to create component with optional slots. */
function createComponent(
  modelValue: TestEntry | null,
  formEntry: TestForm | null,
  tableId: string,
  columns: ColumnData[],
  rowIndex: number,
  entry: TestEntry | null,
  inlineEdit?: boolean,
  rowMeta?: RowMeta | null,
  slots?: Record<string, string>,
) {
  return mount(TableRow, {
    props: {
      modelValue,
      formEntry,
      tableId,
      columns,
      rowIndex,
      entry,
      inlineEdit,
      rowMeta,
    },
    slots: slots ?? {},
  });
}

//

function createEntry(): TestEntry {
  return { id: 42, name: 'Entry Name', value: 'Entry Value' };
}

function createForm(): TestForm {
  return { name: 'Form Name', value: 'Form Value' };
}

/** Create a standard set of four columns (one hidden, one custom). */
function createData(): { testEntry: TestEntry; testForm: TestForm; columns: ColumnData[] } {
  const testEntry: TestEntry = createEntry();
  const testForm: TestForm = createForm();
  const columns: ColumnData[] = [
    {
      name: 'id',
      defSort: '',
      translation: 'test.table.column.id',
      visible: false,
      editable: false,
      kind: EnColumnKind.Data,
    },
    {
      name: 'name',
      defSort: 'ASC',
      translation: 'test.table.column.name',
      visible: true,
      editable: false,
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
  return { testEntry, testForm, columns };
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of TableRow component. */
describe('TableRow', () => {
  // //////////////////////////////////////////////////////////////////////////
  // Rendering

  describe('rendering', () => {
    it('renders visible cells with correct content when row is not selected', () => {
      // Arrange: Typical columns, row not selected.
      const { testEntry, testForm, columns } = createData();

      // Act: Create component.
      const wrapper = createComponent(null, testForm, 'testTable', columns, 0, testEntry, false, null, {
        column_options: 'OPTIONS',
      });

      // Assert: Root has correct data-testid.
      const root = wrapper.find('[data-testid="row_testTable_0"]');
      expect(root.exists()).toBe(true);

      // Assert: Only visible columns are rendered (id is hidden).
      const cells = root.findAll('.table-cell');
      expect(cells).toHaveLength(3);

      // Assert: Each cell shows the correct content.
      expect(cells[0]?.text()).toBe('Entry Name');
      expect(cells[1]?.text()).toBe('Entry Value');
      expect(cells[2]?.text()).toBe('OPTIONS');
    });

    it('shows empty cells when entry is null', () => {
      // Arrange: Typical columns, null entry.
      const { testEntry: _te, testForm, columns } = createData();

      // Act: Create component with null entry.
      const wrapper = createComponent(null, testForm, 'testTable', columns, 0, null, false, null, {
        column_options: 'OPTIONS',
      });

      // Assert: Each data cell shows empty text (custom cell still shows slot).
      const cells = wrapper.findAll('.table-cell');
      expect(cells).toHaveLength(3);
      expect(cells[0]?.text()).toBe('');
      expect(cells[1]?.text()).toBe('');
      expect(cells[2]?.text()).toBe('OPTIONS');
    });

    it('renders no cells when columns array is empty', () => {
      // Arrange: Empty columns array.
      const { testEntry, testForm } = createData();

      // Act: Create component with no columns.
      const wrapper = createComponent(null, testForm, 'testTable', [], 0, testEntry, false, null);

      // Assert: No cells are rendered.
      expect(wrapper.findAll('.table-cell')).toHaveLength(0);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Edit mode

  describe('edit mode', () => {
    it('renders input for editable column when row is selected and inlineEdit is on', () => {
      // Arrange: Row selected, inline edit enabled.
      const { testEntry, testForm, columns } = createData();

      // Act: Create component.
      const wrapper = createComponent(testEntry, testForm, 'testTable', columns, 0, testEntry, true, null, {
        column_options: 'OPTIONS',
      });

      // Assert: Three visible cells.
      const cells = wrapper.findAll('.table-cell');
      expect(cells).toHaveLength(3);

      // Assert: Non-editable 'name' column shows text.
      expect(cells[0]?.text()).toBe('Entry Name');

      // Assert: Editable 'value' column shows an input with form data.
      const inputInCell = cells[1]?.find('input');
      expect(inputInCell?.exists()).toBe(true);
      expect(inputInCell?.classes()).toEqual([]);
      expect(inputInCell?.element.value).toBe('Form Value');

      // Assert: Custom 'options' column shows slot content (text is empty
      // because input swallowed it).
      expect(cells[2]?.text()).toBe('OPTIONS');
    });

    it('shows text instead of input when formEntry is null', () => {
      // Arrange: Row selected, inline edit on, but no form entry provided.
      const { testEntry, testForm: _tf, columns } = createData();

      // Act: Create component with null formEntry.
      const wrapper = createComponent(testEntry, null, 'testTable', columns, 0, testEntry, true, null, {
        column_options: 'OPTIONS',
      });

      // Assert: Editable column shows entry text instead of input.
      const cells = wrapper.findAll('.table-cell');
      expect(cells).toHaveLength(3);
      expect(cells[0]?.text()).toBe('Entry Name');

      // Editable column with null formEntry — should fall back to text.
      expect(cells[1]?.text()).toBe('Entry Value');
      expect(cells[1]?.find('input').exists()).toBe(false);

      expect(cells[2]?.text()).toBe('OPTIONS');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Row metadata

  describe('row meta', () => {
    it('applies field meta CSS to the editable cell input', () => {
      // Arrange: Row metadata with a CSS class for the 'value' column.
      const { testEntry, testForm, columns } = createData();
      const rowMeta: RowMeta = { value: { css: 'err' } };

      // Act: Row selected, inline edit on, with rowMeta.
      const wrapper = createComponent(testEntry, testForm, 'testTable', columns, 0, testEntry, true, rowMeta, {
        column_options: 'OPTIONS',
      });

      // Assert: Editable cell's input has the CSS class from meta.
      const cells = wrapper.findAll('.table-cell');
      const inputInCell = cells[1]?.find('input');
      expect(inputInCell?.exists()).toBe(true);
      expect(inputInCell?.classes()).toEqual(['err']);
    });

    it('ignores rowMeta when it is null', () => {
      // Arrange: RowMeta is null (default).
      const { testEntry, testForm, columns } = createData();

      // Act: Row selected, inline edit on, null rowMeta.
      const wrapper = createComponent(testEntry, testForm, 'testTable', columns, 0, testEntry, true, null, {
        column_options: 'OPTIONS',
      });

      // Assert: Editable cell's input has no extra CSS classes.
      const cells = wrapper.findAll('.table-cell');
      const inputInCell = cells[1]?.find('input');
      expect(inputInCell?.exists()).toBe(true);
      expect(inputInCell?.classes()).toEqual([]);
    });
  });
});
