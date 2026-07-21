/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import apiCommon from '@/services/api-common.ts';

import { logger } from '@/code/utils/logger.ts';
import { locstLastApiCall, prolongAfterLongTime } from '@/code/data/app/const.ts';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

// ////////////////////////////////////////////////////////////////////////////
// Constants.

const authUrls = ['/prolong', '/login', '/logout', '/register'];
/** Offset in minutes to set > 12h idle for tests (13 hours). */
const idleMoreThan = prolongAfterLongTime + 60;
/** Offset in minutes to set < 12h idle for tests (11 hours). */
const idleLessThan = prolongAfterLongTime - 60;

// ////////////////////////////////////////////////////////////////////////////
// Mocks.

// We mock axios.create to capture the created instance and then extract the interceptor function registered
// with interceptors.request.use.
vi.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: {
        use: vi.fn<any>(),
      },
    },
  };
  return {
    default: {
      create: vi.fn<any>(() => mockAxiosInstance),
    },
    isAxiosError: vi.fn<any>((err: any) => err?.isAxiosError === true),
  };
});

vi.mock('@/code/stores/login/AppLoginer.ts', async () => {
  const actual = (await vi.importActual('@/code/stores/login/AppLoginer.ts')) as {
    AppLoginer: { shouldProlong: () => boolean };
  };
  return {
    AppLoginer: {
      getJwt: vi.fn<typeof AppLoginer.getJwt>(),
      shouldProlong: actual.AppLoginer.shouldProlong,
      prolongSilently: vi.fn<typeof AppLoginer.prolongSilently>(),
    },
  };
});

vi.mock('@/services/features/api-users.ts', () => ({ default: {} }));

vi.mock('@/code/utils/logger.ts', () => ({
  logger: {
    debug: vi.fn<typeof logger.debug>(),
    error: vi.fn<typeof logger.error>(),
  },
}));

// ////////////////////////////////////////////////////////////////////////////
// Tests.

describe('api-common', () => {
  let interceptor: (config: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    const pinia = createPinia();
    setActivePinia(pinia);
    apiCommon.create('/test-base');
    const mockAxiosInstance = vi.mocked(axios.create).mock.results[0]?.value;
    interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
  });

  // //////////////////////////////////////////////////////////////////////////
  // General.

  describe('general', () => {
    it('should NOT add Authorization header if no token is present', async () => {
      // Arrange: no token present.
      vi.mocked(AppLoginer.getJwt).mockReturnValue(null);
      const config = { headers: {} };

      // Act: call interceptor.
      const result = await interceptor(config);

      // Assert: no prolong, continue without token.
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should add Authorization header if token is present and no prolong needed', async () => {
      // Arrange: token present and no prolong needed (not idle, not expiring).
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: call interceptor.
      const result = await interceptor(config);

      // Assert: no prolong, continue normally with old token.
      expect(result.headers.Authorization).toBe('Bearer old-token');
      expect(AppLoginer.prolongSilently).not.toHaveBeenCalled();
    });

    it('should prolong session and use new token if prolong is needed', async () => {
      // Arrange: token present and shouldProlong returns true (expiry).
      vi.spyOn(AppLoginer, 'shouldProlong').mockReturnValueOnce(true);
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      vi.mocked(AppLoginer.prolongSilently).mockResolvedValue({ jwt: 'new-token' } as any);
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: call interceptor.
      const result = await interceptor(config);

      // Assert: prolong, continue with new token.
      expect(AppLoginer.prolongSilently).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer new-token');
      expect(logger.debug).toHaveBeenCalledWith('Prolonging session...');
    });

    it('should NOT prolong session for auth requests even if prolong is needed', async () => {
      // Arrange: token present.
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');

      for (const url of authUrls) {
        const config = { headers: {}, url };
        const result = await interceptor(config);
        // Assert: no prolong, because auth endpoints skip the prolong block entirely.
        expect(AppLoginer.prolongSilently).not.toHaveBeenCalled();
        expect(result.headers.Authorization).toBe('Bearer old-token');
      }
    });

    it('should proceed with old token if prolong fails', async () => {
      // Arrange: token present and shouldProlong returns true (expiry).
      vi.spyOn(AppLoginer, 'shouldProlong').mockReturnValueOnce(true);
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      vi.mocked(AppLoginer.prolongSilently).mockRejectedValue(new Error('Prolong failed'));
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: call interceptor.
      const result = await interceptor(config);

      // Assert: prolong was attempted but failed, continue with old token.
      expect(AppLoginer.prolongSilently).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer old-token');
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), 'Failed to prolong.');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Idle prolong.

  describe('idle prolong (12h)', () => {
    it('should prolong when last API call was more than 12h ago', async () => {
      // Arrange: Set last call to 13 hours ago (> 12h idle).
      localStorage.setItem(locstLastApiCall, String(Date.now() - idleMoreThan * 60 * 1000));
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      vi.mocked(AppLoginer.prolongSilently).mockResolvedValue({ jwt: 'new-token' } as any);
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: call interceptor.
      const result = await interceptor(config);

      // Assert: prolong was called due to idle timeout (isIdleTooLong returns true).
      expect(AppLoginer.prolongSilently).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer new-token');
    });

    it('should NOT prolong when storage value is missing', async () => {
      // Arrange: No last call timestamp in storage.
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: call interceptor.
      const result = await interceptor(config);

      // Assert: no prolong triggered (isIdleTooLong returns false).
      expect(AppLoginer.prolongSilently).not.toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer old-token');
    });

    it('should NOT prolong when last API call was less than 12h ago', async () => {
      // Arrange: Set last call to 11 hours ago (within the 12h window).
      localStorage.setItem(locstLastApiCall, String(Date.now() - idleLessThan * 60 * 1000));
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: call interceptor.
      const result = await interceptor(config);

      // Assert: no prolong triggered (isIdleTooLong returns false).
      expect(AppLoginer.prolongSilently).not.toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer old-token');
    });

    it('should NOT prolong for auth requests even if idle > 12h', async () => {
      // Arrange: Set last call to 13 hours ago.
      localStorage.setItem(locstLastApiCall, String(Date.now() - idleMoreThan * 60 * 1000));
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');

      for (const url of authUrls) {
        const config = { headers: {}, url };
        const result = await interceptor(config);
        // Assert: no prolong because auth endpoints skip the prolong block.
        expect(AppLoginer.prolongSilently).not.toHaveBeenCalled();
        expect(result.headers.Authorization).toBe('Bearer old-token');
      }
    });

    it('should save timestamp after a non-auth request', async () => {
      // Arrange: No timestamp set yet.
      expect(localStorage.getItem(locstLastApiCall)).toBeNull();
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: call interceptor.
      await interceptor(config);

      // Assert: timestamp was saved.
      const saved = localStorage.getItem(locstLastApiCall);
      expect(saved).not.toBeNull();
      // Should be a recent timestamp (within the last second).
      expect(Date.now() - Number(saved)).toBeLessThan(1000);
    });

    it('should NOT save timestamp for auth requests', async () => {
      // Arrange: Token present, auth request.
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      const config = { headers: {}, url: '/login' };

      // Act: call interceptor.
      await interceptor(config);

      // Assert: no timestamp was saved (block is skipped for auth URLs).
      expect(localStorage.getItem(locstLastApiCall)).toBeNull();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Logging in case of error.

  describe('logError', () => {
    it('should log detailed error if it is an Axios error with response', () => {
      // Arrange: error that should be processed.
      const error = {
        isAxiosError: true,
        message: 'Request failed',
        response: {
          status: 400,
          data: { detail: 'Bad Request' },
        },
      };

      // Act: call error logging.
      apiCommon.logError(error, 'API Error');

      // Assert: called logger.error internally with correct parameters.
      expect(logger.error).toHaveBeenCalledWith('API Error', {
        status: 400,
        message: 'Request failed',
        backendBody: { detail: 'Bad Request' },
      });
    });

    it('should log unreachable error if it is an Axios error without response', () => {
      // Arrange: error that should be processed.
      const error = {
        isAxiosError: true,
        request: {},
      };

      // Act: call error logging.
      apiCommon.logError(error, 'API Error');

      // Assert: called logger.error internally with correct parameters.
      expect(logger.error).toHaveBeenCalledWith('API Error', 'Backend is unreachable. No response received.');
    });

    it('should log unexpected error if it is not an Axios error', () => {
      // Arrange: error that should be processed.
      const error = new Error('Some other error');

      // Act: call error logging.
      apiCommon.logError(error, 'General Error');

      // Assert: called logger.error internally with correct parameters.
      expect(logger.error).toHaveBeenCalledWith('General Error', 'An unexpected error occurred:', error);
    });
  });
});
