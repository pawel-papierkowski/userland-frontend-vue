import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import i18n from '@/code/lang/i18n.ts';
import { cookieConsent } from '@/code/data/app/const.ts';
import { locstCookieConsent } from '@/code/data/app/storage.ts';

import UserLandCookie from '@/components/common/other/UserLandCookie.vue';

/** Helper: mount component with i18n plugin. */
function createComponent() {
  return mount(UserLandCookie, {
    global: { plugins: [i18n] },
  });
}

/** Tests of UserLandCookie component. */
describe('UserLandCookie', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Mounting behavior

  describe('mount', () => {
    it('shows cookie banner when localStorage has no consent key', async () => {
      // Arrange&Act: Mount component with empty localStorage.
      // Fake timers are active at this point, so onMounted runs synchronously.
      const wrapper = createComponent();
      await nextTick();

      // Assert: Banner is visible.
      expect(wrapper.find('.cookie-banner').exists()).toBe(true);
    });

    it('does not show cookie banner when consent is stored as ok', () => {
      // Arrange: Set consent before mount.
      localStorage.setItem(locstCookieConsent, cookieConsent);

      // Act: Mount component.
      const wrapper = createComponent();

      // Assert: Banner is not rendered.
      expect(wrapper.find('.cookie-banner').exists()).toBe(false);
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // Dismiss interaction

  describe('dismiss', () => {
    it('sets app-cookie-consent to ok in localStorage after button click', async () => {
      // Arrange: Mount with empty localStorage.
      const wrapper = createComponent();
      await nextTick();

      // Assert: Banner exists at this moment.
      expect(wrapper.find('.cookie-banner').exists()).toBe(true);
      // Assert: Consent is not granted yet.
      expect(localStorage.getItem(locstCookieConsent)).toBe(null);

      // Act: Click dismiss button and let animation finish.
      await wrapper.find('.cookie-dismiss').trigger('click');
      vi.advanceTimersByTime(350);
      await nextTick();

      // Assert: Consent is persisted.
      expect(localStorage.getItem(locstCookieConsent)).toBe(cookieConsent);
    });

    it('hides the banner after slide-out animation finishes', async () => {
      // Arrange: Mount with empty localStorage.
      const wrapper = createComponent();
      await nextTick();

      // Assert: Banner exists at this moment.
      expect(wrapper.find('.cookie-banner').exists()).toBe(true);

      // Act: Click dismiss button.
      await wrapper.find('.cookie-dismiss').trigger('click');

      // Assert: Banner still present during animation (leaving class added).
      expect(wrapper.find('.cookie-banner.leaving').exists()).toBe(true);

      // Act: Advance past animation duration.
      vi.advanceTimersByTime(350);
      await nextTick();

      // Assert: Banner is removed from DOM.
      expect(wrapper.find('.cookie-banner').exists()).toBe(false);
    });
  });
});
