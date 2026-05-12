<script setup lang="ts">
/*
We need to use custom combobox implementation because for some reason <select> and <option>
have very bad CSS support for dropdown list for all browsers.

Component uses CSS variables to set up look&feel of combobox. Variables:
  --combobox-border: Border of combobox field.
  --combobox-background: Background color of combobox field.
  --combobox-text: Text color of combobox field.
  --combobox-background-hover: Background color of combobox field when mouse hovers over it.
  --combobox-text-hover: Text color of combobox field when mouse hovers over it.
  --combobox-option-border: Border of dropdown list.
  --combobox-option-background: Color of background.
  --combobox-option-background-hover: Background color of dropdown option when mouse hovers over it.
  --combobox-option-text-hover: Text color of dropdown option when mouse hovers over it.

Properties:
- v-model - Variable holding selected value.
- :options - Array of options, will be shown.
- langPrefix - Prefix, used for auto-translating entries in dropdown list.
- placeholder - Translated text to use if nothing is selected.

Notes:
- ComboBox is integrated with vue-i18n.
*/

import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  modelValue: String,
  options: {
    type: Array<string>,
    default: () => []
  },
  langPrefix: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'tags.combobox.placeholder'
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const arrowClass = computed(() => ({ open: isOpen.value }))

const selectedOption = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const selectOption = (option: string) => {
  selectedOption.value = option;
  isOpen.value = false;
}
</script>

<template>
  <div class="combobox" ref="combobox" tabindex="0" @blur="isOpen = false">
    <div class="selected" @click="isOpen = !isOpen">
      <span class="selected-text">{{ t(langPrefix+'.'+selectedOption) || t(placeholder) }}</span>
      <span class="arrow" :class="arrowClass"></span>
    </div>
    <div class="options" v-show="isOpen">
      <div v-for="option in options" :key="option" class="option"
        @click="selectOption(option)">
        {{ t(langPrefix+'.'+option) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.combobox {
  position: relative;
  display: inline-block;

  margin: 0px 5px;
  padding: 0px;

  color: var(--combobox-text);
  background: var(--combobox-background);

  border: var(--combobox-border);
  border-radius: 5px;
  min-width: 125px;
}

.combobox:hover {
  color: var(--combobox-text-hover);
  background-color: var(--combobox-background-hover);
}

/**/

.selected {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 0px 4px;
  cursor: pointer;
}

.selected-text {
  flex: 1;
}

.arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--combobox-text);
  transition: transform 0.2s;
}

.arrow.open {
  transform: rotate(180deg);
}

/**/

.options {
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

.option {
  padding: 1px;
  cursor: pointer;
}

.option:hover {
  color: var(--combobox-option-text-hover);
  background-color: var(--combobox-option-background-hover);
}
</style>
