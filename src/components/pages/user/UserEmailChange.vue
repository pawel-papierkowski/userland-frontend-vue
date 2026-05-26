<script setup lang="ts">
/**
 * Standalone page for changing email address. Accessed via link from email.
 * Note: you need to be logged in to access endpoint successfully.
 */
import { onMounted, ref } from 'vue';
import type { Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLogger } from 'vue-logger-plugin';
import { useI18n } from 'vue-i18n';

import backendApi from '@/services/api-common.ts';
import backendApiUser from '@/services/features/api-users.ts';
import type { UserEmailChangeReq } from '@/code/data/features/user/user';

import { TokenUtils } from '@/code/utils/TokenUtils.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

const log = useLogger();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

/** Can spinner spin? */
const canSpin: Ref<boolean> = ref(true);
/** Token needed for confirmation of action. */
const tokenStr = TokenUtils.resolve(route);

//

/**
 * Verifies state: you need to be logged in and token must be present.
 * @returns True if verification was successful, otherwise false.
 */
const verifyAll = (): boolean => {
  if (!AppLoginer.isLogged()) {
    AppMessager.failureT('user.emailChange.msg.mustBeLogged.title', 'user.emailChange.msg.mustBeLogged.content');
    router.push({ name: 'login' });
    return false;
  }

  if (!TokenUtils.verify(tokenStr)) {
    AppMessager.failureT('token.invalid.title', 'token.invalid.content');
    router.push({ name: 'home' });
    return false;
  }

  return true;
};

/** Call email change API. Note it is automatically called. */
const callEmailChangeApi = async () => {
  if (!verifyAll()) return;

  try {
    const payload: UserEmailChangeReq = { token: tokenStr };
    await backendApiUser.emailChangeConfirm(payload);

    log.debug('Changed email address using token:', tokenStr);
    AppMessager.successT('user.emailChange.msg.success.title', 'user.emailChange.msg.success.content');

    // Force user to log in again. Why? Previous token stopped working, since email serves as username in both JWT and
    // internal Spring handling on backend.
    AppLoginer.logout(false);
    router.push({ name: 'home' }); // go to home page
  } catch (error) {
    AppMessager.errorT(error, 'user.emailChange.msg.error.title', 'user.emailChange.msg.error.content');
    backendApi.logError(error, 'Email address change failed! Token: ' + tokenStr);
    canSpin.value = false;
  }
};

//

onMounted(() => {
  // automatically call once user enters page
  callEmailChangeApi();
});
</script>

<template>
  <div>
    <h2>{{ t('user.emailChange.title') }}</h2>
    <div class="spinner-container">
      <SpinnerTorus data-testid="spinner" display="block" size="100px" :canSpin="canSpin" />
    </div>
  </div>
</template>

<style scoped></style>
