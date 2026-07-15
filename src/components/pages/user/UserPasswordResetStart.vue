<script setup lang="ts">
/** Page for requesting password reset. */
import { reactive, ref, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { useRouter } from 'vue-router';
import { useLogger } from 'vue-logger-plugin';
import { useI18n } from 'vue-i18n';

import backendApi from '@/services/api-common.ts';
import backendApiUser from '@/services/features/api-users.ts';
import { defDuration } from '@/stores/messages.ts';

import { Verifier } from '@/code/utils/Verifer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import type { UserPasswordResetLinkForm, UserPasswordResetLinkReq } from '@/code/data/features/user/user-type';

const log = useLogger();
const router = useRouter();
const { t } = useI18n();

/** Password reset link form data. */
const form: UserPasswordResetLinkForm = reactive({
  email: '',
});

/** True if submit button was clicked at least once. */
const usedButton = ref(false);
/** True if submission is in progress, otherwise false. Used to disable submit button. */
const isBusy = ref(false);

const emailError: ComputedRef<string | null> = computed(() => {
  return Verifier.verifyEmail(form.email, usedButton.value);
});

//

/** Handle password reset link request. */
const handlePasswordResetLink = async () => {
  usedButton.value = true; // Now we can show all errors.
  if (isFormError()) return; // Prevent submission if there are client-side errors.
  isBusy.value = true; // Disable submit button to prevent new submission while we are working on current submission.

  try {
    const passwordResetReq = convertToReq(form);
    await backendApiUser.passwordResetLink(passwordResetReq); // API CALL.

    showMessage();
    router.push({ name: 'home' });
  } catch (error) {
    AppMessager.errorT(error, 'user.passwordResetStart.msg.error.title', 'user.passwordResetStart.msg.error.content');
    backendApi.logError(error, 'Password reset request failed!');
  } finally {
    isBusy.value = false; // Enable submit button.
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
 * Convert user password reset form data to user password reset request data.
 * @param form User password reset form.
 * @returns User password reset request.
 */
const convertToReq = (form: UserPasswordResetLinkForm): UserPasswordResetLinkReq => {
  return {
    ...form,
    frontend: 'VUE',
  };
};

/** Show success message. */
const showMessage = () => {
  AppMessager.successT(
    'user.passwordResetStart.msg.success.title',
    'user.passwordResetStart.msg.success.content',
    defDuration * 2,
  );
  log.debug('Successfully sent password reset request as user "', form.email, '".');
};

//

/** We can highlight fields that contain errors. */
const getInputClass = (msgError: string | null): string => {
  if (msgError !== null) return 'err';
  return '';
};
</script>

<template>
  <div class="form-alone">
    <h2>{{ t('user.passwordResetStart.form.title') }}</h2>

    <form @submit.prevent="handlePasswordResetLink" novalidate>
      <div class="form-group">
        <div class="onpage-msg info" v-html="t('user.passwordResetStart.form.info')" />
        <div class="form-entry">
          <label for="email">{{ t('user.passwordResetStart.form.email') }}:</label>
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

      <button type="submit" :disabled="isBusy">
        {{ isBusy ? t('user.passwordResetStart.form.buttonBusy') : t('user.passwordResetStart.form.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
