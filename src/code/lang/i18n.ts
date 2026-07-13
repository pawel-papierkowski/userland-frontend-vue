import { createI18n } from 'vue-i18n';

import en from '@/locales/en.json';
import pl from '@/locales/pl.json';
// Add other language files here as needed...

/** Vue i18n plugin.
 *
 * Needs to be installed in `main.ts`:
 * ```app.use(i18n);```
 *
 * Usage in code:
 * ```
 * import { useI18n } from 'vue-i18n';
 * const { t } = useI18n();
 * const translatedText = t('text.key');
 * ```
 * Usage in `<template>`:
 * ```
 * <div>{{ t('text.key') }}</div> <!-- text will have html escaped -->
 * <div v-html="t('text.key')" /> <!-- without escaping html -->
 * ```
 */
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  warnHtmlMessage: false,
  async: false,
  messages: {
    en,
    pl,
  },
});

export default i18n;
