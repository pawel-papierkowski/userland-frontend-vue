<script setup lang="ts">
/** User menu in header. Different depending on your login status. */

import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <router-link :to="{ name: 'user-login' }">{{ t('user.login.link') }}</router-link>
  <router-link :to="{ name: 'user-registration' }">{{ t('user.registration.link') }}</router-link>
  <router-link :to="{ name: 'user-profile' }">{{ t('user.profile.link') }}</router-link>
</template>

<style scoped></style>
