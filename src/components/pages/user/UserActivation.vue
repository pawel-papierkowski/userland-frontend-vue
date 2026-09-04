<script setup lang="ts">
/** Standalone page for activating account. Accessed via link from email. */
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { logger } from '@/code/utils/logger.ts';
import apiLogging from '@/services/api-logging.ts';
import backendApiUser from '@/services/features/api-users.ts';
import type { TokenActivationReq } from '@/code/data/features/user/user-type';

import { TokenUtils } from '@/code/utils/TokenUtils.ts';
import { AppMessager } from '@/code/wrappers/messages/AppMessager';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

/** Can spinner spin? */
const canSpin = ref(true);
/** Token needed for confirmation of action. */
const tokenStr = TokenUtils.resolve(route);

/** Call activation API. */
const callActivationApi = async () => {
  if (!TokenUtils.verify(tokenStr)) {
    AppMessager.failureT('token.invalid.title', 'token.invalid.content');
    router.push({ name: 'home' });
    return;
  }

  try {
    const payload: TokenActivationReq = { token: tokenStr, frontend: 'VUE' };
    await backendApiUser.activate(payload);

    logger.debug('Activated user using token:', tokenStr);
    AppMessager.successT('user.activation.msg.success.title', 'user.activation.msg.success.content');

    router.push({ name: 'login' }); // go straight to login page
  } catch (error) {
    AppMessager.errorT(error, 'user.activation.msg.error.title', 'user.activation.msg.error.content');
    apiLogging.logError(error, 'Activation failed!');
    canSpin.value = false;
  }
};

//

/** Automatically call once user enters page. */
onMounted(() => {
  callActivationApi();
});
</script>

<template>
  <div>
    <h2>{{ t('user.activation.title') }}</h2>
    <div class="spinner-container">
      <SpinnerTorus
        data-testid="spinner"
        display="block"
        size="100px"
        :canSpin="canSpin"
        :descr="t('user.activation.title')"
      />
    </div>
  </div>
</template>

<style scoped></style>
