/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { createPinia, setActivePinia } from 'pinia';
import apiCommon from '@/services/api-common.ts';
import apiLogging from '@/services/api-logging.ts';

import { logger } from '@/code/utils/logger.ts';
import { prolongIdleThreshold } from '@/code/data/app/const.ts';
import { locstLastApiCall } from '@/code/data/app/storage.ts';

import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

// ////////////////////////////////////////////////////////////////////////////
// Constants.

const authUrls = ['/prolong', '/login', '/logout', '/register'];
/** Offset in minutes to set > 12h idle for tests (13 hours). */
const idleMoreThan = prolongIdleThreshold + 60;
/** Offset in minutes to set < 12h idle for tests (11 hours). */
const idleLessThan = prolongIdleThreshold - 60;

// ////////////////////////////////////////////////////////////////////////////
// Mocks.

// We mock axios.create to capture the created instance and then extract the interceptor function registered
// with interceptors.request.use.
vi.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: {
        use: vi.fn<any>(),
        //use: vi.fn<(onFulfilled: (config: unknown) => unknown) => number>(),
      },
      response: {
        use: vi.fn<any>(),
        //use: vi.fn<(onFulfilled: (response: unknown) => unknown, onRejected?: (error: unknown) => unknown) => number>(),
      },
    },
  };
  return {
    default: {
      create: vi.fn<any>(() => mockAxiosInstance),
      //create: vi.fn<() => typeof mockAxiosInstance>(),
    },
    isAxiosError: vi.fn<any>((err: any) => err?.isAxiosError === true),
    //isAxiosError: vi.fn<(err: unknown) => boolean>(),
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
      isLogged: vi.fn<() => boolean>(),
      expireSession: vi.fn<() => void>(),
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
  let responseErrorHandler: (error: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    const pinia = createPinia();
    setActivePinia(pinia);
    apiCommon.create('/test-base');
    const mockAxiosInstance = vi.mocked(axios.create).mock.results[0]?.value;
    interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    responseErrorHandler = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];

    // By default, mock user as logged in. Individual tests can override.
    vi.mocked(AppLoginer.isLogged).mockReturnValue(true);
  });

  // //////////////////////////////////////////////////////////////////////////
  // General.

  describe('general', () => {
    it('should NOT add Authorization header if no token is present', async () => {
      // Arrange: No token present.
      vi.mocked(AppLoginer.getJwt).mockReturnValue(null);
      const config = { headers: {} };

      // Act: Call interceptor.
      const result = await interceptor(config);

      // Assert: No prolong, continue without token.
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should add Authorization header if token is present and no prolong needed', async () => {
      // Arrange: Token present and no prolong needed (not idle, not expiring).
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: Call interceptor.
      const result = await interceptor(config);

      // Assert: No prolong, continue normally with old token.
      expect(result.headers.Authorization).toBe('Bearer old-token');
      expect(AppLoginer.prolongSilently).not.toHaveBeenCalled();
    });

    it('should prolong session and use new token if prolong is needed', async () => {
      // Arrange: Token present and shouldProlong returns true (expiry).
      vi.spyOn(AppLoginer, 'shouldProlong').mockReturnValueOnce(true);
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      vi.mocked(AppLoginer.prolongSilently).mockResolvedValue({ jwt: 'new-token' } as any);
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: Call interceptor.
      const result = await interceptor(config);

      // Assert: Prolong, continue with new token.
      expect(AppLoginer.prolongSilently).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer new-token');
      expect(logger.debug).toHaveBeenCalledWith('Prolonging session...');
    });

    it('should NOT prolong session for auth requests even if prolong is needed', async () => {
      // Arrange: Token present.
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');

      for (const url of authUrls) {
        const config = { headers: {}, url };
        const result = await interceptor(config);
        // Assert: No prolong, because auth endpoints skip the prolong block entirely.
        expect(AppLoginer.prolongSilently).not.toHaveBeenCalled();
        expect(result.headers.Authorization).toBe('Bearer old-token');
      }
    });

    it('should proceed with old token if prolong fails', async () => {
      // Arrange: Token present and shouldProlong returns true (expiry).
      vi.spyOn(AppLoginer, 'shouldProlong').mockReturnValueOnce(true);
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      vi.mocked(AppLoginer.prolongSilently).mockRejectedValue(new Error('Prolong failed'));
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: Call interceptor.
      const result = await interceptor(config);

      // Assert: Prolong was attempted but failed, continue with old token.
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

      // Act: Call interceptor.
      const result = await interceptor(config);

      // Assert: Prolong was called due to idle timeout (isIdleTooLong returns true).
      expect(AppLoginer.prolongSilently).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer new-token');
    });

    it('should NOT prolong when storage value is missing', async () => {
      // Arrange: No last call timestamp in storage.
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: Call interceptor.
      const result = await interceptor(config);

      // Assert: No prolong triggered (isIdleTooLong returns false).
      expect(AppLoginer.prolongSilently).not.toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer old-token');
    });

    it('should NOT prolong when last API call was less than 12h ago', async () => {
      // Arrange: Set last call to 11 hours ago (within the 12h window).
      localStorage.setItem(locstLastApiCall, String(Date.now() - idleLessThan * 60 * 1000));
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: Call interceptor.
      const result = await interceptor(config);

      // Assert: No prolong triggered (isIdleTooLong returns false).
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
        // Assert: No prolong because auth endpoints skip the prolong block.
        expect(AppLoginer.prolongSilently).not.toHaveBeenCalled();
        expect(result.headers.Authorization).toBe('Bearer old-token');
      }
    });

    it('should save timestamp after a non-auth request', async () => {
      // Arrange: No timestamp set yet.
      expect(localStorage.getItem(locstLastApiCall)).toBeNull();
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: Call interceptor.
      await interceptor(config);

      // Assert: Timestamp was saved.
      const saved = localStorage.getItem(locstLastApiCall);
      expect(saved).not.toBeNull();
      // Should be a recent timestamp (within the last second).
      expect(Date.now() - Number(saved)).toBeLessThan(1000);
    });

    it('should NOT save timestamp for auth requests', async () => {
      // Arrange: Token present, auth request.
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      const config = { headers: {}, url: '/login' };

      // Act: Call interceptor.
      await interceptor(config);

      // Assert: No timestamp was saved (block is skipped for auth URLs).
      expect(localStorage.getItem(locstLastApiCall)).toBeNull();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Response interceptor: 401 handling.

  describe('401 response interceptor', () => {
    it('should call expireSession on 401 for non-login endpoint when logged in', async () => {
      // Arrange: 401 error from a non-login endpoint.
      const error = {
        isAxiosError: true,
        response: { status: 401 },
        config: { url: '/some-endpoint' },
      };

      // Act: Call the response error handler.
      await expect(responseErrorHandler(error)).rejects.toBe(error);

      // Assert: ExpireSession was called (session expired).
      expect(AppLoginer.expireSession).toHaveBeenCalled();
    });

    it('should NOT call expireSession on 401 for /login endpoint', async () => {
      // Arrange: 401 error from the login endpoint.
      const error = {
        isAxiosError: true,
        response: { status: 401 },
        config: { url: '/login' },
      };

      // Act: Call the response error handler.
      await expect(responseErrorHandler(error)).rejects.toBe(error);

      // Assert: ExpireSession was NOT called (wrong credentials, not expired session).
      expect(AppLoginer.expireSession).not.toHaveBeenCalled();
    });

    it('should NOT call expireSession on 401 when already not logged in', async () => {
      // Arrange: Ser is not logged in.
      vi.mocked(AppLoginer.isLogged).mockReturnValue(false);
      const error = {
        isAxiosError: true,
        response: { status: 401 },
        config: { url: '/some-endpoint' },
      };

      // Act: Call the response error handler.
      await expect(responseErrorHandler(error)).rejects.toBe(error);

      // Assert: ExpireSession was NOT called (already logged out).
      expect(AppLoginer.expireSession).not.toHaveBeenCalled();
    });

    it('should NOT call expireSession on non-401 errors', async () => {
      // Arrange: 403 Forbidden (not 401).
      const error = {
        isAxiosError: true,
        response: { status: 403 },
        config: { url: '/some-endpoint' },
      };

      // Act: Call the response error handler.
      await expect(responseErrorHandler(error)).rejects.toBe(error);

      // Assert: ExpireSession was NOT called (not a 401).
      expect(AppLoginer.expireSession).not.toHaveBeenCalled();
    });

    it('should reject the promise so the caller can also handle the error', async () => {
      // Arrange: 401 error.
      const error = {
        isAxiosError: true,
        response: { status: 401 },
        config: { url: '/some-endpoint' },
      };

      // Act & assert: the error is still propagated to the caller.
      await expect(responseErrorHandler(error)).rejects.toBe(error);
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Logging in case of error.

  describe('logError', () => {
    it('should log detailed error if it is an Axios error with response', () => {
      // Arrange: Error that should be processed.
      const error = {
        isAxiosError: true,
        message: 'Request failed',
        response: {
          status: 400,
          data: { detail: 'Bad Request' },
        },
      };

      // Act: Call error logging.
      apiLogging.logError(error, 'API Error');

      // Assert: Called logger.error internally with correct parameters.
      expect(logger.error).toHaveBeenCalledWith('API Error', {
        status: 400,
        message: 'Request failed',
        backendBody: { detail: 'Bad Request' },
      });
    });

    it('should log unreachable error if it is an Axios error without response', () => {
      // Arrange: Error that should be processed.
      const error = {
        isAxiosError: true,
        request: {},
      };

      // Act: Call error logging.
      apiLogging.logError(error, 'API Error');

      // Assert: Called logger.error internally with correct parameters.
      expect(logger.error).toHaveBeenCalledWith('API Error', 'Backend is unreachable. No response received.');
    });

    it('should log unexpected error if it is not an Axios error', () => {
      // Arrange: Error that should be processed.
      const error = new Error('Some other error');

      // Act: Call error logging.
      apiLogging.logError(error, 'General Error');

      // Assert: Called logger.error internally with correct parameters.
      expect(logger.error).toHaveBeenCalledWith('General Error', 'An unexpected error occurred:', error);
    });
  });
});
