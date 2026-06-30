<script setup lang="ts">

import TabGroup from '@/components/base/layout/TabGroup.vue';
import TestMessages from '@/components/pages/test/TestMessages.vue';
import TestInputs from '@/components/pages/test/TestInputs.vue';
import TestOther from '@/components/pages/test/TestOther.vue';

</script>

<template>
  <TabGroup langPrefix="testArea.tabs">
    <template #messages>
      <TestMessages />
    </template>
    <template #inputs>
      <TestInputs />
    </template>
    <template #other>
      <TestOther />
    </template>
  </TabGroup>
</template>

<style scoped></style>
