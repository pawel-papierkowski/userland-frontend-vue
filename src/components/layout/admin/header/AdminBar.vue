<script setup lang="ts">
/** Admin panel bar in middle of header. */
import { useI18n } from 'vue-i18n';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

const { t } = useI18n();

const canShowUser = () => {
  return AppLoginer.hasPermissionsAny(['role_admin', 'user_view']);
};
</script>

<template>
  <template v-if="AppLoginer.isLogged()">
    <router-link class="nav-major" data-testid="header_link_main" :to="{ name: 'admin-main' }">{{
      t('admin.header.main')
    }}</router-link>
    <router-link class="nav-major" data-testid="header_link_users" :to="{ name: 'admin-user' }" v-if="canShowUser()">{{
      t('admin.header.user')
    }}</router-link>
  </template>
</template>

<style scoped></style>
