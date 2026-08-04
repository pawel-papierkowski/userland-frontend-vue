<script setup lang="ts">
/**
 * Filter for user tokens table.
 *
 * Models:
 * - v-model - Holds filter form data.
 *
 * Properties:
 * - isBusy - If true, show filter button as disabled and busy.
 * - disabled - If true, entire filter form is disabled.
 *
 * Events:
 * - reload: Fired when user tokens table needs to be reloaded.
 */
import { useI18n } from 'vue-i18n';

import type { UserTokenTableFilterForm } from '@/code/data/features/user/admin-user-type.ts';

import DateTimePicker from '@/components/base/inputs/datetimepicker/DateTimePicker.vue';

const { t } = useI18n();

const form = defineModel<UserTokenTableFilterForm>({ required: true });

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
    <h4>{{ t('admin.user.tokens.filter.title') }}</h4>

    <form @submit.prevent="emit('reload')" novalidate data-testid="form-user-filter">
      <div class="form-subform">
        <label for="usertokens-filter-createdFromAt">{{ t('admin.user.tokens.filter.createdFromAt') }}:</label>
        <DateTimePicker
          v-model="form.createdFromAt"
          id="usertokens-filter-createdFromAt"
          mode="date"
          :dateTimeMax="form.createdToAt"
          :allowNull="true"
          :disabled="disabled"
        />

        <label for="usertokens-filter-createdToAt">{{ t('admin.user.tokens.filter.createdToAt') }}:</label>
        <DateTimePicker
          v-model="form.createdToAt"
          id="usertokens-filter-createdToAt"
          mode="date"
          :dateTimeMin="form.createdFromAt"
          :allowNull="true"
          :disabled="disabled"
        />
      </div>

      <button type="submit" :disabled="isBtnDisabled()" data-testid="usertokens-filter-submit">
        {{ isBusy ? t('admin.user.tokens.filter.buttonBusy') : t('admin.user.tokens.filter.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
