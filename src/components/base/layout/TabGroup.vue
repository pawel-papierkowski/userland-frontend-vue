<script setup lang="ts">
/** Provides tab functionality.
 *
 * Features:
 * - Contains multiple slots, but only one is visible at any given time.
 * - Keyboard navigation via ArrowLeft/ArrowRight (cycle) and Home/End (first/last).
 * - Supports WAI-ARIA.
 *
 * Properties:
 * - id - Used for identification. Optional.
 * - langPrefix - Prefix for language key. Together with slot name will make lang key.
 *
 * Slots:
 * - Any number of slots, each one representing single tab panel.
 */
import { useSlots, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(
  defineProps<{
    /** Used for identification. */
    id?: string;
    /** Prefix for language key. Together with slot name will make lang key. */
    langPrefix: string;
  }>(),
  {
    id: '',
  },
);

const slots = useSlots();
/** Extracted names (keys) of the slots that were actually provided. */
const activeSlots = computed(() => Object.keys(slots));
/** Currently selected slot. */
const selectedSlot = ref(activeSlots?.value[0] || '');

//

/**
 * Select new slot.
 * @param slotName Name of slot.
 */
const selectSlot = (slotName: string) => {
  selectedSlot.value = slotName;
};

//

/**
 * Resolve class of tab menu name.
 * @param slotName Name of slot.
 */
const getNameClass = (slotName: string) => {
  return {
    active: selectedSlot.value === slotName,
  };
};

/** Ref to the tablist container for focus management. */
const tablistRef = ref<HTMLElement | null>(null);

/**
 * Handle keyboard navigation within the tablist following WAI-ARIA tabs pattern.
 * Arrow keys cycle through tabs, Home/End jump to first/last tab.
 */
function onKeydown(event: KeyboardEvent) {
  const tabs = activeSlots.value;
  if (tabs.length === 0) return;

  const currentIndex = tabs.indexOf(selectedSlot.value);
  let newIndex = currentIndex;

  switch (event.key) {
    case 'ArrowLeft':
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      break;
    case 'ArrowRight':
      newIndex = (currentIndex + 1) % tabs.length;
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = tabs.length - 1;
      break;
    default:
      // Ignore non-navigation keys.
      return;
  }

  event.preventDefault();
  selectSlot(tabs[newIndex]!);

  // Move focus to the newly selected tab button.
  const tabButtons = tablistRef.value?.querySelectorAll<HTMLElement>('[role="tab"]');
  tabButtons?.[newIndex]?.focus();
}
</script>

<template>
  <div class="tabgroup-wrapper" :data-testid="`tabgroup_${id}`">
    <div ref="tablistRef" class="tabgroup-header" role="tablist" @keydown="onKeydown">
      <!-- Loop through all slot names passed to this component. -->
      <div
        v-for="slotName in activeSlots"
        :key="slotName"
        :id="`tabgroup-${id}-tab-${slotName}`"
        :data-testid="`tabgroup_${id}_${slotName}`"
        class="tabgroup-header-name"
        :class="getNameClass(slotName)"
        role="tab"
        :aria-selected="selectedSlot === slotName"
        :aria-controls="`tabgroup-${id}-panel-${slotName}`"
        :tabindex="selectedSlot === slotName ? 0 : -1"
        @click="selectSlot(slotName)"
      >
        {{ t(langPrefix + '.' + slotName) }}
      </div>
    </div>

    <!-- Dynamic Tab Content -->
    <div class="tabgroup-slot-content">
      <div
        v-for="slotName in activeSlots"
        v-show="selectedSlot === slotName"
        :key="slotName"
        :id="`tabgroup-${id}-panel-${slotName}`"
        role="tabpanel"
        :aria-labelledby="`tabgroup-${id}-tab-${slotName}`"
      >
        <slot :name="slotName" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tabgroup-wrapper {
  display: flex;
  flex-direction: column;
}

/* Header: bar on top with tabs. */

.tabgroup-header {
  display: flex;
}

.tabgroup-header-name {
  margin: var(--spacing-xs);
  padding: var(--spacing-xs);

  cursor: pointer;
}
.tabgroup-header-name.active {
  border-bottom: 2px solid var(--color-text-primary);
  font-weight: bold;
}
</style>
