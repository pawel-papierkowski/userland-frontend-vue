<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useLogger } from 'vue-logger-plugin';

import { EnMessageLevel, messageLevelStr } from '@/code/stores/messages/types.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';

import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

const log = useLogger();
const { t } = useI18n();

const count: Ref<number> = ref(0);
const canSpin: Ref<boolean> = ref(true);

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

/** Starts spinner. */
const startSpinner = () => {
  canSpin.value = true;
};

/** Stops spinner. */
const stopSpinner = () => {
  canSpin.value = false;
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
      <legend>{{ t('testArea.generalButtons.legend') }}</legend>
      <div class="items-horizontal">
        <button>{{ t('testArea.generalButtons.standard') }}</button>
        <button class="danger">{{ t('testArea.generalButtons.danger') }}</button>
        <button disabled>{{ t('testArea.generalButtons.disabled') }}</button>
      </div>
    </fieldset>
  </div>
  <div class="testArea-wrapper">
    <fieldset>
      <legend>{{ t('testArea.logs.legend') }}</legend>
      <div class="items-vertical">
        <button @click="logBrowser(EnMessageLevel.Info)">{{ t('testArea.logs.browser.info') }}</button>
        <button @click="logBrowser(EnMessageLevel.Warning)">{{ t('testArea.logs.browser.warn') }}</button>
        <button @click="logBrowser(EnMessageLevel.Error)">{{ t('testArea.logs.browser.err') }}</button>
        <button @click="logVue(EnMessageLevel.Info)">{{ t('testArea.logs.vue.info') }}</button>
        <button @click="logVue(EnMessageLevel.Warning)">{{ t('testArea.logs.vue.warn') }}</button>
        <button @click="logVue(EnMessageLevel.Error)">{{ t('testArea.logs.vue.err') }}</button>
      </div>
    </fieldset>
    <fieldset>
      <legend>{{ t('testArea.msgButtons.legend') }}</legend>
      <div class="items-vertical">
        <button @click="genMessage(EnMessageLevel.Info)">{{ t('testArea.msgButtons.info.label') }}</button>
        <button @click="genMessage(EnMessageLevel.Success)">{{ t('testArea.msgButtons.success.label') }}</button>
        <button @click="genMessage(EnMessageLevel.Warning)">{{ t('testArea.msgButtons.warning.label') }}</button>
        <button @click="genMessage(EnMessageLevel.Failure)">{{ t('testArea.msgButtons.failure.label') }}</button>
        <button @click="genMessage(EnMessageLevel.Error)">{{ t('testArea.msgButtons.error.label') }}</button>
      </div>
    </fieldset>
    <fieldset>
      <legend>{{ t('testArea.spinner.legend') }}</legend>
      <div class="spinner-container">
        <SpinnerTorus display="block" size="100px" :canSpin="canSpin" />
        <div class="items-vertical">
          <button @click="startSpinner()">{{ t('testArea.spinner.start') }}</button>
          <button @click="stopSpinner()">{{ t('testArea.spinner.stop') }}</button>
        </div>
      </div>
    </fieldset>
  </div>
  <div class="testArea-wrapper">
    <fieldset>
      <legend>{{ t('testArea.inMessages.legend') }}</legend>
      <div class="items-vertical">
        <div class="onpage-msg info" v-html="t('testArea.inMessages.info')" />
        <div class="onpage-msg success" v-html="t('testArea.inMessages.success')" />
        <div class="onpage-msg warning" v-html="t('testArea.inMessages.warning')" />
        <div class="onpage-msg failure" v-html="t('testArea.inMessages.failure')" />
        <div class="onpage-msg error" v-html="t('testArea.inMessages.error')" />
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
.testArea-wrapper {
  display: flex;
  flex-direction: row; /* Stacks children horizontally. */
  flex-wrap: wrap; /* If not enough space, children will be stacked vertically. */

  align-items: center; /* Centers the items horizontally */
  justify-content: center;

  gap: 1rem;
}
</style>
