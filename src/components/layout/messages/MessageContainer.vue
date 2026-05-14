<script setup lang="ts">
/**
 * Message container that can show many message boxes.
 */
import { useMessageStore } from '@/stores/messages';
import MessageBox from '@/components/layout/messages/MessageBox.vue';

const messageStore = useMessageStore();
</script>

<template>
  <div class="message-wrapper">
    <div class="messages">
      <MessageBox
        v-for="msg in messageStore.messages" :key="msg.id" :msg="msg"
        @click="messageStore.removeMessage(msg.id)"
        @close="messageStore.removeMessage(msg.id)" />
    </div>
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
</style>
