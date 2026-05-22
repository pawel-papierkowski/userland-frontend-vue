<script setup lang="ts">
/** Header. */
import StandardMenu from '@/components/layout/standard/header/StandardMenu.vue';
import StandardBar from '@/components/layout/standard/header/StandardBar.vue';
import UserLandLang from '@/components/common/layout/UserLandLang.vue';
</script>

<template>
  <header>
    <div class="header-menu">
      <div class="header-menu-left">
        <StandardMenu />
      </div>
      <div class="header-menu-center">
        <StandardBar />
      </div>
      <div class="header-menu-right">
        <UserLandLang />
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-menu {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;

  width: 100%;
  margin: 0 auto;
  padding: 0;
}

.header-menu-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-self: start;
}

.header-menu-center {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-menu-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-self: end;
}
</style>
