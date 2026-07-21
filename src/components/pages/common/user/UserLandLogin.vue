<script setup lang="ts">
/** Login page where you can log in. Same for standard and admin login pages. */
import { reactive, ref, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useLogger } from 'vue-logger-plugin';
import { useI18n } from 'vue-i18n';

import apiLogging from '@/services/api-logging.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { Verifier } from '@/code/utils/Verifer.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager';
import type { UserLoginForm, UserLoginReq } from '@/code/data/features/user/user-type';

import TextBox from '@/components/base/inputs/TextBox.vue';

const log = useLogger();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const isAdminPanel = route.name === 'admin-login';

/** User login form data. */
const form: UserLoginForm = reactive({
  email: '',
  password: '',
});

/** True if submit button was clicked at least once. */
const usedButton = ref(false);
/** True if we are busy (submission is in progress), otherwise false. Used to disable form fields and submit button. */
const isBusy = ref(false);

const emailError: ComputedRef<string | null> = computed(() => {
  return Verifier.verifyEmail(form.email, usedButton.value);
});
const passwordError: ComputedRef<string | null> = computed(() => {
  if (!form.password) return usedButton.value ? t('form.errFieldEmpty') : null;
  if (form.password === '') return t('form.errFieldEmpty');
  if (form.password.length < 8) return t('form.errPasswordTooShort', { count: 8 });
  if (form.password.length > 100) return t('form.errPasswordTooLong', { count: 100 });
  const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=.,?!]).*$/;
  if (!passwordRegex.test(form.password)) return t('form.errPasswordWeak');
  return null;
});

//

/** Handle login of user. */
const handleLogin = async () => {
  usedButton.value = true; // Now we can show all errors.
  if (isFormError()) return; // Prevent submission if there are client-side errors.
  isBusy.value = true; // Disable submit button to prevent new submission while we are working on current submission.

  try {
    const loginReq = convertToReq(form);
    const response = await backendApiUser.login(loginReq); // API CALL.
    AppLoginer.login(response.data.jwtToken);

    if (AppLoginer.isLogged()) {
      // token was accepted
      showMessage(true);
      handleRedirection();
    } else {
      // token was rejected for some reason
      clearForm();
      isBusy.value = false;
      showMessage(false);
    }
  } catch (error) {
    clearForm();
    isBusy.value = false;
    AppMessager.errorT(error, 'user.login.msg.error.title', 'user.login.msg.error.content');
    apiLogging.logError(error, 'Login failed!');
  }
};

/** Check if form has any errors. */
const isFormError = () => {
  if (!form.email || !form.password) return true; // prevent sending empty form
  if (emailError.value !== null) return true;
  if (passwordError.value !== null) return true;
  return false;
};

/**
 * Convert user login form data to user login request data.
 * @param form User login form.
 * @returns User login request.
 */
const convertToReq = (form: UserLoginForm): UserLoginReq => {
  return {
    ...form,
  };
};

/** Show success message. */
const showMessage = (success: boolean) => {
  if (success) {
    if (isAdminPanel && AppLoginer.hasPermissionsAny(['role_admin', 'role_operator'])) {
      AppMessager.infoT('user.login.msg.successAdmin.title', 'user.login.msg.successAdmin.content');
      log.debug('Successfully logged in as admin user "', form.email, '".');
      return;
    }

    AppMessager.infoT('user.login.msg.success.title', 'user.login.msg.success.content');
    log.debug('Successfully logged in as user "', form.email, '".');
    return;
  }

  AppMessager.failureT('user.login.msg.error.title', 'user.login.msg.error.content');
  log.error('Login failed!');
};

/** Clear entire form. */
const clearForm = () => {
  usedButton.value = false;
  //form.email = '';
  form.password = '';
};

/** Properly handle redirection (destination depends on current route). */
const handleRedirection = () => {
  if (isAdminPanel) {
    if (AppLoginer.hasPermissionsAny(['role_admin', 'role_operator'])) {
      router.push({ name: 'admin-main' });
      return;
    }
    // If we are here, it means standard user tried to login to admin panel, ouch.
    // We do not logout them or show error, we just kick out them to normal webpage.
  }
  router.push({ name: 'home' });
};

//

/** Go to registration page. */
const goRegistration = () => {
  isBusy.value = true;
  router.push({ name: 'registration' });
};

/** Go to password reset request page. */
const goPasswordReset = () => {
  isBusy.value = true;
  router.push({ name: 'user-passwordReset-start' });
};

/** We can highlight fields that contain errors. */
const isInvalid = (msgError: string | null): boolean => {
  return msgError !== null;
};
</script>

<template>
  <div class="form-alone">
    <h2>{{ isAdminPanel ? t('user.login.formAdmin.title') : t('user.login.form.title') }}</h2>

    <form @submit.prevent="handleLogin" novalidate>
      <div class="form-group">
        <div class="form-entry">
          <label for="email">{{ t('user.login.form.email') }}:</label>
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
          <label for="password">{{ t('user.login.form.password') }}:</label>
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

        <div class="onpage-msg info" v-html="t('test.notify')" />
      </div>

      <button type="submit" :disabled="isBusy">
        {{ isBusy ? t('user.login.form.buttonBusy') : t('user.login.form.button') }}
      </button>
    </form>

    <div class="form-under-2" v-if="!isAdminPanel">
      <div class="nav-minor form-under-left" @click="goRegistration()">{{ t('user.login.form.noAccount') }}</div>
      <div class="nav-minor form-under-right" @click="goPasswordReset()">
        {{ t('user.login.form.passwordReset') }}
      </div>
    </div>
  </div>
</template>

<style scoped></style>
