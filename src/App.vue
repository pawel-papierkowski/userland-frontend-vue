<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { languages, fallbackLang, locstLang, locstJwt } from '@/code/data/app/const.ts';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';
import AppLayout from '@/components/layout/AppLayout.vue';

const { locale } = useI18n();

/** Find out current language - either from storage, system language or fallback. */
const refreshLang = () => {
  const systemLanguage = navigator.language.split('-')[0] || fallbackLang;
  const browserLang = localStorage.getItem(locstLang) || systemLanguage;
  locale.value = languages.includes(browserLang) ? browserLang : fallbackLang;
};

/** If JWT is present in storage, relog user. */
const relogUser = () => {
  const jwt = localStorage.getItem(locstJwt) || null;
  if (jwt !== null) AppLoginer.login(jwt);
};

refreshLang();
relogUser();
</script>

<template>
  <AppLayout />
</template>

<style scoped></style>
