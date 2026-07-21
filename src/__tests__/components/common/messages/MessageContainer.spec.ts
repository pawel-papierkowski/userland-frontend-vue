import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import MessageContainer from '@/components/common/messages/MessageContainer.vue';

let pinia: ReturnType<typeof createPinia>;

/** Convenience function to create component. */
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

  //

  describe('general', () => {
    it('is empty', () => {
      // Check empty message container.

      // Arrange&Act: Create component.
      const messageContainer = createComponent();

      // Assert: Check that there are no elements with class '.message-box'.
      expect(messageContainer.findAll('.message-box')).toHaveLength(0);
    });

    it('has single message', async () => {
      // Check message container with single message.

      // Arrange: Create component.
      const messageContainer = createComponent();

      // Act: Add one message.
      AppMessager.success('user.registration.msg.success.title', 'user.registration.msg.success.content');

      await nextTick(); // Wait for DOM to update.

      // Assert: Check that there is single element with class '.message-box'.
      expect(messageContainer.findAll('.message-box')).toHaveLength(1);
    });

    it('has many messages', async () => {
      // Check message container with many messages.

      // Arrange: Create component.
      const messageContainer = createComponent();

      // Act: Add multiple messages.
      AppMessager.error(new Error(), 'msg.error.title', 'msg.error.content');
      AppMessager.failure('msg.failure.title', 'msg.failure.content');
      AppMessager.warning('msg.warn.title', 'msg.warn.content');
      AppMessager.success('msg.success.title', 'msg.success.content');
      AppMessager.info('msg.info.title', 'msg.info.content');

      await nextTick(); // Wait for DOM to update.

      // Assert: Check that there are five elements with class '.message-box'.
      const messages = messageContainer.findAll('.message-box');
      expect(messages).toHaveLength(5);
      // Assert: Ensure they are in correct order.
      expect(messages[0]?.find('.message-content').text()).toBe('msg.error.content');
      expect(messages[1]?.find('.message-content').text()).toBe('msg.failure.content');
      expect(messages[2]?.find('.message-content').text()).toBe('msg.warn.content');
      expect(messages[3]?.find('.message-content').text()).toBe('msg.success.content');
      expect(messages[4]?.find('.message-content').text()).toBe('msg.info.content');
    });

    it('caps at maxMessages and removes oldest on overflow', async () => {
      // Checks that when the message queue exceeds the limit (20), the oldest
      // message is removed and only the newest 20 remain.

      // Arrange: Create component.
      const messageContainer = createComponent();

      // Act: Add 21 messages (one over cap).
      for (let i = 0; i < 21; i++) {
        AppMessager.info(`Title ${i}`, `Content ${i}`);
      }

      await nextTick(); // Wait for DOM to update.

      // Assert: Only 20 messages are rendered.
      const messages = messageContainer.findAll('.message-box');
      expect(messages).toHaveLength(20);

      // Assert: The oldest message (Content 0) was removed.
      expect(messages[0]?.find('.message-content').text()).toBe('Content 1');
      // Assert: The newest message (Content 20) is present at the end.
      expect(messages[19]?.find('.message-content').text()).toBe('Content 20');
    });
  });

  describe('accessibility', () => {
    it('has correct ARIA attributes', () => {
      // Checks that the container exposes proper ARIA attributes for screen readers.

      // Arrange&Act: Create component.
      const messageContainer = createComponent();

      // Assert: wrapper has needed aria attributes.
      expect(messageContainer.find('.message-wrapper').attributes('aria-label')).toBe('Notifications');
    });
  });
});
