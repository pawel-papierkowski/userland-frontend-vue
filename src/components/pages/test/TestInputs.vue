<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { enTestComboBox, enTestRadioBox, EnInputMode, enModeOptions } from '@/code/data/other/test-area.ts';
import type { TestAreaInputForm } from '@/code/data/other/test-area.ts';

import { TimeUtils } from '@/code/utils/TimeUtils';
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

/** Compute input class. */
const inputClass = computed(() => {
   return form.value.mode === EnInputMode.Error ? 'err' : '';
});
/** Compute disabled. */
const disabled = computed(() => {
   return form.value.mode === EnInputMode.Disabled;
});

//

/**
 * Show value as text or emoji.
 * @param value Value to show.
 * @returns Value as string.
 */
const show = (value: string|boolean|null): string => {
  if (value === null) return '❓';
  if (typeof value === 'boolean') return value ? '✅' : '❌'
  return value;
}
</script>

<template>
  <div class="testArea-wrapper">
    <div class="form-semiwide">
      <div class="form-subform">
        <label for="checkbox">{{ t('testArea.inputs.mode.name') }}:</label>
        <RadioBox id="radiobox" data-testid="radiobox" v-model="form.mode" :options="enModeOptions"
           langPrefix="testArea.inputs.mode" />
      </div>

      <hr/>

      <div class="form-subform-custom">
        <label for="inputText">{{ t('testArea.inputs.inputText') }}:</label>
        <input id="inputText" type="text" v-model="form.inputText" autocomplete="off"
          :class="inputClass" :disabled="disabled" />
        <div>{{ show(form.inputText) }}</div>

        <label for="status">{{ t('testArea.inputs.comboBox') }}:</label>
        <ComboBox id="combobox" data-testid="combobox" v-model="form.comboBox" :options="enTestComboBox"
          langPrefix="tech.user.status" placeholder="tech.user.status.null"
          :class="inputClass" :disabled="disabled"
        />
        <div>{{ show(form.comboBox) }}</div>

        <label for="checkbox">{{ t('testArea.inputs.checkBox') }}:</label>
        <CheckBox id="checkbox" data-testid="checkbox" v-model="form.checkbox" :allowNull="true"
          :class="inputClass" :disabled="disabled" />
        <div>{{ show(form.checkbox) }}</div>

        <label for="radiobox">{{ t('testArea.inputs.radioBox.label') }}:</label>
        <RadioBox id="radiobox" data-testid="radiobox" v-model="form.radiobox" :options="enTestRadioBox"
           langPrefix="test.radioBox"
          :class="inputClass" :disabled="disabled" />
        <div>{{ show(form.radiobox) }}</div>

        <label for="dateTimePicker">{{ t('testArea.inputs.dateTimePicker') }}:</label>
        <DateTimePicker v-model="form.dateTime" ident="dateTimePicker" mode="datetime"
          :class="inputClass" :disabled="disabled" />
        <div>{{ show(TimeUtils.cnvFull(form.dateTime)) }}</div>

        <label for="datePicker">{{ t('testArea.inputs.datePicker') }}:</label>
        <DateTimePicker v-model="form.date" ident="datePicker" mode="date"
          :class="inputClass" :disabled="disabled" />
        <div>{{ show(TimeUtils.cnvFull(form.date)) }}</div>

        <label for="timePicker">{{ t('testArea.inputs.timePicker') }}:</label>
        <DateTimePicker v-model="form.time" ident="timePicker" mode="time"
          :class="inputClass" :disabled="disabled" />
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
