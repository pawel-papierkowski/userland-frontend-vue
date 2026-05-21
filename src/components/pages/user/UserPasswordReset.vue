<script setup lang="ts">
/** Standalone page for resetting password. Accessed via link from email. */
import { onMounted, reactive, ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLogger } from 'vue-logger-plugin';
import { useI18n } from 'vue-i18n';

import backendApi from '@/services/api-common.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { TokenUtils } from '@/code/utils/TokenUtils.ts';
import { Verifier } from '@/code/utils/Verifer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager';
import type { UserPasswordResetForm, UserPasswordResetReq } from '@/code/data/features/user.ts';

const log = useLogger();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

/** Password reset confirmation form data. */
const form: UserPasswordResetForm = reactive({
  password: '',
  confirmPassword: '',
});
/** Token needed for confirmation of action. */
const tokenStr = TokenUtils.resolve(route);

/** True if submit button was clicked at least once. */
const usedButton: Ref<boolean> = ref(false);
/** True if submission is in progress, otherwise false. Used to disable submit button. */
const isSubmitting: Ref<boolean> = ref(false);

const passwordError: ComputedRef<string | null> = computed(() => {
  return Verifier.verifyPassword(form.password, usedButton.value);
});
const passwordConfirmError: ComputedRef<string | null> = computed(() => {
  return Verifier.verifyConfirmPassword(form.password, form.confirmPassword, usedButton.value);
});

//

const verifyToken = () => {
  if (!TokenUtils.verify(tokenStr)) {
    AppMessager.failureT('token.invalid.title', 'token.invalid.content');
    router.push({ name: 'home' });
    return;
  }
};

/** Handle password reset confirmation. */
const handlePasswordResetConfirmation = async () => {
  usedButton.value = true; // Now we can show all errors.
  if (isFormError()) return; // Prevent submission if there are client-side errors.
  isSubmitting.value = true; // Disable submit button to prevent new submission while we are working on current submission.

  try {
    const passwordResetReq = convertToReq(form);
    await backendApiUser.passwordResetConfirm(passwordResetReq); // API CALL.

    showMessage();
    clearForm();
    router.push({ name: 'home' });
  } catch (error) {
    AppMessager.errorT(error, 'user.passwordReset.msg.error.title', 'user.passwordReset.msg.error.content');
    backendApi.logError(error, 'Password reset confirmation failed! Token: '+tokenStr);
  } finally {
    isSubmitting.value = false; // Enable submit button.
  }
};

/** Check if form has any errors. */
const isFormError = () => {
   // prevent sending empty form
  if (!form.password || !form.confirmPassword) return true;
  if (passwordError.value !== null) return true;
  if (passwordConfirmError.value !== null) return true;
  return false;
};

/**
 * Convert user login form data to user login request data.
 * @param form User login form.
 * @returns User login request.
 */
const convertToReq = (form: UserPasswordResetForm): UserPasswordResetReq => {
  return {
    token: tokenStr,
    password: form.password,
  };
};

/** Show success message. */
const showMessage = () => {
  AppMessager.successT('user.passwordReset.msg.success.title', 'user.passwordReset.msg.success.content');
  log.debug('Successfully set new password.');
};

/** Clear entire form. */
const clearForm = () => {
  form.password = '';
  form.confirmPassword = '';
};

//

/** We can highlight fields that contain errors. */
const getInputClass = (msgError: string | null): string => {
  if (msgError !== null) return 'err';
  return '';
};

//

onMounted(() => { // automatically call once user enters page
  verifyToken();
});
</script>

<template>
  <div class="form-all">
    <h2>{{ t('user.passwordReset.form.title') }}</h2>

    <form @submit.prevent="handlePasswordResetConfirmation" novalidate>
      <div class="form-group">
        <div class="form-entry">
          <label for="password">{{ t('user.passwordReset.form.password') }}:</label>
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
          <label for="confirmPassword">{{ t('user.passwordReset.form.confirmPassword') }}:</label>
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
        {{ isSubmitting ? t('user.passwordReset.form.buttonSubmitting') : t('user.passwordReset.form.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
