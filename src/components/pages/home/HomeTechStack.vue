<script setup lang="ts">
/** Info about tech stack for slideshow. */
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <h4 v-html="t('homeArea.techstack.title')" />
  <div class="items-horizontal">
    <p class="wide" v-html="t('homeArea.techstack.backend')" />
    <p class="wide" v-html="t('homeArea.techstack.frontend')" />
  </div>
</template>

<style scoped>
.wide {
  width: 100%;
}
</style>
