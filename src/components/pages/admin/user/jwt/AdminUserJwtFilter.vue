<script setup lang="ts">
/**
 * Filter for user jwt table.
 *
 * Properties:
 * - v-model - Holds filter form data.
 * - isSubmitting - If true, show filter button as disabled and busy.
 */
import { useI18n } from 'vue-i18n';

import type { UserJwtTableFilterForm } from '@/code/data/features/user/admin-user.ts';

import DateTimePicker from '@/components/base/inputs/DateTimePicker.vue';

const { t } = useI18n();

const form = defineModel<UserJwtTableFilterForm>({ required: true });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(defineProps<{
  isSubmitting: boolean,
  disabled?: boolean,
}>(), {
  disabled: false
});

const emit = defineEmits(['reload']);
</script>

<template>
  <div class="form-wide">
    <h4>{{ t('admin.user.jwt.filter.title') }}</h4>

    <form @submit.prevent="emit('reload')" novalidate data-testid="form-user-filter">
      <div class="form-subform">
        <label for="createdFromAt">{{ t('admin.user.jwt.filter.createdFromAt') }}:</label>
        <DateTimePicker
          v-model="form.createdFromAt"
          ident="createdFromAt"
          mode="date"
          :dateTimeMax="form.createdToAt"
          :disabled="disabled"
        />

        <label for="createdToAt">{{ t('admin.user.jwt.filter.createdToAt') }}:</label>
        <DateTimePicker
          v-model="form.createdToAt"
          ident="createdToAt"
          mode="date"
          :dateTimeMin="form.createdFromAt"
          :disabled="disabled"
        />
      </div>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? t('admin.user.jwt.filter.buttonBusy') : t('admin.user.jwt.filter.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
