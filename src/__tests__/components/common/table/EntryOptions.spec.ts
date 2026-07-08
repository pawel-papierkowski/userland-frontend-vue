/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
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

function createData(): EntryMeta {
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
  return {
    id: 42,
    name: 'Entry Name',
    value: 'Entry Value',
  };
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
  it('presents properly', async () => {
    // Ensure that entry options shows correctly.

    // Arrange: Data.
    const meta = createData();
    const entry = createEntry();
    const actions = createActions();

    // Act: Create component.
    const entryOptions = createComponent(meta, entry, 'test.table.entryOptions', actions, false);

    // Assert: Entries are shown correctly.
    const options = entryOptions.findAll('.entry-btn');
    expect(options).toHaveLength(2); // note 'info' button is not present as it is invisible
    expect(options[0]?.text()).toBe('A');
    expect(options[0]?.attributes('title')).toBe('Execute ADD.');
    expect(options[1]?.text()).toBe('D');
    expect(options[1]?.attributes('title')).toBe('Disabled DEL.');
  });

  //

  it('calls action when clicking enabled option', async () => {
    // Ensure that entry options can be clicked and action was correctly handled.

    // Arrange: Data.
    const meta = createData();
    const entry = createEntry();
    const actions = createActions();

    // Act: Create component.
    const entryOptions = createComponent(meta, entry, 'test.table.entryOptions', actions, false);
    const options = entryOptions.findAll('.entry-btn');

    // Act: Click 'add' button.
    await options[0]?.trigger('click'); // add is first visible button
    await nextTick();

    // Assert: 'add' action was called with correct parameter.
    expect(actions.add).toHaveBeenCalledTimes(1);
    expect(actions.add).toHaveBeenCalledWith(entry);

    // Act: Click 'del' button.
    await options[1]?.trigger('click'); // del is second visible button
    await nextTick();

    // Assert: 'del' action was NOT called, as this option is disabled.
    expect(actions.del).not.toHaveBeenCalled();
  });

  it('cannot do anything when busy', async () => {
    // Ensure that entry options can be clicked and action was correctly handled.

    // Arrange: Data.
    const meta = createData();
    const entry = createEntry();
    const actions = createActions();

    // Act: Create component.
    const entryOptions = createComponent(meta, entry, 'test.table.entryOptions', actions, true);
    const options = entryOptions.findAll('.entry-btn');

    // Act: Click 'add' button.
    await options[0]?.trigger('click'); // add is first visible button
    await nextTick();

    // Assert: 'add' action was NOT called, as component is in busy state.
    expect(actions.add).not.toHaveBeenCalled();
  });
});
