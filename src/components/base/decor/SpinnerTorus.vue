<script setup lang="ts">
/**
 * Torus-shaped spinner for loading states.
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(defineProps<{
  /** True if can spin, false if it cannot spin. */
  canSpin?: boolean,
  /** You can set CSS display property directly. */
  display?: string,
  /** Size of the spinner (e.g., "1rem", "100px"). */
  size?: string;
}>(), {
  canSpin: true,
  display: 'inline-block',
  size: '1rem'
});
</script>

<template>
  <div class="spinner-wrapper" :style="{ display: display, width: size, height: size }">
    <svg class="spinner spins" :class="{'paused': !canSpin}"
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 155 155" fill="none">
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
  color: var(--spinnertorus-color);
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
  0%,
  100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
