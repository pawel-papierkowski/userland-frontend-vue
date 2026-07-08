<script setup lang="ts">
/** This is home area. Everyone can access it. */
import SlideShow from '@/components/base/layout/SlideShow.vue';

import HomeDescr from '@/components/pages/home/HomeDescr.vue';
import HomeTechStack from '@/components/pages/home/HomeTechStack.vue';
import HomeFeatures from '@/components/pages/home/HomeFeatures.vue';
import HomeComponents from '@/components/pages/home/HomeComponents.vue';
</script>

<template>
  <article>
    <SlideShow :interval="15" :delay="30">
      <template #descr>
        <HomeDescr />
      </template>
      <template #techStack>
        <HomeTechStack />
      </template>
      <template #features>
        <HomeFeatures />
      </template>
      <template #components>
        <HomeComponents />
      </template>
    </SlideShow>
  </article>
</template>

<style scoped></style>
