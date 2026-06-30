import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import TabGroup from '@/components/base/layout/TabGroup.vue';

//

/** Convenience function to create component. */
function createComponent(slots: Record<string, string>, langPrefix: string) {
  return mount(TabGroup, {
    global: {
      plugins: [i18n],
    },
    props: {
      langPrefix,
    },
    slots,
  });
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of TabGroup component. */
describe('TabGroup', () => {
  it('presents itself correctly', async () => {
    // By default, tab menu and content of first tab is visible.

    // Arrange&Act: Create component.
    const tabGroup = createComponent({ a: 'CONTENT A', b: 'CONTENT B', c: 'CONTENT C' }, 'test.tabGroup');

    // Assert: TabGroup has correct state.
    const tabMenu = tabGroup.findAll('.tabgroup-header-name');
    expect(tabMenu).toHaveLength(3);
    expect(tabMenu[0]?.text()).toBe('Tab A');
    expect(tabMenu[0]?.classes()).toEqual(['tabgroup-header-name', 'active']);
    expect(tabMenu[1]?.text()).toBe('Tab B');
    expect(tabMenu[1]?.classes()).toEqual(['tabgroup-header-name']);
    expect(tabMenu[2]?.text()).toBe('Tab C');
    expect(tabMenu[2]?.classes()).toEqual(['tabgroup-header-name']);

    const currTab = tabGroup.find('.tabgroup-slot-content');
    expect(currTab.text()).toBe('CONTENT A');
  });

  it('click changes tab', async () => {
    // Ensure that clicking on another tab changes content.

    // Arrange: Create component.
    const tabGroup = createComponent({ a: 'CONTENT A', b: 'CONTENT B', c: 'CONTENT C' }, 'test.tabGroup');

    // Act: Click on tab.
    await tabGroup.find(`[data-testid="tabgroup__c"]`).trigger('click');
    await nextTick();

    // Assert: TabGroup has correct state.
    const tabMenu = tabGroup.findAll('.tabgroup-header-name');
    expect(tabMenu).toHaveLength(3);
    expect(tabMenu[0]?.text()).toBe('Tab A');
    expect(tabMenu[0]?.classes()).toEqual(['tabgroup-header-name']);
    expect(tabMenu[1]?.text()).toBe('Tab B');
    expect(tabMenu[1]?.classes()).toEqual(['tabgroup-header-name']);
    expect(tabMenu[2]?.text()).toBe('Tab C');
    expect(tabMenu[2]?.classes()).toEqual(['tabgroup-header-name', 'active']);

    const currTab = tabGroup.find('.tabgroup-slot-content');
    expect(currTab.text()).toBe('CONTENT C');
  });
});
