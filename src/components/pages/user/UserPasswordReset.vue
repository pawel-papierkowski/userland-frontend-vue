<script setup lang="ts">
/** Standalone page for resetting password. Accessed via link from email. */
import { onMounted, reactive, ref, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { logger } from '@/code/utils/logger.ts';
import apiLogging from '@/services/api-logging.ts';
import backendApiUser from '@/services/features/api-users.ts';
import { defDuration } from '@/stores/messages.ts';

import { TokenUtils } from '@/code/utils/TokenUtils.ts';
import { Verifier } from '@/code/utils/Verifer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager';
import type { UserPasswordResetForm, UserPasswordResetReq } from '@/code/data/features/user/user-type';

import TextBox from '@/components/base/inputs/TextBox.vue';

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
const usedButton = ref(false);
/** True if submission is in progress, otherwise false. Used to disable submit button. */
const isBusy = ref(false);

const passwordError: ComputedRef<string | null> = computed(() => {
  return Verifier.verifyPassword(form.password, usedButton.value);
});
const passwordConfirmError: ComputedRef<string | null> = computed(() => {
  return Verifier.verifyConfirmPassword(form.password, form.confirmPassword, usedButton.value);
});

//

/**
 * Verifies state: token must be present.
 * @returns True if verification was successful, otherwise false.
 */
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
  isBusy.value = true; // Disable submit button to prevent new submission while we are working on current submission.

  try {
    const passwordResetReq = convertToReq(form);
    await backendApiUser.passwordResetConfirm(passwordResetReq); // API CALL.

    showMessage();
    router.push({ name: 'login' }); // go straight to login page
  } catch (error) {
    clearForm();
    isBusy.value = false; // Enable submit button.
    AppMessager.errorT(error, 'user.passwordReset.msg.error.title', 'user.passwordReset.msg.error.content');
    apiLogging.logError(error, 'Password reset confirmation failed!');
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
  AppMessager.successT(
    'user.passwordReset.msg.success.title',
    'user.passwordReset.msg.success.content',
    defDuration * 2,
  );
  logger.debug('Successfully set new password.');
};

/** Clear entire form. */
const clearForm = () => {
  usedButton.value = false;
  form.password = '';
  form.confirmPassword = '';
};

//

/** We can highlight fields that contain errors. */
const isInvalid = (msgError: string | null): boolean => {
  return msgError !== null;
};

//

/** Automatically call once user enters page. */
onMounted(() => {
  verifyToken();
});
</script>

<template>
  <div class="form-alone">
    <h2>{{ t('user.passwordReset.form.title') }}</h2>

    <form @submit.prevent="handlePasswordResetConfirmation" novalidate>
      <div class="form-group">
        <div class="form-entry">
          <label for="password">{{ t('user.passwordReset.form.password') }}:</label>
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
          <label for="confirmPassword">{{ t('user.passwordReset.form.confirmPassword') }}:</label>
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
      </div>

      <button type="submit" data-testid="passwordReset_btn_submit" :disabled="isBusy">
        {{ isBusy ? t('user.passwordReset.form.buttonBusy') : t('user.passwordReset.form.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
