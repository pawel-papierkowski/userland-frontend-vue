<script setup lang="ts">
/** Shows provided components in rotation. You also can click on navigation to show particular component.
 *
 * Features:
 * - Automatic rotation of slots.
 * - User can select slot and it will be shown for some time without rotation.
 * - Keyboard navigation via ArrowLeft/ArrowRight (cycle) and Home/End (first/last).
 * - Supports WAI-ARIA. The dot indicators act as a tablist with `role="tab"`, `aria-selected`, and `aria-controls`.
 *
 * Properties:
 * - id - Used for identification. Optional.
 * - langPrefix - Prefix for language key.
 * - autoplay - Whether the slideshow should rotate automatically.
 * - interval - Interval between slot rotations in seconds.
 * - delay - If user clicks on entry, how long before slideshow resumes in seconds. Negative number means no resuming.
 *
 * Slots:
 * - Any number of slots representing slides in slideshow.
 */
import { useSlots, computed, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    /** Used for identification. */
    id?: string;
    /** Prefix for language key used for ARIA labels. */
    langPrefix: string;
    /** Whether the slideshow should rotate automatically. */
    autoplay?: boolean;
    /** Interval between slot rotations in seconds. */
    interval?: number;
    /** If user clicks on entry, how long before slideshow resumes in seconds. Negative number means no resuming. */
    delay?: number;
  }>(),
  {
    id: '',
    autoplay: true,
    interval: 3,
    delay: 10,
  },
);

/** Defined slots. */
const slots = useSlots();
/** Extracted names (keys) of the slots that were actually provided. */
const activeSlots = computed(() => Object.keys(slots));
/** Currently selected slot. */
const selectedSlot = ref(activeSlots?.value[0] || '');
/** Timer for automatic slideshow. */
let autoplayTimer: ReturnType<typeof setInterval> | null = null;
/** Timer for slideshow delay. */
let delayTimer: ReturnType<typeof setTimeout> | null = null;
/** If true, autoplay is stopped and cannot resume. */
const stopped = ref(false);

//

/**
 * Advances the slideshow to the next slot.
 */
const nextSlot = () => {
  if (activeSlots.value.length <= 1) return; // there is no advancing possible

  const currentIndex = activeSlots.value.indexOf(selectedSlot.value);
  const nextIndex = (currentIndex + 1) % activeSlots.value.length;
  selectedSlot.value = activeSlots?.value[nextIndex] || '';
};

/**
 * Starts the automatic transition timer.
 */
const startAutoplay = () => {
  if (!props.autoplay || stopped.value || activeSlots.value.length < 1) return;
  stopAutoplay();
  autoplayTimer = setInterval(nextSlot, props.interval * 1000);
};

/**
 * Stops the automatic transition timer.
 */
const stopAutoplay = () => {
  if (!autoplayTimer) return;
  clearInterval(autoplayTimer);
  autoplayTimer = null;
};

//

/**
 * Select new slot.
 * @param slotName Name of slot.
 */
const selectSlot = (slotName: string) => {
  selectedSlot.value = slotName;
  if (props.delay !== 0) stopSlideShow();
  else startAutoplay(); // reset state
};

/** Stops slideshow and optionally sets timer for resuming slideshow. */
const stopSlideShow = () => {
  if (delayTimer) clearTimeout(delayTimer); // if any delay timer exists, clear it

  stopped.value = true; // prevent change of slot
  stopAutoplay();
  if (props.delay < 0) return; // no resuming slideshow
  delayTimer = setTimeout(() => resumeSlideShow(), props.delay * 1000);
};

/** Resumes slideshow after delay. Note that means actual delay time is actually delay + normal interval. */
const resumeSlideShow = () => {
  stopped.value = false;
  startAutoplay();
};

//

/**
 * Resolve class of entry.
 * @param slotName Name of slot.
 */
const getEntryClass = (slotName: string) => {
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
function onTablistKeydown(event: KeyboardEvent) {
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
      return;
  }

  event.preventDefault();
  selectSlot(tabs[newIndex]!);

  // Move focus to the newly selected tab button.
  const tabButtons = tablistRef.value?.querySelectorAll<HTMLElement>('[role="tab"]');
  tabButtons?.[newIndex]?.focus();
}

//

onMounted(() => {
  startAutoplay();
});

onUnmounted(() => {
  stopAutoplay();
});
</script>

<template>
  <div
    class="slideshow-wrapper"
    :data-testid="`slideshow_${id}`"
    role="region"
    :aria-label="t(langPrefix + '.label', { id: id || 'slideshow' })"
    @mouseenter="stopAutoplay()"
    @mouseleave="startAutoplay()"
  >
    <div ref="tablistRef" class="slideshow-header" role="tablist" @keydown="onTablistKeydown">
      <!-- Loop through all slot names passed to this component. -->
      <div
        v-for="(slotName, index) in activeSlots"
        :key="slotName"
        :id="`slideshow-${id}-tab-${slotName}`"
        class="slideshow-selection"
        role="tab"
        :aria-selected="selectedSlot === slotName"
        :aria-controls="`slideshow-${id}-panel-${slotName}`"
        :tabindex="selectedSlot === slotName ? 0 : -1"
        :aria-label="t(langPrefix + '.slide', { n: index + 1, total: activeSlots.length })"
        @click="selectSlot(slotName)"
      >
        <div class="slideshow-selection-entry" :class="getEntryClass(slotName)"></div>
      </div>
    </div>

    <div class="slideshow-slot-section">
      <Transition name="slide" mode="out-in">
        <div
          :key="selectedSlot"
          :id="`slideshow-${id}-panel-${selectedSlot}`"
          role="tabpanel"
          :aria-labelledby="`slideshow-${id}-tab-${selectedSlot}`"
          class="slideshow-slide"
        >
          <slot :name="selectedSlot" />
        </div>
      </Transition>
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

/* Header: bar on top with dots. */

.slideshow-header {
  display: flex;
  justify-content: center;
  align-items: center;
}

.slideshow-selection {
  margin: var(--spacing-xs);
  padding: var(--spacing-xs);

  cursor: pointer;
}

.slideshow-selection-entry {
  /* Shaped as dot. */
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ccc;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.slideshow-selection-entry:hover {
  transform: scale(1.2);
}

.slideshow-selection-entry.active {
  background-color: var(--color-text-primary);
}

/* Content of slot. */

.slideshow-slot-section {
  margin: var(--spacing-xs);
  padding: var(--spacing-sm);
  overflow: hidden; /* Prevents layout overflow during translation */
}

.slideshow-slide {
  width: 100%;
}

/* Slide/Fade Transition */
.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
