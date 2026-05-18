<script setup lang="ts">
/** Main bar in middle of header. */
import { useI18n } from 'vue-i18n';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

const { t } = useI18n();
</script>

<template>
  <router-link class="nav-link" :to="{ name: 'home' }">{{ t('header.general.home') }}</router-link>
  <router-link class="nav-link" v-if="AppLoginer.isLogged()" :to="{ name: 'member' }">{{ t('header.general.member') }}</router-link>
  <router-link class="nav-link" :to="{ name: 'testArea' }">{{ t('header.general.test') }}</router-link>
</template>

<style scoped></style>
