<script setup lang="ts">
/** Description of project for slideshow. */
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <p v-html="t('homeArea.welcome')" />
  <p v-html="t('homeArea.description')" />
</template>

<style scoped></style>
