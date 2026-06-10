<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { enTestComboBox } from '@/code/data/other/test-area.ts';
import type { TestAreaInputForm } from '@/code/data/other/test-area.ts';

import { TimeUtils } from '@/code/utils/TimeUtils';
import ComboBox from '@/components/base/inputs/ComboBox.vue';
import DateTimePicker from '@/components/base/inputs/datetimepicker/DateTimePicker.vue';

const { t } = useI18n();

const form: Ref<TestAreaInputForm> = ref({
  inputText: null,
  comboBox: null,
  checkbox: null,
  dateTime: null,
  date: null,
  time: null,
});

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
      <div class="form-subform-custom">
        <label for="inputText">{{ t('testArea.inputs.inputText') }}:</label>
        <input id="inputText" type="text" v-model="form.inputText" autocomplete="off" />
        <div>{{ show(form.inputText) }}</div>

        <label for="status">{{ t('testArea.inputs.comboBox') }}:</label>
        <ComboBox
          v-model="form.comboBox"
          :options="enTestComboBox"
          langPrefix="tech.user.status"
          placeholder="tech.user.status.null"
        />
        <div>{{ show(form.comboBox) }}</div>

        <label for="checkbox">{{ t('testArea.inputs.checkbox') }}:</label>
        <input id="checkbox" data-testid="checkbox" type="checkbox" v-model="form.checkbox" autocomplete="off" />
        <div>{{ show(form.checkbox) }}</div>

        <label for="dateTimePicker">{{ t('testArea.inputs.dateTimePicker') }}:</label>
        <DateTimePicker v-model="form.dateTime" ident="dateTimePicker" mode="datetime" />
        <div>{{ show(TimeUtils.cnvFull(form.dateTime)) }}</div>

        <label for="datePicker">{{ t('testArea.inputs.datePicker') }}:</label>
        <DateTimePicker v-model="form.date" ident="datePicker" mode="date" />
        <div>{{ show(TimeUtils.cnvFull(form.date)) }}</div>

        <label for="timePicker">{{ t('testArea.inputs.timePicker') }}:</label>
        <DateTimePicker v-model="form.time" ident="timePicker" mode="time" />
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
</style>
