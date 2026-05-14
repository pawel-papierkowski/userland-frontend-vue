import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Message } from '@/code/messages/types';
import { EnMessageLevel } from '@/code/messages/types';

export const useMessageStore = defineStore('messages', () => {
  /** Global message queue. */
  const messages = ref<Message[]>([]);

  /**
   * Adds a message to the global queue.
   * @param level Message level (Info, Warning, Error).
   * @param title Optional title.
   * @param content The main message text.
   * @param errCode Error code. If present, will show separately in message box.
   * @param duration Time in seconds before auto-removal. Set to 0 to keep forever.
   */
  function addMessage(level: EnMessageLevel, title: string = '', content: string, errCode: string = '', duration = 15) {
    const id = crypto.randomUUID();
    messages.value.push({ id, level, title, content, errCode });
    if (duration > 0)
      setTimeout(() => {
        removeMessage(id);
      }, duration * 1000);
  }

  function removeMessage(id: string) {
    messages.value = messages.value.filter((m) => m.id !== id);
  }

  // Convenience helpers
  const info = (title: string, content: string) => addMessage(EnMessageLevel.Info, title, content);
  const warn = (title: string, content: string) => addMessage(EnMessageLevel.Warning, title, content);
  const error = (title: string, content: string, errCode: string = '') =>
    addMessage(EnMessageLevel.Error, title, content, errCode);

  return { messages, addMessage, removeMessage, info, warn, error };
});
