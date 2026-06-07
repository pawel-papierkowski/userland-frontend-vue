<script setup lang="ts">
/** Info about components for slideshow. */
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <p v-html="t('homeArea.components')" />
</template>

<style scoped>
</style>
