<script setup lang="ts">
/**
 * Torus-shaped spinner for loading states.
 * If it appears, some component is busy doing task (like loading) somewhere.
 * Successful completion of task will usually result in spinner disappearing. Failure is signaled by stop of spin while spinner stays visible.
 *
 * Properties:
 * - canSpin: True if can spin, false if it cannot spin.
 * - display: You can set CSS display property directly.
 * - size: Size of the spinner (e.g., "1rem", "100px").
 *
 * Examples:
 * - Standalone big spinner: <SpinnerTorus display="block" size="100px" />
 * - Spinner in text: <SpinnerTorus display="inline-block" size="1em" />
 */
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** True if can spin, false if it cannot spin. */
    canSpin?: boolean;
    /** Description of spinner for screen readers and the like. Undefined means no aria will be present. */
    descr?: string;
    /** You can set CSS display property directly. */
    display?: string;
    /** Size of the spinner (e.g., "1rem", "100px"). */
    size?: string;
  }>(),
  {
    canSpin: true,
    display: 'inline-block',
    size: '1rem',
  },
);

//

/** Role. */
const role = computed(() => {
  if (!props.descr) return undefined;
  return 'status';
});

</script>

<template>
  <div
    class="spinner-wrapper"
    :style="{ display: display, width: size, height: size }"
    :role="role"
    :aria-label="descr">

    <svg
      class="spinner spins"
      :class="{ paused: !canSpin }"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 155 155"
      fill="none"
    >
      <g stroke="currentColor" stroke-width="35" stroke-linecap="round">
        <circle cx="77.5" cy="77.5" r="60" stroke-opacity=".55" />
        <path d="M90.305 18.882A60.003 60.003 0 0 1 137.5 77.5" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.spinner-wrapper {
  vertical-align: -0.14em; /* Drops it down just enough to look visually centered with text. */
  margin: 0.25em 0em; /* Add a tiny bit of spacing. */
}

.spinner {
  color: var(--spinnertorus-color, currentColor);
}

.spins {
  animation: spin 1500ms linear infinite;
  animation-play-state: running;
}

.paused {
  animation-play-state: paused;
}

@keyframes spin {
  /* Spin the spinner using CSS. Additionally pulsate slightly. */
  0% {
    transform: rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: rotate(180deg);
    opacity: 0.7;
  }
  100% {
    transform: rotate(360deg);
    opacity: 1;
  }
}
</style>
