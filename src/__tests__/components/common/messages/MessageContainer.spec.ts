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

      // Assert: check that there is single element with class '.message-box'.
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

  describe('accessibility', () => {
    it('has correct ARIA attributes', () => {
      // Checks that the container exposes proper ARIA attributes for screen readers.

      // Arrange&Act: Create component.
      const messageContainer = createComponent();

      // Assert: wrapper has live region attributes.
      expect(messageContainer.find('.message-wrapper').attributes('role')).toBe('status');
      expect(messageContainer.find('.message-wrapper').attributes('aria-live')).toBe('polite');
      expect(messageContainer.find('.message-wrapper').attributes('aria-atomic')).toBe('true');
      expect(messageContainer.find('.message-wrapper').attributes('aria-label')).toBe('Notifications');
      expect(messageContainer.find('.message-wrapper').attributes('aria-relevant')).toBe('additions removals');
    });

    it('announces new messages via live region', async () => {
      // Checks that when a message is added, it appears inside the live region.

      // Arrange: Create component.
      const messageContainer = createComponent();

      // Act: add a message.
      AppMessager.success('user.registration.msg.success.title', 'user.registration.msg.success.content');
      await nextTick();

      // Assert: the live region contains the message box.
      const liveRegion = messageContainer.find('[aria-live="polite"]');
      expect(liveRegion.findAll('.message-box').length).toBe(1);
    });
  });
});
