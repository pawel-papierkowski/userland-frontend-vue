<script setup lang="ts">
/** Standalone page for activating account. Accessed via link from email. */
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLogger } from 'vue-logger-plugin';
import { useI18n } from 'vue-i18n';

import backendApi from '@/services/api-common.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { AppMessager } from '@/code/messages/AppMessager.ts';

const log = useLogger();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

/**
 * Call activation API.
 */
const callActivationApi = async () => {
  // Ensure token is string, even if the URL query is missing or duplicated.
  const tokenStr: string = (Array.isArray(route.query.token) ? route.query.token[0] : route.query.token) ?? '';

  if (tokenStr === '') {// verify token existence
    AppMessager.failure('user.activation.msg.noToken.title', 'user.activation.msg.noToken.content');
    router.push({ name: 'home' });
    return;
  }

  try {
    await backendApiUser.activate(tokenStr);

    log.debug('Activated user using token:', tokenStr);
    AppMessager.success('user.activation.msg.success.title', 'user.activation.msg.success.content');

    router.push({ name: 'user-login' }); // go straight to login page
  } catch (error) {
    AppMessager.error(error, 'user.activation.msg.error.title', 'user.activation.msg.error.content');
    backendApi.logError(error, 'Activation failed!');
    router.push({ name: 'home' }); // kick user out of this page
  }
}

onMounted(() => {
  callActivationApi(); // automatically call once user enters page
});
</script>

<template>
  <div>
    <h2>{{ t('user.activation.title') }}</h2>
    <!-- TODO: insert nice spinner here -->
  </div>
</template>

<style scoped></style>
