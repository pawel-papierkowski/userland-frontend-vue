<script setup lang="ts">
/**
 * Filter for user history table.
 *
 * Properties:
 * - v-model - Holds filter form data.
 * - isBusy - If true, show filter button as disabled and busy.
 */
import { useI18n } from 'vue-i18n';

import type { UserHistoryTableFilterForm } from '@/code/data/features/user/admin-user.ts';
import { enUserHistoryWho, enUserHistoryWhat } from '@/code/data/features/user/user-const.ts';

import ComboBox from '@/components/base/inputs/ComboBox.vue';
import DateTimePicker from '@/components/base/inputs/DateTimePicker.vue';

const { t } = useI18n();

const form = defineModel<UserHistoryTableFilterForm>({ required: true });
 
const props = withDefaults(
  defineProps<{
    isBusy: boolean;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits(['reload']);

/**
 * Should filter button be disabled?
 * @returns True if button should be disabled, otherwise false.
 */
const isBtnDisabled = () => {
  return props.isBusy || props.disabled;
}
</script>

<template>
  <div class="form-wide">
    <h4>{{ t('admin.user.history.filter.title') }}</h4>

    <form @submit.prevent="emit('reload')" novalidate data-testid="form-user-filter">
      <div class="form-subform">
        <label for="createdFromAt">{{ t('admin.user.history.filter.createdFromAt') }}:</label>
        <DateTimePicker
          v-model="form.createdFromAt"
          ident="createdFromAt"
          mode="date"
          :dateTimeMax="form.createdToAt"
          :disabled="disabled"
        />

        <label for="createdToAt">{{ t('admin.user.history.filter.createdToAt') }}:</label>
        <DateTimePicker
          v-model="form.createdToAt"
          ident="createdToAt"
          mode="date"
          :dateTimeMin="form.createdFromAt"
          :disabled="disabled"
        />

        <label for="status">{{ t('admin.user.history.filter.who') }}:</label>
        <ComboBox
          data-testid="who"
          v-model="form.who"
          :options="enUserHistoryWho"
          :disabled="disabled"
          langPrefix="tech.user.who"
          placeholder="tech.user.who.null"
        />

        <label for="status">{{ t('admin.user.history.filter.what') }}:</label>
        <ComboBox
          data-testid="what"
          v-model="form.what"
          :options="enUserHistoryWhat"
          :disabled="disabled"
          langPrefix="tech.user.what"
          placeholder="tech.user.what.null"
        />
      </div>

      <button type="submit" :disabled="isBtnDisabled()">
        {{ isBusy ? t('admin.user.history.filter.buttonBusy') : t('admin.user.history.filter.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
