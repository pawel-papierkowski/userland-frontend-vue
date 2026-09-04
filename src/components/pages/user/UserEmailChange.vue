<script setup lang="ts">
/**
 * Standalone page for changing email address. Accessed via link from email.
 * Note: you need to be logged in to access endpoint successfully.
 */
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { logger } from '@/code/utils/logger.ts';
import apiLogging from '@/services/api-logging.ts';
import backendApiUser from '@/services/features/api-users.ts';
import { durEmailChange } from '@/stores/messages/const.ts';
import type { UserEmailChangeReq } from '@/code/data/features/user/user-type';

import { TokenUtils } from '@/code/utils/TokenUtils.ts';
import { AppLoginer } from '@/code/wrappers/login/AppLoginer.ts';
import { AppMessager } from '@/code/wrappers/messages/AppMessager';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

/** Can spinner spin? */
const canSpin = ref(true);
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

    AppMessager.successT('user.emailChange.msg.success.title', 'user.emailChange.msg.success.content', durEmailChange);
    logger.debug('Changed email address.');

    // Force user to log in again. Why? Previous token stopped working, since email serves as username in both JWT and
    // internal Spring handling on backend.
    AppLoginer.logout(false);
    router.push({ name: 'home' }); // go to home page
  } catch (error) {
    AppMessager.errorT(error, 'user.emailChange.msg.error.title', 'user.emailChange.msg.error.content');
    apiLogging.logError(error, 'Email address change failed!');
    canSpin.value = false;
  }
};

//

/** Automatically call once user enters page. */
onMounted(() => {
  callEmailChangeApi();
});
</script>

<template>
  <div>
    <h2>{{ t('user.emailChange.title') }}</h2>
    <div class="spinner-container">
      <SpinnerTorus
        data-testid="spinner"
        display="block"
        size="100px"
        :canSpin="canSpin"
        :descr="t('user.emailChange.title')"
      />
    </div>
  </div>
</template>

<style scoped></style>
