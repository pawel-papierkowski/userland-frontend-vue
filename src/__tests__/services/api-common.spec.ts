/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import apiCommon from '@/services/api-common.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';
import { logger } from '@/code/utils/logger.ts';

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

vi.mock('@/code/stores/login/AppLoginer.ts', () => ({
  AppLoginer: {
    getJwt: vi.fn<typeof AppLoginer.getJwt>(),
    shouldProlong: vi.fn<typeof AppLoginer.shouldProlong>(),
    prolongSilently: vi.fn<typeof AppLoginer.prolongSilently>(),
  },
}));

vi.mock('@/code/utils/logger.ts', () => ({
  logger: {
    debug: vi.fn<typeof logger.debug>(),
    error: vi.fn<typeof logger.error>(),
  },
}));

describe('api-common', () => {
  let interceptor: (config: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    apiCommon.create('/test-base');
    const mockAxiosInstance = vi.mocked(axios.create).mock.results[0]?.value;
    interceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
  });

  describe('request interceptor', () => {
    it('should NOT add Authorization header if no token is present', async () => {
      // Arrange: no token present.
      vi.mocked(AppLoginer.getJwt).mockReturnValue(null);
      const config = { headers: {} };

      // Act: call interceptor.
      const result = await interceptor(config);

      // Assert: no prolong, continue without token.
      expect(result.headers.Authorization).toBeUndefined();
      expect(AppLoginer.shouldProlong).not.toHaveBeenCalled();
    });

    it('should add Authorization header if token is present and no prolong needed', async () => {
      // Arrange: token present and no prolong needed.
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      vi.mocked(AppLoginer.shouldProlong).mockReturnValue(false);
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: call interceptor.
      const result = await interceptor(config);

      // Assert: no prolong, continue normally with old token.
      expect(result.headers.Authorization).toBe('Bearer old-token');
      expect(AppLoginer.prolongSilently).not.toHaveBeenCalled();
    });

    it('should prolong session and use new token if prolong is needed', async () => {
      // Arrange: token present and should prolong.
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      vi.mocked(AppLoginer.shouldProlong).mockReturnValue(true);
      vi.mocked(AppLoginer.prolongSilently).mockResolvedValue({ jwt: 'new-token' } as any);
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: call interceptor.
      const result = await interceptor(config);

      // Assert: prolong, continue with new token.
      expect(AppLoginer.prolongSilently).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer new-token');
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('prolonging'));
    });

    it('should NOT prolong session for auth requests even if prolong is needed', async () => {
      // Arrange: token present and should prolong.
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      vi.mocked(AppLoginer.shouldProlong).mockReturnValue(true);
      const authUrls = ['/prolong', '/login', '/logout', '/register'];

      for (const url of authUrls) {
        // Arrange: correct config.
        const config = { headers: {}, url };
        // Act: call interceptor.
        const result = await interceptor(config);
        // Assert: no prolong, even though AppLoginer.shouldProlong() returns true.
        // Reason: certain endpoints never have prolong to avoid infinite loops or unnecessary calls.
        expect(AppLoginer.prolongSilently).not.toHaveBeenCalled();
        expect(result.headers.Authorization).toBe('Bearer old-token');
      }
    });

    it('should proceed with old token if prolong fails', async () => {
      // Arrange: token present and should prolong.
      vi.mocked(AppLoginer.getJwt).mockReturnValue('old-token');
      vi.mocked(AppLoginer.shouldProlong).mockReturnValue(true);
      vi.mocked(AppLoginer.prolongSilently).mockRejectedValue(new Error('Prolong failed'));
      const config = { headers: {}, url: '/some-endpoint' };

      // Act: call interceptor.
      const result = await interceptor(config);

      // Assert: no prolong, continue normally with old token.
      expect(AppLoginer.prolongSilently).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer old-token');
      expect(logger.error).toHaveBeenCalledWith(expect.any(Error), 'Failed to prolong.');
    });
  });

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
