/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserPasswordResetLink from '@/components/pages/user/UserPasswordResetLink.vue';

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    passwordResetLink: vi.fn<typeof backendApiUser.register>(),
  },
}));

const mockPush = vi.fn<(to: any) => void>();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, }),
}));

/** Boilerplate code. */
function createWrapper() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(UserPasswordResetLink, {
    global: {
      plugins: [logger, pinia, i18n],
    },
  });
}

/** Tests of UserPasswordResetLink component. */
describe('UserPasswordResetLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is correctly filled and submits successfully', async () => {
    const userPasswordResetLink = createWrapper();
    const messageStore = useMessageStore();

    // Arrange: mock successful API response.
    vi.mocked(backendApiUser.passwordResetLink).mockResolvedValue({ data: {} } as any);

    // Arrange: fill form fields correctly.
    await userPasswordResetLink.find('[data-testid="email"]').setValue('test@example.com');

    // Act: click on password reset link button.
    await userPasswordResetLink.find('button[type="submit"]').trigger('submit');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: verify API call.
    expect(backendApiUser.passwordResetLink).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com'
    }));

    // Assert: verify success message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Success);
    expect(messageStore.messages[0].title).toBe("Success");
    expect(messageStore.messages[0].content).toBe("In few minutes email with link leading to password reset form will be sent.");

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
          "detail": "User with email 'test@example.com' does not exist.",
          "instance": "/api/users/password/link",
          "status": 404,
          "title": "User cannot be found.",
          "type": "https://api.userland.org/errors/user/doesNotExist",
          "errCode": "user_0001"
        }
      }
    };
    vi.mocked(backendApiUser.passwordResetLink).mockRejectedValue(errorResponse);

    const userPasswordResetLink = createWrapper();
    const messageStore = useMessageStore();

    // Arrange: fill form fields correctly.
    await userPasswordResetLink.find('[data-testid="email"]').setValue('test@example.com');

    // Act: click on password reset button.
    await userPasswordResetLink.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify API was called.
    expect(backendApiUser.passwordResetLink).toHaveBeenCalled();

    // Assert: verify error message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Failure");
    expect(messageStore.messages[0].content).toBe("User not found.");

    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  //

  it('is empty', async () => {
    const userPasswordResetLink = createWrapper();
    const messageStore = useMessageStore();

    // No arrange here - form is untouched.

    // Act: click on password reset link button while form is completely empty.
    await userPasswordResetLink.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify that error messages properly shown up for all fields.
    const errorMessages = userPasswordResetLink.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(1);
    errorMessages.forEach(msg => {
      expect(msg.text()).not.toBe('');
    });

    // Assert: verify API was not called.
    expect(backendApiUser.passwordResetLink).not.toHaveBeenCalled();
    // Assert: verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows error when invalid email is entered', async () => {
    const userPasswordResetLink = createWrapper();
    const messageStore = useMessageStore();

    // Arrange: fill form fields with invalid email.
    await userPasswordResetLink.find('[data-testid="email"]').setValue('invalid-email');

    // Act: click on password reset link button.
    await userPasswordResetLink.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify that error message is shown for email.
    expect(userPasswordResetLink.find('#email').classes()).toContain('err');
    const errorMessages = userPasswordResetLink.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0].text()).not.toBe('');

    // Assert: verify API was not called.
    expect(backendApiUser.passwordResetLink).not.toHaveBeenCalled();
    // Assert: verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });
});
