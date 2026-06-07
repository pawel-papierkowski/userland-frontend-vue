<script setup lang="ts">
/** Header. */
import StandardMenu from '@/components/layout/standard/header/StandardMenu.vue';
import StandardBar from '@/components/layout/standard/header/StandardBar.vue';
import UserLandLang from '@/components/common/other/UserLandLang.vue';
</script>

<template>
  <header>
    <div class="header">
      <div class="header-menu">
        <StandardMenu />
      </div>
      <div class="header-bar">
        <StandardBar />
      </div>
      <div class="header-lang">
        <UserLandLang />
      </div>
    </div>
  </header>
</template>

<style scoped></style>
