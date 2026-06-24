import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import MessageContainer from '@/components/common/messages/MessageContainer.vue';

let pinia: ReturnType<typeof createPinia>;

/** Boilerplate code. */
function createComponent() {
  return mount(MessageContainer, {
    global: {
      plugins: [pinia, i18n],
    },
  });
}

/** Tests of MessageContainer component. */
describe('MessageContainer', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
  });

  it('is empty', () => {
    // Check empty message container.

    const messageContainer = createComponent();

    // Check that there are no elements with class '.message-box'.
    expect(messageContainer.findAll('.message-box')).toHaveLength(0);
  });

  it('has single message', async () => {
    // Check message container with single message.

    const messageContainer = createComponent();

    // Act: Add one message.
    AppMessager.success('user.registration.msg.success.title', 'user.registration.msg.success.content');

    await nextTick(); // Wait for DOM to update.

    // Assert: check that there is single element with class '.message-box'.
    expect(messageContainer.findAll('.message-box')).toHaveLength(1);
  });

  it('has many messages', async () => {
    // Check message container with many messages.

    const messageContainer = createComponent();

    // Act: Add multiple messages.
    AppMessager.error(new Error(), 'msg.error.title', 'msg.error.content');
    AppMessager.failure('msg.failure.title', 'msg.failure.content');
    AppMessager.warning('msg.warn.title', 'msg.warn.content');
    AppMessager.success('msg.success.title', 'msg.success.content');
    AppMessager.info('msg.info.title', 'msg.info.content');

    await nextTick(); // Wait for DOM to update.

    // Assert: check that there are five elements with class '.message-box'.
    const messages = messageContainer.findAll('.message-box');
    expect(messages).toHaveLength(5);
    // Assert: ensure they are in correct order.
    expect(messages[0]?.find('.message-content').text()).toBe('msg.error.content');
    expect(messages[1]?.find('.message-content').text()).toBe('msg.failure.content');
    expect(messages[2]?.find('.message-content').text()).toBe('msg.warn.content');
    expect(messages[3]?.find('.message-content').text()).toBe('msg.success.content');
    expect(messages[4]?.find('.message-content').text()).toBe('msg.info.content');
  });
});
