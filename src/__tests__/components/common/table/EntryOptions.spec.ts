/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import type { EntryMeta } from '@/code/data/features/common/type.ts';

import EntryOptions from '@/components/common/table/EntryOptions.vue';

//

interface TestEntry {
  id: number;
  name: string;
  [key: string]: any;
}

/** Convenience function to create component. */
function createComponent(
  meta: EntryMeta | null,
  entry: TestEntry | null,
  langPrefix: string,
  actions: Record<string, (entry: Record<string, any> | null) => void | Promise<void>>,
  isBusy: boolean,
) {
  return mount(EntryOptions, {
    global: {
      plugins: [i18n],
    },
    props: {
      meta,
      entry,
      langPrefix,
      actions,
      isBusy,
    },
  });
}

//

function createMeta(): EntryMeta {
  return {
    options: {
      info: {
        access: 'INVISIBLE',
        reason: null,
      },
      add: {
        access: 'ENABLED',
        reason: null,
      },
      del: {
        access: 'DISABLED',
        reason: 'disabled',
      },
    },
    data: null,
  };
}

function createEntry(): TestEntry {
  return { id: 42, name: 'Entry Name', value: 'Entry Value' };
}

function createActions(): Record<string, (entry: Record<string, any> | null) => void | Promise<void>> {
  return {
    add: vi.fn<(entry: Record<string, any> | null) => void | Promise<void>>(),
    del: vi.fn<(entry: Record<string, any> | null) => void | Promise<void>>(),
  };
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of EntryOptions component. */
describe('EntryOptions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // //////////////////////////////////////////////////////////////////////////
  // Rendering

  describe('rendering', () => {
    it('shows visible options with correct label and tooltip', () => {
      // Arrange: Standard meta with one INVISIBLE, one ENABLED, one DISABLED.
      const meta = createMeta();
      const entry = createEntry();
      const actions = createActions();

      // Act: Create component.
      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, false);

      // Assert: Only visible options are rendered.
      const options = wrapper.findAll('.entry-btn');
      expect(options).toHaveLength(2);

      // Assert: First visible option is 'add' (ENABLED).
      expect(options[0]?.text()).toBe('A');
      expect(options[0]?.attributes('title')).toBe('Execute ADD.');

      // Assert: Second visible option is 'del' (DISABLED).
      expect(options[1]?.text()).toBe('D');
      expect(options[1]?.attributes('title')).toBe('Disabled DEL.');
    });

    it('renders nothing when meta is null', () => {
      // Arrange: Null metadata.
      const entry = createEntry();
      const actions = createActions();

      // Act: Create component with null meta.
      const wrapper = createComponent(null, entry, 'test.table.entryOptions', actions, false);

      // Assert: No buttons rendered.
      expect(wrapper.findAll('.entry-btn')).toHaveLength(0);
    });

    it('renders nothing when meta.options is null', () => {
      // Arrange: Meta with null options.
      const meta: EntryMeta = { options: null, data: null };
      const entry = createEntry();
      const actions = createActions();

      // Act: Create component.
      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, false);

      // Assert: No buttons rendered.
      expect(wrapper.findAll('.entry-btn')).toHaveLength(0);
    });

    it('renders nothing when meta.options is empty', () => {
      // Arrange: Meta with empty options.
      const meta: EntryMeta = { options: {}, data: null };
      const entry = createEntry();
      const actions = createActions();

      // Act: Create component.
      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, false);

      // Assert: No buttons rendered.
      expect(wrapper.findAll('.entry-btn')).toHaveLength(0);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Interaction

  describe('interaction', () => {
    it('calls the matching action with the entry when clicking an enabled option', async () => {
      // Arrange: Standard data.
      const meta = createMeta();
      const entry = createEntry();
      const actions = createActions();

      // Act: Create component.
      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, false);
      const options = wrapper.findAll('.entry-btn');

      // Act: Click the 'add' (ENABLED) button.
      await options[0]?.trigger('click');
      await nextTick();

      // Assert: 'add' action was called with the entry.
      expect(actions.add).toHaveBeenCalledTimes(1);
      expect(actions.add).toHaveBeenCalledWith(entry);

      // Act: Click the 'del' (DISABLED) button.
      await options[1]?.trigger('click');
      await nextTick();

      // Assert: 'del' action was NOT called (option is disabled).
      expect(actions.del).not.toHaveBeenCalled();
    });

    it('does not call any action when isBusy is true', async () => {
      // Arrange: Busy state.
      const meta = createMeta();
      const entry = createEntry();
      const actions = createActions();

      // Act: Create component with isBusy=true.
      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, true);
      const options = wrapper.findAll('.entry-btn');

      // Act: Click the 'add' button.
      await options[0]?.trigger('click');
      await nextTick();

      // Assert: No action was called.
      expect(actions.add).not.toHaveBeenCalled();
    });

    it('calls action with null entry when entry is null', async () => {
      // Arrange: Null entry.
      const meta = createMeta();
      const actions = createActions();

      // Act: Create component with null entry.
      const wrapper = createComponent(meta, null, 'test.table.entryOptions', actions, false);
      const options = wrapper.findAll('.entry-btn');

      // Act: Click the 'add' button.
      await options[0]?.trigger('click');
      await nextTick();

      // Assert: Action was called with null.
      expect(actions.add).toHaveBeenCalledWith(null);
    });

    it('warns via console when action key is missing from actions map', async () => {
      // Arrange: Meta with an option that has no matching action.
      const meta = createMeta();
      const entry = createEntry();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act: Create component without 'add' action (only 'del').
      const actions = { del: vi.fn<() => void>() };
      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, false);
      const options = wrapper.findAll('.entry-btn');

      // Act: Click the first button ('add') which has no matching action.
      await options[0]?.trigger('click');
      await nextTick();

      // Assert: Console.warn was called with a message about missing action.
      expect(warnSpy).toHaveBeenCalledWith("Action 'add' not implemented in parent.");
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Disabled state

  describe('disabled state', () => {
    it('adds disabled CSS class to DISABLED and busy options', () => {
      // Arrange: Standard meta.
      const meta = createMeta();
      const entry = createEntry();
      const actions = createActions();

      // Act: Create component, not busy.
      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, false);
      const options = wrapper.findAll('.entry-btn');

      // Assert: ENABLED option does not have 'disabled' class.
      expect(options[0]?.classes()).not.toContain('disabled');

      // Assert: DISABLED option has 'disabled' class.
      expect(options[1]?.classes()).toContain('disabled');
    });

    it('adds disabled class to all options when busy', () => {
      // Arrange: Busy state.
      const meta = createMeta();
      const entry = createEntry();
      const actions = createActions();

      // Act: Create component with isBusy=true.
      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, true);
      const options = wrapper.findAll('.entry-btn');

      // Assert: All visible options have 'disabled' class.
      options.forEach((opt) => {
        expect(opt.classes()).toContain('disabled');
      });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Keyboard navigation

  describe('keyboard navigation', () => {
    it('enabled option has tabindex 0, disabled option has tabindex -1', () => {
      // Arrange: Standard meta with ENABLED and DISABLED options.
      const meta = createMeta();
      const entry = createEntry();
      const actions = createActions();

      // Act: Create component.
      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, false);
      const options = wrapper.findAll('.entry-btn');

      // Assert: ENABLED option is focusable via Tab.
      expect(options[0]?.attributes('tabindex')).toBe('0');

      // Assert: DISABLED option is not focusable via Tab.
      expect(options[1]?.attributes('tabindex')).toBe('-1');
    });

    it('Enter on enabled option calls the matching action', async () => {
      // Arrange: Standard data.
      const meta = createMeta();
      const entry = createEntry();
      const actions = createActions();

      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, false);
      const options = wrapper.findAll('.entry-btn');

      // Act: Press Enter on the 'add' (ENABLED) button.
      await options[0]?.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: 'add' action was called with the entry.
      expect(actions.add).toHaveBeenCalledTimes(1);
      expect(actions.add).toHaveBeenCalledWith(entry);
    });

    it('Space on enabled option calls the matching action', async () => {
      // Arrange: Standard data.
      const meta = createMeta();
      const entry = createEntry();
      const actions = createActions();

      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, false);
      const options = wrapper.findAll('.entry-btn');

      // Act: Press Space on the 'add' (ENABLED) button.
      await options[0]?.trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: 'add' action was called with the entry.
      expect(actions.add).toHaveBeenCalledTimes(1);
      expect(actions.add).toHaveBeenCalledWith(entry);
    });

    it('Enter on disabled option does not call action', async () => {
      // Arrange: Standard data.
      const meta = createMeta();
      const entry = createEntry();
      const actions = createActions();

      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, false);
      const options = wrapper.findAll('.entry-btn');

      // Act: Press Enter on the 'del' (DISABLED) button.
      await options[1]?.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: No action was called.
      expect(actions.del).not.toHaveBeenCalled();
    });

    it('Space on disabled option does not call action', async () => {
      // Arrange: Standard data.
      const meta = createMeta();
      const entry = createEntry();
      const actions = createActions();

      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, false);
      const options = wrapper.findAll('.entry-btn');

      // Act: Press Space on the 'del' (DISABLED) button.
      await options[1]?.trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: No action was called.
      expect(actions.del).not.toHaveBeenCalled();
    });

    it('Enter on option when busy does not call action', async () => {
      // Arrange: Busy state.
      const meta = createMeta();
      const entry = createEntry();
      const actions = createActions();

      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, true);
      const options = wrapper.findAll('.entry-btn');

      // Act: Press Enter on the 'add' button.
      await options[0]?.trigger('keydown', { key: 'Enter' });
      await nextTick();

      // Assert: No action was called.
      expect(actions.add).not.toHaveBeenCalled();
    });

    it('Space on option when busy does not call action', async () => {
      // Arrange: Busy state.
      const meta = createMeta();
      const entry = createEntry();
      const actions = createActions();

      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, true);
      const options = wrapper.findAll('.entry-btn');

      // Act: Press Space on the 'add' button.
      await options[0]?.trigger('keydown', { key: ' ' });
      await nextTick();

      // Assert: No action was called.
      expect(actions.add).not.toHaveBeenCalled();
    });

    it('all options have tabindex -1 when busy', () => {
      // Arrange: Busy state.
      const meta = createMeta();
      const entry = createEntry();
      const actions = createActions();

      // Act: Create component with isBusy=true.
      const wrapper = createComponent(meta, entry, 'test.table.entryOptions', actions, true);
      const options = wrapper.findAll('.entry-btn');

      // Assert: All visible options have tabindex -1.
      options.forEach((opt) => {
        expect(opt.attributes('tabindex')).toBe('-1');
      });
    });
  });
});
