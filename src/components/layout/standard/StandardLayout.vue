<script setup lang="ts">
/** Layout for standard webpage accessible to anyone. */

import StandardHeader from '@/components/layout/standard/header/StandardHeader.vue';
import StandardFooter from '@/components/layout/standard/footer/StandardFooter.vue';

</script>

<template>
  <StandardHeader />

  <main>
    <router-view />
  </main>

  <StandardFooter />
</template>

<style scoped></style>
