<script setup lang="ts">
/** Page where you can register new user. */
import { reactive, ref, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { logger } from '@/code/utils/logger.ts';
import apiLogging from '@/services/api-logging.ts';
import backendApiUser from '@/services/features/api-users.ts';
import { durRegistrationSuccess } from '@/stores/messages/const.ts';

import { Verifer } from '@/code/utils/Verifer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager';
import type { UserRegisterForm, UserRegisterReq } from '@/code/data/features/user/user-type';

import TextBox from '@/components/base/inputs/TextBox.vue';
import CheckBox from '@/components/base/inputs/CheckBox.vue';

const router = useRouter();
const { t, locale } = useI18n();

/** User registration form data. */
const form: UserRegisterForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  isAdmin: false,
});

/** True if submit button was clicked at least once. */
const usedButton = ref(false);
/** True if submission is in progress, otherwise false. Used to disable submit button. */
const isBusy = ref(false);

const usernameError: ComputedRef<string | null> = computed(() => {
  return Verifer.verifyField(form.username, usedButton.value);
});
const emailError: ComputedRef<string | null> = computed(() => {
  return Verifer.verifyEmail(form.email, usedButton.value);
});
const passwordError: ComputedRef<string | null> = computed(() => {
  return Verifer.verifyPassword(form.password, usedButton.value);
});
const passwordConfirmError: ComputedRef<string | null> = computed(() => {
  return Verifer.verifyConfirmPassword(form.password, form.confirmPassword, usedButton.value);
});

//

/** Handle registration of user. */
const handleRegister = async () => {
  usedButton.value = true; // Now we can show all errors.
  if (isFormError()) return; // Prevent submission if there are client-side errors.
  isBusy.value = true; // Disable submit button to prevent new submission while we are working on current submission.

  try {
    const registerReq = convertToReq(form);
    await backendApiUser.register(registerReq); // API CALL

    showMessage();
    router.push({ name: 'home' });
  } catch (error) {
    isBusy.value = false; // Enable submit button.
    AppMessager.errorT(error, 'user.registration.msg.error.title', 'user.registration.msg.error.content');
    apiLogging.logError(error, 'Registration failed!');
  }
};

/** Check if form has any errors. */
const isFormError = () => {
  // prevent sending empty form
  if (!form.username || !form.email || !form.password || !form.confirmPassword) return true;
  if (usernameError.value !== null) return true;
  if (emailError.value !== null) return true;
  if (passwordError.value !== null) return true;
  if (passwordConfirmError.value !== null) return true;
  return false;
};

/**
 * Convert user registration form data to user registration request data.
 * @param form User registration form.
 * @returns User registration request.
 */
const convertToReq = (form: UserRegisterForm): UserRegisterReq => {
  return {
    ...form,
    lang: locale.value,
    frontend: 'VUE',
  };
};

/** Show success message. */
const showMessage = () => {
  AppMessager.successT(
    'user.registration.msg.success.title',
    'user.registration.msg.success.content',
    durRegistrationSuccess,
  );
  logger.debug('Registered user using form data:', { ...form });
};

/** Go to login page. */
const goLogin = () => {
  isBusy.value = true;
  router.push({ name: 'login' });
};

/** We can highlight fields that contain errors. */
const isInvalid = (msgError: string | null): boolean => {
  return msgError !== null;
};
</script>

<template>
  <div class="form-alone">
    <h2>{{ t('user.registration.form.title') }}</h2>

    <form @submit.prevent="handleRegister" novalidate autocomplete="off">
      <div class="form-group">
        <div class="onpage-msg warning" v-html="t('user.registration.form.warning')" />
        <div class="form-entry">
          <label for="username">{{ t('user.registration.form.username') }}:</label>
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
          <label for="email">{{ t('user.registration.form.email') }}:</label>
          <TextBox
            id="email"
            type="email"
            v-model="form.email"
            autocomplete="email"
            :required="true"
            :disabled="isBusy"
            :invalid="isInvalid(emailError)"
          />
          <span v-if="emailError" class="form-text-error">{{ emailError }}</span>
        </div>

        <div class="form-entry">
          <label for="password">{{ t('user.registration.form.password') }}:</label>
          <TextBox
            id="password"
            type="password"
            v-model="form.password"
            autocomplete="new-password"
            :required="true"
            :disabled="isBusy"
            :invalid="isInvalid(passwordError)"
          />
          <span v-if="passwordError" class="form-text-error">{{ passwordError }}</span>
        </div>

        <div class="form-entry">
          <label for="confirmPassword">{{ t('user.registration.form.confirmPassword') }}:</label>
          <TextBox
            id="confirmPassword"
            type="password"
            v-model="form.confirmPassword"
            :allowPaste="false"
            autocomplete="new-password"
            :required="true"
            :disabled="isBusy"
            :invalid="isInvalid(passwordConfirmError)"
          />
          <span v-if="passwordConfirmError" class="form-text-error">{{ passwordConfirmError }}</span>
        </div>

        <div class="form-entry-inline">
          <label for="isAdmin">{{ t('user.registration.form.isAdmin') }}:</label>
          <CheckBox id="isAdmin" v-model="form.isAdmin" :disabled="isBusy" />
        </div>

        <div class="onpage-msg info" v-html="t('test.notify')" />
      </div>

      <button type="submit" :disabled="isBusy" data-testid="registration_btn_submit">
        {{ isBusy ? t('user.registration.form.buttonBusy') : t('user.registration.form.button') }}
      </button>
    </form>

    <div class="form-under-1">
      <div class="nav-minor form-under-center" @click="goLogin()" data-testid="registration_btn_login">
        {{ t('user.registration.form.hasAccount') }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>
