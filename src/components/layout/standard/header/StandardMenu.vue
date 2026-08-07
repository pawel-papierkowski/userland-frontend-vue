<script setup lang="ts">
/** User menu in header. Different depending on your login status. */
import { nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

import DropdownMenu from '@/components/base/layout/DropdownMenu.vue';

const router = useRouter();
const { t } = useI18n();

/** Handle logout. */
const handleLogout = async () => {
  await AppLoginer.logout();
  router.push({ name: 'home' });
};

/** Handle keyboard events. */
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    nextTick(() => handleLogout());
  }
}
</script>

<template>
  <template v-if="!AppLoginer.isLogged()">
    <router-link class="nav-major" :to="{ name: 'login' }">{{ t('general.header.login') }}</router-link>
    <router-link class="nav-major" :to="{ name: 'registration' }">{{ t('general.header.registration') }}</router-link>
  </template>

  <DropdownMenu v-if="AppLoginer.isLogged()">
    <template #trigger>
      {{ t('general.header.user.options') }}
    </template>

    <template #content>
      <div tabindex="-1" class="dropdown-content">
        <router-link class="nav-major" :to="{ name: 'user-profile' }">{{
          t('general.header.user.profile')
        }}</router-link>
        <hr />
        <div class="nav-major" tabindex="0" @click="handleLogout()" @keydown="onKeydown">
          {{ t('general.header.user.logout') }}
        </div>
      </div>
    </template>
  </DropdownMenu>
</template>

<style scoped></style>
