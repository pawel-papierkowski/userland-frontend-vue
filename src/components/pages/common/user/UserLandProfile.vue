<script setup lang="ts">
/** User profile page. */
import { onMounted, reactive, ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useLogger } from 'vue-logger-plugin';
import { useI18n } from 'vue-i18n';

import { useLoginStore } from '@/stores/login.ts';

import backendApi from '@/services/api-common.ts';
import backendApiUser from '@/services/features/api-users.ts';
import type { UserDataResp, UserEditForm, UserEditReq } from '@/code/data/features/user/user-type';

import { Verifier } from '@/code/utils/Verifer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

const log = useLogger();
const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n();

const isAdminPanel = route.name === 'admin-profile';

/** User data. */
const form: UserEditForm = reactive({
  username: '',
  email: '',
  name: '',
  surname: '',
});

/** True if submit button was clicked at least once. */
const usedButton: Ref<boolean> = ref(false);
/** True if busy doing something, otherwise false. Used to disable edit button. */
const isBusy: Ref<boolean> = ref(false);
/** True if data load is in progress, otherwise false. Used to hide form. */
const isLoading: Ref<boolean> = ref(true);
/** Can spinner spin? */
const canSpin: Ref<boolean> = ref(true);

const usernameError: ComputedRef<string | null> = computed(() => {
  return Verifier.verifyField(form.username, usedButton.value);
});

//

/** Fill form. */
const fillForm = async () => {
  clearForm();
  const data = await resolveUserData();
  if (data === null) return; // failed to load data

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
    backendApi.logError(error, 'Loading user data for profile failed!');
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
    await backendApiUser.edit(editReq); // API CALL

    updateLocalState(editReq);
    showMessage();
  } catch (error) {
    AppMessager.errorT(error, 'user.profile.msg.error.title', 'user.profile.msg.error.content');
    backendApi.logError(error, 'Profile update failed!');
  } finally {
    isBusy.value = false; // Enable submit button.
  }
};

/** Update local state if needed (name of user). */
const updateLocalState = async (editReq: UserEditReq) => {
  const loginStore = useLoginStore();
  if (loginStore.loginState.username !== editReq.username) {
    try {
      log.debug(
        `Profile update: prolong for local state update. Name in form: ${editReq.username}, name in store: ${loginStore.loginState.username}.`,
      );
      await AppLoginer.prolongSilently();
    } catch (error) {
      log.error(error, 'Failed to prolong.');
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
  router.push({ name: 'user-emailChange-start' });
};

/** Sends user to dedicated account deletion page. */
const handleAccountDelete = async () => {
  router.push({ name: 'user-accountDel-start' });
};

//

/** Show success message. */
const showMessage = () => {
  AppMessager.successT('user.profile.msg.success.title', 'user.profile.msg.success.content');
  log.debug('Successfully updated user data.');
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
const getInputClass = (msgError: string | null): string => {
  if (msgError !== null) return 'err';
  return '';
};

//

/** Automatically call once user enters page. */
onMounted(async () => {
  await fillForm();
});
</script>

<template>
  <div class="form-alone">
    <h2>{{ isAdminPanel ? t('user.profile.formAdmin.title') : t('user.profile.form.title') }}</h2>

    <div class="spinner-container" v-if="isLoading">
      <SpinnerTorus data-testid="spinner" display="block" size="100px" :canSpin="canSpin" />
    </div>

    <form @submit.prevent="saveUserData" novalidate v-if="!isLoading" data-testid="form">
      <div class="form-group">
        <div class="form-entry">
          <label for="username">{{ t('user.profile.form.username') }}:</label>
          <input
            id="username"
            data-testid="username"
            type="text"
            v-model="form.username"
            required
            autocomplete="off"
            :class="getInputClass(usernameError)"
          />
          <span v-if="usernameError" class="form-text-error">{{ usernameError }}</span>
        </div>

        <div class="form-entry">
          <label for="email">{{ t('user.profile.form.email') }}:</label>
          <input
            id="email"
            data-testid="email"
            type="email"
            v-model="form.email"
            required
            disabled
            autocomplete="email"
          />
        </div>

        <div class="form-entry">
          <label for="name">{{ t('user.profile.form.name') }}:</label>
          <input id="name" data-testid="name" type="text" v-model="form.name" required autocomplete="off" />
        </div>

        <div class="form-entry">
          <label for="surname">{{ t('user.profile.form.surname') }}:</label>
          <input id="surname" data-testid="surname" type="text" v-model="form.surname" required autocomplete="off" />
        </div>
      </div>

      <button data-testid="btn-submit" type="submit" :disabled="isBusy">
        {{ isBusy ? t('user.profile.button.updateBusy') : t('user.profile.button.update') }}
      </button>
      <div class="items-horizontal">
        <button data-testid="btn-emailChange" :disabled="isBusy" @click="handleEmailChange()">
          {{ t('user.profile.button.emailChange') }}
        </button>
        <button data-testid="btn-deleteAccount" class="danger" :disabled="isBusy" @click="handleAccountDelete()">
          {{ t('user.profile.button.deleteAccount') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
