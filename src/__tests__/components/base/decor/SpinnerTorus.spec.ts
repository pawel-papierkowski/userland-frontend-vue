import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

//

/** Convenience function to create component. */
function createComponent(canSpin?: boolean, display?: string, size?: string) {
  return mount(SpinnerTorus, {
    props: {
      canSpin,
      display,
      size,
    },
  });
}

// ////////////////////////////////////////////////////////////////////////////

/** Tests of SpinnerTorus component. */
describe('SpinnerTorus', () => {
  it('presents itself correctly when spinning', async () => {
    // SpinnerTorus should have correct styling.

    // Arrange&Act: Create component.
    const spinnerTorus = createComponent(true, 'inline-block', '1em');

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
    const spinnerTorus = createComponent(false, 'block', '100px');

    const outer = spinnerTorus.find('.spinner-wrapper');
    expect(outer.attributes('style')).toContain('display: block');
    expect(outer.attributes('style')).toContain('width: 100px');
    expect(outer.attributes('style')).toContain('height: 100px');

    const inner = spinnerTorus.find('.spinner');
    expect(inner.classes()).toEqual(['spinner', 'spins', 'paused']);
  });
});
