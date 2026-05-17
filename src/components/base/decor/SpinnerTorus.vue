<script setup lang="ts">
/**
 * Torus-shaped spinner for loading states.
 *
 * Properties:
 * - size: Size of the spinner (e.g., "1rem", "100px").
 */
withDefaults(defineProps<{
  display?: string,
  size?: string;
}>(), {
  // default values allow spinner in text
  display: 'inline-block',
  size: '1rem'
});
</script>

<template>
  <div class="spinner-wrapper" :style="{ display: display, width: size, height: size }">
    <svg class="spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 155 155" fill="none">
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
  color: #ff8e3c;
  animation: spin 1500ms linear infinite;
}

@keyframes spin {
  /* Spin the spinner with CSS. */
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
