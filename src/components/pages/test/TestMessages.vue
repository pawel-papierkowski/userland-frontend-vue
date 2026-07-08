<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useLogger } from 'vue-logger-plugin';

import { EnMessageLevel, messageLevelStr } from '@/code/stores/messages/types.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';

const log = useLogger();
const { t } = useI18n();

const count: Ref<number> = ref(0);

/**
 * Generate message.
 * @param level Level of message.
 */
const genMessage = (level: EnMessageLevel) => {
  count.value++;
  const titleKey = 'testArea.msgButtons.' + messageLevelStr(level) + '.title';
  const contentKey = 'testArea.msgButtons.' + messageLevelStr(level) + '.content';

  switch (level) {
    case EnMessageLevel.Info:
      AppMessager.info(t(titleKey), t(contentKey, { count: count.value }));
      break;
    case EnMessageLevel.Success:
      AppMessager.success(t(titleKey), t(contentKey, { count: count.value }));
      break;
    case EnMessageLevel.Warning:
      AppMessager.warning(t(titleKey), t(contentKey, { count: count.value }));
      break;
    case EnMessageLevel.Failure:
      AppMessager.failure(t(titleKey), t(contentKey, { count: count.value }));
      break;
    case EnMessageLevel.Error:
      AppMessager.error(null, t(titleKey), t(contentKey, { count: count.value }));
      break;
  }
};

/** Sends message to standard browser console. */
const logBrowser = (level: EnMessageLevel) => {
  switch (level) {
    case EnMessageLevel.Info:
      console.info('Log info data via browser console.');
      break;
    case EnMessageLevel.Warning:
      console.warn('Log warn data via browser console.');
      break;
    case EnMessageLevel.Error:
      console.error('Log error data via browser console.');
      break;
  }
};
/** Sends message to vue logger. */
const logVue = (level: EnMessageLevel) => {
  switch (level) {
    case EnMessageLevel.Info:
      log.info('Log info data via browser console.');
      break;
    case EnMessageLevel.Warning:
      log.warn('Log warn data via browser console.');
      break;
    case EnMessageLevel.Error:
      log.error('Log error data via browser console.');
      break;
  }
};
</script>

<template>
  <div class="testArea-wrapper">
    <fieldset>
      <legend>{{ t('testArea.messages.logs.legend') }}</legend>
      <div class="items-vertical">
        <button @click="logBrowser(EnMessageLevel.Info)">{{ t('testArea.messages.logs.browser.info') }}</button>
        <button @click="logBrowser(EnMessageLevel.Warning)">{{ t('testArea.messages.logs.browser.warn') }}</button>
        <button @click="logBrowser(EnMessageLevel.Error)">{{ t('testArea.messages.logs.browser.err') }}</button>
        <button @click="logVue(EnMessageLevel.Info)">{{ t('testArea.messages.logs.vue.info') }}</button>
        <button @click="logVue(EnMessageLevel.Warning)">{{ t('testArea.messages.logs.vue.warn') }}</button>
        <button @click="logVue(EnMessageLevel.Error)">{{ t('testArea.messages.logs.vue.err') }}</button>
      </div>
    </fieldset>
    <fieldset>
      <legend>{{ t('testArea.messages.msgButtons.legend') }}</legend>
      <div class="items-vertical">
        <button @click="genMessage(EnMessageLevel.Info)">{{ t('testArea.messages.msgButtons.info.label') }}</button>
        <button @click="genMessage(EnMessageLevel.Success)">
          {{ t('testArea.messages.msgButtons.success.label') }}
        </button>
        <button @click="genMessage(EnMessageLevel.Warning)">
          {{ t('testArea.messages.msgButtons.warning.label') }}
        </button>
        <button @click="genMessage(EnMessageLevel.Failure)">
          {{ t('testArea.messages.msgButtons.failure.label') }}
        </button>
        <button @click="genMessage(EnMessageLevel.Error)">{{ t('testArea.messages.msgButtons.error.label') }}</button>
      </div>
    </fieldset>
  </div>
  <div class="testArea-wrapper">
    <fieldset>
      <legend>{{ t('testArea.messages.inMessages.legend') }}</legend>
      <div class="items-vertical">
        <div class="onpage-msg info" v-html="t('testArea.messages.inMessages.info')" />
        <div class="onpage-msg success" v-html="t('testArea.messages.inMessages.success')" />
        <div class="onpage-msg warning" v-html="t('testArea.messages.inMessages.warning')" />
        <div class="onpage-msg failure" v-html="t('testArea.messages.inMessages.failure')" />
        <div class="onpage-msg error" v-html="t('testArea.messages.inMessages.error')" />
      </div>
    </fieldset>
  </div>
</template>

<style scoped></style>
