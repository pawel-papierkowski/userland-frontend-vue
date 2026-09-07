<script setup lang="ts" generic="E extends Record<string, any>">
/**
 * Handle table entry options based on metadata for this entry.
 *
 * Generics:
 * - E: Type of table entry.
 *
 * Properties:
 * - tableId - Identifier of table.
 * - rowIndex - Index of row in table. -1 means options are assigned to special row, -2 means options are for whole table (like adding entry).
 * - meta - Metadata for this entry.
 * - entry - Entry itself.
 * - langPrefix - Prefix for language key.
 * - actions - Actions to execute when user clicks on option.
 * - isBusy - If true, disable all options.
 */
import { useI18n } from 'vue-i18n';

import type { EntryMeta, EntryOption } from '@/code/data/features/common/type.ts';

const { t } = useI18n();

const props = defineProps<{
  tableId: string;
  rowIndex: number;
  meta: EntryMeta | null;
  entry: E | null;
  langPrefix: string;
  actions: Record<string, (entry: E | null) => void | Promise<void>>;
  isBusy: boolean;
}>();

//

/**
 * Check if the option can be used.
 * @param option Option.
 * @returns True if the option can be used, otherwise false.
 */
const optionCanUse = (option: EntryOption): boolean => {
  if (option == null || props.isBusy) return false;
  return option.access === 'ENABLED';
};

/**
 * Check if the option is visible.
 * @param option Option.
 * @returns True if the option can be seen, otherwise false.
 */
const optionCanSee = (option: EntryOption): boolean => {
  if (option == null) return false;
  return option.access !== 'INVISIBLE';
};

/**
 * Get dynamic class of the option.
 * @param option Option.
 */
const optionClass = (option: EntryOption) => {
  return {
    disabled: !optionCanUse(option),
  };
};

/**
 * Resolve tooltip for the option.
 * @param option Option.
 */
const optionTooltip = (option: EntryOption, key: string): string => {
  const reason = option?.reason ? option.reason : 'action';
  // Example:
  // - langPrefix = 'admin.user.config.table.texts'
  // - key = 'delete'
  // - reason = 'adminOnly'
  // Result: 'admin.user.config.table.texts.delete.adminOnly'
  return `${props.langPrefix}.${key}.${reason}`;
};

/**
 * Execute the option.
 * @param option Entry option.
 * @param key Key.
 */
const optionExecute = async (option: EntryOption, key: string) => {
  if (!optionCanUse(option)) return;

  const action = props.actions?.[key];
  if (action) {
    await action(props.entry);
  } else {
    console.warn(`Action '${key}' not implemented in parent.`);
  }
};

/**
 * React to key press while we are focused on the given option.
 * @param e Keyboard event.
 * @param option Entry option.
 * @param key Key.
 */
const onKeyDown = async (e: KeyboardEvent, option: EntryOption, key: string) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      await optionExecute(option, key);
      break;
  }
};
</script>

<template>
  <div class="entry-content">
    <template v-for="(option, key) in meta?.options" :key="key">
      <div
        v-if="optionCanSee(option)"
        :data-testid="`${tableId}_${rowIndex}_opt_${key}`"
        class="entry-btn"
        :class="optionClass(option)"
        :title="t(optionTooltip(option, key))"
        :tabindex="optionCanUse(option) ? 0 : -1"
        @keydown="onKeyDown($event, option, key)"
        @click="optionExecute(option, key)"
      >
        {{ t(langPrefix + '.' + key + '.button') }}
      </div>
    </template>
  </div>
</template>

<style scoped></style>
