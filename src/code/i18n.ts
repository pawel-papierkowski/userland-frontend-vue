import { createI18n } from 'vue-i18n';

import en from '@/locales/en.json';
import pl from '@/locales/pl.json';

/** Vue plugin, needs to be installed in main.ts: app.use(i18n); */
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  async: false,
  messages: {
    en,
    pl
  },
});

export default i18n;
