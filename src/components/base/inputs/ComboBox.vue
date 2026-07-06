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
 * - Can disable or mark as invalid.
 * - Component is integrated with vue-i18n.
 *
 * Models:
 * - v-model - Variable holding selected option.
 *
 * Properties:
 * - ident - Used for identification. Optional.
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
    /** Used for identification. */
    ident?: string;
    /** Array of options, will be shown after user clicks on component. Can contain null value for 'unselected'. */
    options: (number | string | null)[];
    /**  If true, acts as disabled component (panels do not show). Optional, default is false. */
    disabled?: boolean;
    /** If true, shows component as having invalid state. Visual only. Optional, default is false. */
    invalid?: boolean;
    /** Prefix, used for auto-translating entries in dropdown list. If empty, options will be shown as is without translation. */
    langPrefix?: string;
    /** Translation key to use if nothing is selected and for 'unselected' option. */
    placeholder?: string;
  }>(),
  {
    ident: '',
    disabled: false,
    invalid: false,
    langPrefix: '',
    placeholder: 'combobox.placeholder',
  },
);

const isOpen = ref(false);
const arrowClass = computed(() => ({ open: isOpen.value }));

//

/** If you disable combobox, list of options will close. */
watch(
  () => props.disabled,
  () => {
    if (props.disabled) isOpen.value = false;
  },
);

//

/** User clicked on input. */
const openOptions = () => {
  if (props.disabled) return;

  isOpen.value = !isOpen.value;
};

/**
 * User clicked on option.
 * @param option Clicked option.
 */
const selectOption = (option: number | string | null) => {
  if (props.disabled) return;

  selOption.value = option;
  isOpen.value = false;
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
  <div class="combobox" :class="{ disabled: disabled, err: invalid }" :data-testid="`combobox_${ident}`"
    ref="combobox" tabindex="0" @blur="isOpen = false">
    <div class="combobox-selected" @click="openOptions()">
      <span class="combobox-selected-text">{{ showOption(selOption) }}</span>
      <span class="combobox-arrow" :class="arrowClass"></span>
    </div>

    <div class="combobox-options" v-show="isOpen">
      <div
        v-for="(option, index) in options"
        :key="index"
        class="combobox-option"
        :data-testid="`combobox_${ident}_${index}`"
        @click="selectOption(option)"
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
.combobox.err .combobox-option:hover {
  color: var(--combobox-option-err-color-hover);
  background-color: var(--combobox-option-err-background-hover);
}
</style>
