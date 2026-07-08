<script setup lang="ts">
/** Provides tab functionality.
 *
 * Properties:
 * - ident - Used for identification. Optional.
 * - langPrefix - Prefix for language key. Together with slot name will make lang key.
 *
 * Slots:
 * - Any number of slots, each one representing single tab panel.
 */
import { useSlots, computed, ref } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(
  defineProps<{
    /** Used for identification. */
    ident?: string;
    /** Prefix for language key. Together with slot name will make lang key. */
    langPrefix: string;
  }>(),
  {
    ident: '',
  },
);

const slots = useSlots();
/** Extracted names (keys) of the slots that were actually provided. */
const activeSlots = computed(() => Object.keys(slots));
/** Currently selected slot. */
const selectedSlot: Ref<string> = ref(activeSlots?.value[0] || '');

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
</script>

<template>
  <div class="tabgroup-wrapper">
    <div class="tabgroup-header">
      <!-- Loop through all slot names passed to this component. -->
      <div
        v-for="slotName in activeSlots"
        :key="slotName"
        @click="selectSlot(slotName)"
        :data-testid="`tabgroup_${ident}_${slotName}`"
        class="tabgroup-header-name"
        :class="getNameClass(slotName)"
      >
        {{ t(langPrefix + '.' + slotName) }}
      </div>
    </div>

    <!-- Dynamic Tab Content -->
    <div class="tabgroup-slot-content">
      <KeepAlive>
        <slot :name="selectedSlot" />
      </KeepAlive>
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

/* Content of slot. */

.tabgroup-slot-content {
}
</style>
