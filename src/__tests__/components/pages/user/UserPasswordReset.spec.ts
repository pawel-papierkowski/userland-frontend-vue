/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserPasswordReset from '@/components/pages/user/UserPasswordReset.vue';

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    passwordResetConfirm: vi.fn<typeof backendApiUser.register>(),
  },
}));

const mockPush = vi.fn<(to: any) => void>();
const mockRoute = {
  query: {
    token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs'
  },
};

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, }),
  useRoute: () => mockRoute,
}));

/** Boilerplate code. */
function createWrapper() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(UserPasswordReset, {
    global: {
      plugins: [logger, pinia, i18n],
    },
  });
}

/** Tests of UserPasswordReset component. */
describe('UserPasswordReset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.query.token = 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs';
  });

  it('is correctly filled and submits successfully', async () => {
    const userPasswordReset = createWrapper();
    const messageStore = useMessageStore();

    // Arrange: mock successful API response.
    vi.mocked(backendApiUser.passwordResetConfirm).mockResolvedValue({ data: {} } as any);

    // Arrange: fill form fields correctly.
    await userPasswordReset.find('[data-testid="password"]').setValue('n3wP@s5w0rD');
    await userPasswordReset.find('[data-testid="confirmPassword"]').setValue('n3wP@s5w0rD');

    // Act: click on password reset confirmation button.
    await userPasswordReset.find('button[type="submit"]').trigger('submit');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: verify API call.
    expect(backendApiUser.passwordResetConfirm).toHaveBeenCalledWith(expect.objectContaining({
      token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs',
      password: 'n3wP@s5w0rD'
    }));

    // Assert: verify success message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Success);
    expect(messageStore.messages[0].title).toBe("Success");
    expect(messageStore.messages[0].content).toBe("New password was set successfully.");

    // Assert: verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
  });

  it('shows error message when server returns 404 error', async () => {
    // Arrange: mock API returning 404 error.
    const errorResponse = {
      isAxiosError: true,
      response: {
        status: 404,
        data: {
          "detail": "Token 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs' does not exist.",
          "instance": "/api/users/password/confirm",
          "status": 404,
          "title": "User token is missing.",
          "type": "https://api.userland.org/errors/user/token/missing",
          "errCode": "user_0012"
        }
      }
    };
    vi.mocked(backendApiUser.passwordResetConfirm).mockRejectedValue(errorResponse);

    const userPasswordReset = createWrapper();
    const messageStore = useMessageStore();

    // Arrange: fill form fields correctly.
    await userPasswordReset.find('[data-testid="password"]').setValue('n3wP@s5w0rD');
    await userPasswordReset.find('[data-testid="confirmPassword"]').setValue('n3wP@s5w0rD');

    // Act: click on password reset confirmation button.
    await userPasswordReset.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify API was called.
    expect(backendApiUser.passwordResetConfirm).toHaveBeenCalled();

    // Assert: verify error message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Failure");
    expect(messageStore.messages[0].content).toBe("Token is missing.");

    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  //

  it('form is empty', async () => {
    const userPasswordReset = createWrapper();
    const messageStore = useMessageStore();

    // No arrange here - form is untouched.

    // Act: click on password reset confirmation button while form is completely empty.
    await userPasswordReset.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify that error messages properly shown up for all fields.
    const errorMessages = userPasswordReset.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(2);
    errorMessages.forEach(msg => {
      expect(msg.text()).not.toBe('');
    });

    // Assert: verify API was not called.
    expect(backendApiUser.passwordResetConfirm).not.toHaveBeenCalled();
    // Assert: verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    const userPasswordReset = createWrapper();
    const messageStore = useMessageStore();

    // Arrange: fill form fields with mismatching passwords.
    await userPasswordReset.find('[data-testid="password"]').setValue('Password123!');
    await userPasswordReset.find('[data-testid="confirmPassword"]').setValue('Different123!');

    // Act: click on password reset confirmation button.
    await userPasswordReset.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify that error message is shown for confirmPassword.
    expect(userPasswordReset.find('#confirmPassword').classes()).toContain('err');
    const errorMessages = userPasswordReset.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0].text()).not.toBe('');

    // Assert: verify API was not called.
    expect(backendApiUser.passwordResetConfirm).not.toHaveBeenCalled();
    // Assert: verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('fails when no token is provided', async () => {
    // Arrange: set token to undefined for this test.
    mockRoute.query.token = undefined as any;

    // Act: create page. Yes, it is enough here, as it will do stuff on mount already.
    // oxlint-disable-next-line no-unused-vars
    const userPasswordReset = createWrapper();
    const messageStore = useMessageStore();

    await flushPromises();

    // Assert: verify API call was NOT made.
    expect(backendApiUser.passwordResetConfirm).not.toHaveBeenCalled();

    // Assert: verify failure message.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Failure);
    expect(messageStore.messages[0].title).toBe("Invalid token");
    expect(messageStore.messages[0].content).toBe("No token provided or it is malformed.");

    // Assert: verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
  });
});
