<script setup lang="ts">
/**
 * Filter for user history table.
 *
 * Models:
 * - v-model - Holds filter form data.
 *
 * Properties:
 * - isBusy - If true, show filter button as disabled and busy.
 * - disabled - If true, entire filter form is disabled.
 *
 * Events:
 * - reload: Fired when user history table needs to be reloaded.
 */
import { useI18n } from 'vue-i18n';

import type { UserHistoryTableFilterForm } from '@/code/data/features/user/admin-user-type.ts';
import { enUserHistoryWho, enUserHistoryWhat } from '@/code/data/features/user/user-const.ts';

import ComboBox from '@/components/base/inputs/ComboBox.vue';
import DateTimePicker from '@/components/base/inputs/datetimepicker/DateTimePicker.vue';

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
};
</script>

<template>
  <div class="form-wide">
    <h4>{{ t('admin.user.history.filter.title') }}</h4>

    <form @submit.prevent="emit('reload')" novalidate data-testid="form-user-filter">
      <div class="form-subform">
        <label for="userhistory-filter-createdFromAt">{{ t('admin.user.history.filter.createdFromAt') }}:</label>
        <DateTimePicker
          v-model="form.createdFromAt"
          id="userhistory-filter-createdFromAt"
          mode="date"
          :dateTimeMax="form.createdToAt"
          :allowNull="true"
          :disabled="disabled"
        />

        <label for="userhistory-filter-createdToAt">{{ t('admin.user.history.filter.createdToAt') }}:</label>
        <DateTimePicker
          v-model="form.createdToAt"
          id="userhistory-filter-createdToAt"
          mode="date"
          :dateTimeMin="form.createdFromAt"
          :allowNull="true"
          :disabled="disabled"
        />

        <label for="userhistory-filter-who">{{ t('admin.user.history.filter.who') }}:</label>
        <ComboBox
          id="userhistory-filter-who"
          data-testid="who"
          v-model="form.who"
          :options="enUserHistoryWho"
          :disabled="disabled"
          langPrefix="tech.user.who"
          placeholder="tech.user.who.null"
        />

        <label for="userhistory-filter-what">{{ t('admin.user.history.filter.what') }}:</label>
        <ComboBox
          id="userhistory-filter-what"
          data-testid="what"
          v-model="form.what"
          :options="enUserHistoryWhat"
          :disabled="disabled"
          langPrefix="tech.user.what"
          placeholder="tech.user.what.null"
        />
      </div>

      <button type="submit" :disabled="isBtnDisabled()" data-testid="userhistory-filter-submit">
        {{ isBusy ? t('admin.user.history.filter.buttonBusy') : t('admin.user.history.filter.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
