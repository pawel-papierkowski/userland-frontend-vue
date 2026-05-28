<script setup lang="ts">
/**
 * Filter for user table.
 *
 * Properties:
 * - v-model - Holds filter form data.
 * - isSubmitting - If true, show filter button as disabled and busy.
 */
import { useI18n } from 'vue-i18n';

import type { UserTableForm } from '@/code/data/features/user/admin-user.ts';
import { enUserStatus } from '@/code/data/features/user/user-const.ts';

import ComboBox from '@/components/base/inputs/ComboBox.vue';
import DateTimePicker from '@/components/base/inputs/DateTimePicker.vue';

const { t } = useI18n();

const form = defineModel<UserTableForm>({ required: true });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
  isSubmitting: boolean;
}>();

const emit = defineEmits(['reload']);

</script>

<template>
  <div class="form-wide">
    <h4>{{ t('admin.user.filter.title') }}</h4>

    <form @submit.prevent="emit('reload')" novalidate data-testid="form-user-filter">
      <div class="form-divider">
        <div class="form-spacer">
          <div class="form-pairs">
            <label for="username">{{ t('admin.user.filter.username') }}:</label>
            <input id="username" data-testid="username" type="text" v-model="form.username" autocomplete="off" />
          </div>

          <div class="form-pairs">
            <label for="email">{{ t('admin.user.filter.email') }}:</label>
            <input id="email" data-testid="email" type="text" v-model="form.email" autocomplete="email" />
          </div>

          <div class="form-pairs">
            <label for="status">{{ t('admin.user.filter.status') }}:</label>
            <ComboBox data-testid="status" v-model="form.status" :options="enUserStatus"
              langPrefix="tech.user.status" placeholder="tech.user.status.null"/>
          </div>
        </div>
        <div class="form-spacer">
          <div class="form-pairs">
            <label for="createdFromAt">{{ t('admin.user.filter.createdFromAt') }}:</label>
            <DateTimePicker v-model="form.createdFromAt" ident="createdFromAt" mode="date" :dateTimeMax="form.createdToAt" />
          </div>

          <div class="form-pairs">
            <label for="createdToAt">{{ t('admin.user.filter.createdToAt') }}:</label>
            <DateTimePicker v-model="form.createdToAt" ident="createdToAt" mode="date" :dateTimeMin="form.createdFromAt" />
          </div>

          <div class="form-pairs">
            <label for="locked">{{ t('admin.user.filter.locked') }}:</label>
            <input id="locked" data-testid="locked" type="checkbox" v-model="form.locked" autocomplete="off" />
          </div>
        </div>
      </div>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? t('admin.user.filter.buttonBusy') : t('admin.user.filter.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
