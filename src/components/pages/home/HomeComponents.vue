<script setup lang="ts">
/** Info about components for slideshow. */
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <h4 v-html="t('homeArea.components.title')" />
  <ul>
    <li v-html="t('homeArea.components.ComboBox')"></li>
    <li v-html="t('homeArea.components.CheckBox')"></li>
    <li v-html="t('homeArea.components.DateTimePicker')"></li>
    <li v-html="t('homeArea.components.SlideShow')"></li>
    <li v-html="t('homeArea.components.MessageContainer')"></li>
    <li v-html="t('homeArea.components.Table')"></li>
    <li v-html="t('homeArea.components.SpinnerTorus')"></li>
  </ul>
</template>

<style scoped>
</style>
