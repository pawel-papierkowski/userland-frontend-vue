<script setup lang="ts">
/** Standalone page for activating account. Accessed via link from email. */
import { onMounted, ref } from 'vue';
import type { Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLogger } from 'vue-logger-plugin';
import { useI18n } from 'vue-i18n';

import backendApi from '@/services/api-common.ts';
import backendApiUser from '@/services/features/api-users.ts';
import type { TokenActivationReq } from '@/code/data/features/user.ts';

import { TokenUtils } from '@/code/utils/TokenUtils.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager';
import SpinnerTorus from '@/components/base/decor/SpinnerTorus.vue';

const log = useLogger();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

/** Can spinner spin? */
const canSpin: Ref<boolean> = ref(true);

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

    log.debug('Activated user using token:', tokenStr);
    AppMessager.successT('user.activation.msg.success.title', 'user.activation.msg.success.content');

    router.push({ name: 'login' }); // go straight to login page
  } catch (error) {
    AppMessager.errorT(error, 'user.activation.msg.error.title', 'user.activation.msg.error.content');
    backendApi.logError(error, 'Activation failed!');
    canSpin.value = false;
  }
}

//

onMounted(() => { // automatically call once user enters page
  callActivationApi();
});
</script>

<template>
  <div>
    <h2>{{ t('user.activation.title') }}</h2>
    <div class="spinner-container">
      <SpinnerTorus display="block" size="100px" :canSpin="canSpin" />
    </div>
  </div>
</template>

<style scoped></style>
