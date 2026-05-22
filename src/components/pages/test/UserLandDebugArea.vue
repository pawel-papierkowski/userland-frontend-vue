<script setup lang="ts">
/** Page that provides various debug information. */
import { ref } from 'vue';
import type { Ref } from 'vue';
import { useLogger } from 'vue-logger-plugin';
import { useI18n } from 'vue-i18n';

import { useLoginStore } from '@/stores/login.ts';

import backendApi from '@/services/api-common.ts';
import backendApiCheck from '@/services/features/api-checks.ts';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';
import { AppMessager } from '@/code/stores/messages/AppMessager';

const loginStore = useLoginStore();
const log = useLogger();
const { t } = useI18n();

/** True if option call is in progress, otherwise false. Used to disable option buttons. */
const isOptionSubmitting: Ref<boolean> = ref(false);

//

/** Call API checks endpoint: alive. */
const callCheckAlive = async () => {
  try {
    isOptionSubmitting.value = true;
    await backendApiCheck.alive(); // API CALL

    AppMessager.successT('debugArea.checks.alive.msg.success.title', 'debugArea.checks.alive.msg.success.content');
    log.debug('Called /api/checks/alive successfully.');
  } catch (error) {
    AppMessager.errorT(error, 'debugArea.checks.alive.msg.error.title', 'debugArea.checks.alive.msg.error.content');
    backendApi.logError(error, 'Failed to call /api/checks/alive!');
  } finally {
    isOptionSubmitting.value = false; // Enable checks buttons.
  }
}

/** Call API checks endpoint: logged. */
const callCheckLogged = async () => {
  try {
    isOptionSubmitting.value = true;
    await backendApiCheck.mustBeLogged(); // API CALL

    AppMessager.successT('debugArea.checks.logged.msg.success.title', 'debugArea.checks.logged.msg.success.content');
    log.debug('Called /api/checks/must-be-logged successfully.');
  } catch (error) {
    AppMessager.errorT(error, 'debugArea.checks.logged.msg.error.title', 'debugArea.checks.logged.msg.error.content');
    backendApi.logError(error, 'Failed to call /api/checks/must-be-logged!');
  } finally {
    isOptionSubmitting.value = false; // Enable checks buttons.
  }
}

/** Call API checks endpoint: admin. */
const callCheckAdmin = async () => {
  try {
    isOptionSubmitting.value = true;
    await backendApiCheck.mustBeAdmin(); // API CALL

    AppMessager.successT('debugArea.checks.admin.msg.success.title', 'debugArea.checks.admin.msg.success.content');
    log.debug('Called /api/checks/must-be-admin successfully.');
  } catch (error) {
    AppMessager.errorT(error, 'debugArea.checks.admin.msg.error.title', 'debugArea.checks.admin.msg.error.content');
    backendApi.logError(error, 'Failed to call /api/checks/must-be-admin!');
  } finally {
    isOptionSubmitting.value = false; // Enable checks buttons.
  }
}

/** Call API checks endpoint: exception. */
const callCheckException = async () => {
  try {
    isOptionSubmitting.value = true;
    await backendApiCheck.exception(); // API CALL

    AppMessager.successT('debugArea.checks.exception.msg.success.title', 'debugArea.checks.exception.msg.success.content');
    log.debug('Called /api/checks/exception successfully.');
  } catch (error) {
    AppMessager.errorT(error, 'debugArea.checks.exception.msg.error.title', 'debugArea.checks.exception.msg.error.content');
    backendApi.logError(error, 'Failed to call /api/checks/exception!');
  } finally {
    isOptionSubmitting.value = false; // Enable checks buttons.
  }
}

/** Call API users endpoint: prolong. */
const callProlong = async () => {
  try {
    isOptionSubmitting.value = true;
    const { result, jwt } = await AppLoginer.prolongSilently();

    if (result) {
      AppMessager.successT('debugArea.options.prolong.msg.success.title', 'debugArea.options.prolong.msg.success.content');
      log.debug('Prolonged user session successfully. New token: ' + jwt);
    } else {
      AppMessager.failureT('debugArea.options.prolong.msg.failure.title', 'debugArea.options.prolong.msg.failure.content');
      log.error('Prolong failed! Used token: ' + jwt);
    }
  } catch (error) {
    AppMessager.errorT(error, 'debugArea.options.prolong.msg.error.title', 'debugArea.options.prolong.msg.error.content');
    backendApi.logError(error, 'Failed to prolong user session!');
  } finally {
    isOptionSubmitting.value = false; // Enable checks buttons.
  }
}
</script>

<template>
  <div class="debugArea-wrapper">

    <fieldset>
      <legend>{{ t('debugArea.login.legend') }}</legend>
      <div class="debugArea-data">
        <div>{{ t('debugArea.login.logged') }}:</div>
        <div>{{ t('state.'+loginStore.loginState.isLogged) }}</div>
        <div>{{ t('debugArea.login.name') }}:</div>
        <div>{{ loginStore.loginState.name }}</div>
        <div>{{ t('debugArea.login.email') }}:</div>
        <div>{{ loginStore.loginState.email }}</div>
        <div>{{ t('debugArea.login.issuedAt') }}:</div>
        <div>{{ loginStore.loginState.issuedAt.toISOString() }}</div>
        <div>{{ t('debugArea.login.expiresAt') }}:</div>
        <div>{{ loginStore.loginState.expiresAt.toISOString() }}</div>
        <div>{{ t('debugArea.login.permissions') }}:</div>
        <div>{{ loginStore.loginState.permissions }}</div>
      </div>
    </fieldset>

    <fieldset>
      <legend>{{ t('debugArea.checks.legend') }}</legend>
      <div class="buttons-vertical">
        <button :disabled="isOptionSubmitting" @click="callCheckAlive()">{{ t('debugArea.checks.alive.button') }}</button>
        <button :disabled="isOptionSubmitting" @click="callCheckLogged()">{{ t('debugArea.checks.logged.button') }}</button>
        <button :disabled="isOptionSubmitting" @click="callCheckAdmin()">{{ t('debugArea.checks.admin.button') }}</button>
        <button :disabled="isOptionSubmitting" @click="callCheckException()">{{ t('debugArea.checks.exception.button') }}</button>
      </div>
    </fieldset>

    <fieldset>
      <legend>{{ t('debugArea.options.legend') }}</legend>
      <div class="buttons-vertical">
        <button :disabled="isOptionSubmitting" @click="callProlong()">{{ t('debugArea.options.prolong.button') }}</button>
      </div>
    </fieldset>

  </div>
</template>

<style scoped>
.debugArea-wrapper {
  display: flex;
  flex-direction: row; /* Stacks children horizontally */
  align-items: center; /* Centers the items horizontally */
  gap: 1rem; /* Adds consistent spacing between items without margins */
}

.debugArea-data {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;

  padding: 1px;
}

.debugArea-data div {
  padding: 2px;
}
</style>
