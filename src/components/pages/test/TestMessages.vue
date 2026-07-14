<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useLogger } from 'vue-logger-plugin';

import { EnMessageLevel, messageLevelStr } from '@/code/stores/messages/types.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';

import type { TestAreaMessageForm } from '@/code/data/other/test-area.ts';

import TextBox from '@/components/base/inputs/TextBox.vue';

const log = useLogger();
const { t } = useI18n();

const form: Ref<TestAreaMessageForm> = ref({
  count: 0,
  time: -1,
  title: '',
  content: '',
});

/**
 * Generate message.
 * @param level Level of message.
 */
const genMessage = (level: EnMessageLevel) => {
  form.value.count++;
  let duration: number|undefined = form.value.time;
  let title = form.value.title;
  let content = form.value.content;

  if (form.value.time === -1) {
    duration = undefined; // use default duration
  }
  if (!form.value.title) {
    const titleKey = 'testArea.messages.msgButtons.' + messageLevelStr(level) + '.title';
    title = t(titleKey);
  }
  if (!form.value.content) {
    const contentKey = 'testArea.messages.msgButtons.' + messageLevelStr(level) + '.content';
    content = t(contentKey, { count: form.value.count });
  }

  switch (level) {
    case EnMessageLevel.Info:
      AppMessager.info(title, content, duration);
      break;
    case EnMessageLevel.Success:
      AppMessager.success(title, content, duration);
      break;
    case EnMessageLevel.Warning:
      AppMessager.warning(title, content, duration);
      break;
    case EnMessageLevel.Failure:
      AppMessager.failure(title, content, duration);
      break;
    case EnMessageLevel.Error:
      // we need to create fake axios error
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            errCode: 'test_0001',
          },
        },
      };
      AppMessager.error(axiosError, title, content, duration);
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

        <div class="items-horizontal"><input type="range" min="-1" max="100" step="1" v-model="form.time" /> {{ form.time }}</div>
        <TextBox
          id="titleTextbox"
          v-model="form.title"
          autocomplete="off"
          :placeholder="t('testArea.messages.placeholder.title')"
        />
        <TextBox
          id="contentTextbox"
          v-model="form.content"
          autocomplete="off"
          :placeholder="t('testArea.messages.placeholder.content')"
        />
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
