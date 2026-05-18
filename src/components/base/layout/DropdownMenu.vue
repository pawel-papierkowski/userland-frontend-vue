<script setup lang="ts">
  import { ref } from 'vue';
  import { onClickOutside } from '@vueuse/core';

  const isOpen = ref(false);
  const dropdown = ref(null);

  onClickOutside(dropdown, () => (isOpen.value = false));
</script>

<template>
  <div class="dropdown" ref="dropdown">
    <div @mouseover="isOpen = true" @click="isOpen = !isOpen" class="nav-major">
      <slot name="trigger" />
    </div>

    <div v-if="isOpen" class="dropdown-wrap">
      <slot name="content" />
    </div>
  </div>
</template>

<style scoped>
  .dropdown {
    position: relative;
    display: inline-block;
    cursor: pointer;
    user-select: none;
  }

  .dropdown-wrap {
    position: absolute;

    top: 100%;
    left: 0;

    background: var(--header-background);
    border: var(--header-border);

    min-width: 150px;
    z-index: 100;
  }
</style>
