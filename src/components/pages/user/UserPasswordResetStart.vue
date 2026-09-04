<script setup lang="ts">
/** Page for requesting password reset. */
import { reactive, ref, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { logger } from '@/code/utils/logger.ts';
import apiLogging from '@/services/api-logging.ts';
import backendApiUser from '@/services/features/api-users.ts';
import { durPasswordReset } from '@/stores/messages/const.ts';

import { Verifer } from '@/code/utils/Verifer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import type { UserPasswordResetLinkForm, UserPasswordResetLinkReq } from '@/code/data/features/user/user-type';

import TextBox from '@/components/base/inputs/TextBox.vue';

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
  return Verifer.verifyEmail(form.email, usedButton.value);
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
    isBusy.value = false; // Enable submit button.
    AppMessager.errorT(error, 'user.passwordResetStart.msg.error.title', 'user.passwordResetStart.msg.error.content');
    apiLogging.logError(error, 'Password reset request failed!');
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
    durPasswordReset,
  );
  logger.debug('Successfully sent password reset request as user "', form.email, '".');
};

//

/** We can highlight fields that contain errors. */
const isInvalid = (msgError: string | null): boolean => {
  return msgError !== null;
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
      </div>

      <button type="submit" data-testid="passwordResetStart_btn_submit" :disabled="isBusy">
        {{ isBusy ? t('user.passwordResetStart.form.buttonBusy') : t('user.passwordResetStart.form.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
