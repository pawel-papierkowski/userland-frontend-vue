import { describe, it, expect } from 'vitest';
import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router';

import { TokenUtils } from '@/code/utils/TokenUtils';

/** Helper to create a minimal route stub with a given query. */
function createRoute(query: Record<string, string | string[]>): RouteLocationNormalizedLoadedGeneric {
  return { query } as RouteLocationNormalizedLoadedGeneric;
}

describe('TokenUtils', () => {
  // ////////////////////////////////////////////////////////////////////////////
  // resolve

  describe('resolve', () => {
    it('returns the token from route query', () => {
      // Arrange: Route with a single token.
      const route = createRoute({ token: 'AbCdEfGhIjKlMnOpQrStUvWxYz123456' });

      // Act: Resolve token.
      const result = TokenUtils.resolve(route);

      // Assert: The token is returned.
      expect(result).toBe('AbCdEfGhIjKlMnOpQrStUvWxYz123456');
    });

    it('returns the first token when query has duplicate token params', () => {
      // Arrange: Duplicate token parameters produce an array.
      const route = createRoute({ token: ['firstToken', 'secondToken'] });

      // Act: Resolve token.
      const result = TokenUtils.resolve(route);

      // Assert: First value is returned.
      expect(result).toBe('firstToken');
    });

    it('returns empty string when token is missing from query', () => {
      // Arrange: Route without a token parameter.
      const route = createRoute({});

      // Act: Resolve token.
      const result = TokenUtils.resolve(route);

      // Assert: Empty string fallback.
      expect(result).toBe('');
    });
  });

  // ////////////////////////////////////////////////////////////////////////////
  // verify

  describe('verify', () => {
    it('returns false for empty string', () => {
      // Arrange: Empty token.
      const token = '';

      // Act: Verify token.
      const result = TokenUtils.verify(token);

      // Assert: Invalid.
      expect(result).toBe(false);
    });

    it('returns false for token shorter than 32 characters', () => {
      // Arrange: Too-short token.
      const token = 'AbCdEfGhIjKlMnOpQrStUvWxYz12345'; // 31 chars

      // Act: Verify token.
      const result = TokenUtils.verify(token);

      // Assert: Invalid.
      expect(result).toBe(false);
    });

    it('returns false for token longer than 32 characters', () => {
      // Arrange: Too-long token.
      const token = 'AbCdEfGhIjKlMnOpQrStUvWxYz1234567'; // 33 chars

      // Act: Verify token.
      const result = TokenUtils.verify(token);

      // Assert: Invalid.
      expect(result).toBe(false);
    });

    it('returns false for token with non-alphanumeric characters', () => {
      // Arrange: Token with a dash (not alphanumeric).
      const token = 'AbCdEfGhIjKlMnOpQrStUvWxYz12345-';

      // Act: Verify token.
      const result = TokenUtils.verify(token);

      // Assert: Invalid.
      expect(result).toBe(false);
    });

    it('returns false for token with special characters', () => {
      // Arrange: Token with an underscore.
      const token = 'AbCdEfGhIjKlMnOpQrStUvWxYz_2345';

      // Act: Verify token.
      const result = TokenUtils.verify(token);

      // Assert: Invalid.
      expect(result).toBe(false);
    });

    it('returns true for a valid 32-character alphanumeric token', () => {
      // Arrange: Exactly 32 alphanumeric characters.
      const token = 'AbCdEfGhIjKlMnOpQrStUvWxYz123456';

      // Act: Verify token.
      const result = TokenUtils.verify(token);

      // Assert: Valid.
      expect(result).toBe(true);
    });

    it('returns true for lowercase-only valid token', () => {
      // Arrange: 32 lowercase characters.
      const token = 'abcdefghijklmnopqrstuvwxyz012345';

      // Act: Verify token.
      const result = TokenUtils.verify(token);

      // Assert: Valid.
      expect(result).toBe(true);
    });

    it('returns true for uppercase-only valid token', () => {
      // Arrange: 32 uppercase characters.
      const token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345';

      // Act: Verify token.
      const result = TokenUtils.verify(token);

      // Assert: Valid.
      expect(result).toBe(true);
    });

    it('returns true for digits-only valid token', () => {
      // Arrange: 32 digits.
      const token = '01234567890123456789012345678901';

      // Act: Verify token.
      const result = TokenUtils.verify(token);

      // Assert: Valid.
      expect(result).toBe(true);
    });
  });
});
