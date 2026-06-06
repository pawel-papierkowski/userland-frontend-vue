<script setup lang="ts">
/** This is member area. Only logged users can access it, though no other special permissions are needed. */
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <article>
    <h1>{{ t('memberArea.title') }}</h1>
    <p v-html="t('memberArea.welcome')" />
    <p v-html="t('memberArea.description')" />
  </article>
</template>

<style scoped></style>
