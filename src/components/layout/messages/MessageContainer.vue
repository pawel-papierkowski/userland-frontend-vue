<script setup lang="ts">
/**
 * Message container that can show many message boxes.
 * To add new messages, use AppMessager.
 *
 * Example of use:
 * import { AppMessager } from '@/code/messages/AppMessager.ts';
 * AppMessager.info('user.registration.msg.success.title', 'user.registration.msg.success.content');
 */
import { useMessageStore } from '@/stores/messages.ts';
import MessageBox from '@/components/layout/messages/MessageBox.vue';

const messageStore = useMessageStore();
</script>

<template>
  <div class="message-wrapper" data-testid="msgContainer">
    <TransitionGroup name="msg-list" tag="div" class="messages">
      <MessageBox
        v-for="msg in messageStore.messages" :key="msg.id" :msg="msg"
        @click="messageStore.removeMessage(msg.id)"
        @close="messageStore.removeMessage(msg.id)" />
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Whole message container. */
.message-wrapper {
  position: fixed;
  top: 0;
  bottom: 0; /* Tells it to stop at the bottom of the screen */
  right: 0;

  overflow-y: auto; /* Scrollable if content is long */
  z-index: 100; /* Ensure it's above other content */

  min-width: 200px;
  max-width: 400px;

  scrollbar-width: none; /* Hide scrollbar in Firefox. */
  -ms-overflow-style: none; /* Hide scrollbar in older IE/Edge. */

  /* Allow clicks to pass through to elements underneath when this is empty. */
  pointer-events: none;
}

/* Hide scrollbar in Chrome, Safari, and newer Edge. */
.message-wrapper::-webkit-scrollbar {
  display: none;
}

/* Contains list of messages. */
.messages {
  display: flex;
  flex-direction: column; /* Stacks children vertically */
  align-items: center; /* Centers the items horizontally */
  gap: 1rem; /* Adds consistent spacing between items without margins */

  width: 100%;
  padding: 0.5rem;
}

/* Animations for message boxes */
.msg-list-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.msg-list-enter-active {
  transition: all 0.4s ease-out;
}

.msg-list-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.msg-list-leave-active {
  transition: all 0.3s ease-in;
  position: absolute; /* necessary for move transition of remaining items */
}

.msg-list-move {
  transition: transform 0.4s ease;
}
</style>
