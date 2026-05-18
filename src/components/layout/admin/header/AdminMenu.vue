<script setup lang="ts">
/** User menu in header. Different depending on your login status. */
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

import DropdownMenu from '@/components/base/layout/DropdownMenu.vue';

const router = useRouter();
const { t } = useI18n();

const handleLogout = () => {
  AppLoginer.logout();
  router.push({ name: 'admin-login' });
}
</script>

<template>
  <DropdownMenu v-if="AppLoginer.isLogged()">
    <template #trigger>
      {{ t('header.user.options') }}
    </template>

    <template #content>
      <div class="dropdown-menu">
        <router-link class="nav-link" :to="{ name: 'admin-profile' }">{{ t('header.user.profile') }}</router-link>
        <hr />
        <div class="nav-link" @click="handleLogout()">{{ t('header.user.logout') }}</div>
      </div>
    </template>
  </DropdownMenu>
</template>

<style scoped></style>
