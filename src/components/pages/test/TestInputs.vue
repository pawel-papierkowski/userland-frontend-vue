<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { enTestComboBox } from '@/code/data/other/test-area.ts';
import type { TestAreaInputForm } from '@/code/data/other/test-area.ts';

import ComboBox from '@/components/base/inputs/ComboBox.vue';
import DateTimePicker from '@/components/base/inputs/DateTimePicker.vue';

const { t } = useI18n();

const form: Ref<TestAreaInputForm> = ref({
  inputText: null,
  comboBox: null,
  dateTime: null,
  date: null,
  time: null
});

</script>

<template>
  <div class="testArea-wrapper">
    <div class="form-alone">
      <div class="form-subform">
        <label for="inputText">{{ t('testArea.inputs.inputText') }}:</label>
        <input id="inputText" type="text" v-model="form.inputText" autocomplete="off" />

        <label for="status">{{ t('testArea.inputs.comboBox') }}:</label>
        <ComboBox
          v-model="form.comboBox"
          :options="enTestComboBox"
          langPrefix="tech.user.status"
          placeholder="tech.user.status.null"
        />

        <label for="dateTimePicker">{{ t('testArea.inputs.dateTimePicker') }}:</label>
        <DateTimePicker
          v-model="form.dateTime"
          ident="dateTimePicker"
          mode="datetime"
        />
        <label for="datePicker">{{ t('testArea.inputs.datePicker') }}:</label>
        <DateTimePicker
          v-model="form.date"
          ident="datePicker"
          mode="date"
        />
        <label for="timePicker">{{ t('testArea.inputs.timePicker') }}:</label>
        <DateTimePicker
          v-model="form.time"
          ident="timePicker"
          mode="time"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
