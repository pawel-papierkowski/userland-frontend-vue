<script setup lang="ts">
/**
 * Standalone page for deleting user account. Accessed via link from email.
 * Note: you need to be logged in to access endpoint successfully.
 */
import { onMounted, ref } from 'vue';
import type { Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLogger } from 'vue-logger-plugin';
import { useI18n } from 'vue-i18n';

import backendApi from '@/services/api-common.ts';
import backendApiUser from '@/services/features/api-users.ts';
import type { UserAccountDeleteReq } from '@/code/data/features/user/user';

import { TokenUtils } from '@/code/utils/TokenUtils.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager';

const log = useLogger();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

/** Token needed for confirmation of action. */
const tokenStr = TokenUtils.resolve(route);
/** True if submission is in progress, otherwise false. Used to disable submit button. */
const isBusy: Ref<boolean> = ref(false);

//

/**
 * Verifies state: you need to be logged in and token must be present.
 */
const verifyAll = () => {
  if (!AppLoginer.isLogged()) {
    AppMessager.failureT('user.accountDelete.msg.mustBeLogged.title', 'user.accountDelete.msg.mustBeLogged.content');
    router.push({ name: 'login' });
    return;
  }

  if (!TokenUtils.verify(tokenStr)) {
    AppMessager.failureT('token.invalid.title', 'token.invalid.content');
    router.push({ name: 'home' });
    return;
  }
};

/** Handle account deletion confirmation. */
const handleAccountDeletion = async () => {
  isBusy.value = true; // Disable submit button to prevent new submission while we are working on current submission.

  try {
    const payload: UserAccountDeleteReq = { token: tokenStr };
    await backendApiUser.accountDeleteConfirm(payload);

    log.debug('Deleted user account using token:', tokenStr);
    AppMessager.successT('user.accountDelete.msg.success.title', 'user.accountDelete.msg.success.content');

    // User account ceased to exist, so we log out user on frontend.
    AppLoginer.logout(false);
    router.push({ name: 'home' }); // go to home page
  } catch (error) {
    AppMessager.errorT(error, 'user.accountDelete.msg.error.title', 'user.accountDelete.msg.error.content');
    backendApi.logError(error, 'User account deletion failed! Token: ' + tokenStr);
  } finally {
    isBusy.value = false; // Enable submit button.
  }
};

//

/** Automatically call once user enters page. */
onMounted(() => {
  verifyAll();
});
</script>

<template>
  <div class="form-alone">
    <h2>{{ t('user.accountDelete.form.title') }}</h2>
    <div class="form-group">
      <div class="onpage-msg warning" v-html="t('user.accountDelete.form.warning')" />
    </div>

    <button data-testid="btn-deleteAccount" class="danger" :disabled="isBusy" @click="handleAccountDeletion()">
      {{ isBusy ? t('user.accountDelete.form.buttonBusy') : t('user.accountDelete.form.button') }}
    </button>
  </div>
</template>

<style scoped></style>
