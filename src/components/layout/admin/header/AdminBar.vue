<script setup lang="ts">
/** Admin panel bar in middle of header. */

import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <router-link :to="{ name: 'home' }">{{ t('header.home') }}</router-link>
  <router-link :to="{ name: 'member' }">{{ t('header.member') }}</router-link>
  <router-link :to="{ name: 'testArea' }">{{ t('header.test') }}</router-link>
</template>

<style scoped></style>
