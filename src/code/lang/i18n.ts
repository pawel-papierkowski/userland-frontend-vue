import { createI18n } from 'vue-i18n';

type DeepRecord = { [key: string]: string | DeepRecord };

const enModules = import.meta.glob('@/locales/en/**/*.json', { eager: true });
const plModules = import.meta.glob('@/locales/pl/**/*.json', { eager: true });
// Add other language directories here as needed...

/**
 * Recursively merge `source` into `target`. Arrays are not merged (source wins).
 * Both are treated as immutable — a new object is returned.
 * @param target Target of merge.
 * @param source Source that should merge into target.
 */
export function deepMerge(target: DeepRecord, source: DeepRecord): DeepRecord {
  const result = { ...target };
  for (const key in source) {
    if (
      source[key] instanceof Object &&
      !Array.isArray(source[key]) &&
      key in result
    ) {
      result[key] = deepMerge(result[key] as DeepRecord, source[key] as DeepRecord);
    } else {
      result[key] = source[key]!;
    }
  }
  return result;
}

/**
 * Iterates over Vite `import.meta.glob` result and deep-merges all default
 * exports into a single plain object.
 * @param modules Content loaded via `import.meta.glob`. Must be eager.
 */
export function loadMessages(modules: Record<string, { default: DeepRecord }>): DeepRecord {
  let messages: DeepRecord = {};
  for (const path in modules) {
    messages = deepMerge(messages, modules[path]?.default ?? {});
  }
  return messages;
}

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
    en: loadMessages(enModules as Record<string, { default: DeepRecord }>),
    pl: loadMessages(plModules as Record<string, { default: DeepRecord }>),
    // Add other languages as needed...
  },
});

export default i18n;
