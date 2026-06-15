import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useMessageStore } from '@/stores/messages.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import { EnMessageLevel } from '@/code/stores/messages/types.ts';

/** Tests AppMessager class. */
describe('AppMessager', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('adds an info message', () => {
    const messageStore = useMessageStore();

    // Act: create message.
    AppMessager.info('testArea.msgButtons.info.title', 'testArea.msgButtons.info.content');

    // Assert: message exists in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Info);
    expect(messageStore.messages[0].title).toBe("testArea.msgButtons.info.title"); // as is
    expect(messageStore.messages[0].content).toBe("testArea.msgButtons.info.content");
  });

  it('adds an translated info message', () => {
    const messageStore = useMessageStore();

    // Act: create translated message.
    AppMessager.infoT('testArea.messages.msgButtons.info.title', 'testArea.messages.msgButtons.info.content');

    // Assert: message exists in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Info);
    expect(messageStore.messages[0].title).toBe("Info"); // translated
    expect(messageStore.messages[0].content).toBe("This is informational message. Number: .");
  });

  //

  it('handles axios response error with known errCode', () => {
    const messageStore = useMessageStore();

    // Arrange: simulate an Axios error object that has expected format.
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          errCode: 'user_0001'
        }
      }
    };

    // Act: create message.
    AppMessager.error(axiosError, 'test.msg.fallback.title', 'test.msg.fallback.content');

    // Assert: message exists in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Failure");
    expect(messageStore.messages[0].content).toBe("User not found.");
  });

  it('handles axios response error with unknown errCode and known http code', () => {
    const messageStore = useMessageStore();

    // Arrange: simulate an Axios error object with unknown error code.
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          errCode: 'unknown_0001'
        }
      }
    };

    // Act: create message.
    AppMessager.error(axiosError, 'test.msg.fallback.title', 'test.msg.fallback.content');

    // Assert: message exists in store. It will report error for HTTP status 400.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Bad request");
    expect(messageStore.messages[0].content).toBe("Request has invalid or missing data.");
  });

  it('handles axios response error with unknown errCode and unhandled http code', () => {
    const messageStore = useMessageStore();

    // Arrange: simulate an Axios error object with unhandled http code.
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 410,
        data: {
          errCode: 'unknown_0001'
        }
      }
    };

    // Act: create message.
    AppMessager.error(axiosError, 'test.msg.fallback.title', 'test.msg.fallback.content');

    // Assert: message exists in store. Will show fallback text.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("test.msg.fallback.title"); // shown as is
    expect(messageStore.messages[0].content).toBe("test.msg.fallback.content");
  });

  it('handles axios request error (network error)', () => {
    const messageStore = useMessageStore();

    // Arrange: simulate an Axios error object without response. Can happen if network error occurs.
    const axiosError = {
      isAxiosError: true,
      request: {} // No response
    };

    // Act: create message.
    AppMessager.error(axiosError, 'test.msg.fallback.title', 'test.msg.fallback.content');

    // Assert: message exists in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Network error");
    expect(messageStore.messages[0].content).toBe("Cannot connect with server. Make sure your Internet connection is not down.");
  });

  it('uses fallback when not an axios error', () => {
    const messageStore = useMessageStore();

    // Arrange: custom error (not an Axios error).
    const error = new Error('Simple error');

    // Act: create translated message.
    AppMessager.errorT(error, 'test.msg.fallback.title', 'test.msg.fallback.content');

    // Assert: message exists in store. Will show fallback text.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Fallback title");
    expect(messageStore.messages[0].content).toBe("Fallback content.");
  });
});
