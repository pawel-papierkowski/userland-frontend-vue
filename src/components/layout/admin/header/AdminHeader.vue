<script setup lang="ts">
/** Admin panel header. */
import AdminMenu from '@/components/layout/admin/header/AdminMenu.vue';
import AdminBar from '@/components/layout/admin/header/AdminBar.vue';
import UserLandLang from '@/components/common/layout/UserLandLang.vue';
</script>

<template>
  <header>
    <div class="header">
      <div class="header-menu">
        <AdminMenu />
      </div>
      <div class="header-bar">
        <AdminBar />
      </div>
      <div class="header-lang">
        <UserLandLang />
      </div>
    </div>
  </header>
</template>

<style scoped></style>
