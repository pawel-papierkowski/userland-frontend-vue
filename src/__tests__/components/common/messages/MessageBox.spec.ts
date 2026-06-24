import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import i18n from '@/code/lang/i18n.ts';

import type { Message } from '@/code/stores/messages/types.ts';
import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import MessageBox from '@/components/common/messages/MessageBox.vue';

//

/** Boilerplate code. */
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
  it('renders info message', () => {
    // Checks proper rendering of message type 'info'.

    // Arrange: message data.
    const message: Message = {
      id: crypto.randomUUID(),
      no: 0,
      level: EnMessageLevel.Info,
      title: 'Info Title',
      content: 'Info Content',
      errCode: '',
    };

    // Act: create message box.
    const messageBox = createComponent(message);

    // Assert: message box is in correct state.
    expect(messageBox.classes()).toContain('message-info');
    expect(messageBox.find('.message-icon').text()).toBe('ℹ️');
    expect(messageBox.find('.message-title').text()).toBe('Info Title');
    expect(messageBox.find('.message-content').text()).toBe('Info Content');
    expect(messageBox.find('.message-errCode').exists()).toBe(false);
  });

  it('renders success message', () => {
    // Checks proper rendering of message type 'success'.

    // Arrange: message data.
    const message: Message = {
      id: crypto.randomUUID(),
      no: 1,
      level: EnMessageLevel.Success,
      title: 'Success Title',
      content: 'Success Content',
      errCode: '',
    };

    // Act: create message box.
    const messageBox = createComponent(message);

    // Assert: message box is in correct state.
    expect(messageBox.classes()).toContain('message-success');
    expect(messageBox.find('.message-icon').text()).toBe('✅');
    expect(messageBox.find('.message-title').text()).toBe('Success Title');
    expect(messageBox.find('.message-content').text()).toBe('Success Content');
    expect(messageBox.find('.message-errCode').exists()).toBe(false);
  });

  it('renders warning message', () => {
    // Checks proper rendering of message type 'warning'.

    // Arrange: message data.
    const message: Message = {
      id: crypto.randomUUID(),
      no: 2,
      level: EnMessageLevel.Warning,
      title: 'Warning Title',
      content: 'Warning Content',
      errCode: '',
    };

    // Act: create message box.
    const messageBox = createComponent(message);

    // Assert: message box is in correct state.
    expect(messageBox.classes()).toContain('message-warning');
    expect(messageBox.find('.message-icon').text()).toBe('⚠️');
    expect(messageBox.find('.message-title').text()).toBe('Warning Title');
    expect(messageBox.find('.message-content').text()).toBe('Warning Content');
    expect(messageBox.find('.message-errCode').exists()).toBe(false);
  });

  it('renders failure message', () => {
    // Checks proper rendering of message type 'failure'.

    // Arrange: message data.
    const message: Message = {
      id: crypto.randomUUID(),
      no: 3,
      level: EnMessageLevel.Failure,
      title: 'Failure Title',
      content: 'Failure Content',
      errCode: '',
    };

    // Act: create message box.
    const messageBox = createComponent(message);

    // Assert: message box is in correct state.
    expect(messageBox.classes()).toContain('message-failure');
    expect(messageBox.find('.message-icon').text()).toBe('❌');
    expect(messageBox.find('.message-title').text()).toBe('Failure Title');
    expect(messageBox.find('.message-content').text()).toBe('Failure Content');
    expect(messageBox.find('.message-errCode').exists()).toBe(false);
  });

  it('renders error message', () => {
    // Checks proper rendering of message type 'error', including error code.

    // Arrange: message data.
    const message: Message = {
      id: crypto.randomUUID(),
      no: 4,
      level: EnMessageLevel.Error,
      title: 'Error Title',
      content: 'Error Content',
      errCode: 'ERR_001',
    };

    // Act: create message box.
    const messageBox = createComponent(message);

    // Assert: message box is in correct state.
    expect(messageBox.classes()).toContain('message-error');
    expect(messageBox.find('.message-icon').text()).toBe('🛑');
    expect(messageBox.find('.message-title').text()).toBe('Error Title');
    expect(messageBox.find('.message-content').text()).toBe('Error Content');
    expect(messageBox.find('.message-errCode').text()).toBe('Error code: ERR_001');
  });
});
