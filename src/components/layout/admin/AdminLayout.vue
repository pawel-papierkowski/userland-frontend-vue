<script setup lang="ts">
/** Layout for administration panel. */

import AdminHeader from '@/components/layout/admin/header/AdminHeader.vue';
import AdminFooter from '@/components/layout/admin/footer/AdminFooter.vue';

</script>

<template>
  <AdminHeader />

  <main>
    <router-view />
  </main>

  <AdminFooter />
</template>

<style scoped></style>
