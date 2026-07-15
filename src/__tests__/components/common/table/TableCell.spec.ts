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
function createComponent(
  modelValue: TestEntry | null,
  formEntry: TestForm | null,
  tableId: string,
  column: ColumnData,
  rowIndex: number,
  entry: TestEntry | null,
  inlineEdit?: boolean,
  fieldMeta?: FieldMeta | null,
) {
  return mount(TableCell, {
    props: {
      modelValue,
      formEntry,
      tableId,
      column,
      rowIndex,
      entry,
      inlineEdit,
      fieldMeta,
    },
  });
}

/** Convenience function to create component with slots. */
function createComponentWithSlots(
  slots: Record<string, string>,
  modelValue: TestEntry | null,
  formEntry: TestForm | null,
  tableId: string,
  column: ColumnData,
  rowIndex: number,
  entry: TestEntry | null,
  inlineEdit?: boolean,
  fieldMeta?: FieldMeta | null,
) {
  return mount(TableCell, {
    props: {
      modelValue,
      formEntry,
      tableId,
      column,
      rowIndex,
      entry,
      inlineEdit,
      fieldMeta,
    },
    slots,
  });
}

//

function createEntry(): TestEntry {
  return { id: 42, name: 'Entry Name', value: 'Entry Value' };
}

function createForm(): TestForm {
  return { name: 'Form Name', value: 'Form Value' };
}

function createFieldMeta(): FieldMeta {
  return { css: 'err' };
}

/** Create test data for a non-editable 'name' column. */
function createDataName(): { testEntry: TestEntry; testForm: TestForm; column: ColumnData } {
  const testEntry: TestEntry = createEntry();
  const testForm: TestForm = createForm();
  const column: ColumnData = {
    name: 'name',
    defSort: 'ASC',
    translation: 'test.table.column.name',
    visible: true,
    editable: false,
    kind: EnColumnKind.Data,
  };
  return { testEntry, testForm, column };
}

/** Create test data for an editable 'value' column. */
function createDataValue(): { testEntry: TestEntry; testForm: TestForm; column: ColumnData } {
  const testEntry: TestEntry = createEntry();
  const testForm: TestForm = createForm();
  const column: ColumnData = {
    name: 'value',
    defSort: 'ASC',
    translation: 'test.table.column.value',
    visible: true,
    editable: true,
    kind: EnColumnKind.Data,
  };
  return { testEntry, testForm, column };
}

/** Create test data for a custom 'options' column. */
function createDataOptions(): { testEntry: TestEntry; testForm: TestForm; column: ColumnData } {
  const testEntry: TestEntry = createEntry();
  const testForm: TestForm = createForm();
  const column: ColumnData = {
    name: 'options',
    defSort: '',
    translation: 'test.table.column.options',
    visible: true,
    editable: false,
    kind: EnColumnKind.Custom,
  };
  return { testEntry, testForm, column };
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of TableCell component. */
describe('TableCell', () => {
  // //////////////////////////////////////////////////////////////////////////
  // Data column — display modes

  describe('data column', () => {
    it('shows entry text when not editable and not selected', () => {
      // Arrange: non-editable name column, row not selected, no inline edit.
      const { testEntry, testForm, column } = createDataName();

      // Act: Create component.
      const wrapper = createComponent(null, testForm, 'testTable', column, 0, testEntry, false, null);

      // Assert: Content from entry is shown.
      expect(wrapper.text()).toBe('Entry Name');

      // Assert: No input is rendered.
      expect(wrapper.find('input').exists()).toBe(false);

      // Assert: ARIA role and data-testid are set.
      const cell = wrapper.find('[role="cell"]');
      expect(cell.exists()).toBe(true);
      expect(cell.attributes('data-testid')).toBe('cell_testTable_0_name');
    });

    it('shows slot content when slot is provided', () => {
      // Arrange: Non-editable column with a custom slot.
      const { testEntry, testForm, column } = createDataName();

      // Act: Create component with slot.
      const wrapper = createComponentWithSlots(
        { column_name: 'Other Name' },
        null,
        testForm,
        'testTable',
        column,
        0,
        testEntry,
        false,
        null,
      );

      // Assert: Slot content overrides entry value.
      expect(wrapper.text()).toBe('Other Name');
    });

    it('shows empty string when entry is null', () => {
      // Arrange: Non-editable column with null entry.
      const { testEntry: _te, testForm, column } = createDataName();

      // Act: Create component with null entry.
      const wrapper = createComponent(null, testForm, 'testTable', column, 0, null, false, null);

      // Assert: Content is empty.
      expect(wrapper.text()).toBe('');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Edit mode

  describe('edit mode', () => {
    it('shows text when column is non-editable even if row is selected', () => {
      // Arrange: Non-editable column, row selected, inline edit enabled.
      const { testEntry, testForm, column } = createDataName();

      // Act: Create component.
      const wrapper = createComponent(testEntry, testForm, 'testTable', column, 0, testEntry, true, null);

      // Assert: Text is shown (no input because column is not editable).
      expect(wrapper.text()).toBe('Entry Name');
      expect(wrapper.find('input').exists()).toBe(false);
    });

    it('shows text when row is not selected even if column is editable', () => {
      // Arrange: Editable column, row not selected, inline edit enabled.
      const { testEntry, testForm, column } = createDataValue();

      // Act: Create component.
      const wrapper = createComponent(null, testForm, 'testTable', column, 0, testEntry, true, null);

      // Assert: Text is shown (no input because row is not selected).
      expect(wrapper.text()).toBe('Entry Value');
      expect(wrapper.find('input').exists()).toBe(false);
    });

    it('shows text when inline edit is disabled even if row is selected', () => {
      // Arrange: Editable column, row selected, inline edit disabled.
      const { testEntry, testForm, column } = createDataValue();

      // Act: Create component.
      const wrapper = createComponent(testEntry, testForm, 'testTable', column, 0, testEntry, false, null);

      // Assert: Text is shown (no input because inline edit is off).
      expect(wrapper.text()).toBe('Entry Value');
      expect(wrapper.find('input').exists()).toBe(false);
    });

    it('renders input when editable, selected, and inline edit is on', () => {
      // Arrange: Editable column, row selected, inline edit enabled.
      const { testEntry, testForm, column } = createDataValue();

      // Act: Create component.
      const wrapper = createComponent(testEntry, testForm, 'testTable', column, 0, testEntry, true, null);

      // Assert: Input is rendered with form value.
      const input = wrapper.find('input');
      expect(input.exists()).toBe(true);
      expect(input.classes()).toEqual([]);
      expect(input.element.value).toBe('Form Value');
    });

    it('applies field meta CSS class to input', () => {
      // Arrange: Editable column with field metadata.
      const { testEntry, testForm, column } = createDataValue();

      // Act: Create component with field meta.
      const wrapper = createComponent(testEntry, testForm, 'testTable', column, 0, testEntry, true, createFieldMeta());

      // Assert: Input has the CSS class from field meta.
      const input = wrapper.find('input');
      expect(input.exists()).toBe(true);
      expect(input.classes()).toEqual(['err']);
      expect(input.element.value).toBe('Form Value');
    });

    it('shows text instead of input when formEntry is null', () => {
      // Arrange: Editable column, row selected, inline edit on, but no form
      // entry provided — should fall back to displaying entry text.
      const { testEntry, testForm: _tf, column } = createDataValue();

      // Act: Create component with null formEntry.
      const wrapper = createComponent(testEntry, null, 'testTable', column, 0, testEntry, true, null);

      // Assert: No input rendered; entry text shown instead.
      expect(wrapper.find('input').exists()).toBe(false);
      expect(wrapper.text()).toBe('Entry Value');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Custom column

  describe('custom column', () => {
    it('renders slot content for custom column', () => {
      // Arrange: Custom column with a slot.
      const { testEntry, testForm, column } = createDataOptions();

      // Act: Create component with slot.
      const wrapper = createComponentWithSlots(
        { column_options: 'OPTIONS' },
        null,
        testForm,
        'testTable',
        column,
        0,
        testEntry,
        false,
        null,
      );

      // Assert: Slot content is rendered.
      expect(wrapper.text()).toBe('OPTIONS');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Visibility

  describe('visibility', () => {
    it('renders nothing when column is hidden', () => {
      // Arrange: Column with visible=false.
      const { testEntry, testForm, column: visibleColumn } = createDataName();
      const column: ColumnData = { ...visibleColumn, visible: false };

      // Act: Create component.
      const wrapper = createComponent(null, testForm, 'testTable', column, 0, testEntry, false, null);

      // Assert: No cell element is rendered.
      expect(wrapper.find('[role="cell"]').exists()).toBe(false);
    });
  });
});
