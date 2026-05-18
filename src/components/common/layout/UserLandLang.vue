<script setup lang="ts">
/** This subpanel of header allows selecting new language. */

import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { languages, fallbackLang } from '@/code/data/app/const.ts';

const currentLanguage = ref(fallbackLang);
const systemLanguage = navigator.language.split('-')[0] || fallbackLang;
const { t, locale } = useI18n();

onMounted(() => { // Triggered on beginning.
  const savedLang = localStorage.getItem('app-language') || systemLanguage;
  setLanguage(savedLang);
});

watch(currentLanguage, (newVal) => { // Triggered when value of currentLanguage changes.
  applyLanguage(newVal);
});

//

// Set new language. Triggers watch.
const setLanguage = (langKey: string) => {
  currentLanguage.value = langKey;
};

// Apply given language. Saves language code to storage and updates all texts on page to new language.
const applyLanguage = (langKey: string) => {
  localStorage.setItem('app-language', langKey); // preserve between browser sessions
  locale.value = langKey;
};
</script>

<template>
  <template v-for="language in languages" :key="language">
    <div class="lang-container" @click="setLanguage(language)" :title="t('languages.'+language+'.name')">
      {{ t('languages.'+language+'.flag') }}
    </div>
  </template>
</template>

<style scoped>
.lang-container {
  font-size: 18px;
  cursor: pointer; /* Changes the mouse to a pointing hand */
  user-select: none; /* Prevents text highlighting when clicking rapidly */
}
</style>
