<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { EnMessageLevel, messageLevelStr } from '@/code/stores/messages/types';
import { AppMessager } from '@/code/stores/messages/AppMessager';

const { t } = useI18n();
const count: Ref<number> = ref(0);

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
</script>

<template>
  <div class="testArea-wrapper">
    <fieldset>
      <legend>{{ t('testArea.msgButtons.legend') }}</legend>
      <div class="testArea-msgButtons">
        <button @click="genMessage(EnMessageLevel.Info)">{{ t('testArea.msgButtons.info.label') }}</button>
        <button @click="genMessage(EnMessageLevel.Success)">{{ t('testArea.msgButtons.success.label') }}</button>
        <button @click="genMessage(EnMessageLevel.Warning)">{{ t('testArea.msgButtons.warning.label') }}</button>
        <button @click="genMessage(EnMessageLevel.Failure)">{{ t('testArea.msgButtons.failure.label') }}</button>
        <button @click="genMessage(EnMessageLevel.Error)">{{ t('testArea.msgButtons.error.label') }}</button>
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
.testArea-wrapper {
  display: flex;
  flex-direction: row; /* Stacks children horizontally */
  align-items: center; /* Centers the items horizontally */
  gap: 1rem; /* Adds consistent spacing between items without margins */
}

.testArea-msgButtons {
  display: flex;
  flex-direction: column; /* Stacks children horizontally */
  align-items: center; /* Centers the items horizontally */
  gap: 1rem; /* Adds consistent spacing between items without margins */

  padding: 10px;
}
</style>
