<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { languages, fallbackLang } from '@/code/data/app/const.ts';
import { locstLang, locstJwt } from '@/code/data/app/storage.ts';
import { durSessionExpired } from '@/stores/messages/const.ts';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
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
  if (jwt !== null) {
    const result = AppLoginer.login(jwt);
    if (!result) {
      AppMessager.warningT('user.session.msg.warning.title', 'user.session.msg.warning.content', durSessionExpired);
    }
  }
};

refreshLang();
relogUser();
</script>

<template>
  <AppLayout />
</template>

<style scoped></style>
