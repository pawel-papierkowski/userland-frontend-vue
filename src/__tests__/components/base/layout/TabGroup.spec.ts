import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import i18n from '@/code/lang/i18n.ts';

import TabGroup from '@/components/base/layout/TabGroup.vue';

//

/** Convenience function to create component. */
function createComponent(slots: Record<string, string>, id: string, langPrefix: string) {
  return mount(TabGroup, {
    global: {
      plugins: [i18n],
    },
    props: {
      id,
      langPrefix,
    },
    slots,
  });
}

//

/** Helper: create a 3-tab wrapper and return the tablist element. */
function createGeneralWrapper() {
  const tabGroup = createComponent({ a: 'CONTENT A', b: 'CONTENT B', c: 'CONTENT C' }, 'myTabs', 'test.tabGroup');
  const tablist = tabGroup.find('[role="tablist"]');
  return { tabGroup, tablist };
}

/** Helper: create a 3-tab wrapper and return the tablist element. */
function createKeyboardWrapper() {
  const tabGroup = createComponent({ a: 'A', b: 'B', c: 'C' }, 'myTabs', 'test.tabGroup');
  const tablist = tabGroup.find('[role="tablist"]');
  return { tabGroup, tablist };
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of TabGroup component. */
describe('TabGroup', () => {
  describe('general', () => {
    it('presents itself correctly', async () => {
      // By default, tab menu and content of first tab is visible.

      // Arrange&Act: Create component.
      const { tabGroup } = createGeneralWrapper();

      // Assert: TabGroup has correct state.
      const tabMenu = tabGroup.findAll('.tabgroup-header-name');
      expect(tabMenu).toHaveLength(3);
      expect(tabMenu[0]?.text()).toBe('Tab A');
      expect(tabMenu[0]?.classes()).toEqual(['tabgroup-header-name', 'active']);
      expect(tabMenu[1]?.text()).toBe('Tab B');
      expect(tabMenu[1]?.classes()).toEqual(['tabgroup-header-name']);
      expect(tabMenu[2]?.text()).toBe('Tab C');
      expect(tabMenu[2]?.classes()).toEqual(['tabgroup-header-name']);

      const visiblePanel = tabGroup.findAll('[role="tabpanel"]').find(p => p.isVisible());
      expect(visiblePanel?.text()).toBe('CONTENT A');
    });

    it('click changes tab', async () => {
      // Ensure that clicking on another tab changes content.

      // Arrange: Create component.
      const { tabGroup } = createGeneralWrapper();

      // Act: Click on tab.
      await tabGroup.find(`[data-testid="tabgroup_myTabs_c"]`).trigger('click');
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

      const visiblePanel = tabGroup.findAll('[role="tabpanel"]').find(p => p.isVisible());
      expect(visiblePanel?.text()).toBe('CONTENT C');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Accessibility tests

  describe('accessibility', () => {
    it('tablist has correct role', () => {
      // Verify that the tab header container exposes the correct ARIA role.

      // Arrange&Act: Create component.
      const tabGroup = createComponent({ a: 'A', b: 'B' }, 'myTabs', 'test.tabGroup');

      // Assert: Tablist role is set.
      expect(tabGroup.find('.tabgroup-header').attributes('role')).toBe('tablist');
    });

    it('each tab has correct ARIA attributes', () => {
      // Ensure each tab has role="tab", aria-selected, aria-controls and id
      // when an ident is provided.

      // Arrange&Act: Create component with an ident for id/aria bindings.
      const tabGroup = createComponent({ a: 'A', b: 'B' }, 'myTabs', 'test.tabGroup');
      const tabs = tabGroup.findAll('[role="tab"]');

      // Assert: Two tabs are rendered with correct ARIA attributes.
      expect(tabs).toHaveLength(2);

      // First tab (active by default).
      expect(tabs[0]?.attributes('role')).toBe('tab');
      expect(tabs[0]?.attributes('aria-selected')).toBe('true');
      expect(tabs[0]?.attributes('aria-controls')).toBe('tabgroup-myTabs-panel-a');
      expect(tabs[0]?.attributes('id')).toBe('tabgroup-myTabs-tab-a');

      // Second tab (inactive).
      expect(tabs[1]?.attributes('role')).toBe('tab');
      expect(tabs[1]?.attributes('aria-selected')).toBe('false');
      expect(tabs[1]?.attributes('aria-controls')).toBe('tabgroup-myTabs-panel-b');
      expect(tabs[1]?.attributes('id')).toBe('tabgroup-myTabs-tab-b');
    });

    it('active tab has tabindex 0, inactive tabs have -1', () => {
      // Only the currently selected tab should be keyboard-focusable.

      // Arrange&Act: Create component.
      const tabGroup = createComponent({ a: 'A', b: 'B', c: 'C' }, 'myTabs', 'test.tabGroup');
      const tabs = tabGroup.findAll('[role="tab"]');

      // Assert: Active tab is focusable, others are not.
      expect(tabs[0]?.attributes('tabindex')).toBe('0');
      expect(tabs[1]?.attributes('tabindex')).toBe('-1');
      expect(tabs[2]?.attributes('tabindex')).toBe('-1');
    });

    it('tabpanel has correct ARIA attributes', () => {
      // Ensure the content panel carries role="tabpanel" and aria-labelledby.

      // Arrange&Act: Create component with ident.
      const tabGroup = createComponent({ a: 'CONTENT A' }, 'myTabs', 'test.tabGroup');
      const panel = tabGroup.find('[role="tabpanel"]');

      // Assert: Tabpanel attributes are set correctly.
      expect(panel.attributes('role')).toBe('tabpanel');
      expect(panel.attributes('aria-labelledby')).toBe('tabgroup-myTabs-tab-a');
      expect(panel.attributes('id')).toBe('tabgroup-myTabs-panel-a');
      expect(panel.text()).toBe('CONTENT A');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Keyboard navigation tests

  describe('keyboard', () => {
    it('ArrowRight moves to next tab', async () => {
      // Pressing ArrowRight should select the next tab.

      // Arrange: Create tab group.
      const { tabGroup, tablist } = createKeyboardWrapper();
      expect(tabGroup.find('[aria-selected="true"]').text()).toBe('Tab A');

      // Act: Press ArrowRight.
      await tablist.trigger('keydown', { key: 'ArrowRight' });

      // Assert: Tab B is now selected.
      expect(tabGroup.find('[aria-selected="true"]').text()).toBe('Tab B');
    });

    it('ArrowLeft moves to previous tab', async () => {
      // Pressing ArrowLeft should select the previous tab.

      // Arrange: Move to the last tab first.
      const { tabGroup, tablist } = createKeyboardWrapper();
      await tablist.trigger('keydown', { key: 'ArrowRight' });
      await tablist.trigger('keydown', { key: 'ArrowRight' });
      expect(tabGroup.find('[aria-selected="true"]').text()).toBe('Tab C');

      // Act: Press ArrowLeft.
      await tablist.trigger('keydown', { key: 'ArrowLeft' });

      // Assert: Tab B is now selected.
      expect(tabGroup.find('[aria-selected="true"]').text()).toBe('Tab B');
    });

    it('Home moves to first tab', async () => {
      // Pressing Home should select the first tab regardless of current position.

      // Arrange: Navigate to the last tab.
      const { tabGroup, tablist } = createKeyboardWrapper();
      await tablist.trigger('keydown', { key: 'End' });
      expect(tabGroup.find('[aria-selected="true"]').text()).toBe('Tab C');

      // Act: Press Home.
      await tablist.trigger('keydown', { key: 'Home' });

      // Assert: First tab is selected.
      expect(tabGroup.find('[aria-selected="true"]').text()).toBe('Tab A');
    });

    it('End moves to last tab', async () => {
      // Pressing End should select the last tab regardless of current position.

      // Arrange.
      const { tabGroup, tablist } = createKeyboardWrapper();

      // Act: Press End.
      await tablist.trigger('keydown', { key: 'End' });

      // Assert: Last tab is selected.
      expect(tabGroup.find('[aria-selected="true"]').text()).toBe('Tab C');
    });

    it('ArrowLeft wraps around from first to last', async () => {
      // Pressing ArrowLeft on the first tab should wrap to the last tab.

      // Arrange.
      const { tabGroup, tablist } = createKeyboardWrapper();

      // Act: Press ArrowLeft on the first tab.
      await tablist.trigger('keydown', { key: 'ArrowLeft' });

      // Assert: Last tab is selected (wrap-around).
      expect(tabGroup.find('[aria-selected="true"]').text()).toBe('Tab C');
    });

    it('ArrowRight wraps around from last to first', async () => {
      // Pressing ArrowRight on the last tab should wrap to the first tab.

      // Arrange: Navigate to the last tab.
      const { tabGroup, tablist } = createKeyboardWrapper();
      await tablist.trigger('keydown', { key: 'End' });

      // Act: Press ArrowRight on the last tab.
      await tablist.trigger('keydown', { key: 'ArrowRight' });

      // Assert: First tab is selected (wrap-around).
      expect(tabGroup.find('[aria-selected="true"]').text()).toBe('Tab A');
    });
  });
});
