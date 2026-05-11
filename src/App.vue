<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { languages } from '@/code/data/app/const.ts';

import UserLandHeader from '@/components/layout/UserLandHeader.vue';
import UserLandFooter from '@/components/layout/UserLandFooter.vue';

const { locale } = useI18n();

// Find out current language - either from storage or fallback.
const browserLang = localStorage.getItem('app-language') || 'en';
locale.value = languages.includes(browserLang) ? browserLang : 'en';
</script>

<template>
  <UserLandHeader />

  <main>
    <h1>Placeholder H1</h1>
    <p>
      Placeholder text
    </p>
  </main>

  <UserLandFooter />
</template>

<style scoped></style>
