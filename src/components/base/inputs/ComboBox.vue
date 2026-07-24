<script setup lang="ts">
/** Custom combobox implementation. Needed because <select> and <option> have very bad CSS support for dropdown list
 * for all browsers.
 *
 * Component uses CSS variables to set up look&feel of combobox. Variables:
 *   --combobox-color: Text color of combobox field.
 *   --combobox-background: Background color of combobox field.
 *   --combobox-border: Border of combobox field.
 *   --combobox-border-radius: Rounding of border of combobox field.
 *   --combobox-hover-color: Text color of combobox field when mouse hovers over it.
 *   --combobox-hover-background: Background color of combobox field when mouse hovers over it.
 *   --combobox-option-border: Border of dropdown list.
 *   --combobox-option-background: Color of background.
 *   --combobox-option-background-hover: Background color of dropdown option when mouse hovers over it.
 *   --combobox-option-color-hover: Text color of dropdown option when mouse hovers over it.
 * See /styles/var/components-custom.css for full list.
 *
 * Features:
 * - Accept number (so also enums), string or null (not set) value.
 * - You provide list of options. Can use null value as option.
 * - Can disable or mark as invalid.
 * - Component is integrated with vue-i18n.
 * - Keyboard navigation supported via arrows. Enter/space selects option and closes list.
 * - Supports <label>.
 * - Supports WAI-ARIA.
 *
 * Models:
 * - v-model - Variable holding selected option.
 *
 * Properties:
 * - id - Used for identification and id attribute in focusable element (so <label> etc. work properly). Optional.
 * - options - Array of options, will be shown after user clicks on component. Can contain null value for 'unselected'.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 * - invalid - If true, shows component as having invalid state. Visual only. Optional, default is false.
 * - langPrefix - Prefix, used for auto-translating entries in dropdown list. If empty, options will be shown as is without translation.
 * - placeholder - Translated text to use if nothing is selected and for 'unselected' option.
 *
 * Notes:
 * - Null value is supported as option. Example: const enUserStatus: (string|null)[] = [ null, 'PENDING', 'ACTIVE' ];
 */
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

/** Currently selected option. Null means nothing is selected. */
const selOption = defineModel<number | string | null>({ required: true });

const props = withDefaults(
  defineProps<{
    /** Used for identification and id attribute on a hidden <button> (so <label for="id"> works). Optional. */
    id?: string;
    /** Array of options, will be shown after user clicks on component. Can contain null value for 'unselected'. */
    options: (number | string | null)[];
    /** If true, acts as disabled component (panels do not show). Optional, default is false. */
    disabled?: boolean;
    /** If true, shows component as having invalid state. Visual only. Optional, default is false. */
    invalid?: boolean;
    /** Prefix, used for auto-translating entries in dropdown list. If empty, options will be shown as is without translation. */
    langPrefix?: string;
    /** Translation key to use if nothing is selected and for 'unselected' option. */
    placeholder?: string;
  }>(),
  {
    id: '',
    disabled: false,
    invalid: false,
    langPrefix: '',
    placeholder: 'combobox.placeholder',
  },
);


/** Template ref for the root element. */
const comboboxRef = ref<HTMLElement | null>(null);
/** Indicates visibility of combobox list. */
const isOpen = ref(false);
/** Index of currently highlighted option. -1 means none highlighted. */
const highlightedIndex = ref(-1);

/** Get option element ID for aria-activedescendant. */
const optionId = (index: number): string => `combobox_${props.id}_option_${index}`;

/** Tracks if focus handler just opened the list (to suppress synthetic follow-up click). */
let focusOpened = false;

// COMPUTED

/** Class of decorative arrow on right. */
const arrowClass = computed(() => ({ open: isOpen.value }));
/** ID for the listbox used by aria-controls and aria-activedescendant. */
const listboxId = computed(() => `combobox-listbox_${props.id || 'default'}`);

// WATCHES

/** If you disable combobox, list of options will close. */
watch(
  () => props.disabled,
  () => {
    if (props.disabled) {
      isOpen.value = false;
      resetInteractionState();
    }
  },
);

// FUNCTIONS

/** Reset interaction state (must be called when any interaction completes). */
const resetInteractionState = () => {
  focusOpened = false;
};

/** Track new pointer interaction: cancel any pending focus-open so click can toggle. */
const handleMousedown = () => {
  focusOpened = false;
};

/** Handle focus: handles direct clicks, label clicks, and Tab. */
const handleFocus = () => {
  if (props.disabled) return;
  if (!isOpen.value) {
    openList();
    focusOpened = true;
  }
};

/** Handle blur. */
const handleBlur = () => {
  isOpen.value = false;
  highlightedIndex.value = -1;
  resetInteractionState();
};

/** Handle click: both from normal mouse click and label click. */
const handleClick = () => {
  if (props.disabled) return;

  if (focusOpened) {
    // Focus already opened the list (label or Tab). Suppress any synthetic click.
    focusOpened = false;
    return;
  }

  // Toggle for direct clicks and programmatic clicks. Handles both real browser
  // clicks (preceded by mousedown) and test/programmatic clicks (no mousedown).
  isOpen.value = !isOpen.value;
  if (isOpen.value) openList();
  else highlightedIndex.value = -1;
};

// KEYBOARD HANDLERS

/**
 * Handle keyboard events for accessibility.
 * Arrow keys navigate options, Enter/Space select, Escape closes.
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return;

  switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault();
      if (!isOpen.value) {
        openList(true);
      } else {
        // Wraparound.
        highlightedIndex.value = (highlightedIndex.value + 1) % props.options.length;
      }
      break;
    }
    case 'ArrowUp': {
      event.preventDefault();
      if (!isOpen.value) {
        openList(false);
      } else {
        // Wraparound.
        highlightedIndex.value = (highlightedIndex.value - 1 + props.options.length) % props.options.length;
      }
      break;
    }
    case 'Enter':
    case ' ': {
      event.preventDefault();
      if (isOpen.value && highlightedIndex.value >= 0) {
        selectOption(props.options[highlightedIndex.value] ?? null);
      } else if (!isOpen.value) {
        openList();
      }
      break;
    }
    case 'Escape': {
      event.preventDefault();
      isOpen.value = false;
      highlightedIndex.value = -1;
      resetInteractionState();
      break;
    }
  }
};

/** Open list. */
const openList = (top:boolean|null=null) => {
  isOpen.value = true;

  // Set visually selected entry, if any. Works with null selection.
  highlightedIndex.value = props.options.findIndex((o) => o === selOption.value);

  if (highlightedIndex.value === -1 && top !== null) {
    // Still nothing highlighted and we want to highlight either beginning or end of list.
    highlightedIndex.value = top ? 0 : props.options.length - 1;
  }
}

/**
 * User clicked on combobox option.
 * @param option Clicked option.
 */
const selectOption = (option: number | string | null) => {
  if (props.disabled) return;

  selOption.value = option;
  isOpen.value = false;
  resetInteractionState();
};

/**
 * Show text of option.
 * @param option Option to show.
 */
const showOption = (option: number | string | null): number | string | null => {
  if (option === null) {
    if (props.langPrefix) return t(props.placeholder);
    return props.placeholder;
  }
  if (props.langPrefix) return t(props.langPrefix + '.' + option);
  return option;
};

</script>

<template>
  <div
    :data-testid="`combobox_${id}`"
    class="combobox"
    :class="{ disabled: disabled, err: invalid }"
    ref="comboboxRef"
    role="combobox"
    :aria-expanded="isOpen"
    aria-haspopup="listbox"
    :aria-controls="listboxId"
    :aria-activedescendant="highlightedIndex >= 0 ? optionId(highlightedIndex) : undefined"
    :aria-disabled="disabled || undefined"
    :tabindex="disabled ? -1 : 0"
    @mousedown="handleMousedown()"
    @focus="handleFocus()"
    @blur="handleBlur()"
    @click="handleClick()"
    @keydown="handleKeydown"
  >
    <!-- Hidden button: labelable target for <label for="...">. -->
    <!-- We do not need @click here, as it will bubble up to div's @click above. -->
    <button
      :id="id"
      class="hidden-label-button"
      tabindex="-1"
      aria-hidden="true"
    ></button>

    <div class="combobox-selected">
      <span class="combobox-selected-text">{{ showOption(selOption) }}</span>
      <span class="combobox-arrow" :class="arrowClass"></span>
    </div>

    <div class="combobox-options" v-show="isOpen" :id="listboxId" role="listbox">
      <div
        v-for="(option, index) in options"
        :key="index"
        :id="optionId(index)"
        class="combobox-option"
        :class="{ highlighted: highlightedIndex === index }"
        :data-testid="`combobox_${id}_${index}`"
        role="option"
        :aria-selected="option === selOption"
        @click.stop="selectOption(option)"
        @mouseenter="highlightedIndex = index"
      >
        {{ showOption(option) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.combobox {
  position: relative;
  display: inline-block;

  margin: 0px;
  padding: var(--spacing-xxs);
  min-width: 125px;

  color: var(--combobox-color);
  background: var(--combobox-background);
  border: var(--combobox-border);
  border-radius: var(--combobox-border-radius);

  user-select: none;
}

.combobox:hover {
  color: var(--combobox-hover-color);
  background-color: var(--combobox-hover-background);
}

.combobox.err {
  color: var(--combobox-err-color);
  background: var(--combobox-err-background);
  border: var(--combobox-err-border);
}

.combobox.disabled {
  color: var(--combobox-disabled-color);
  background: var(--combobox-disabled-background);
}

/**/

.combobox-selected {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: var(--combobox-selected-padding);
  cursor: pointer;
}

.combobox.disabled .combobox-selected {
  cursor: unset;
}

.combobox-selected-text {
  flex: 1;
}

/* Down arrow. */
.combobox-arrow {
  width: 0;
  height: 0;
  margin-left: var(--spacing-xs);
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--combobox-color);
  transition: transform 0.2s;
}

.combobox-arrow.open {
  transform: rotate(180deg);
}

.combobox.disabled .combobox-arrow {
  border-top: 6px solid var(--combobox-disabled-color);
}

.combobox.err .combobox-arrow {
  border-top: 6px solid var(--combobox-err-color);
}

/**/

.combobox-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;

  margin: 0px;
  padding: 3px;

  border: var(--combobox-option-border);
  border-radius: 5px;
  background: var(--combobox-option-background);

  min-width: 150px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 10010;
}
.combobox.err .combobox-options {
  background: var(--combobox-option-err-background);
}

.combobox-option {
  padding: 1px;
  cursor: pointer;
}

.combobox-option:hover {
  color: var(--combobox-option-color-hover);
  background-color: var(--combobox-option-background-hover);
}

.combobox-option.highlighted {
  color: var(--combobox-option-color-hover);
  background-color: var(--combobox-option-background-hover);
}
.combobox.err .combobox-option:hover,
.combobox.err .combobox-option.highlighted {
  color: var(--combobox-option-err-color-hover);
  background-color: var(--combobox-option-err-background-hover);
}
</style>
