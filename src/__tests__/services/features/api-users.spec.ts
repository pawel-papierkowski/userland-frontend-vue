import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiUsers from '@/services/features/api-users.ts';

// ////////////////////////////////////////////////////////////////////////////
// Mocks.

const mocks = vi.hoisted(() => {
  const apiClient = {
    post: vi.fn<() => Promise<unknown>>(),
    get: vi.fn<() => Promise<unknown>>(),
    patch: vi.fn<() => Promise<unknown>>(),
    delete: vi.fn<() => Promise<unknown>>(),
  };
  const apiClientFastTimeout = {
    post: vi.fn<() => Promise<unknown>>(),
  };
  const mockCreate = vi
    .fn<() => unknown>()
    .mockReturnValueOnce(apiClient)
    .mockReturnValueOnce(apiClientFastTimeout);
  return { apiClient, apiClientFastTimeout, mockCreate };
});

vi.mock('@/services/api-common.ts', () => ({
  default: {
    create: mocks.mockCreate,
  },
}));

// ////////////////////////////////////////////////////////////////////////////
// Tests.

describe('api-users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-chain mock return values since clearAllMocks resets them.
    mocks.mockCreate
      .mockReturnValueOnce(mocks.apiClient)
      .mockReturnValueOnce(mocks.apiClientFastTimeout);
  });

  describe('register', () => {
    it('should call POST /register with payload', async () => {
      // Arrange
      const payload = {
        username: 'user',
        email: 'user@example.com',
        password: 'pass',
        lang: 'en',
        isAdmin: false,
        frontend: 'VUE',
      };
      const mockResponse = { data: 'registered' };
      mocks.apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiUsers.register(payload);

      // Assert
      expect(mocks.apiClient.post).toHaveBeenCalledWith('/register', payload);
      expect(result).toBe(mockResponse);
    });
  });

  describe('activate', () => {
    it('should call POST /activate with payload', async () => {
      // Arrange
      const payload = { token: 'abc-123', frontend: 'VUE' };
      const mockResponse = { data: 'activated' };
      mocks.apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiUsers.activate(payload);

      // Assert
      expect(mocks.apiClient.post).toHaveBeenCalledWith('/activate', payload);
      expect(result).toBe(mockResponse);
    });
  });

  describe('login', () => {
    it('should call POST /login with payload', async () => {
      // Arrange
      const payload = { email: 'user@example.com', password: 'pass' };
      const mockResponse = { data: 'logged in' };
      mocks.apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiUsers.login(payload);

      // Assert
      expect(mocks.apiClient.post).toHaveBeenCalledWith('/login', payload);
      expect(result).toBe(mockResponse);
    });
  });

  describe('logout', () => {
    it('should call POST /logout on fast timeout instance', async () => {
      // Arrange
      const mockResponse = { data: 'logged out' };
      mocks.apiClientFastTimeout.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiUsers.logout();

      // Assert
      expect(mocks.apiClientFastTimeout.post).toHaveBeenCalledWith('/logout');
      expect(result).toBe(mockResponse);
    });
  });

  describe('prolong', () => {
    it('should call POST /prolong', async () => {
      // Arrange
      const mockResponse = { data: 'prolonged' };
      mocks.apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiUsers.prolong();

      // Assert
      expect(mocks.apiClient.post).toHaveBeenCalledWith('/prolong');
      expect(result).toBe(mockResponse);
    });
  });

  describe('view', () => {
    it('should call GET /view', async () => {
      // Arrange
      const mockResponse = { data: { username: 'user' } };
      mocks.apiClient.get.mockResolvedValue(mockResponse);

      // Act
      const result = await apiUsers.view();

      // Assert
      expect(mocks.apiClient.get).toHaveBeenCalledWith('/view');
      expect(result).toBe(mockResponse);
    });
  });

  describe('edit', () => {
    it('should call PATCH /edit with payload', async () => {
      // Arrange
      const payload = {
        version: 1,
        username: 'user',
        lang: 'en',
        profile: { name: 'John', surname: 'Doe' },
      };
      const mockResponse = { data: 'edited' };
      mocks.apiClient.patch.mockResolvedValue(mockResponse);

      // Act
      const result = await apiUsers.edit(payload);

      // Assert
      expect(mocks.apiClient.patch).toHaveBeenCalledWith('/edit', payload);
      expect(result).toBe(mockResponse);
    });
  });

  describe('password reset', () => {
    it('should call POST /password/link with payload', async () => {
      // Arrange
      const payload = { email: 'user@example.com', frontend: 'VUE' };
      const mockResponse = { data: 'link sent' };
      mocks.apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiUsers.passwordResetLink(payload);

      // Assert
      expect(mocks.apiClient.post).toHaveBeenCalledWith('/password/link', payload);
      expect(result).toBe(mockResponse);
    });

    it('should call PATCH /password/confirm with payload', async () => {
      // Arrange
      const payload = { token: 'abc-123', password: 'newpass' };
      const mockResponse = { data: 'password reset' };
      mocks.apiClient.patch.mockResolvedValue(mockResponse);

      // Act
      const result = await apiUsers.passwordResetConfirm(payload);

      // Assert
      expect(mocks.apiClient.patch).toHaveBeenCalledWith('/password/confirm', payload);
      expect(result).toBe(mockResponse);
    });
  });

  describe('email change', () => {
    it('should call POST /email/link with payload', async () => {
      // Arrange
      const payload = { newEmail: 'new@example.com', password: 'pass', frontend: 'VUE' };
      const mockResponse = { data: 'link sent' };
      mocks.apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiUsers.emailChangeLink(payload);

      // Assert
      expect(mocks.apiClient.post).toHaveBeenCalledWith('/email/link', payload);
      expect(result).toBe(mockResponse);
    });

    it('should call PATCH /email/confirm with payload', async () => {
      // Arrange
      const payload = { token: 'abc-123' };
      const mockResponse = { data: 'email changed' };
      mocks.apiClient.patch.mockResolvedValue(mockResponse);

      // Act
      const result = await apiUsers.emailChangeConfirm(payload);

      // Assert
      expect(mocks.apiClient.patch).toHaveBeenCalledWith('/email/confirm', payload);
      expect(result).toBe(mockResponse);
    });
  });

  describe('account delete', () => {
    it('should call POST /delete/link with payload', async () => {
      // Arrange
      const payload = { password: 'pass', frontend: 'VUE' };
      const mockResponse = { data: 'link sent' };
      mocks.apiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiUsers.accountDeleteLink(payload);

      // Assert
      expect(mocks.apiClient.post).toHaveBeenCalledWith('/delete/link', payload);
      expect(result).toBe(mockResponse);
    });

    it('should call DELETE /delete/confirm with payload in data option', async () => {
      // Arrange
      const payload = { token: 'abc-123' };
      const mockResponse = { data: 'account deleted' };
      mocks.apiClient.delete.mockResolvedValue(mockResponse);

      // Act
      const result = await apiUsers.accountDeleteConfirm(payload);

      // Assert
      expect(mocks.apiClient.delete).toHaveBeenCalledWith('/delete/confirm', { data: payload });
      expect(result).toBe(mockResponse);
    });
  });
});
