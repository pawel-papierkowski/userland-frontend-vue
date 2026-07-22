<script setup lang="ts">
/**
 * Filter for user table.
 *
 * Models:
 * - v-model - Holds filter form data.
 *
 * Properties:
 * - isBusy - If true, show filter button as disabled and busy.
 *
 * Events:
 * - reload: Fired when user table needs to be reloaded.
 */
import { useI18n } from 'vue-i18n';

import type { UserTableFilterForm } from '@/code/data/features/user/admin-user-type.ts';
import { enUserStatus } from '@/code/data/features/user/user-const.ts';

import TextBox from '@/components/base/inputs/TextBox.vue';
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
          <TextBox
            id="username"
            v-model="form.username"
            autocomplete="off"
          />

          <label for="email">{{ t('admin.user.filter.email') }}:</label>
          <TextBox
            id="email"
            v-model="form.email"
            autocomplete="off"
          />

          <label for="status">{{ t('admin.user.filter.status') }}:</label>
          <ComboBox
            id="status"
            v-model="form.status"
            :options="enUserStatus"
            langPrefix="tech.user.status"
            placeholder="tech.user.status.null"
          />
        </div>
        <div class="form-subform">
          <label for="createdFromAt">{{ t('admin.user.filter.createdFromAt') }}:</label>
          <DateTimePicker
            id="createdFromAt"
            v-model="form.createdFromAt"
            mode="date"
            :dateTimeMax="form.createdToAt"
            :allowNull="true"
          />

          <label for="createdToAt">{{ t('admin.user.filter.createdToAt') }}:</label>
          <DateTimePicker
            id="createdToAt"
            v-model="form.createdToAt"
            mode="date"
            :dateTimeMin="form.createdFromAt"
            :allowNull="true"
          />

          <label for="locked">{{ t('admin.user.filter.locked') }}:</label>
          <CheckBox id="locked" v-model="form.locked" :allowNull="true" />
        </div>
      </div>

      <button type="submit" :disabled="isBusy">
        {{ isBusy ? t('admin.user.filter.buttonBusy') : t('admin.user.filter.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
