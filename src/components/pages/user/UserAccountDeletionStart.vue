<script setup lang="ts">
/** Page for requesting user account deletion. */
import { reactive, ref, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { logger } from '@/code/utils/logger.ts';
import apiLogging from '@/services/api-logging.ts';
import backendApiUser from '@/services/features/api-users.ts';
import { durAccountDelete } from '@/stores/messages/const.ts';

import { Verifier } from '@/code/utils/Verifer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import type { UserAccountDeleteLinkForm, UserAccountDeleteLinkReq } from '@/code/data/features/user/user-type';

import TextBox from '@/components/base/inputs/TextBox.vue';

const router = useRouter();
const { t } = useI18n();

/** Email change link form data. */
const form: UserAccountDeleteLinkForm = reactive({
  password: '',
});

/** True if submit button was clicked at least once. */
const usedButton = ref(false);
/** True if submission is in progress, otherwise false. Used to disable submit button. */
const isBusy = ref(false);

const passwordError: ComputedRef<string | null> = computed(() => {
  return Verifier.verifyPassword(form.password, usedButton.value);
});

//

/** Handle account deletion link request. */
const handleAccountDeletionLink = async () => {
  usedButton.value = true; // Now we can show all errors.
  if (isFormError()) return; // Prevent submission if there are client-side errors.
  isBusy.value = true; // Disable submit button to prevent new submission while we are working on current submission.

  try {
    const accountDeleteReq = convertToReq(form);
    await backendApiUser.accountDeleteLink(accountDeleteReq); // API CALL.

    showMessage();
    router.push({ name: 'home' });
  } catch (error) {
    clearForm();
    isBusy.value = false; // Enable submit button.
    AppMessager.errorT(error, 'user.accountDeleteStart.msg.error.title', 'user.accountDeleteStart.msg.error.content');
    apiLogging.logError(error, 'Account deletion request failed!');
  }
};

/** Check if form has any errors. */
const isFormError = () => {
  // prevent sending empty form
  if (!form.password) return true;
  if (passwordError.value !== null) return true;
  return false;
};

/**
 * Convert user account deletion form data to user account deletion request data.
 * @param form User account deletion form.
 * @returns User account deletion request.
 */
const convertToReq = (form: UserAccountDeleteLinkForm): UserAccountDeleteLinkReq => {
  return {
    ...form,
    frontend: 'VUE',
  };
};

/** Show success message. */
const showMessage = () => {
  AppMessager.successT(
    'user.accountDeleteStart.msg.success.title',
    'user.accountDeleteStart.msg.success.content',
    durAccountDelete,
  );
  logger.debug('Successfully sent account deletion request.');
};

/** Clear entire form. */
const clearForm = () => {
  usedButton.value = false;
  form.password = '';
};

//

/** We can highlight fields that contain errors. */
const isInvalid = (msgError: string | null): boolean => {
  return msgError !== null;
};
</script>

<template>
  <div class="form-alone">
    <h2>{{ t('user.accountDeleteStart.form.title') }}</h2>

    <form @submit.prevent="handleAccountDeletionLink" novalidate>
      <div class="form-group">
        <div class="onpage-msg info" v-html="t('user.accountDeleteStart.form.info')" />
        <div class="form-entry">
          <label for="password">{{ t('user.accountDeleteStart.form.password') }}:</label>
          <TextBox
            id="password"
            type="password"
            v-model="form.password"
            autocomplete="password"
            :required="true"
            :disabled="isBusy"
            :invalid="isInvalid(passwordError)"
          />
          <span v-if="passwordError" class="form-text-error">{{ passwordError }}</span>
        </div>
      </div>

      <button type="submit" data-testid="accountDeleteStart_btn_submit" :disabled="isBusy">
        {{ isBusy ? t('user.accountDeleteStart.form.buttonBusy') : t('user.accountDeleteStart.form.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
