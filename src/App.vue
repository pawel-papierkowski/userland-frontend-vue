<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { languages, fallbackLang } from '@/code/data/app/const.ts';

import AppLayout from '@/components/layout/AppLayout.vue';

const { locale } = useI18n();

// Find out current language - either from storage, system language or fallback.
const systemLanguage = navigator.language.split('-')[0] || fallbackLang;
const browserLang = localStorage.getItem('app-language') || systemLanguage;
locale.value = languages.includes(browserLang) ? browserLang : fallbackLang;
</script>

<template>
  <AppLayout />
</template>

<style scoped></style>
