<script setup lang="ts">
/** Custom radiobox implementation.
 *
 * Features:
 * - Accept number (so also enums), string or null (not set) value.
 * - Can disable or mark as invalid.
 * - Keyboard navigation via arrows (automatically selects option). Enter/space moves to next component.
 * - Component is integrated with vue-i18n.
 * - Supports WAI-ARIA.
 *
 * Models:
 * - v-model - Variable holding selected option.
 *
 * Properties:
 * - id - Used for identification and id attribute in focusable element (so <label> etc. work properly). Optional.
 * - options - Array of options. Can contain null value for 'unselected'.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 * - invalid - If true, shows component as having invalid state. Visual only. Optional, default is false.
 * - langPrefix - Prefix, used for auto-translating entries in list. If empty, options will be shown as is without translation.
 */
import { nextTick } from 'vue';
import { NavUtils } from '@/code/utils/NavUtils.ts';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

/** Currently selected option. Null means nothing is selected. */
const selOption = defineModel<number | string | null>({ required: true });

const props = withDefaults(
  defineProps<{
    /** Used for identification and id attribute in focusable element (so <label> etc. work properly). Optional. */
    id?: string;
    /** Array of options. Can contain null value for 'unselected'. */
    options: (number | string | null)[];
    /**  If true, acts as disabled component. Optional, default is false. */
    disabled?: boolean;
    /** If true, shows component as having invalid state. Visual only. Optional, default is false. */
    invalid?: boolean;
    /** Prefix, used for auto-translating entries in list. If empty, options will be shown as is without translation. */
    langPrefix?: string;
  }>(),
  {
    id: '',
    disabled: false,
    invalid: false,
    langPrefix: '',
  },
);

//

/** Get option element ID for ARIA and programmatic focus. */
const optionId = (index: number): string => `radiobox_${props.id}_option_${index}`;

//

/**
 * Returns selected element or first element if nothing selected.
 * @returns Active element or null if could not find element.
 */
const findActiveElement = (): HTMLElement | null => {
  const selectedIndex = props.options.findIndex((o) => o === selOption.value);
  const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
  return document.getElementById(optionId(targetIndex));
};

/** Focus on chosen option inside. */
const onGroupFocus = () => {
  // Immediately change focus to actually selected option (or first option if nothing is selected).
  const el = findActiveElement();
  el?.focus();
};

/**
 * User clicked on option.
 * @param option Clicked option.
 * @param index Index of the option for focus management.
 */
const selectOption = (option: number | string | null, index?: number) => {
  if (props.disabled) return;

  selOption.value = option;

  if (index !== undefined) {
    const optionEl = document.getElementById(optionId(index));
    if (optionEl) optionEl.focus();
  }
};

/**
 * Handle keyboard events for accessibility.
 * Arrow keys navigate between options, Space selects the focused option.
 */
const handleKeydown = (e: KeyboardEvent) => {
  if (props.disabled) return;

  const currentIndex = props.options.findIndex((o) => o === selOption.value);
  let nextIndex = currentIndex;

  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      e.preventDefault();
      nextIndex = currentIndex + 1;
      if (nextIndex >= props.options.length) nextIndex = 0; // Wraparound.
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      e.preventDefault();
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) nextIndex = props.options.length - 1; // Wraparound.
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      focusNext();
      break;
    default:
      return;
  }

  if (nextIndex !== currentIndex) {
    selectOption(props.options[nextIndex] ?? null, nextIndex);
  }
};

/**
 * Show text of option.
 * @param option Option to show.
 */
const showOption = (option: number | string | null): number | string | null => {
  if (props.langPrefix) return t(props.langPrefix + '.' + option);
  return option;
};

/** Move focus to the next focusable element on page. */
const focusNext = () => {
  nextTick(() => {
    const el = findActiveElement();
    NavUtils.FocusNext(el);
  });
};
</script>

<template>
  <div class="radiobox-wrapper" :data-testid="`radiobox_${id}`">
    <div
      :id="id"
      class="radiobox"
      :class="{ disabled: disabled, err: invalid }"
      role="radiogroup"
      tabindex="-1"
      @keydown="handleKeydown"
      @focus="onGroupFocus">

      <div
        v-for="(option, index) in options"
        :id="optionId(index)"
        :key="index"
        class="radiobox-option"
        :data-testid="`radiobox_${id}_${index}`"
        role="radio"
        :aria-checked="option === selOption"
        :tabindex="option === selOption && !disabled ? 0 : -1"
        @click="selectOption(option, index)"
      >
        <div class="radiobox-circle">
          <div class="radiobox-inside" :class="{ mark: option === selOption }"></div>
        </div>
        <div class="radiobox-label">{{ showOption(option) }}</div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.radiobox-wrapper {
  user-select: none;
}

.radiobox-option {
  display: grid;
  grid-template-columns: auto 1fr;
}

/**/

.radiobox-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  color: var(--radiobox-color);
  background: var(--radiobox-background);
  border: var(--radiobox-border);
  border-radius: var(--radiobox-border-radius);

  align-self: center;

  width: 0.9em;
  height: 0.9em;

  cursor: pointer;
}

.radiobox-option:hover .radiobox-circle {
  color: var(--radiobox-hover-color);
  background-color: var(--radiobox-hover-background);
}

.radiobox.err .radiobox-circle {
  color: var(--radiobox-err-color);
  background: var(--radiobox-err-background);
  border: var(--radiobox-err-border);
}

.radiobox.disabled .radiobox-circle {
  color: var(--radiobox-disabled-color);
  background: var(--radiobox-disabled-background);

  cursor: default;
}

.radiobox-inside {
  align-self: center;

  width: 0.46em;
  height: 0.46em;
}

.radiobox-inside.mark {
  background: var(--radiobox-inside-background);
  border-radius: var(--radiobox-inside-border-radius);
}

.radiobox-wrapper.err .radiobox-inside.mark {
  background: var(--radiobox-inside-err-background);
}

.radiobox.disabled .radiobox-inside.mark {
  background: var(--radiobox-disabled-color);
}

/**/

.radiobox-label {
  padding: 2px;
  cursor: pointer;
}

.radiobox-wrapper.err .radiobox-label {
  color: var(--radiobox-err-color);
}

.radiobox.disabled .radiobox-label {
  color: var(--radiobox-disabled-color);
  cursor: default;
}
</style>
