<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { EnMessageLevel, messageLevelStr } from '@/code/stores/messages/types';
import { AppMessager } from '@/code/stores/messages/AppMessager';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

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
}

/** Stops spinner. */
const stopSpinner = () => {
  canSpin.value = false;
}
</script>

<template>
  <div class="testArea-wrapper">
    <fieldset>
      <legend>{{ t('testArea.generalButtons.legend') }}</legend>
      <div class="buttons-horizontal">
        <button>{{ t('testArea.generalButtons.standard') }}</button>
        <button class="danger">{{ t('testArea.generalButtons.danger') }}</button>
        <button disabled>{{ t('testArea.generalButtons.disabled') }}</button>
      </div>
    </fieldset>
  </div>
  <div class="testArea-wrapper">
    <fieldset>
      <legend>{{ t('testArea.msgButtons.legend') }}</legend>
      <div class="buttons-vertical">
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
        <div class="buttons-vertical">
          <button @click="startSpinner()">{{ t('testArea.spinner.start') }}</button>
          <button @click="stopSpinner()">{{ t('testArea.spinner.stop') }}</button>
        </div>
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
.testArea-wrapper {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row; /* Stacks children horizontally */

  align-items: center; /* Centers the items horizontally */
  justify-content: center;

  gap: 1rem; /* Adds consistent spacing between items without margins */
}

</style>
