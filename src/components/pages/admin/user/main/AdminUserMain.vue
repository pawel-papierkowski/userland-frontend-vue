<script setup lang="ts">
/**
 * View/edit of single, selected user.
 * For now we are only viewing user.
 *
 * Properties:
 * - v-model - Holds selected user.
 */
import { ref, reactive, watch } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import backendApi from '@/services/api-common.ts';
import backendApiAdminUser from '@/services/features/api-admin-users.ts';

import type { UserTableEntry, UserFullDataReq, UserFullDataResp, UserFullDataForm } from '@/code/data/features/user/admin-user.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

const { t } = useI18n();

/** User data for form. */
const form: UserFullDataForm = reactive({
  createdAt: '',
  modifiedAt: '',
  username: '',
  email: '',
  status: '',
  locked: null,
  lang: '',
  name: '',
  surname: '',
});

/** Selected user record. */
const selUserRecord = defineModel<UserTableEntry|null>();

/** True if submission is in progress, otherwise false. Used to disable submit button. */
//const isSubmitting: Ref<boolean> = ref(false);
/** True if data load is in progress, otherwise false. Used to hide form. */
const isLoading: Ref<boolean> = ref(false);
/** Can spinner spin? */
const canSpin: Ref<boolean> = ref(true);

/** Change in selection requires reload of form. */
watch(selUserRecord, () => {
  fillForm();
});

//


/** Fill form. */
const fillForm = async () => {
  clearForm();
  const data = await resolveUserData();
  if (data === null) return null; // nothing to do

  form.createdAt = data.createdAt;
  form.modifiedAt = data.modifiedAt;
  form.username = data.username;
  form.email = data.email;
  form.status = data.status;
  form.locked = data.locked;
  form.lang = data.lang;
  form.name = data.profile.name;
  form.surname = data.profile.surname;
};

/** Retrieve all available data about currently logged user from backend. */
const resolveUserData = async (): Promise<UserFullDataResp | null> => {
  if (!selUserRecord.value) return null; // nothing to do
  isLoading.value = true;
  canSpin.value = true;

  try {
    const payload: UserFullDataReq = { id: selUserRecord.value.id };
    const response = await backendApiAdminUser.loadUserData(payload); // API CALL
    isLoading.value = false; // Enable submit button.
    return response.data;
  } catch (error) {
    AppMessager.errorT(error, 'admin.user.msg.errorLoadUser.title', 'admin.user.msg.errorLoadUser.content');
    backendApi.logError(error, 'Loading user data failed!');
    canSpin.value = false;
    return null;
  }
};

//

const saveUserData = async () => {
  // TODO actually save data
};

//

/** Clear entire form. */
const clearForm = () => {
  form.createdAt = '';
  form.modifiedAt = '';
  form.username = '';
  form.email = '';
  form.status = '';
  form.locked = null;
  form.lang = '';
  form.name = '';
  form.surname = '';
};

const isUnloaded = (): boolean => {
  return selUserRecord.value === null;
};
</script>

<template>
  <div class="form-wide">
    <div class="spinner-container" v-if="isLoading">
      <SpinnerTorus data-testid="spinner" display="block" size="100px" :canSpin="canSpin" />
    </div>

    <form @submit.prevent="saveUserData" novalidate v-if="!isLoading" data-testid="form-user-main">
      <div class="form-group">
        <h4>{{ t('admin.user.main.form.general') }}</h4>
        <div class="form-subform">
          <div>{{ t('admin.user.main.form.createdAt') }}:</div>
          <div>{{ form.createdAt }}</div>

          <div>{{ t('admin.user.main.form.modifiedAt') }}:</div>
          <div>{{ form.modifiedAt }}</div>

          <label for="username">{{ t('admin.user.main.form.username') }}:</label>
          <input id="username" data-testid="username" type="text" v-model="form.username"
            required :disabled="isUnloaded()" autocomplete="off" />

          <label for="email">{{ t('admin.user.main.form.email') }}:</label>
          <input id="email" data-testid="email" type="email" v-model="form.email"
            required :disabled="isUnloaded()" autocomplete="off" />

          <div>{{ t('admin.user.main.form.status') }}:</div>
          <div>{{ form.status }}</div>

          <div>{{ t('admin.user.main.form.locked') }}:</div>
          <div>{{ form.locked === null ? '' : t('state.'+form.locked) }}</div>

          <div>{{ t('admin.user.main.form.lang') }}:</div>
          <div>{{ form.lang }}</div>
        </div>

        <h4>{{ t('admin.user.main.form.profile') }}</h4>
        <div class="form-subform">
          <label for="name">{{ t('admin.user.main.form.name') }}:</label>
          <input id="name" data-testid="name" type="text" v-model="form.name"
            required :disabled="isUnloaded()" autocomplete="off" />

          <label for="surname">{{ t('admin.user.main.form.surname') }}:</label>
          <input id="surname" data-testid="surname" type="text" v-model="form.surname"
            required :disabled="isUnloaded()" autocomplete="off" />
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
