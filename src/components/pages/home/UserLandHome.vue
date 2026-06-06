<script setup lang="ts">
/** This is home area. Everyone can access it. */
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <article>
    <h1>{{ t('homeArea.title') }}</h1>
    <p v-html="t('homeArea.welcome')" />
    <p v-html="t('homeArea.description')" />
    <div class="items-horizontal">
      <p class="wide" v-html="t('homeArea.techstack.backend')" />
      <p class="wide" v-html="t('homeArea.techstack.frontend')" />
    </div>
  </article>
</template>

<style scoped>

.wide {
  width: 100%;
}
</style>
