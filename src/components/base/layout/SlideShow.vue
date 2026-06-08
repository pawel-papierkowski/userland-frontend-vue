<script setup lang="ts">
/** Shows provided components in rotation. You also can click on navigation to show particular component. */
import { useSlots, computed, ref } from 'vue';
import type { Ref } from 'vue';

const slots = useSlots();
 // Extract the names (keys) of the slots that were actually provided.
const activeSlots = computed(() => Object.keys(slots));
const selectedSlot: Ref<string> = ref(activeSlots?.value[0] || '');

const getEntryClass = (slotName: string) => {
  return {
    'active': selectedSlot.value === slotName
  };
};

/**
 * Select new slot.
 * @param slotName Name of slot.
 */
const selectSlot = (slotName: string) => {
  selectedSlot.value = slotName;
};
</script>

<template>
  <div class="slideshow-wrapper">
    <div class="slideshow-selection">
      <!-- Loop through all slot names passed to this component. -->
      <div v-for="slotName in activeSlots" :key="slotName" class="slideshow-selection-entry">
        <div @click="selectSlot(slotName)" class="slideshow-entry" :class="getEntryClass(slotName)"></div>
      </div>
    </div>

    <div class="slideshow-slot-section">
      <slot :name="selectedSlot" />
    </div>
  </div>
</template>

<style scoped>
.slideshow-wrapper {
  margin: var(--spacing-sm);
  padding: var(--spacing-xxs);

  border: 1px solid var(--color-text-primary);
  border-radius: 8px;
}

.slideshow-selection {
  display: flex;
  justify-content: center;
  align-items: center;
}

.slideshow-selection-entry {
  margin: var(--spacing-xs);
  padding: var(--spacing-xs);

  cursor: pointer;
}

.slideshow-entry {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ccc;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.slideshow-entry:hover {
  transform: scale(1.2);
}

.slideshow-entry.active {
  background-color: var(--color-text-primary);
}

.slideshow-slot-section {
  margin: var(--spacing-xs);
  padding: var(--spacing-sm);
}

</style>
