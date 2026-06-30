<script setup lang="ts">
/** Dropdown menu.
 *
 * Slots:
 * - trigger - Place to click so dropdown will show.
 * - content - Actual content of dropdown.
 */
  import { ref } from 'vue';
  import { onClickOutside } from '@vueuse/core';

  const isOpen = ref(false);
  const dropdown = ref(null);

  onClickOutside(dropdown, () => (isOpen.value = false));
</script>

<template>
  <div class="dropdown-wrapper" ref="dropdown">
    <div @mouseover="isOpen = true" @click="isOpen = !isOpen" class="dropdown nav-major">
      <slot name="trigger" />
    </div>

    <div v-if="isOpen" class="dropdown-slot" @click="isOpen = false">
      <slot name="content" />
    </div>
  </div>
</template>

<style scoped>
.dropdown-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
  user-select: none;
}

.dropdown {
  
}

.dropdown-slot {
  position: absolute;

  top: 100%;
  left: 0;

  background: var(--dropdown-background);
  border: var(--dropdown-border);
  box-shadow: var(--dropdown-box-shadow);

  min-width: 200px;
  z-index: 100;
}
</style>
