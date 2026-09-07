import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useMessageStore } from '@/stores/messages/messages.ts';
import { EnMessageLevel } from '@/code/wrappers/messages/types.ts';
import { defDuration } from '@/stores/messages/const.ts';

// ////////////////////////////////////////////////////////////////////////////
// Helpers.

/** Counter for generating sequential mock UUIDs. */
let uuidCounter = 0;

/**
 * Advance fake timers by given number of seconds.
 * @param seconds Number of seconds to advance.
 */
const advanceTime = (seconds: number) => {
  vi.advanceTimersByTime(seconds * 1000);
};

// ////////////////////////////////////////////////////////////////////////////

/** Tests useMessageStore. */
describe('useMessageStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.useFakeTimers();
    uuidCounter = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => `id-${uuidCounter++}` as `${string}-${string}-${string}-${string}-${string}`);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // //////////////////////////////////////////////////////////////////////////
  // General.

  describe('general', () => {
    it('initializes with empty messages array', () => {
      // Arrange: Create store (fresh Pinia in beforeEach).

      // Act: No action needed, checking initial state.

      // Assert: Messages array is empty.
      const store = useMessageStore();
      expect(store.messages).toHaveLength(0);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // addMessage.

  describe('addMessage', () => {
    it('adds message with correct fields', () => {
      // Arrange: Create store.
      const store = useMessageStore();

      // Act: Add a message.
      store.addMessage(EnMessageLevel.Warning, 'Title', 'Content', 'ERR_001');

      // Assert: Message has all correct fields.
      expect(store.messages).toHaveLength(1);
      expect(store.messages[0]).toStrictEqual({
        id: 'id-0',
        no: 0,
        level: EnMessageLevel.Warning,
        title: 'Title',
        content: 'Content',
        errCode: 'ERR_001',
      });
    });

    it('generates unique id for each message', () => {
      // Arrange: Create store.
      const store = useMessageStore();

      // Act: Add multiple messages.
      store.addMessage(EnMessageLevel.Info, '', 'First');
      store.addMessage(EnMessageLevel.Info, '', 'Second');
      store.addMessage(EnMessageLevel.Info, '', 'Third');

      // Assert: Each message has a unique id.
      const ids = store.messages.map((m) => m.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('increments no for each message', () => {
      // Arrange: Create store.
      const store = useMessageStore();

      // Act: Add three messages.
      store.addMessage(EnMessageLevel.Info, '', 'First');
      store.addMessage(EnMessageLevel.Info, '', 'Second');
      store.addMessage(EnMessageLevel.Info, '', 'Third');

      // Assert: Message numbers are sequential starting from 0.
      expect(store.messages).toHaveLength(3);
      expect(store.messages[0]!.no).toBe(0);
      expect(store.messages[1]!.no).toBe(1);
      expect(store.messages[2]!.no).toBe(2);
    });

    it('enforces 20-message cap', () => {
      // Arrange: Create store and fill with 20 messages.
      const store = useMessageStore();
      for (let i = 0; i < 20; i++) {
        store.addMessage(EnMessageLevel.Info, '', `Message ${i}`);
      }
      expect(store.messages).toHaveLength(20);

      // Act: Add one more message (21st), triggering cap enforcement.
      store.addMessage(EnMessageLevel.Info, '', 'Message 20');

      // Assert: Oldest message (first) was removed, newest was added.
      expect(store.messages).toHaveLength(20);
      expect(store.messages[0]!.content).toBe('Message 1');
      expect(store.messages[19]!.content).toBe('Message 20');
    });

    it('schedules auto-removal when duration > 0', () => {
      // Arrange: Create store and add a message with 5 second duration.
      const store = useMessageStore();
      store.addMessage(EnMessageLevel.Info, '', 'Temporary', '', 5);
      expect(store.messages).toHaveLength(1);

      // Act: Advance time past the duration.
      advanceTime(5);

      // Assert: Message was removed.
      expect(store.messages).toHaveLength(0);
    });

    it('does not schedule auto-removal when duration is 0', () => {
      // Arrange: Create store and add a message with 0 duration (forever).
      const store = useMessageStore();
      store.addMessage(EnMessageLevel.Info, '', 'Permanent', '', 0);

      // Act: Advance time significantly.
      advanceTime(600);

      // Assert: Message is still present.
      expect(store.messages).toHaveLength(1);
    });

    it('uses default duration from const', () => {
      // Arrange: Create store and add a message without explicit duration.
      const store = useMessageStore();
      store.addMessage(EnMessageLevel.Info, '', 'Default duration');

      // Act: Advance time to just before default duration expires.
      advanceTime(defDuration - 1);

      // Assert: Message is still present.
      expect(store.messages).toHaveLength(1);

      // Act: Advance past default duration.
      advanceTime(1);

      // Assert: Message was removed.
      expect(store.messages).toHaveLength(0);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // removeMessage.

  describe('removeMessage', () => {
    it('removes message by id', () => {
      // Arrange: Create store with a message.
      const store = useMessageStore();
      store.addMessage(EnMessageLevel.Info, '', 'To remove');
      const id = store.messages[0]!.id;

      // Act: Remove the message.
      store.removeMessage(id);

      // Assert: Message is gone.
      expect(store.messages).toHaveLength(0);
    });

    it('no-op when id does not exist', () => {
      // Arrange: Create store with a message.
      const store = useMessageStore();
      store.addMessage(EnMessageLevel.Info, '', 'To keep');

      // Act: Try to remove a non-existent message.
      store.removeMessage('non-existent-id');

      // Assert: Original message is still present.
      expect(store.messages).toHaveLength(1);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Convenience helpers.

  describe('convenience helpers', () => {
    it('info adds info level message', () => {
      // Arrange: Create store.
      const store = useMessageStore();

      // Act: Call info helper.
      store.info('Info Title', 'Info Content');

      // Assert: Message has info level.
      expect(store.messages[0]!.level).toBe(EnMessageLevel.Info);
      expect(store.messages[0]!.title).toBe('Info Title');
      expect(store.messages[0]!.content).toBe('Info Content');
    });

    it('success adds success level message', () => {
      // Arrange: Create store.
      const store = useMessageStore();

      // Act: Call success helper.
      store.success('Success Title', 'Success Content');

      // Assert: Message has success level.
      expect(store.messages[0]!.level).toBe(EnMessageLevel.Success);
      expect(store.messages[0]!.title).toBe('Success Title');
      expect(store.messages[0]!.content).toBe('Success Content');
    });

    it('warning adds warning level message', () => {
      // Arrange: Create store.
      const store = useMessageStore();

      // Act: Call warning helper.
      store.warning('Warning Title', 'Warning Content');

      // Assert: Message has warning level.
      expect(store.messages[0]!.level).toBe(EnMessageLevel.Warning);
      expect(store.messages[0]!.title).toBe('Warning Title');
      expect(store.messages[0]!.content).toBe('Warning Content');
    });

    it('failure adds failure level message', () => {
      // Arrange: Create store.
      const store = useMessageStore();

      // Act: Call failure helper.
      store.failure('Failure Title', 'Failure Content');

      // Assert: Message has failure level.
      expect(store.messages[0]!.level).toBe(EnMessageLevel.Failure);
      expect(store.messages[0]!.title).toBe('Failure Title');
      expect(store.messages[0]!.content).toBe('Failure Content');
    });

    it('error adds error level message', () => {
      // Arrange: Create store.
      const store = useMessageStore();

      // Act: Call error helper.
      store.error('Error Title', 'Error Content');

      // Assert: Message has error level.
      expect(store.messages[0]!.level).toBe(EnMessageLevel.Error);
      expect(store.messages[0]!.title).toBe('Error Title');
      expect(store.messages[0]!.content).toBe('Error Content');
    });

    it('error includes errCode', () => {
      // Arrange: Create store.
      const store = useMessageStore();

      // Act: Call error helper with errCode.
      store.error('Error Title', 'Error Content', 'ERR_404');

      // Assert: Message has the error code.
      expect(store.messages[0]!.errCode).toBe('ERR_404');
    });
  });
});
