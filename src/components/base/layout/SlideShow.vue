<script setup lang="ts">
/** Shows provided components in rotation. You also can click on navigation to show particular component.
 *
 * Features:
 * - Automatic rotation of slots.
 * - User can select slot and it will be shown for some time without rotation.
 *
 * Properties:
 * - autoplay - Whether the slideshow should rotate automatically.
 * - interval - Interval between slot rotations in seconds.
 * - delay - If user clicks on entry, how long before slideshow resumes in seconds. Negative number means no resuming.
 */
import { useSlots, computed, ref, onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';

const props = withDefaults(
  defineProps<{
    /** Whether the slideshow should rotate automatically. */
    autoplay?: boolean;
    /** Interval between slot rotations in seconds. */
    interval?: number;
    /** If user clicks on entry, how long before slideshow resumes in seconds. Negative number means no resuming. */
    delay?: number;
  }>(),
  {
    autoplay: true,
    interval: 3,
    delay: 10
  }
);

const slots = useSlots();
/** Extracted names (keys) of the slots that were actually provided. */
const activeSlots = computed(() => Object.keys(slots));
/** Currently selected slot. */
const selectedSlot: Ref<string> = ref(activeSlots?.value[0] || '');
/** Timer for automatic slideshow. */
let autoplayTimer: ReturnType<typeof setInterval> | null = null;
/** Timer for slideshow delay. */
let delayTimer: ReturnType<typeof setTimeout> | null = null;
/** If true, autoplay is stopped and cannot resume. */
const stopped: Ref<boolean> = ref(false);

//

/**
 * Advances the slideshow to the next slot.
 */
const nextSlot = () => {
  if (activeSlots.value.length === 0) return;
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
  autoplayTimer = setInterval(nextSlot, props.interval*1000);
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
  console.warn(`Called selectSlot(${slotName})`)
  selectedSlot.value = slotName;
  if (props.delay > 0) stopSlideShow();
  else startAutoplay(); // reset state
};

/** Stops slideshow and optionally sets timer for resuming slideshow. */
const stopSlideShow = () => {
  if (delayTimer) clearTimeout(delayTimer); // if any delay timer exists, clear it

  stopped.value = true; // prevent change of slot
  stopAutoplay();
  if (props.delay < 0) return; // no resuming slideshow
  delayTimer = setTimeout(() => resumeSlideShow(), props.delay*1000);
}

/** Resumes slideshow after delay. */
const resumeSlideShow = () => {
  stopped.value = false;
  startAutoplay();
}

//

/**
 * Resolve class of entry.
 * @param slotName Name of slot.
 */
const getEntryClass = (slotName: string) => {
  return {
    'active': selectedSlot.value === slotName
  };
};

//

onMounted(() => {
  startAutoplay();
});

onUnmounted(() => {
  stopAutoplay();
});
</script>

<template>
  <div class="slideshow-wrapper" @mouseenter="stopAutoplay()" @mouseleave="startAutoplay()">
    <div class="slideshow-selection">
      <!-- Loop through all slot names passed to this component. -->
      <div v-for="slotName in activeSlots" :key="slotName" class="slideshow-selection-entry" @click="selectSlot(slotName)">
        <div class="slideshow-entry" :class="getEntryClass(slotName)"></div>
      </div>
    </div>

    <div class="slideshow-slot-section">
      <Transition name="slide" mode="out-in">
        <div :key="selectedSlot" class="slideshow-slide">
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

/* Shaped as dot. */
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
  overflow: hidden; /* Prevents layout overflow during translation */
}

.slideshow-slide {
  width: 100%;
}

/* Slide/Fade Transition */
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
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
