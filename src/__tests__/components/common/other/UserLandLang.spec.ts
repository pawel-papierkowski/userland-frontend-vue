import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import i18n from '@/code/lang/i18n.ts';
import { fallbackLang, languages } from '@/code/data/app/const.ts';
import { locstLang } from '@/code/data/app/storage.ts';

import UserLandLang from '@/components/common/other/UserLandLang.vue';

const origNavigatorLanguage = navigator.language;

/** Helper: mount component with i18n plugin. */
function createComponent() {
  return mount(UserLandLang, {
    global: { plugins: [i18n] },
  });
}

/** Tests of UserLandLang component. */
describe('UserLandLang', () => {
  beforeEach(() => {
    localStorage.clear();
    i18n.global.locale.value = 'en';
    Object.defineProperty(navigator, 'language', {
      value: origNavigatorLanguage,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore navigator.language to its original value.
    Object.defineProperty(navigator, 'language', {
      value: origNavigatorLanguage,
      configurable: true,
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Mounting behavior

  describe('mount', () => {
    it('applies saved language from localStorage on mount', async () => {
      // Arrange: Save Polish in localStorage before mount.
      localStorage.setItem(locstLang, 'pl');

      // Act: Mount component and wait for watcher to fire.
      createComponent();
      await nextTick();

      // Assert: i18n locale is set to Polish.
      expect(i18n.global.locale.value).toBe('pl');
    });

    it('falls back to system language when localStorage is empty', async () => {
      // Arrange: Mock system language to Polish.
      Object.defineProperty(navigator, 'language', {
        value: 'pl-PL',
        configurable: true,
      });

      // Act: Mount component.
      createComponent();
      await nextTick();

      // Assert: i18n locale is set to Polish (from navigator.language).
      expect(i18n.global.locale.value).toBe('pl');
    });

    it('uses system language even when it is not in the known languages list', async () => {
      // The component does not validate the detected language against the known list; it applies whatever it finds.
      // Should be fine, as using unknown language will trigger English fallback when we get around to actually translating stuff.

      // Arrange: Mock system language to an unsupported locale.
      Object.defineProperty(navigator, 'language', {
        value: 'de-DE',
        configurable: true,
      });

      // Act: Mount component.
      createComponent();
      await nextTick();

      // Assert: i18n locale is set to "de" (from navigator.language, no fallback).
      expect(i18n.global.locale.value).toBe('de');
    });

    it('falls back to default language when system language string is empty', async () => {
      // Arrange: Mock system language to empty string.
      Object.defineProperty(navigator, 'language', {
        value: '',
        configurable: true,
      });

      // Act: Mount component.
      createComponent();
      await nextTick();

      // Assert: i18n locale falls back to "en" (fallbackLang).
      expect(i18n.global.locale.value).toBe(fallbackLang);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Rendering

  describe('render', () => {
    it('renders a flag for each known language', () => {
      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: One .lang-container per language.
      const langContainers = wrapper.findAll('.lang-container');
      expect(langContainers).toHaveLength(languages.length);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Interaction

  describe('interaction', () => {
    it('clicking a language flag changes the i18n locale', async () => {
      // Arrange: Mount component with English as current.
      const wrapper = createComponent();
      expect(i18n.global.locale.value).toBe('en');

      // Act: Click on the Polish flag (second container).
      const langContainers = wrapper.findAll('.lang-container');
      await langContainers[1]!.trigger('click');
      await nextTick();

      // Assert: Locale changed to Polish.
      expect(i18n.global.locale.value).toBe('pl');
    });

    it('clicking a language flag saves the language to localStorage', async () => {
      // Arrange: Mount component.
      const wrapper = createComponent();

      // Act: Click on the Polish flag.
      const langContainers = wrapper.findAll('.lang-container');
      await langContainers[1]!.trigger('click');
      await nextTick();

      // Assert: Language is persisted.
      expect(localStorage.getItem(locstLang)).toBe('pl');
    });
  });
});
