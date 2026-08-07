<script setup lang="ts">
/**
 * Cookie consent banner that appears at the bottom of the page until dismissed.
 * Once dismissed, the choice is persisted in localStorage so it will not appear again
 * (unless storage is cleared).
 */
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import { cookieConsent } from '@/code/data/app/const.ts';
import { locstCookieConsent } from '@/code/data/app/storage.ts';

const { t } = useI18n();

/** Whether the banner is visible (has not been dismissed). */
const isVisible = ref(false);

/** Whether the slide-down exit animation should play. */
const isLeaving = ref(false);

onMounted(() => {
  const consent = localStorage.getItem(locstCookieConsent);
  if (consent !== cookieConsent) {
    isVisible.value = true;
  }
});

/** Dismiss the banner, animate it away, then hide permanently. */
const dismiss = () => {
  isLeaving.value = true;
  // Wait for CSS transition to finish, then hide.
  setTimeout(() => {
    isVisible.value = false;
    isLeaving.value = false;
    localStorage.setItem(locstCookieConsent, cookieConsent);
  }, 350);
};
</script>

<template>
  <div v-if="isVisible" class="cookie-banner" :class="{ leaving: isLeaving }" role="alert">
    <div>
      <span class="cookie-message">{{ t('general.cookie.message') }}</span>
    </div>

    <div>
      <button class="cookie-dismiss" @click="dismiss">{{ t('general.cookie.button') }}</button>
    </div>
  </div>
</template>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;

  padding: 12px 24px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  border-radius: 10px 10px 0px 0px;

  font-size: 14px;
  z-index: 9999;

  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
  transform: translateY(0);
  opacity: 1;
}

.cookie-banner.leaving {
  transform: translateY(100%);
  opacity: 0;
}

.cookie-message {
  min-width: 100px;
}

.cookie-dismiss {
  padding: 6px 16px;
  border: 1px solid #fff;
  border-radius: 4px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.cookie-dismiss:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
