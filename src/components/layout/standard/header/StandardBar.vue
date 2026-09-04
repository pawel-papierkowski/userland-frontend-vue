<script setup lang="ts">
/** Main bar in middle of header. */
import { useI18n } from 'vue-i18n';

import { AppLoginer } from '@/code/wrappers/login/AppLoginer.ts';

const { t } = useI18n();
</script>

<template>
  <router-link class="nav-major" data-testid="header_link_home" :to="{ name: 'home' }">{{
    t('general.header.home')
  }}</router-link>
  <router-link
    class="nav-major"
    v-if="AppLoginer.isLogged()"
    data-testid="header_link_member"
    :to="{ name: 'memberArea' }"
    >{{ t('general.header.member') }}</router-link
  >
  <router-link class="nav-major" data-testid="header_link_test" :to="{ name: 'testArea' }">{{
    t('general.header.test')
  }}</router-link>
  <router-link class="nav-major" data-testid="header_link_debug" :to="{ name: 'debugArea' }">{{
    t('general.header.debug')
  }}</router-link>
</template>

<style scoped></style>
