import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import i18n from '@/code/lang/i18n.ts'

import RadioBox from '@/components/base/inputs/RadioBox.vue';

//

/** Boilerplate code. */
function createComponent(initialModel?: number|string|null, options?: (number|string|null)[], disabled?: boolean, langPrefix?: string) {
  return mount(RadioBox, {
      global: {
        plugins: [i18n]
      },
      props: {
        modelValue: initialModel,
        options: options,
        disabled: disabled,
        langPrefix: langPrefix,
      }
    });
}

function createOptions(): (number|string|null)[] {
  return [ null, 'one', 'two', 'three' ];
}

//

/** Tests of RadioBox component. */
describe('RadioBox', () => {
  it('presentation', async () => {
    // Check if radio box is constructed correctly.

    // Arrange and Act: set up radio box.
    const radioBox = createComponent(null, createOptions(), false, 'test.radioBox');

    // Assert: all options are shown correctly.
  });

});
