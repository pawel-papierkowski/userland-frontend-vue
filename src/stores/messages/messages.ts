import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { Message } from '@/code/wrappers/messages/types.ts';
import { EnMessageLevel } from '@/code/wrappers/messages/types.ts';
import { defDuration } from '@/stores/messages/const.ts';

/** Soft cap on the number of messages at once. The actual amount can temporarily be above that; it is fine. */
const maxMessages = 20;

/**
 * Stores the global message queue. Shown in the `MessageContainer` component. Use `AppMessager` to add messages.
 */
export const useMessageStore = defineStore('messages', () => {
  /** Global message queue. */
  const messages = ref<Message[]>([]);
  /** Number of the last message. */
  let lastNo: number = 0;

  /**
   * Adds a message to the global queue.
   * @param level Message level (Info, Success, Warning, Failure, Error).
   * @param title Optional title.
   * @param content The main message text.
   * @param errCode Error code. If present, will show separately in the message box.
   * @param duration Time in seconds before auto-removal. Set to 0 to keep forever.
   */
  function addMessage(
    level: EnMessageLevel,
    title: string = '',
    content: string,
    errCode: string = '',
    duration = defDuration,
  ) {
    if (messages.value.length >= maxMessages) {
      // Remove the oldest message.
      const id = messages.value[0]?.id ?? '';
      removeMessage(id);
    }

    const id = crypto.randomUUID();
    messages.value.push({ id, no: lastNo, level, title, content, errCode });
    if (duration > 0)
      setTimeout(() => {
        removeMessage(id);
      }, duration * 1000);
    lastNo++;
  }

  /**
   * Remove the message with the given id from the global queue.
   * @param id Identifier of the message.
   */
  function removeMessage(id: string) {
    messages.value = messages.value.filter((m) => m.id !== id);
  }

  // Convenience helpers.
  const info = (title: string, content: string, duration = defDuration) =>
    addMessage(EnMessageLevel.Info, title, content, '', duration);
  const success = (title: string, content: string, duration = defDuration) =>
    addMessage(EnMessageLevel.Success, title, content, '', duration);
  const warning = (title: string, content: string, duration = defDuration) =>
    addMessage(EnMessageLevel.Warning, title, content, '', duration);
  const failure = (title: string, content: string, duration = defDuration) =>
    addMessage(EnMessageLevel.Failure, title, content, '', duration);
  const error = (title: string, content: string, errCode: string = '', duration = defDuration) =>
    addMessage(EnMessageLevel.Error, title, content, errCode, duration);

  return { messages, addMessage, removeMessage, info, success, warning, failure, error };
});
