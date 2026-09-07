import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiChecks from '@/services/features/api-checks.ts';

// ////////////////////////////////////////////////////////////////////////////
// Mocks.

const mockAxiosInstance = vi.hoisted(() => ({
  get: vi.fn<() => Promise<unknown>>(),
}));

vi.mock('@/services/api-common.ts', () => ({
  default: {
    create: vi.fn<() => typeof mockAxiosInstance>().mockReturnValue(mockAxiosInstance),
  },
}));

// ////////////////////////////////////////////////////////////////////////////
// Tests.

describe('api-checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('alive', () => {
    it('should call GET /alive', async () => {
      // Arrange
      const mockResponse = { data: 'ok' };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await apiChecks.alive();

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alive');
      expect(result).toBe(mockResponse);
    });
  });

  describe('mustBeLogged', () => {
    it('should call GET /must-be-logged', async () => {
      // Arrange
      const mockResponse = { data: 'ok' };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await apiChecks.mustBeLogged();

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/must-be-logged');
      expect(result).toBe(mockResponse);
    });
  });

  describe('mustBeAdmin', () => {
    it('should call GET /must-be-admin', async () => {
      // Arrange
      const mockResponse = { data: 'ok' };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await apiChecks.mustBeAdmin();

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/must-be-admin');
      expect(result).toBe(mockResponse);
    });
  });

  describe('exception', () => {
    it('should call GET /exception', async () => {
      // Arrange
      const mockResponse = { data: 'ok' };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Act
      const result = await apiChecks.exception();

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/exception');
      expect(result).toBe(mockResponse);
    });
  });
});
