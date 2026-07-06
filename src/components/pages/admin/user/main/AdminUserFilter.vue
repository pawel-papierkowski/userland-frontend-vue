<script setup lang="ts">
/**
 * Filter for user table.
 *
 * Models:
 * - v-model - Holds filter form data.
 *
 * Properties:
 * - isBusy - If true, show filter button as disabled and busy.
 */
import { useI18n } from 'vue-i18n';

import type { UserTableFilterForm } from '@/code/data/features/user/admin-user-type.ts';
import { enUserStatus } from '@/code/data/features/user/user-const.ts';

import CheckBox from '@/components/base/inputs/CheckBox.vue';
import ComboBox from '@/components/base/inputs/ComboBox.vue';
import DateTimePicker from '@/components/base/inputs/datetimepicker/DateTimePicker.vue';

const { t } = useI18n();

const form = defineModel<UserTableFilterForm>({ required: true });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
  isBusy: boolean;
}>();

const emit = defineEmits(['reload']);
</script>

<template>
  <div class="form-wide">
    <h4>{{ t('admin.user.filter.title') }}</h4>

    <form @submit.prevent="emit('reload')" novalidate data-testid="form-user-filter">
      <div class="form-divide2">
        <div class="form-subform">
          <label for="username">{{ t('admin.user.filter.username') }}:</label>
          <input id="username" data-testid="username" type="text" v-model="form.username" autocomplete="off" />

          <label for="email">{{ t('admin.user.filter.email') }}:</label>
          <input id="email" data-testid="email" type="text" v-model="form.email" autocomplete="off" />

          <label for="status">{{ t('admin.user.filter.status') }}:</label>
          <ComboBox id="status"
            ident="status"
            v-model="form.status"
            :options="enUserStatus"
            langPrefix="tech.user.status"
            placeholder="tech.user.status.null"
          />
        </div>
        <div class="form-subform">
          <label for="createdFromAt">{{ t('admin.user.filter.createdFromAt') }}:</label>
          <DateTimePicker id="createdFromAt"
            ident="createdFromAt"
            v-model="form.createdFromAt"
            mode="date"
            :dateTimeMax="form.createdToAt"
          />

          <label for="createdToAt">{{ t('admin.user.filter.createdToAt') }}:</label>
          <DateTimePicker id="createdToAt"
            ident="createdToAt"
            v-model="form.createdToAt"
            mode="date"
            :dateTimeMin="form.createdFromAt"
          />

          <label for="locked">{{ t('admin.user.filter.locked') }}:</label>
          <CheckBox id="locked" ident="locked" v-model="form.locked" :allowNull="true" />
        </div>
      </div>

      <button type="submit" :disabled="isBusy">
        {{ isBusy ? t('admin.user.filter.buttonBusy') : t('admin.user.filter.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
