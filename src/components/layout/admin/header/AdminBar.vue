<script setup lang="ts">
/** Admin panel bar in middle of header. */
import { useI18n } from 'vue-i18n';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

const { t } = useI18n();
</script>

<template>
  <template v-if="AppLoginer.isLogged()">
    <router-link class="nav-major" :to="{ name: 'admin-main' }">{{ t('header.admin.main') }}</router-link>
    <router-link class="nav-major" :to="{ name: 'admin-user' }">{{ t('header.admin.user') }}</router-link>
  </template>
</template>

<style scoped></style>
