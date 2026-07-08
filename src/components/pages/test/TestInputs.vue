<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { enTestComboBox, enTestRadioBox, EnInputMode, enModeOptions } from '@/code/data/other/test-area.ts';
import type { TestAreaInputForm } from '@/code/data/other/test-area.ts';

import { TimeUtils } from '@/code/utils/TimeUtils';
import TextBox from '@/components/base/inputs/TextBox.vue';
import ComboBox from '@/components/base/inputs/ComboBox.vue';
import CheckBox from '@/components/base/inputs/CheckBox.vue';
import RadioBox from '@/components/base/inputs/RadioBox.vue';
import DateTimePicker from '@/components/base/inputs/datetimepicker/DateTimePicker.vue';

const { t } = useI18n();

const form: Ref<TestAreaInputForm> = ref({
  mode: EnInputMode.Standard,
  inputText: null,
  comboBox: null,
  checkbox: null,
  radiobox: null,
  dateTime: null,
  date: null,
  time: null,
});

//

/** Compute disabled. */
const disabled = computed(() => {
  return form.value.mode === EnInputMode.Disabled;
});
/** Compute invalid. */
const invalid = computed(() => {
  return form.value.mode === EnInputMode.Error;
});

//

/**
 * Show value as text or emoji.
 * @param value Value to show.
 * @returns Value as string.
 */
const show = (value: string | boolean | null): string => {
  if (value === null) return '❓';
  if (typeof value === 'boolean') return value ? '✅' : '❌';
  return value;
};
</script>

<template>
  <div class="testArea-wrapper">
    <div class="form-semiwide">
      <div class="form-subform">
        <label for="checkbox">{{ t('testArea.inputs.mode.name') }}:</label>
        <RadioBox
          id="radiobox"
          data-testid="radiobox"
          v-model="form.mode"
          :options="enModeOptions"
          langPrefix="testArea.inputs.mode"
        />
      </div>

      <hr />

      <div class="form-subform-custom">
        <label for="inputText">{{ t('testArea.inputs.inputText') }}:</label>
        <TextBox
          id="testCombobox"
          ident="testTextbox"
          v-model="form.inputText"
          autocomplete="off"
          placeholder="Enter some text"
          :disabled="disabled"
          :invalid="invalid"
        />
        <div>{{ show(form.inputText) }}</div>

        <label for="testCombobox">{{ t('testArea.inputs.comboBox') }}:</label>
        <ComboBox
          id="testCombobox"
          ident="testCombobox"
          v-model="form.comboBox"
          :options="enTestComboBox"
          langPrefix="tech.user.status"
          placeholder="tech.user.status.null"
          :disabled="disabled"
          :invalid="invalid"
        />
        <div>{{ show(form.comboBox) }}</div>

        <label for="testCheckbox">{{ t('testArea.inputs.checkBox') }}:</label>
        <CheckBox
          id="testCheckbox"
          ident="testCheckbox"
          v-model="form.checkbox"
          :allowNull="true"
          :disabled="disabled"
          :invalid="invalid"
        />
        <div>{{ show(form.checkbox) }}</div>

        <label for="testRadiobox">{{ t('testArea.inputs.radioBox.label') }}:</label>
        <RadioBox
          id="testRadiobox"
          ident="testRadiobox"
          v-model="form.radiobox"
          :options="enTestRadioBox"
          langPrefix="test.radioBox"
          :disabled="disabled"
          :invalid="invalid"
        />
        <div>{{ show(form.radiobox) }}</div>

        <label for="testDateTimePicker">{{ t('testArea.inputs.dateTimePicker') }}:</label>
        <DateTimePicker
          id="testDateTimePicker"
          ident="testDateTimePicker"
          v-model="form.dateTime"
          mode="datetime"
          :allowNull="true"
          :disabled="disabled"
          :invalid="invalid"
        />
        <div>{{ show(TimeUtils.cnvFull(form.dateTime)) }}</div>

        <label for="testDatePicker">{{ t('testArea.inputs.datePicker') }}:</label>
        <DateTimePicker
          id="testDatePicker"
          ident="testDatePicker"
          v-model="form.date"
          mode="date"
          :allowNull="true"
          :showWeeks="true"
          :disabled="disabled"
          :invalid="invalid"
        />
        <div>{{ show(TimeUtils.cnvFull(form.date)) }}</div>

        <label for="testTimePicker">{{ t('testArea.inputs.timePicker') }}:</label>
        <DateTimePicker
          id="testTimePicker"
          ident="testTimePicker"
          v-model="form.time"
          mode="time"
          :allowNull="true"
          :disabled="disabled"
          :invalid="invalid"
        />
        <div>{{ show(TimeUtils.cnvFull(form.time)) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-subform-custom {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  gap: 0.3rem;

  align-items: center;
  justify-content: center;
  justify-items: stretch;

  margin-bottom: 6px;

  white-space: nowrap;
}
.form-subform-custom input[type='checkbox'] {
  justify-self: start;
}

.form-subform-radio {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.2rem;

  align-items: center;
  justify-content: center;
  justify-items: stretch;
}
.form-subform-radio input {
  cursor: pointer;
}
.form-subform-radio label {
  cursor: pointer;
}
</style>
