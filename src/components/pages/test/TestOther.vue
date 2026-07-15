<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

const { t } = useI18n();

const canSpin = ref(true);

/** Starts spinner. */
const startSpinner = () => {
  canSpin.value = true;
};

/** Stops spinner. */
const stopSpinner = () => {
  canSpin.value = false;
};
</script>

<template>
  <div class="testArea-wrapper">
    <fieldset>
      <legend>{{ t('testArea.other.generalButtons.legend') }}</legend>
      <div class="items-horizontal">
        <button>{{ t('testArea.other.generalButtons.standard') }}</button>
        <button class="danger">{{ t('testArea.other.generalButtons.danger') }}</button>
        <button disabled>{{ t('testArea.other.generalButtons.disabled') }}</button>
      </div>
    </fieldset>
  </div>
  <div class="testArea-wrapper">
    <fieldset>
      <legend>{{ t('testArea.other.spinner.legend') }}</legend>
      <div class="spinner-container">
        <SpinnerTorus display="block" size="100px" :canSpin="canSpin" />
        <div class="items-vertical">
          <button @click="startSpinner()">{{ t('testArea.other.spinner.start') }}</button>
          <button @click="stopSpinner()">{{ t('testArea.other.spinner.stop') }}</button>
        </div>
      </div>
    </fieldset>
  </div>
</template>

<style scoped></style>
