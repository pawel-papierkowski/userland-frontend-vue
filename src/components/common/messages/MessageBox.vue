<script setup lang="ts">
/**
 * Single message in a box. Can be removed by clicking on it or pressing Escape.
 *
 * Properties:
 * - msg: Message data.
 *
 * Events:
 * - close: Fired when user dismisses the message (click or Escape).
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EnMessageLevel } from '@/code/stores/messages/types';
import type { Message } from '@/code/stores/messages/types';

const { t } = useI18n();

const props = defineProps<{
  msg: Message;
}>();

const emit = defineEmits<{
  close: [];
}>();

//

/** Label for message level. */
const levelLabel = computed(() => {
  switch (props.msg.level) {
    case EnMessageLevel.Info:
      return t('msgs.aria.level.info');
    case EnMessageLevel.Success:
      return t('msgs.aria.level.success');
    case EnMessageLevel.Warning:
      return t('msgs.aria.level.warning');
    case EnMessageLevel.Failure:
      return t('msgs.aria.level.failure');
    case EnMessageLevel.Error:
      return t('msgs.aria.level.error');
    default:
      return '';
  }
});

/** Determines CSS class of message. */
const messageClass = computed(() => {
  switch (props.msg.level) {
    case EnMessageLevel.Info:
      return 'message-info';
    case EnMessageLevel.Success:
      return 'message-success';
    case EnMessageLevel.Warning:
      return 'message-warning';
    case EnMessageLevel.Failure:
      return 'message-failure';
    case EnMessageLevel.Error:
      return 'message-error';
    default:
      return '';
  }
});

/** Emoji to show for given message box based on its level. */
const icon = computed(() => {
  switch (props.msg.level) {
    case EnMessageLevel.Info:
      return 'ℹ️';
    case EnMessageLevel.Success:
      return '✅';
    case EnMessageLevel.Warning:
      return '⚠️';
    case EnMessageLevel.Failure:
      return '❌';
    case EnMessageLevel.Error:
      return '🛑';
    default:
      return '';
  }
});

//

/**
 * Handle keyboard events on the message box.
 * Dismisses the message on Escape key.
 */
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close');
  }
}
</script>

<template>
  <div
    class="message-box"
    :class="messageClass"
    :data-testid="'msgBox_' + msg.no"
    role="alert"
    :aria-label="levelLabel"
    tabindex="0"
    @keydown="handleKeydown"
  >
    <div class="message-header">
      <div class="message-icon" aria-hidden="true">{{ icon }}</div>
      <div class="message-title">{{ msg.title }}</div>
    </div>
    <div class="message-body">
      <div class="message-content">{{ msg.content }}</div>
    </div>
    <div v-if="msg.errCode" class="message-errCode">
      <div class="message-divider"></div>
      {{ t('msgs.errorCode') }}: <b>{{ msg.errCode }}</b>
    </div>
  </div>
</template>

<style scoped>
.message-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: var(--spacing-sm);

  width: 100%;
  font-size: 13px;

  border-radius: 6px;
  border-width: 1px;
  border-style: solid;
  line-height: 1.4;

  pointer-events: all;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.message-info {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: 1px solid #2196f3;
  color: #0d47a1;
}
.message-success {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 1px solid #4caf50;
  color: #1b5e20;
}
.message-warning {
  background: linear-gradient(135deg, #fffde7 0%, #fff9c4 100%);
  border: 1px solid #fbc02d;
  color: #664d03;
}
.message-failure {
  background: linear-gradient(135deg, #fff3e0 0%, #ffccbc 100%);
  border: 1px solid #ffab91;
  color: #bf360c;
}
.message-error {
  background: linear-gradient(135deg, #f8d7da 0%, #f1b0b7 100%);
  border: 1px solid #f5c2c7;
  color: #842029;
}

.message-icon {
  margin-right: var(--spacing-sm);
  font-size: 1.1em;
  flex-shrink: 0;
  user-select: none;
}

.message-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.message-body {
  flex-grow: 1;
  margin-left: 1.8rem; /* align content with title text */
}

.message-title {
  font-weight: bold;
}

.message-content {
  font-size: 0.95em;
  word-break: break-word;
}

.message-divider {
  border-top: 1px solid currentColor;
  opacity: 0.2;
  margin-bottom: var(--spacing-xs);
  width: 100%;
}

.message-errCode {
  width: 100%;
  text-align: center;
  margin-top: var(--spacing-xs);
}
</style>
