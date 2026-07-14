import { describe, it, expect } from 'vitest';
import i18n, { deepMerge, loadMessages } from '@/code/lang/i18n.ts';

//
// ////////////////////////////////////////////////////////////////////////////
// deepMerge

describe('deepMerge', () => {
  it('merges keys from source into target', () => {
    // Merging flat objects: source keys appear in result.

    // Arrange: Two flat objects.
    const target = { a: '1', b: '2' };
    const source = { c: '3' };

    // Act: Merge.
    const result = deepMerge(target, source);

    // Assert: source key was added.
    expect(result).toEqual({ a: '1', b: '2', c: '3' });
  });

  it('last value wins when both objects have the same key', () => {
    // Duplicate leaf key — the source value overwrites the target.

    // Arrange: Overlapping keys.
    const target = { key: 'old' };
    const source = { key: 'new' };

    // Act: Merge.
    const result = deepMerge(target, source);

    // Assert: source wins.
    expect(result).toEqual({ key: 'new' });
  });

  it('deeply merges nested objects instead of replacing them', () => {
    // When both target and source have an object at the same key,
    // they are merged recursively instead of source replacing target.

    // Arrange: Nested overlapping structures.
    const target = { parent: { a: '1', b: '2' } };
    const source = { parent: { c: '3' } };

    // Act: Merge.
    const result = deepMerge(target, source);

    // Assert: nested keys from both are present.
    expect(result).toEqual({ parent: { a: '1', b: '2', c: '3' } });
  });

  it('replaces arrays rather than merging them', () => {
    // Arrays are not merged element-wise; source array wins.

    // Arrange: Objects with arrays.
    const target = { items: ['a', 'b'] };
    const source = { items: ['c'] };

    // Act: Merge.
    const result = deepMerge(target, source);

    // Assert: source array replaces target array.
    expect(result).toEqual({ items: ['c'] });
  });

  it('returns source when target is empty', () => {
    // Merging into empty target returns a copy of source.

    // Arrange: Empty target.
    const target = {};
    const source = { a: '1' };

    // Act: Merge.
    const result = deepMerge(target, source);

    // Assert: source is returned.
    expect(result).toEqual({ a: '1' });
  });

  it('does not mutate either input', () => {
    // deepMerge is pure; original objects remain unchanged.

    // Arrange: Two objects.
    const target = { a: '1' };
    const source = { b: '2' };

    // Act: Merge.
    deepMerge(target, source);

    // Assert: originals are untouched.
    expect(target).toEqual({ a: '1' });
    expect(source).toEqual({ b: '2' });
  });

  it('handles three levels of nesting', () => {
    // Deep nesting does not break merging.

    // Arrange: Three-level nesting.
    const target = { lvl1: { lvl2: { lvl3_a: 'deep' } } };
    const source = { lvl1: { lvl2: { lvl3_b: 'deeper' } } };

    // Act: Merge.
    const result = deepMerge(target, source);

    // Assert: Both deep keys are present.
    expect(result).toEqual({
      lvl1: { lvl2: { lvl3_a: 'deep', lvl3_b: 'deeper' } },
    });
  });
});

//
// ////////////////////////////////////////////////////////////////////////////
// loadMessages

describe('loadMessages', () => {
  it('merges all default exports from modules', () => {
    // Multiple modules are deep-merged into one object.

    // Arrange: Simulate two JSON modules.
    const modules = {
      '/src/locales/en/part1.json': { default: { header: { title: 'Welcome' } } },
      '/src/locales/en/part2.json': { default: { header: { subtitle: 'Subtitle' } } },
    };

    // Act: Load messages.
    const result = loadMessages(modules);

    // Assert: Both parts are merged.
    expect(result).toEqual({
      header: { title: 'Welcome', subtitle: 'Subtitle' },
    });
  });

  it('returns empty object for empty modules', () => {
    // No modules produce an empty object.

    // Arrange: Empty modules object.
    const modules = {};

    // Act & Assert: Result is empty.
    expect(loadMessages(modules)).toEqual({});
  });

  it('handles modules with missing default gracefully', () => {
    // Modules without a `default` key are treated as empty.

    // Arrange: Module with no default export (edge case).
    const modules = {
      '/src/locales/en/empty.json': {} as { default: Record<string, string> },
    };

    // Act: Load messages.
    const result = loadMessages(modules);

    // Assert: No crash, result is empty.
    expect(result).toEqual({});
  });
});

//
// ////////////////////////////////////////////////////////////////////////////
// i18n instance

describe('i18n instance', () => {
  it('has en as the default locale', () => {
    // The i18n instance should default to English.

    // Assert: Default locale is en.
    expect(i18n.global.locale.value).toBe('en');
  });

  it('has en as the fallback locale', () => {
    // The fallback locale should be English.

    // Assert: Fallback locale is en.
    expect(i18n.global.fallbackLocale.value).toBe('en');
  });

  it('loads english translations', () => {
    // Translations are loaded and accessible via the i18n instance.

    // Assert: A known key from en.json resolves.
    expect(i18n.global.t('app.title')).toBe('UserLand');
  });

  it('loads all translations from en locale directory', () => {
    // Translations from the en locale directory should be available.

    // Arrange: known keys from the en locale files.
    const knownKeys = [
      'app.title',
      'header.general.home',
      'header.user.login',
      'footer.frontendRepository',
    ];

    // Act: Translate each key.
    for (const key of knownKeys) {
      const translation = i18n.global.t(key);

      // Assert: Translation exists and is not the key itself.
      expect(translation).not.toBe(key);
      expect(translation).toBeTruthy();
    }
  });

  it('loads polish translations', () => {
    // Polish locale should also be registered.

    // Assert: Polish translation differs from English.
    expect(i18n.global.t('app.title')).toBe('UserLand'); // en
    expect(i18n.global.t('app.title', {}, { locale: 'pl' })).toBe('UserLand'); // pl (same for this key)
    expect(i18n.global.t('header.general.home', {}, { locale: 'pl' })).toBe('🏠 Strona główna');
  });

  it('resolves nested keys using dot notation', () => {
    // i18n uses dot notation to traverse nested translation objects.

    // Assert: Deeply nested keys are resolved.
    expect(i18n.global.t('header.user.logout')).toBe('🚪 Logout');
  });
});
