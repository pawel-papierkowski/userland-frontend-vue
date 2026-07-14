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
  // SVG rendering

  describe('SVG', () => {
    it('renders SVG with correct attributes', async () => {
      // Checks that the SVG element has proper attributes and contains expected elements.

      // Arrange&Act: Create component.
      const spinnerTorus = createComponent(true, undefined, 'inline-block', '1em');

      // Assert: SVG has correct structural attributes.
      const svg = spinnerTorus.find('svg');
      expect(svg.attributes('viewBox')).toBe('0 0 155 155');
      expect(svg.attributes('xmlns')).toBe('http://www.w3.org/2000/svg');
      expect(svg.attributes('fill')).toBe('none');
    });

    it('renders circle and path elements', async () => {
      // Checks that the SVG contains the circle (track) and path (indicator arc) elements.

      // Arrange&Act: Create component.
      const spinnerTorus = createComponent(true, undefined, 'inline-block', '1em');

      // Assert: SVG has circle and path inside the <g> group.
      const svg = spinnerTorus.find('svg');
      const group = svg.find('g');
      expect(group.exists()).toBe(true);

      const circle = group.find('circle');
      expect(circle.exists()).toBe(true);
      expect(circle.attributes('cx')).toBe('77.5');
      expect(circle.attributes('cy')).toBe('77.5');
      expect(circle.attributes('r')).toBe('60');

      const path = group.find('path');
      expect(path.exists()).toBe(true);
      expect(path.attributes('d')).toBe('M90.305 18.882A60.003 60.003 0 0 1 137.5 77.5');
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Paused class

  describe('paused', () => {
    it('adds paused class when canSpin is false', async () => {
      // Checks that the SVG gets the `paused` class when not allowed to spin.

      // Arrange: Create component with canSpin = false.
      const spinnerTorus = createComponent(false, undefined, 'inline-block', '1em');

      // Act: Find the SVG inside.
      const svg = spinnerTorus.find('.spinner');

      // Assert: SVG has paused class.
      expect(svg.classes()).toContain('paused');
    });

    it('does not add paused class when canSpin is true', async () => {
      // Checks that the SVG does NOT get the `paused` class when allowed to spin.

      // Arrange: Create component with canSpin = true.
      const spinnerTorus = createComponent(true, undefined, 'inline-block', '1em');

      // Act: Find the SVG inside.
      const svg = spinnerTorus.find('.spinner');

      // Assert: SVG does not have paused class.
      expect(svg.classes()).not.toContain('paused');
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
