<script setup lang="ts">
/** Dropdown menu.
 *
 * Features:
 * - Contains two slots, one always visible and other shown when first is clicked.
 * - Keyboard navigation via Enter/Space to toggle, Escape to close.
 * - Supports WAI-ARIA.
 *
 * Properties:
 * - id - Used for identification. Optional.
 *
 * Slots:
 * - trigger - Place to click so dropdown will show.
 * - content - Actual content of dropdown.
 */
import { ref, nextTick } from 'vue';
import { onClickOutside } from '@vueuse/core';

import { NavUtils } from '@/code/utils/NavUtils.ts';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(
  defineProps<{
    /** Used for identification. */
    id?: string;
  }>(),
  {
    id: '',
  },
);

/** Whether the dropdown content is currently visible. */
const isOpen = ref(false);
/** Reference to the wrapper element for click-outside detection. */
const dropdown = ref<HTMLElement | null>(null);
/** Reference to the trigger element for focus management. */
const triggerRef = ref<HTMLElement | null>(null);
/** Reference to the content element for focus management. */
const contentRef = ref<HTMLElement | null>(null);

onClickOutside(dropdown, () => (isOpen.value = false));

/**
 * Toggle dropdown open/closed on trigger click.
 * Manages focus: first focusable element inside content slot receives focus
 * when opening (falling back to the content wrapper), trigger when closing.
 */
function onTriggerClick() {
  const wasOpen = isOpen.value;
  isOpen.value = !wasOpen;
  if (!wasOpen) {
    nextTick(() => {
      NavUtils.FocusNextInside(contentRef.value);
    });
  } else {
    nextTick(() => triggerRef.value?.focus());
  }
}

/**
 * Handle keyboard events on the trigger.
 * Enter/Space/ArrowDown toggle the dropdown; all other keys are ignored.
 */
function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
    event.preventDefault();
    onTriggerClick();
  }
}

/**
 * Handle keyboard events on the content area.
 * Escape closes the dropdown and returns focus to the trigger.
 */
function onContentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    isOpen.value = false;
    nextTick(() => triggerRef.value?.focus());
  }
}
</script>

<template>
  <div class="dropdown-wrapper" ref="dropdown" :data-testid="`dropdownmenu_${id}`">
    <div
      ref="triggerRef"
      class="dropdown nav-major"
      role="button"
      tabindex="0"
      :aria-haspopup="true"
      :aria-expanded="isOpen"
      :aria-controls="`dropdownmenu-content-${id}`"
      @mouseover="isOpen = true"
      @click="onTriggerClick"
      @keydown="onTriggerKeydown"
    >
      <slot name="trigger" />
    </div>

    <div
      v-if="isOpen"
      ref="contentRef"
      :id="`dropdownmenu-content-${id}`"
      class="dropdown-slot"
      tabindex="-1"
      @click="isOpen = false"
      @keydown="onContentKeydown"
    >
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
