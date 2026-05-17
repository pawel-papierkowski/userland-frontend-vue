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
      <div v-for="msg in messageStore.messages" :key="msg.id" class="msg-item">
        <MessageBox :msg="msg"
          @click="messageStore.removeMessage(msg.id)"
          @close="messageStore.removeMessage(msg.id)" />
      </div>
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
  z-index: 1000; /* Ensure it's above other content */

  /*width: 600px;*/
  min-width: 200px;
  max-width: 800px;

  scrollbar-width: none; /* Hide scrollbar in Firefox. */
  -ms-overflow-style: none; /* Hide scrollbar in older IE/Edge. */

  /* Allow clicks to pass through to elements underneath when this is empty. */
  pointer-events: none;
}

.message-wrapper::-webkit-scrollbar {
  display: none; /* Hide scrollbar in Chrome, Safari, and newer Edge. */
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

/* Individual message wrapper to handle animations better than component root. */
.msg-item {
  width: 100%;
  pointer-events: all;
}

/* Animations for message boxes handled by <<TransitionGroup>. */
.msg-list-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.msg-list-enter-active {
  transition: all 0.4s ease-out;
}
/*
.msg-list-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.msg-list-leave-active {
  transition: all 0.3s ease-in;
  position: absolute;
  width: calc(100% - 1rem);
  z-index: 1;
}*/

.msg-list-move {
  transition: transform 0.4s ease;
}
</style>
