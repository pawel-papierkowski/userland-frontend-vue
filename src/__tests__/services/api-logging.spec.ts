import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiLogging from '@/services/api-logging.ts';

import { logger } from '@/code/utils/logger.ts';

// ////////////////////////////////////////////////////////////////////////////
// Mocks.

const mockProjectProp = vi.hoisted(() => ({ build: 'DEV' as 'DEV' | 'PROD' }));

vi.mock('@/code/data/app/const.ts', () => ({
  projectProp: mockProjectProp,
}));

vi.mock('axios', () => ({
  isAxiosError: vi.fn<(err: unknown) => boolean>(
    (err: unknown) => (err as { isAxiosError?: boolean })?.isAxiosError === true,
  ),
}));

vi.mock('@/code/utils/logger.ts', () => ({
  logger: {
    debug: vi.fn<typeof logger.debug>(),
    error: vi.fn<typeof logger.error>(),
  },
}));

// ////////////////////////////////////////////////////////////////////////////
// Tests.

describe('api-logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProjectProp.build = 'DEV';
  });

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

    it('should log less detailed error in PROD build', () => {
      // Arrange: PROD build, Axios error with response.
      mockProjectProp.build = 'PROD';
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

      // Assert: No backendBody in PROD — only status and message.
      expect(logger.error).toHaveBeenCalledWith('API Error', {
        status: 400,
        message: 'Request failed',
      });
    });

    it('should NOT log if Axios error has neither response nor request', () => {
      // Arrange: Axios error missing both response and request.
      const error = {
        isAxiosError: true,
      };

      // Act: Call error logging.
      apiLogging.logError(error, 'API Error');

      // Assert: No logging at all (silent fall-through).
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
