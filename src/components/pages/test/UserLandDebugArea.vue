<script setup lang="ts">
/** Page that provides various debug information. */
import { useI18n } from 'vue-i18n';
import { useLoginStore } from '@/stores/login.ts';

const loginStore = useLoginStore();

const { t } = useI18n();
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
