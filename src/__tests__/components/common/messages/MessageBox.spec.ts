import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import i18n from '@/code/lang/i18n.ts';

import type { Message } from '@/code/wrappers/messages/types.ts';
import { EnMessageLevel } from '@/code/wrappers/messages/types.ts';
import MessageBox from '@/components/common/messages/MessageBox.vue';

//

/** Convenience function to create component. */
function createComponent(message: Message) {
  return mount(MessageBox, {
    global: {
      plugins: [i18n],
    },
    props: {
      msg: message,
    },
  });
}

//

/** Tests of MessageBox component. */
describe('MessageBox', () => {
  describe('general', () => {
    it('renders info message', () => {
      // Checks proper rendering of message type 'info'.

      // Arrange: Message data.
      const message: Message = {
        id: crypto.randomUUID(),
        no: 0,
        level: EnMessageLevel.Info,
        title: 'Info Title',
        content: 'Info Content',
        errCode: '',
      };

      // Act: Create message box.
      const messageBox = createComponent(message);

      // Assert: Message box is in correct state.
      expect(messageBox.classes()).toContain('message-info');
      expect(messageBox.find('.message-icon').text()).toBe('ℹ️');
      expect(messageBox.find('.message-title').text()).toBe('Info Title');
      expect(messageBox.find('.message-content').text()).toBe('Info Content');
      expect(messageBox.find('.message-errCode').exists()).toBe(false);
    });

    it('renders success message', () => {
      // Checks proper rendering of message type 'success'.

      // Arrange: Message data.
      const message: Message = {
        id: crypto.randomUUID(),
        no: 1,
        level: EnMessageLevel.Success,
        title: 'Success Title',
        content: 'Success Content',
        errCode: '',
      };

      // Act: Create message box.
      const messageBox = createComponent(message);

      // Assert: Message box is in correct state.
      expect(messageBox.classes()).toContain('message-success');
      expect(messageBox.find('.message-icon').text()).toBe('✅');
      expect(messageBox.find('.message-title').text()).toBe('Success Title');
      expect(messageBox.find('.message-content').text()).toBe('Success Content');
      expect(messageBox.find('.message-errCode').exists()).toBe(false);
    });

    it('renders warning message', () => {
      // Checks proper rendering of message type 'warning'.

      // Arrange: Message data.
      const message: Message = {
        id: crypto.randomUUID(),
        no: 2,
        level: EnMessageLevel.Warning,
        title: 'Warning Title',
        content: 'Warning Content',
        errCode: '',
      };

      // Act: Create message box.
      const messageBox = createComponent(message);

      // Assert: Message box is in correct state.
      expect(messageBox.classes()).toContain('message-warning');
      expect(messageBox.find('.message-icon').text()).toBe('⚠️');
      expect(messageBox.find('.message-title').text()).toBe('Warning Title');
      expect(messageBox.find('.message-content').text()).toBe('Warning Content');
      expect(messageBox.find('.message-errCode').exists()).toBe(false);
    });

    it('renders failure message', () => {
      // Checks proper rendering of message type 'failure'.

      // Arrange: Message data.
      const message: Message = {
        id: crypto.randomUUID(),
        no: 3,
        level: EnMessageLevel.Failure,
        title: 'Failure Title',
        content: 'Failure Content',
        errCode: '',
      };

      // Act: Create message box.
      const messageBox = createComponent(message);

      // Assert: Message box is in correct state.
      expect(messageBox.classes()).toContain('message-failure');
      expect(messageBox.find('.message-icon').text()).toBe('❌');
      expect(messageBox.find('.message-title').text()).toBe('Failure Title');
      expect(messageBox.find('.message-content').text()).toBe('Failure Content');
      expect(messageBox.find('.message-errCode').exists()).toBe(false);
    });

    it('renders error message', () => {
      // Checks proper rendering of message type 'error', including error code.

      // Arrange: Message data.
      const message: Message = {
        id: crypto.randomUUID(),
        no: 4,
        level: EnMessageLevel.Error,
        title: 'Error Title',
        content: 'Error Content',
        errCode: 'ERR_001',
      };

      // Act: Create message box.
      const messageBox = createComponent(message);

      // Assert: Message box is in correct state.
      expect(messageBox.classes()).toContain('message-error');
      expect(messageBox.find('.message-icon').text()).toBe('🛑');
      expect(messageBox.find('.message-title').text()).toBe('Error Title');
      expect(messageBox.find('.message-content').text()).toBe('Error Content');
      expect(messageBox.find('.message-errCode').text()).toBe('Error code: ERR_001');
    });
  });

  describe('accessibility', () => {
    it('has correct ARIA attributes for info message', () => {
      // Checks that an info message box exposes proper ARIA attributes.

      // Arrange: Message data.
      const message: Message = {
        id: crypto.randomUUID(),
        no: 0,
        level: EnMessageLevel.Info,
        title: 'Info Title',
        content: 'Info Content',
        errCode: '',
      };

      // Act: Create message box.
      const messageBox = createComponent(message);

      // Assert: ARIA attributes are correct.
      expect(messageBox.attributes('role')).toBe('alert');
      expect(messageBox.attributes('aria-label')).toBe('Information');
      expect(messageBox.attributes('tabindex')).toBe('0');
    });

    it('has correct ARIA attributes for error message', () => {
      // Checks that an error message box includes error code in aria-label.

      // Arrange: Message data.
      const message: Message = {
        id: crypto.randomUUID(),
        no: 4,
        level: EnMessageLevel.Error,
        title: 'Error Title',
        content: 'Error Content',
        errCode: 'ERR_001',
      };

      // Act: Create message box.
      const messageBox = createComponent(message);

      // Assert: ARIA attributes are correct.
      expect(messageBox.attributes('role')).toBe('alert');
      expect(messageBox.attributes('aria-label')).toBe('Error');
      expect(messageBox.attributes('tabindex')).toBe('0');
    });

    it('icon is hidden from screen readers', () => {
      // Checks that the icon element is hidden from accessibility tree.

      // Arrange: Message data.
      const message: Message = {
        id: crypto.randomUUID(),
        no: 0,
        level: EnMessageLevel.Info,
        title: 'Info Title',
        content: 'Info Content',
        errCode: '',
      };

      // Act: Create message box.
      const messageBox = createComponent(message);

      // Assert: Icon has aria-hidden="true".
      expect(messageBox.find('.message-icon').attributes('aria-hidden')).toBe('true');
    });
  });

  describe('keyboard', () => {
    it('emits close event on Escape key', async () => {
      // Checks that pressing Escape emits the close event.

      // Arrange: Message data.
      const message: Message = {
        id: crypto.randomUUID(),
        no: 0,
        level: EnMessageLevel.Info,
        title: 'Info Title',
        content: 'Info Content',
        errCode: '',
      };

      // Act: Create message box and press Escape.
      const messageBox = createComponent(message);
      await messageBox.trigger('keydown', { key: 'Escape' });

      // Assert: Close event was emitted.
      expect(messageBox.emitted('close')?.length).toBe(1);
    });

    it('does not emit close on other keys', async () => {
      // Checks that pressing a non-Escape key does not emit the close event.

      // Arrange: Message data.
      const message: Message = {
        id: crypto.randomUUID(),
        no: 0,
        level: EnMessageLevel.Info,
        title: 'Info Title',
        content: 'Info Content',
        errCode: '',
      };

      // Act: Create message box and press Enter.
      const messageBox = createComponent(message);
      await messageBox.trigger('keydown', { key: 'Enter' });

      // Assert: Close event was NOT emitted.
      expect(messageBox.emitted('close')).toBeUndefined();
    });
  });
});
