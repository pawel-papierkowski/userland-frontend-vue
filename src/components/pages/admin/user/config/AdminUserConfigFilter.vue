<script setup lang="ts">
/**
 * Filter for user config table.
 *
 * Models:
 * - v-model - Holds filter form data.
 *
 * Properties:
 * - isBusy - If true, show filter button as disabled and busy.
 * - disabled - If true, entire filter form is disabled.
 *
 * Events:
 * - reload: Fired when user config table needs to be reloaded.
 */
import { useI18n } from 'vue-i18n';

import type { UserConfigTableFilterForm } from '@/code/data/features/user/admin-user-type.ts';

import DateTimePicker from '@/components/base/inputs/datetimepicker/DateTimePicker.vue';

const { t } = useI18n();

const form = defineModel<UserConfigTableFilterForm>({ required: true });

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
    <h4>{{ t('admin.user.config.filter.title') }}</h4>

    <form @submit.prevent="emit('reload')" novalidate data-testid="form-user-filter">
      <div class="form-subform">
        <label for="createdFromAt">{{ t('admin.user.config.filter.createdFromAt') }}:</label>
        <DateTimePicker
          v-model="form.createdFromAt"
          id="createdFromAt"
          mode="date"
          :dateTimeMax="form.createdToAt"
          :disabled="disabled"
        />

        <label for="createdToAt">{{ t('admin.user.config.filter.createdToAt') }}:</label>
        <DateTimePicker
          v-model="form.createdToAt"
          id="createdToAt"
          mode="date"
          :dateTimeMin="form.createdFromAt"
          :disabled="disabled"
        />
      </div>

      <button type="submit" :disabled="isBtnDisabled()">
        {{ isBusy ? t('admin.user.config.filter.buttonBusy') : t('admin.user.config.filter.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
