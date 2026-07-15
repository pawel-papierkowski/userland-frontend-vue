<script setup lang="ts">
/**
 * Floating message container that can show many message boxes. After some time, message boxes are automatically removed. User can also remove them by clicking on them.
 * Used as feedback for user after doing various actions.
 *
 * To add new messages, use AppMessager.
 *
 * Example of use:
 * import { AppMessager } from '@/code/messages/AppMessager.ts';
 * AppMessager.infoT('user.registration.msg.success.title', 'user.registration.msg.success.content');
 */
import { useI18n } from 'vue-i18n';

import { useMessageStore } from '@/stores/messages.ts';
import MessageBox from '@/components/common/messages/MessageBox.vue';

const { t } = useI18n();

const messageStore = useMessageStore();
</script>

<template>
  <div class="message-wrapper" data-testid="msgContainer" :aria-label="t('msgs.aria.container')">
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
.message-wrapper {
  --msg-padding: 0.5rem;
}

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
  padding: var(--msg-padding);
  position: relative; /* Needed for absolute positioning of leaving items */
}

/* Individual message wrapper to handle animations better than component root. */
.msg-item {
  min-width: 100%;
  width: 100%;
  max-width: 100%;
  pointer-events: all;
}

/*** Animations for message boxes handled by <<TransitionGroup>. ***/

/* Entering message container: start state. */
.msg-list-enter-from {
  opacity: 0.5;
  transform: translateX(100%);
}

/* Entering message container: transformation of state. */
.msg-list-enter-active {
  transition: all 0.4s ease-out;
}

/* Entering message container: end state. */
.msg-list-enter-to {
  opacity: 1;
  transform: none;
}

/* Leaving message container: start state. */
.msg-list-leave-from {
  opacity: 1;
  transform: none;
}

/* Leaving message container: transformation of state. */
.msg-list-leave-active {
  transition: all 0.3s ease-in;
  /* If present, in conjuction with allows smootch sliding up components below if current
     component is removed. But it causes diagonal movement for component that is leaving.
     TODO check if we can have both sliding out of current component and sliding up rest
     of components without undesirable side effects. */
  /*position: absolute;*/
  left: var(--msg-padding);
  right: var(--msg-padding);
  width: auto;
}

/* Leaving message container: end state. */
.msg-list-leave-to {
  opacity: 0.5;
  transform: translateX(100%);
}

/* Moving within message container: transformation of state. */
.msg-list-move {
  /* TODO: it seems to interfere with sliding out, making it diagonal */
  /*transition: transform 0.4s ease;*/
}
</style>
