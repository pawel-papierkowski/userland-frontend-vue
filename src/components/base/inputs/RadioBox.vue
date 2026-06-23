<script setup lang="ts">
/**
 * Custom radiobox implementation.
 *
 * Features:
 * - Accept number (so also enums), string or null (not set) value.
 * - Component is integrated with vue-i18n.
 *
 * Models:
 * - v-model - Variable holding chosen radio value.
 *
 * Properties:
 * - options - Array of options.
 * - disabled - If true, acts as disabled component. Optional, default is false.
 * - langPrefix - Prefix, used for auto-translating entries in dropdown list. If empty, options will be shown as is without translation.
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  /** Variable holding selected value. */
  modelValue: [Number, String, null], // null means nothing is selected
  /** Array of options. Can contain null value for 'unselected'. */
  options: {
    type: Array<number|string|null>,
    default: () => []
  },
  /** If true, acts as disabled component. Optional, default is false. */
  disabled: {
    type: Boolean,
    default: false
  },
  /** Prefix, used for auto-translating entries in dropdown list. If empty, options will be shown as is without translation. */
  langPrefix: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

//

const selectedOption = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

//

/**
 * User clicked on option.
 * @param option Clicked option.
 */
const selectOption = (option: number|string|null) => {
  if (props.disabled) return;
  selectedOption.value = option;
}

/**
 * Show text of option.
 * @param option Option to show.
 */
const showOption = (option: number|string|null): number|string|null => {
  if (props.langPrefix) return t(props.langPrefix+'.'+option);
  return option;
}
</script>

<template>
  <div class="radiobox-wrapper">
    <div class="radiobox" :class="{disabled: disabled}">
      <div v-for="(option, index) in options" :key="index" class="radiobox-option"
        @click="selectOption(option)">
        <div class="radiobox-circle">
          <div class="radiobox-inside" :class="{mark: option === selectedOption}"></div>
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

.radiobox {

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

.radiobox-wrapper.err .radiobox-circle {
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

  width: 0.45em;
  height: 0.45em;
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
