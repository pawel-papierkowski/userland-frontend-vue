<script setup lang="ts">
/** Page for requesting email address change. */
import { reactive, ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { useRouter } from 'vue-router';
import { useLogger } from 'vue-logger-plugin';
import { useI18n } from 'vue-i18n';

import backendApi from '@/services/api-common.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { Verifier } from '@/code/utils/Verifer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager.ts';
import type { UserEmailChangeLinkForm, UserEmailChangeLinkReq } from '@/code/data/features/user/user';

const log = useLogger();
const router = useRouter();
const { t } = useI18n();

/** Email change link form data. */
const form: UserEmailChangeLinkForm = reactive({
  newEmail: '',
  password: '',
});

/** True if submit button was clicked at least once. */
const usedButton: Ref<boolean> = ref(false);
/** True if submission is in progress, otherwise false. Used to disable submit button. */
const isSubmitting: Ref<boolean> = ref(false);

const newEmailError: ComputedRef<string | null> = computed(() => {
  return Verifier.verifyEmail(form.newEmail, usedButton.value);
});
const passwordError: ComputedRef<string | null> = computed(() => {
  return Verifier.verifyPassword(form.password, usedButton.value);
});

//

/** Handle email change link request. */
const handleEmailChangeLink = async () => {
  usedButton.value = true; // Now we can show all errors.
  if (isFormError()) return; // Prevent submission if there are client-side errors.
  isSubmitting.value = true; // Disable submit button to prevent new submission while we are working on current submission.

  try {
    const emailChangeReq = convertToReq(form);
    await backendApiUser.emailChangeLink(emailChangeReq); // API CALL.

    showMessage();
    clearForm();
    router.push({ name: 'home' });
  } catch (error) {
    AppMessager.errorT(error, 'user.emailChangeStart.msg.error.title', 'user.emailChangeStart.msg.error.content');
    backendApi.logError(error, 'Email change request failed!');
  } finally {
    isSubmitting.value = false; // Enable submit button.
  }
};

/** Check if form has any errors. */
const isFormError = () => {
  // prevent sending empty form
  if (!form.newEmail || !form.password) return true;
  if (newEmailError.value !== null) return true;
  if (passwordError.value !== null) return true;
  return false;
};

/**
 * Convert user email change form data to user email change request data.
 * @param form User email change form.
 * @returns User email change request.
 */
const convertToReq = (form: UserEmailChangeLinkForm): UserEmailChangeLinkReq => {
  return {
    ...form,
    frontend: 'VUE',
  };
};

/** Show success message. */
const showMessage = () => {
  AppMessager.successT('user.emailChangeStart.msg.success.title', 'user.emailChangeStart.msg.success.content');
  log.debug('Successfully sent email change request.');
};

/** Clear entire form. */
const clearForm = () => {
  form.newEmail = '';
  form.password = '';
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
    <h2>{{ t('user.emailChangeStart.form.title') }}</h2>

    <form @submit.prevent="handleEmailChangeLink" novalidate>
      <div class="form-group">
        <div class="box-info" v-html="t('user.emailChangeStart.form.info')" />
        <div class="form-entry">
          <label for="newEmail">{{ t('user.emailChangeStart.form.newEmail') }}:</label>
          <input
            :class="getInputClass(newEmailError)"
            id="newEmail"
            data-testid="newEmail"
            type="email"
            v-model="form.newEmail"
            required
            autocomplete="email"
          />
          <span v-if="newEmailError" class="form-text-error">{{ newEmailError }}</span>
        </div>

        <div class="form-entry">
          <label for="password">{{ t('user.emailChangeStart.form.password') }}:</label>
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
      </div>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? t('user.emailChangeStart.form.buttonBusy') : t('user.emailChangeStart.form.button') }}
      </button>
    </form>
  </div>
</template>

<style scoped></style>
