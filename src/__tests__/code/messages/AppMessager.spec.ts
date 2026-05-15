import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useMessageStore } from '@/stores/messages';
import { AppMessager } from '@/code/messages/AppMessager';
import { EnMessageLevel } from '@/code/messages/types';

/** Tests AppMessager class. */
describe('AppMessager', () => {
  beforeEach(() => {
    // Crucial for testing code that uses Pinia stores outside components
    setActivePinia(createPinia());
  });

  it('adds an info message', () => {
    const messageStore = useMessageStore();

    AppMessager.info('user.registration.msg.success.title', 'user.registration.msg.success.content');

    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Info);
  });

  it('handles axios response error with known errCode', () => {
    const messageStore = useMessageStore();

    // Simulate an Axios error object.
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          errCode: 'user_0001'
        }
      }
    };

    AppMessager.error(axiosError, 'fallback.title', 'fallback.content');

    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Failure");
    expect(messageStore.messages[0].content).toBe("User not found.");
  });

  it('handles axios response error with unknown errCode and known http code', () => {
    const messageStore = useMessageStore();

    // Simulate an Axios error object.
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          errCode: 'unknown_0001'
        }
      }
    };

    AppMessager.error(axiosError, 'fallback.title', 'fallback.content');

    // It will report error for HTTP status 400.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Bad request");
    expect(messageStore.messages[0].content).toBe("Request has invalid or missing data.");
  });

  it('handles axios response error with unknown errCode and unknown http code', () => {
    const messageStore = useMessageStore();

    // Simulate an Axios error object.
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 410,
        data: {
          errCode: 'unknown_0001'
        }
      }
    };

    AppMessager.error(axiosError, 'fallback.title', 'fallback.content');

    // Will show fallback text.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("fallback.title"); // shown as is, since these keys do not exist in language files
    expect(messageStore.messages[0].content).toBe("fallback.content");
  });

  it('handles axios request error (network error)', () => {
    const messageStore = useMessageStore();

    const axiosError = {
      isAxiosError: true,
      request: {} // No response
    };

    AppMessager.error(axiosError, 'fallback.title', 'fallback.content');

    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Network error");
    expect(messageStore.messages[0].content).toBe("Cannot connect with server. Make sure your Internet connection is not down.");
  });

  it('uses fallback when not an axios error', () => {
    const messageStore = useMessageStore();

    AppMessager.error(new Error('Simple error'), 'fallback.title', 'fallback.content');

    // Will show fallback text.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("fallback.title"); // shown as is, since these keys do not exist in language files
    expect(messageStore.messages[0].content).toBe("fallback.content");
  });
});
