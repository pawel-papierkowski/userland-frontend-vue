<script setup lang="ts">
/** Layout for administration panel. */

import MessageContainer from '@/components/common/messages/MessageContainer.vue';
import AdminHeader from '@/components/layout/admin/header/AdminHeader.vue';
import AdminFooter from '@/components/layout/admin/footer/AdminFooter.vue';

</script>

<template>
  <MessageContainer />

  <AdminHeader />

  <main>
    <router-view />
  </main>

  <AdminFooter />
</template>

<style scoped></style>
