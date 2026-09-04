<script setup lang="ts">
/** User profile page. */
import { onMounted, reactive, ref, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { useLoginStore } from '@/stores/login.ts';

import { logger } from '@/code/utils/logger.ts';
import apiLogging from '@/services/api-logging.ts';
import backendApiUser from '@/services/features/api-users.ts';
import type { UserDataResp, UserEditForm, UserEditReq } from '@/code/data/features/user/user-type';

import { Verifer } from '@/code/utils/Verifer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

import TextBox from '@/components/base/inputs/TextBox.vue';

const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n();

const isAdminPanel = route.name === 'admin-profile';

/** User data. */
const form: UserEditForm = reactive({
  version: -1,
  username: '',
  email: '',
  name: '',
  surname: '',
});

/** True if submit button was clicked at least once. */
const usedButton = ref(false);
/** True if busy doing something, otherwise false. Used to disable edit button. */
const isBusy = ref(false);
/** True if data load is in progress, otherwise false. Used to hide form. */
const isLoading = ref(true);
/** Can spinner spin? */
const canSpin = ref(true);

const usernameError: ComputedRef<string | null> = computed(() => {
  return Verifer.verifyField(form.username, usedButton.value);
});

//

/** Fill form. */
const loadData = async () => {
  clearForm();
  const data = await resolveUserData();
  if (data === null) return; // failed to load data
  fillForm(data);
};

/** Fill form. */
const fillForm = (data: UserDataResp) => {
  form.version = data.version;
  form.username = data.username;
  form.email = data.email;
  form.name = data.profile.name;
  form.surname = data.profile.surname;
};

/** Retrieve all available data about currently logged user from backend. */
const resolveUserData = async (): Promise<UserDataResp | null> => {
  isLoading.value = true;
  canSpin.value = true;

  try {
    const response = await backendApiUser.view(); // API CALL
    isLoading.value = false;
    return response.data;
  } catch (error) {
    AppMessager.errorT(error, 'user.profile.msg.loadError.title', 'user.profile.msg.loadError.content');
    apiLogging.logError(error, 'Loading user data for profile failed!');
    canSpin.value = false;
    return null;
  }
};

//

/** Save user data. */
const saveUserData = async () => {
  usedButton.value = true; // Now we can show all errors.
  if (isFormError()) return; // Prevent submission if there are client-side errors.
  isBusy.value = true; // Disable submit button to prevent new submission while we are working on current submission.

  try {
    const editReq = convertToReq(form);
    const response = await backendApiUser.edit(editReq); // API CALL
    fillForm(response.data);

    updateLocalState(editReq);
    showMessage();
  } catch (error) {
    AppMessager.errorT(error, 'user.profile.msg.error.title', 'user.profile.msg.error.content');
    apiLogging.logError(error, 'Profile update failed!');
  } finally {
    isBusy.value = false; // Enable submit button.
  }
};

/** Update local state if needed (name of user). */
const updateLocalState = async (editReq: UserEditReq) => {
  const loginStore = useLoginStore();
  if (loginStore.loginState.username !== editReq.username) {
    try {
      logger.debug(
        `Profile update: prolong for local state update. Name in form: ${editReq.username}, name in store: ${loginStore.loginState.username}.`,
      );
      await AppLoginer.prolongSilently();
    } catch (error) {
      logger.error(error, 'Failed to prolong.');
    }
  }
};

/** Check if form has any errors. */
const isFormError = () => {
  // prevent sending empty form
  if (!form.username) return true;
  if (usernameError.value !== null) return true;
  return false;
};

/**
 * Convert user edit form data to user edit request data.
 * @param form User edit form.
 * @returns User edit request.
 */
const convertToReq = (form: UserEditForm): UserEditReq => {
  return {
    ...form,
    lang: locale.value,
    profile: {
      name: form.name,
      surname: form.surname,
    },
  };
};

//

/** Sends user to dedicated email change page. */
const handleEmailChange = async () => {
  isBusy.value = true;
  router.push({ name: 'user-emailChange-start' });
};

/** Sends user to dedicated account deletion page. */
const handleAccountDelete = async () => {
  isBusy.value = true;
  router.push({ name: 'user-accountDel-start' });
};

//

/** Show success message. */
const showMessage = () => {
  AppMessager.successT('user.profile.msg.success.title', 'user.profile.msg.success.content');
  logger.debug('Successfully updated user data.');
};

/** Clear entire form. */
const clearForm = () => {
  usedButton.value = false;
  form.username = '';
  form.email = '';
  form.name = '';
  form.surname = '';
};

/** We can highlight fields that contain errors. */
const isInvalid = (msgError: string | null): boolean => {
  return msgError !== null;
};

//

/** Automatically call once user enters page. */
onMounted(async () => {
  await loadData();
});
</script>

<template>
  <div class="form-alone">
    <h2>{{ isAdminPanel ? t('user.profile.formAdmin.title') : t('user.profile.form.title') }}</h2>

    <div class="spinner-container" v-if="isLoading">
      <SpinnerTorus data-testid="spinner" display="block" size="100px" :canSpin="canSpin" />
    </div>

    <form @submit.prevent="saveUserData" novalidate v-if="!isLoading" data-testid="form" autocomplete="off">
      <div class="form-group">
        <div class="form-entry">
          <label for="username">{{ t('user.profile.form.username') }}:</label>
          <TextBox
            id="username"
            v-model="form.username"
            autocomplete="username"
            :required="true"
            :disabled="isBusy"
            :invalid="isInvalid(usernameError)"
          />
          <span v-if="usernameError" class="form-text-error">{{ usernameError }}</span>
        </div>

        <div class="form-entry">
          <!-- Note it is read-only field, we change email separately. -->
          <label for="email">{{ t('user.profile.form.email') }}:</label>
          <TextBox id="email" type="email" v-model="form.email" autocomplete="email" :disabled="true" />
        </div>

        <div class="form-entry">
          <label for="name">{{ t('user.profile.form.name') }}:</label>
          <TextBox id="name" v-model="form.name" autocomplete="given-name" :required="true" :disabled="isBusy" />
        </div>

        <div class="form-entry">
          <label for="surname">{{ t('user.profile.form.surname') }}:</label>
          <TextBox id="surname" v-model="form.surname" autocomplete="family-name" :required="true" :disabled="isBusy" />
        </div>
      </div>

      <button data-testid="profileUpdate_btn_submit" type="submit" :disabled="isBusy">
        {{ isBusy ? t('user.profile.button.updateBusy') : t('user.profile.button.update') }}
      </button>
    </form>

    <div class="items-horizontal">
      <button data-testid="emailChange_btn_submit" :disabled="isBusy" @click="handleEmailChange()">
        {{ t('user.profile.button.emailChange') }}
      </button>
      <button data-testid="accountDelete_btn_submit" class="danger" :disabled="isBusy" @click="handleAccountDelete()">
        {{ t('user.profile.button.deleteAccount') }}
      </button>
    </div>
  </div>
</template>

<style scoped></style>
