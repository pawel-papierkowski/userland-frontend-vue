<script setup lang="ts">
/** Page where you can register new user. */
import { reactive, ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useLogger } from 'vue-logger-plugin';

import { AppMessage } from '@/code/messages/message.ts';
import { logAxiosError } from '@/services/api-error.ts';
import { useMessageStore } from '@/stores/messages';
import type { UserRegisterForm } from '@/code/data/features/user.ts';
import apiUser from '@/services/features/api-users.ts';

const log = useLogger();
const messageStore = useMessageStore();
const router = useRouter();
const { t, locale } = useI18n();
const form: UserRegisterForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  lang: '',
});
const usedButton: Ref<boolean> = ref(false);
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
  isSubmitting.value = true; // Disable button to prevent multiple submissions in row.

  try {
    form.lang = locale.value; // user could change language after entering registration page

    await apiUser.register(form); // API CALL
    log.debug('Registered user from form data:', form);

    clearForm();
    messageStore.info(t('user.registration.msg.success.title'), t('user.registration.msg.success.content'));
    redirect();
  } catch (error) {
    AppMessage.show(error, 'msgs.user_0201.title', 'msgs.user_0201.content');
    logAxiosError(error, 'Registration failed!');
  } finally {
    isSubmitting.value = false; // Enable button.
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

/** Clear entire form. */
const clearForm = () => {
  form.username = '';
  form.email = '';
  form.password = '';
  form.confirmPassword = '';
  form.lang = '';
};

/** After successful registration we redirect user to login page. */
const redirect = () => {
  router.push({ name: 'user-login' });
};

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
    </form>
  </div>
</template>

<style scoped></style>
