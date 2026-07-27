<script setup lang="ts">
/** Main bar in middle of header. */
import { useI18n } from 'vue-i18n';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

const { t } = useI18n();
</script>

<template>
  <router-link class="nav-major" :to="{ name: 'home' }">{{ t('general.header.home') }}</router-link>
  <router-link class="nav-major" v-if="AppLoginer.isLogged()" :to="{ name: 'memberArea' }">{{
    t('general.header.member')
  }}</router-link>
  <router-link class="nav-major" :to="{ name: 'testArea' }">{{ t('general.header.test') }}</router-link>
  <router-link class="nav-major" :to="{ name: 'debugArea' }">{{ t('general.header.debug') }}</router-link>
</template>

<style scoped></style>
