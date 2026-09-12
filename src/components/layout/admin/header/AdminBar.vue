<script setup lang="ts">
/** Admin panel bar in the middle of the header. */
import { useI18n } from 'vue-i18n';

import { AppLoginer } from '@/code/wrappers/login/AppLoginer.ts';

const { t } = useI18n();

const canShowUser = () => {
  if (AppLoginer.hasPermission('role_admin')) return true;
  return AppLoginer.hasPermissionsAll(['role_operator', 'user_view']);
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
  <template v-else>
    <router-link class="nav-major" data-testid="header_link_back" :to="{ name: 'home' }">{{
      t('admin.header.home')
    }}</router-link>
  </template>
</template>

<style scoped></style>
