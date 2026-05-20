<script setup lang="ts">
/** Page for requesting password reset. */
import { reactive, ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { useRouter } from 'vue-router';
import { useLogger } from 'vue-logger-plugin';
import { useI18n } from 'vue-i18n';

import backendApi from '@/services/api-common.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { Verifier } from '@/code/utils/Verifer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import type { UserPasswordResetLinkForm, UserPasswordResetLinkReq } from '@/code/data/features/user.ts';

const log = useLogger();
const router = useRouter();
const { t } = useI18n();

/** Password reset link form data. */
const form: UserPasswordResetLinkForm = reactive({
  email: '',
});

/** True if submit button was clicked at least once. */
const usedButton: Ref<boolean> = ref(false);
/** True if submission is in progress, otherwise false. Used to disable submit button. */
const isSubmitting: Ref<boolean> = ref(false);

const emailError: ComputedRef<string | null> = computed(() => {
  return Verifier.verifyEmail(form.email, usedButton.value);
});

//

/** Handle password reset link request. */
const handlePasswordResetLink = async () => {
  usedButton.value = true; // Now we can show all errors.
  if (isFormError()) return; // Prevent submission if there are client-side errors.
  isSubmitting.value = true; // Disable submit button to prevent new submission while we are working on current submission.

  try {
    const passwordResetReq = convertToReq(form);
    await backendApiUser.passwordResetLink(passwordResetReq); // API CALL.

    showMessage();
    clearForm();
    router.push({ name: 'home' });
  } catch (error) {
    AppMessager.errorT(error, 'user.passwordResetLink.msg.error.title', 'user.passwordResetLink.msg.error.content');
    backendApi.logError(error, 'Password reset request failed!');
  } finally {
    isSubmitting.value = false; // Enable submit button.
  }
};

/** Check if form has any errors. */
const isFormError = () => {
   // prevent sending empty form
  if (!form.email) return true;
  if (emailError.value !== null) return true;
  return false;
};

/**
 * Convert user login form data to user login request data.
 * @param form User login form.
 * @returns User login request.
 */
const convertToReq = (form: UserPasswordResetLinkForm): UserPasswordResetLinkReq => {
  return {
    ...form,
    frontend: 'VUE',
  };
};

/** Show success message. */
const showMessage = () => {
  AppMessager.successT('user.passwordResetLink.msg.success.title', 'user.passwordResetLink.msg.success.content');
  log.debug('Successfully sent password reset request as user "', form.email, '".');
};

/** Clear entire form. */
const clearForm = () => {
  form.email = '';
};

//

/** We can highlight fields that contain errors. */
const getInputClass = (msgError: string | null): string => {
  if (msgError !== null) return 'err';
  return '';
};
</script>

<template>
  <div class="form-all">
    <h2>{{ t('user.passwordResetLink.form.title') }}</h2>

    <form @submit.prevent="handlePasswordResetLink" novalidate>
      <div class="form-group">
        <div class="form-info">{{ t('user.passwordResetLink.form.info') }}</div>
        <div class="form-entry">
          <label for="email">{{ t('user.passwordResetLink.form.email') }}:</label>
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
      </div>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? t('user.passwordResetLink.form.buttonSubmitting') : t('user.passwordResetLink.form.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
