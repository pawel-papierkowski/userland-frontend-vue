<script setup lang="ts">
/**
 * Floating message container that can show many message boxes.
 * To add new messages, use AppMessager.
 *
 * Example of use:
 * import { AppMessager } from '@/code/messages/AppMessager.ts';
 * AppMessager.info('user.registration.msg.success.title', 'user.registration.msg.success.content');
 */
import { useMessageStore } from '@/stores/messages.ts';
import MessageBox from '@/components/common/messages/MessageBox.vue';

const messageStore = useMessageStore();
</script>

<template>
  <div class="message-wrapper" data-testid="msgContainer">
    <TransitionGroup name="msg-list" tag="div" class="messages">
      <div v-for="msg in messageStore.messages" :key="msg.id" class="msg-item">
        <MessageBox
          :msg="msg"
          @click="messageStore.removeMessage(msg.id)"
          @close="messageStore.removeMessage(msg.id)"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Whole message container. Causes all messages to appear on top right. */
.message-wrapper {
  position: fixed;
  top: 0;
  bottom: 0; /* Tells it to stop at the bottom of the screen */
  right: 0;

  overflow-y: auto; /* Scrollable if content is long */
  overflow-x: hidden;
  z-index: 1000; /* Ensure it's above other content */

  width: 300px; /* Constant width needed, otherwise last message will glitch out when removed. */

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
  position: relative; /* Needed for absolute positioning of leaving items */
}

/* Individual message wrapper to handle animations better than component root. */
.msg-item {
  width: 100%;
  pointer-events: all;
}

/* Animations for message boxes handled by <<TransitionGroup>. */
.msg-list-enter-from {
  opacity: 0.5;
  transform: translateX(100%);
}

.msg-list-enter-active {
  transition: all 0.4s ease-out;
}

.msg-list-leave-to {
  opacity: 0.5;
  transform: translateX(100%);
}

.msg-list-leave-active {
  transition: all 0.3s ease-in;
  /* Ensure all messages below slids up (instead of jumping up) when current message leaves. */
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  width: auto;
}

.msg-list-move {
  transition: transform 0.4s ease;
}
</style>
