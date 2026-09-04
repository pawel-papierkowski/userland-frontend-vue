<script setup lang="ts">
/** Determines correct layout. */
import { useRoute } from 'vue-router';

import StandardLayout from '@/components/layout/standard/StandardLayout.vue';
import AdminLayout from '@/components/layout/admin/AdminLayout.vue';
import UserLandCookie from '@/components/common/other/UserLandCookie.vue';

const route = useRoute();
</script>

<template>
  <template v-if="route.meta.layout !== 'ADMIN'">
    <StandardLayout />
  </template>
  <template v-else>
    <AdminLayout />
  </template>

  <UserLandCookie />
</template>

<style scoped></style>
