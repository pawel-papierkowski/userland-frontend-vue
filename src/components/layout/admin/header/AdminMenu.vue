<script setup lang="ts">
/** User menu in header. Different depending on your login status. */
import { computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

import DropdownMenu from '@/components/base/layout/DropdownMenu.vue';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

//

const canShowLoginRedirect = computed(() => {
  return !AppLoginer.isLogged() && route.name !== 'admin-login';
});

//

/** Handle logout. */
const handleLogout = async () => {
  await AppLoginer.logout();
  router.push({ name: 'admin-login' });
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
  <div v-if="canShowLoginRedirect">
    <router-link class="nav-major" :to="{ name: 'admin-login' }">{{ t('admin.header.login') }}</router-link>
  </div>
  <DropdownMenu v-if="AppLoginer.isLogged()">
    <template #trigger>
      {{ t('general.header.user.options') }}
    </template>

    <template #content>
      <div tabindex="-1" class="dropdown-content">
        <router-link class="nav-major" :to="{ name: 'admin-profile' }">{{ t('general.header.user.profile') }}</router-link>
        <hr />
        <div class="nav-major" tabindex="0" @click="handleLogout()" @keydown="onKeydown">
          {{ t('general.header.user.logout') }}
        </div>
      </div>
    </template>
  </DropdownMenu>
</template>

<style scoped></style>
