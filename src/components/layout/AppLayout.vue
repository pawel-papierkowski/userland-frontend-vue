<script setup lang="ts">
/** Determines correct layout. */
import { useRoute } from 'vue-router';

import StandardLayout from '@/components/layout/standard/StandardLayout.vue';
import AdminLayout from '@/components/layout/admin/AdminLayout.vue';

const route = useRoute();
</script>

<template>
  <template v-if="route.meta.layout !== 'ADMIN'">
    <StandardLayout />
  </template>
  <template v-if="route.meta.layout === 'ADMIN'">
    <AdminLayout />
  </template>
</template>

<style scoped></style>
