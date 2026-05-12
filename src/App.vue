<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { languages } from '@/code/data/app/const.ts';

import AppLayout from '@/components/layout/AppLayout.vue';

const { locale } = useI18n();

// Find out current language - either from storage or fallback.
const browserLang = localStorage.getItem('app-language') || 'en';
locale.value = languages.includes(browserLang) ? browserLang : 'en';
</script>

<template>
  <AppLayout />
</template>

<style scoped></style>
