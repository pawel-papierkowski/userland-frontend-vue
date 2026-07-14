import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

//

/** Convenience function to create component. */
function createComponent(canSpin: boolean, descr: string|undefined, display: string, size: string) {
  return mount(SpinnerTorus, {
    props: {
      canSpin,
      descr,
      display,
      size,
    },
  });
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of SpinnerTorus component. */
describe('SpinnerTorus', () => {
  describe('general', () => {
    it('presents itself correctly when spinning', async () => {
      // SpinnerTorus should have correct styling.

      // Arrange&Act: Create component.
      const spinnerTorus = createComponent(true, undefined, 'inline-block', '1em');

      const outer = spinnerTorus.find('.spinner-wrapper');
      expect(outer.attributes('style')).toContain('display: inline-block');
      expect(outer.attributes('style')).toContain('width: 1em');
      expect(outer.attributes('style')).toContain('height: 1em');

      const inner = spinnerTorus.find('.spinner');
      expect(inner.classes()).toEqual(['spinner', 'spins']);
    });

    it('presents itself correctly when not spinning', async () => {
      // SpinnerTorus should have correct styling when stopped.

      // Arrange&Act: Create component.
      const spinnerTorus = createComponent(false, undefined, 'block', '100px');

      const outer = spinnerTorus.find('.spinner-wrapper');
      expect(outer.attributes('style')).toContain('display: block');
      expect(outer.attributes('style')).toContain('width: 100px');
      expect(outer.attributes('style')).toContain('height: 100px');

      const inner = spinnerTorus.find('.spinner');
      expect(inner.classes()).toEqual(['spinner', 'spins', 'paused']);
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Accessibility tests

  describe('accessibility', () => {
    it('uses description if present', async () => {
      // SpinnerTorus should have correct aria attributes.

      // Arrange&Act: Create component.
      const spinnerTorus = createComponent(true, 'Loading...', 'inline-block', '1em');

      // Assert: Spinner has role status.
      expect(spinnerTorus.attributes('role')).toBe('status');
      // Assert: Spinner has aria-label.
      expect(spinnerTorus.attributes('aria-label')).toBe('Loading...');
    });

    it('invisible to aria if description is absent', async () => {
      // SpinnerTorus should have no aria attributes.

      // Arrange&Act: Create component.
      const spinnerTorus = createComponent(true, undefined, 'inline-block', '1em');

      // Assert: Spinner does not have role status.
      expect(spinnerTorus.attributes('role')).toBeUndefined();
      // Assert: Spinner does not have aria-label.
      expect(spinnerTorus.attributes('aria-label')).toBeUndefined();
    });
  });
});
