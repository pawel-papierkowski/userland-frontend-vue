<script setup lang="ts">
/** Layout for standard webpage accessible to anyone. */

import MessageContainer from '@/components/common/messages/MessageContainer.vue';
import StandardHeader from '@/components/layout/standard/header/StandardHeader.vue';
import StandardFooter from '@/components/layout/standard/footer/StandardFooter.vue';

</script>

<template>
  <MessageContainer />

  <StandardHeader />

  <main>
    <router-view />
  </main>

  <StandardFooter />
</template>

<style scoped></style>
