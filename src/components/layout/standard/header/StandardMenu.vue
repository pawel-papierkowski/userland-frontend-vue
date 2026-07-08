<script setup lang="ts">
/** User menu in header. Different depending on your login status. */
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

import DropdownMenu from '@/components/base/layout/DropdownMenu.vue';

const router = useRouter();
const { t } = useI18n();

const handleLogout = async () => {
  await AppLoginer.logout();
  router.push({ name: 'home' });
};
</script>

<template>
  <template v-if="!AppLoginer.isLogged()">
    <router-link class="nav-major" :to="{ name: 'login' }">{{ t('header.user.login') }}</router-link>
    <router-link class="nav-major" :to="{ name: 'registration' }">{{ t('header.user.registration') }}</router-link>
  </template>

  <DropdownMenu v-if="AppLoginer.isLogged()">
    <template #trigger>
      {{ t('header.user.options') }}
    </template>

    <template #content>
      <div class="dropdown-content">
        <router-link class="nav-major" :to="{ name: 'user-profile' }">{{ t('header.user.profile') }}</router-link>
        <hr />
        <div class="nav-major" @click="handleLogout()">{{ t('header.user.logout') }}</div>
      </div>
    </template>
  </DropdownMenu>
</template>

<style scoped></style>
