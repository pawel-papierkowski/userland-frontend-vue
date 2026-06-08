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

Features:
- Accept null (not set) value.

Properties:
- v-model - Variable holding selected value.
- :options - Array of options, will be shown.
- disabled - If true, acts as disabled component. Optional, default is false.
- langPrefix - Prefix, used for auto-translating entries in dropdown list.
- placeholder - Translated text to use if nothing is selected.

Notes:
- ComboBox is integrated with vue-i18n.
- Null value is supported as option. Example: const enUserStatus: (string|null)[] = [ null, 'PENDING', 'ACTIVE' ];
*/
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  modelValue: [String, null], // null means nothing is selected
  disabled: {
    type: Boolean,
    default: false
  },
  options: {
    type: Array<string|null>,
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
const arrowClass = computed(() => ({ open: isOpen.value }));

const selectedOption = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

/** If you disable combobox, list of options will close. */
watch(() => props.disabled, () => {
  if (props.disabled) isOpen.value = false;
});

/** User clicked on input. */
const openOptions = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

/** User clicked on option. */
const selectOption = (option: string|null) => {
  selectedOption.value = option;
  isOpen.value = false;
}
</script>

<template>
  <div class="combobox" :class="{ disabled: disabled }" ref="combobox" tabindex="0" @blur="isOpen = false">
    <div class="combobox-selected" @click="openOptions()">
      <span class="combobox-selected-text">{{ selectedOption ? t(langPrefix+'.'+selectedOption) : t(placeholder) }}</span>
      <span class="combobox-arrow" :class="arrowClass"></span>
    </div>
    <div class="combobox-options" v-show="isOpen">
      <div v-for="(option, index) in options" :key="index" class="combobox-option"
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

  margin: 0px;
  padding: 2px;
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

.combobox.disabled {
  color: var(--combobox-disabled-color);
  background: var(--combobox-disabled-background);
}

/**/

.combobox-selected {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 0px 4px;
  cursor: pointer;
}

.combobox-selected-text {
  flex: 1;
}

/* Down arrow. */
.combobox-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--combobox-color);
  transition: transform 0.2s;
}

.combobox-arrow.open {
  transform: rotate(180deg);
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

.combobox-option {
  padding: 1px;
  cursor: pointer;
}

.combobox-option:hover {
  color: var(--combobox-option-text-hover);
  background-color: var(--combobox-option-background-hover);
}
</style>
