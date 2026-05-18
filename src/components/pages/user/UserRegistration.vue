<script setup lang="ts">
/** Page where you can register new user. */
import { reactive, ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { useRouter } from 'vue-router';
import { useLogger } from 'vue-logger-plugin';
import { useI18n } from 'vue-i18n';

import backendApi from '@/services/api-common.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { AppMessager } from '@/code/stores/messages/AppMessager';
import type { UserRegisterForm, UserRegisterReq } from '@/code/data/features/user.ts';

const log = useLogger();
const router = useRouter();
const { t, locale } = useI18n();

/** User registration form data. */
const form: UserRegisterForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
});

/** True if submit button was clicked at least once. */
const usedButton: Ref<boolean> = ref(false);
/** True if submission is in progress, otherwise false. Used to disable submit button. */
const isSubmitting: Ref<boolean> = ref(false);

// field verifers

const usernameError: ComputedRef<string | null> = computed(() => {
  // Prevent printing error message instantly after form loads.
  if (!form.username) return usedButton.value ? t('form.errFieldEmpty') : null;
  if (form.username === '') return t('form.errFieldEmpty');
  return null;
});
const emailError: ComputedRef<string | null> = computed(() => {
  if (!form.email) return usedButton.value ? t('form.errFieldEmpty') : null;
  if (form.email === '') return t('form.errFieldEmpty');
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(form.email)) return t('form.errEmailBad');
  return null;
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
const passwordConfirmError: ComputedRef<string | null> = computed(() => {
  if (!form.confirmPassword) return usedButton.value ? t('form.errFieldEmpty') : null;
  if (form.confirmPassword === '') return t('form.errFieldEmpty');
  if (form.password !== form.confirmPassword) return t('form.errPasswordMatch');
  return null;
});

//

/** Handle registration of user. */
const handleRegister = async () => {
  usedButton.value = true; // Now we can show all errors.
  if (isFormError()) return; // Prevent submission if there are client-side errors.
  isSubmitting.value = true; // Disable submit button to prevent new submission while we are working on current submission.

  try {
    const registerReq: UserRegisterReq = convertToReq(form);
    await backendApiUser.register(registerReq); // API CALL

    log.debug('Registered user using form data:', { ...form });
    AppMessager.successT('user.registration.msg.success.title', 'user.registration.msg.success.content');

    clearForm();
    router.push({ name: 'home' });
  } catch (error) {
    AppMessager.errorT(error, 'user.registration.msg.error.title', 'user.registration.msg.error.content');
    backendApi.logError(error, 'Registration failed!');
  } finally {
    isSubmitting.value = false; // Enable submit button.
  }
};

/** Check if form has any errors. */
const isFormError = () => {
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

/** Clear entire form. */
const clearForm = () => {
  form.username = '';
  form.email = '';
  form.password = '';
  form.confirmPassword = '';
};

/** Go to login page. */
const goLogin = () => {
  router.push({ name: 'login' });
}

/** We can highlight fields that contain errors. */
const getInputClass = (msgError: string | null): string => {
  if (msgError !== null) return 'err';
  return '';
};
</script>

<template>
  <div class="form-all">
    <h2>{{ t('user.registration.form.title') }}</h2>

    <!-- @submit.prevent stops the page reload and calls handleRegister -->
    <form @submit.prevent="handleRegister" novalidate>
      <div class="form-group">
        <div class="form-entry">
          <label for="username">{{ t('user.registration.form.username') }}:</label>
          <input
            :class="getInputClass(usernameError)"
            id="username"
            data-testid="username"
            type="text"
            v-model="form.username"
            required
            autocomplete="off"
          />
          <span v-if="usernameError" class="form-text-error">{{ usernameError }}</span>
        </div>

        <div class="form-entry">
          <label for="email">{{ t('user.registration.form.email') }}:</label>
          <input
            :class="getInputClass(emailError)"
            id="email"
            data-testid="email"
            type="email"
            v-model="form.email"
            required
            autocomplete="email"
          />
          <span v-if="emailError" class="form-text-error">{{ emailError }}</span>
        </div>

        <div class="form-entry">
          <label for="password">{{ t('user.registration.form.password') }}:</label>
          <input
            :class="getInputClass(passwordError)"
            id="password"
            data-testid="password"
            type="password"
            v-model="form.password"
            required
            autocomplete="new-password"
          />
          <span v-if="passwordError" class="form-text-error">{{ passwordError }}</span>
        </div>

        <div class="form-entry">
          <label for="confirmPassword">{{ t('user.registration.form.confirmPassword') }}:</label>
          <input
            :class="getInputClass(passwordConfirmError)"
            id="confirmPassword"
            data-testid="confirmPassword"
            type="password"
            v-model="form.confirmPassword"
            required
            autocomplete="new-password"
          />
          <span v-if="passwordConfirmError" class="form-text-error">{{ passwordConfirmError }}</span>
        </div>
      </div>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? t('user.registration.form.buttonSubmitting') : t('user.registration.form.button') }}
      </button>

      <div class="underForm-1">
        <div class="nav-minor underForm-center" @click="goLogin()">{{ t('user.registration.form.hasAccount') }}</div>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
