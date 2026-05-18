import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import MessageContainer from '@/components/common/messages/MessageContainer.vue';

/** Boilerplate code. */
function createWrapper() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(MessageContainer, {
      global: {
        plugins: [pinia, i18n]
      }
    });
}

/** Tests of MessageContainer component. */
describe('MessageContainer', () => {
  it('is empty', () => {
    const messageContainer = createWrapper();

    // Check that there are no elements with class .message-box .
    expect(messageContainer.findAll('.message-box')).toHaveLength(0);
  });

  it('has single message', async () => {
    const messageContainer = createWrapper();

    // Add one message.
    AppMessager.success('user.registration.msg.success.title', 'user.registration.msg.success.content');

    // Wait for DOM to update.
    await nextTick();

    // Check that there is single element with class .message-box .
    expect(messageContainer.findAll('.message-box')).toHaveLength(1);
  });
});
