<script setup lang="ts">
/** Info about features for slideshow. */
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <h4 v-html="t('homeArea.features.title')" />
  <ul>
    <li>
      <div v-html="t('homeArea.features.website.descr')"></div>
      <ul>
        <li v-html="t('homeArea.features.website.home')" />
        <li v-html="t('homeArea.features.website.member')" />
        <li v-html="t('homeArea.features.website.test')" />
        <li v-html="t('homeArea.features.website.debug')" />
      </ul>
    </li>
    <li>
      <div v-html="t('homeArea.features.user.descr')"></div>
      <ul>
        <li v-html="t('homeArea.features.user.register')" />
        <li v-html="t('homeArea.features.user.login')" />
        <li v-html="t('homeArea.features.user.edit')" />
        <li v-html="t('homeArea.features.user.email')" />
        <li v-html="t('homeArea.features.user.reset')" />
        <li v-html="t('homeArea.features.user.delete')" />
      </ul>
    </li>
    <li>
      <div v-html="t('homeArea.features.admin.descr')"></div>
      <ul>
        <li v-html="t('homeArea.features.admin.user')" />
        <li v-html="t('homeArea.features.admin.userSub')" />
      </ul>
    </li>
  </ul>
</template>

<style scoped></style>
