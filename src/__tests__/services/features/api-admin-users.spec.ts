import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiAdminUsers from '@/services/features/api-admin-users.ts';

// ////////////////////////////////////////////////////////////////////////////
// Mocks.

const mocks = vi.hoisted(() => {
  const apiClient = {
    post: vi.fn<() => Promise<unknown>>(),
    get: vi.fn<() => Promise<unknown>>(),
    patch: vi.fn<() => Promise<unknown>>(),
    delete: vi.fn<() => Promise<unknown>>(),
  };
  return { apiClient };
});

vi.mock('@/services/api-common.ts', () => ({
  default: {
    create: vi.fn<() => unknown>().mockReturnValue(mocks.apiClient),
  },
}));

// ////////////////////////////////////////////////////////////////////////////
// Tests.

describe('api-admin-users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('users list', () => {
    it('should call POST /users with payload', async () => {
      // Arrange
      const payload = { username: null, email: null, status: null, locked: null, createdFromAt: null, createdToAt: null, tableMeta: null };
      const mockResponse = { data: { entries: [], tableMeta: {} } };
      mocks.apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiAdminUsers.loadPage(payload);

      // Assert
      expect(mocks.apiClient.post).toHaveBeenCalledWith('/users', payload);
      expect(result).toBe(mockResponse);
    });
  });

  describe('single user', () => {
    it('should call GET /user/{userId}', async () => {
      // Arrange
      const mockResponse = { data: { id: 42, username: 'user' } };
      mocks.apiClient.get.mockResolvedValue(mockResponse);

      // Act
      const result = await apiAdminUsers.loadUserData(42);

      // Assert
      expect(mocks.apiClient.get).toHaveBeenCalledWith('/user/42');
      expect(result).toBe(mockResponse);
    });

    it('should call PATCH /user with payload', async () => {
      // Arrange
      const payload = { id: 42, version: 1, username: 'user', email: 'user@example.com', locked: false, lang: 'en', profile: { name: 'John', surname: 'Doe' } };
      const mockResponse = { data: { id: 42, username: 'user' } };
      mocks.apiClient.patch.mockResolvedValue(mockResponse);

      // Act
      const result = await apiAdminUsers.editUserData(payload);

      // Assert
      expect(mocks.apiClient.patch).toHaveBeenCalledWith('/user', payload);
      expect(result).toBe(mockResponse);
    });
  });

  describe('history', () => {
    it('should call POST /user/history with payload', async () => {
      // Arrange
      const payload = { userId: 42, who: null, what: null, createdFromAt: null, createdToAt: null, tableMeta: null };
      const mockResponse = { data: { entries: [], tableMeta: {} } };
      mocks.apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiAdminUsers.loadHistoryPage(payload);

      // Assert
      expect(mocks.apiClient.post).toHaveBeenCalledWith('/user/history', payload);
      expect(result).toBe(mockResponse);
    });
  });

  describe('permissions', () => {
    it('should call POST /user/permissions with payload', async () => {
      // Arrange
      const payload = { userId: 42, createdFromAt: null, createdToAt: null, tableMeta: null };
      const mockResponse = { data: { entries: [], tableMeta: {} } };
      mocks.apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiAdminUsers.loadPermissionsPage(payload);

      // Assert
      expect(mocks.apiClient.post).toHaveBeenCalledWith('/user/permissions', payload);
      expect(result).toBe(mockResponse);
    });

    it('should call PATCH /user/permission with payload', async () => {
      // Arrange
      const payload = { id: 7, userId: 42, name: 'ADMIN', value: 'true' };
      const mockResponse = { data: 'permission edited' };
      mocks.apiClient.patch.mockResolvedValue(mockResponse);

      // Act
      const result = await apiAdminUsers.editPermissionEntry(payload);

      // Assert
      expect(mocks.apiClient.patch).toHaveBeenCalledWith('/user/permission', payload);
      expect(result).toBe(mockResponse);
    });

    it('should call DELETE /user/permission/{id}', async () => {
      // Arrange
      const mockResponse = { data: 'permission deleted' };
      mocks.apiClient.delete.mockResolvedValue(mockResponse);

      // Act
      const result = await apiAdminUsers.deletePermissionEntry(7);

      // Assert
      expect(mocks.apiClient.delete).toHaveBeenCalledWith('/user/permission/7');
      expect(result).toBe(mockResponse);
    });
  });

  describe('config', () => {
    it('should call POST /user/configs with payload', async () => {
      // Arrange
      const payload = { userId: 42, createdFromAt: null, createdToAt: null, tableMeta: null };
      const mockResponse = { data: { entries: [], tableMeta: {} } };
      mocks.apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiAdminUsers.loadConfigPage(payload);

      // Assert
      expect(mocks.apiClient.post).toHaveBeenCalledWith('/user/configs', payload);
      expect(result).toBe(mockResponse);
    });

    it('should call PATCH /user/config with payload', async () => {
      // Arrange
      const payload = { id: 3, userId: 42, name: 'theme', value: 'dark' };
      const mockResponse = { data: 'config edited' };
      mocks.apiClient.patch.mockResolvedValue(mockResponse);

      // Act
      const result = await apiAdminUsers.editConfigEntry(payload);

      // Assert
      expect(mocks.apiClient.patch).toHaveBeenCalledWith('/user/config', payload);
      expect(result).toBe(mockResponse);
    });

    it('should call DELETE /user/config/{id}', async () => {
      // Arrange
      const mockResponse = { data: 'config deleted' };
      mocks.apiClient.delete.mockResolvedValue(mockResponse);

      // Act
      const result = await apiAdminUsers.deleteConfigEntry(3);

      // Assert
      expect(mocks.apiClient.delete).toHaveBeenCalledWith('/user/config/3');
      expect(result).toBe(mockResponse);
    });
  });

  describe('tokens', () => {
    it('should call POST /user/tokens with payload', async () => {
      // Arrange
      const payload = { userId: 42, createdFromAt: null, createdToAt: null, tableMeta: null };
      const mockResponse = { data: { entries: [], tableMeta: {} } };
      mocks.apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiAdminUsers.loadTokensPage(payload);

      // Assert
      expect(mocks.apiClient.post).toHaveBeenCalledWith('/user/tokens', payload);
      expect(result).toBe(mockResponse);
    });
  });

  describe('jwt', () => {
    it('should call POST /user/jwt with payload', async () => {
      // Arrange
      const payload = { userId: 42, createdFromAt: null, createdToAt: null, tableMeta: null };
      const mockResponse = { data: { entries: [], tableMeta: {} } };
      mocks.apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiAdminUsers.loadJwtPage(payload);

      // Assert
      expect(mocks.apiClient.post).toHaveBeenCalledWith('/user/jwt', payload);
      expect(result).toBe(mockResponse);
    });
  });
});
