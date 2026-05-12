<script setup lang="ts">
/** Simple footer. */

import { useI18n } from 'vue-i18n';
import { projectProp } from '@/code/data/app/const.ts';

const { t } = useI18n();
</script>

<template>
  <footer>
    <p>
      {{ t('footer.frontendRepository') }}:
      <a href="https://github.com/pawel-papierkowski/userland-frontend-vue" target="_blank" rel="noopener">https://github.com/pawel-papierkowski/userland-frontend-vue</a>
    </p>
    <p>
      {{ t('footer.backendRepository') }}:
      <a href="https://github.com/pawel-papierkowski/userland-backend-java" target="_blank" rel="noopener">https://github.com/pawel-papierkowski/userland-backend-java</a>
    </p>
    <p>
      &copy; {{ projectProp.dateRange }} {{ projectProp.author }} | v. {{ projectProp.version }} {{ projectProp.build }} | <a href="mailto:pawel.papierkowski@gmail.com">pawel.papierkowski@gmail.com</a>
    </p>
  </footer>
</template>

<style scoped></style>
