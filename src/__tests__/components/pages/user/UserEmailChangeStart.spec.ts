/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia, getActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserEmailChangeStart from '@/components/pages/user/UserEmailChangeStart.vue';

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    emailChangeLink: vi.fn<typeof backendApiUser.emailChangeLink>(),
  },
}));

const mockPush = vi.fn<(to: any) => void>();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, }),
}));

/** Boilerplate code. */
function createWrapper() {
  return mount(UserEmailChangeStart, {
    global: {
      plugins: [logger, getActivePinia(), i18n],
    },
  });
}

/** Tests of UserEmailChangeStart component. */
describe('UserEmailChangeStart', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('is correctly filled and submits successfully', async () => {
    const userEmailChangeStart = createWrapper();
    const messageStore = useMessageStore();

    // Arrange: mock successful API response.
    vi.mocked(backendApiUser.emailChangeLink).mockResolvedValue({ data: {} } as any);

    // Arrange: fill form fields correctly.
    await userEmailChangeStart.find('[data-testid="newEmail"]').setValue('test@example.com');
    await userEmailChangeStart.find('[data-testid="password"]').setValue('5trOnGP@ssw0rd');

    // Act: click on email change link button.
    await userEmailChangeStart.find('button[type="submit"]').trigger('submit');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: verify API call.
    expect(backendApiUser.emailChangeLink).toHaveBeenCalledWith(expect.objectContaining({
      newEmail: 'test@example.com',
      password: '5trOnGP@ssw0rd'
    }));

    // Assert: verify success message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Success);
    expect(messageStore.messages[0].title).toBe("Success");
    expect(messageStore.messages[0].content).toBe("Check your inbox in a few minutes for a email with link to confirm email address change.");

    // Assert: verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
  });

  it('shows error message when server returns 409 error', async () => {
    // Arrange: mock API returning 409 error.
    const errorResponse = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          "detail": "Token of type 'EMAIL' already exists and is still valid. You cannot do this action twice in row.",
          "instance": "/api/users/email/link",
          "status": 409,
          "title": "Required token already exists.",
          "type": "https://api.userland.org/errors/user/doesNotExist",
          "errCode": "user_0013"
        }
      }
    };
    vi.mocked(backendApiUser.emailChangeLink).mockRejectedValue(errorResponse);

    const userEmailChangeStart = createWrapper();
    const messageStore = useMessageStore();

    // Arrange: fill form fields correctly.
    await userEmailChangeStart.find('[data-testid="newEmail"]').setValue('test@example.com');
    await userEmailChangeStart.find('[data-testid="password"]').setValue('5trOnGP@ssw0rd');

    // Act: click on email change button.
    await userEmailChangeStart.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify API was called.
    expect(backendApiUser.emailChangeLink).toHaveBeenCalled();

    // Assert: verify error message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Failure");
    expect(messageStore.messages[0].content).toBe("Token already exists.");

    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  //

  it('form is empty', async () => {
    const userEmailChangeStart = createWrapper();
    const messageStore = useMessageStore();

    // No arrange here - form is untouched.

    // Act: click on email change link button while form is completely empty.
    await userEmailChangeStart.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify that error messages properly shown up for all fields.
    const errorMessages = userEmailChangeStart.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(2);
    errorMessages.forEach(msg => {
      expect(msg.text()).not.toBe('');
    });

    // Assert: verify API was not called.
    expect(backendApiUser.emailChangeLink).not.toHaveBeenCalled();
    // Assert: verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows error when invalid email is entered', async () => {
    const userEmailChangeStart = createWrapper();
    const messageStore = useMessageStore();

    // Arrange: fill form fields.
    await userEmailChangeStart.find('[data-testid="newEmail"]').setValue('invalid-email');
    await userEmailChangeStart.find('[data-testid="password"]').setValue('5trOnGP@ssw0rd');

    // Act: click on email change link button.
    await userEmailChangeStart.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify that error message is shown for email.
    expect(userEmailChangeStart.find('#newEmail').classes()).toContain('err');
    const errorMessages = userEmailChangeStart.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0].text()).not.toBe('');

    // Assert: verify API was not called.
    expect(backendApiUser.emailChangeLink).not.toHaveBeenCalled();
    // Assert: verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows error when invalid password is entered', async () => {
    const userEmailChangeStart = createWrapper();
    const messageStore = useMessageStore();

    // Arrange: fill form fields.
    await userEmailChangeStart.find('[data-testid="newEmail"]').setValue('test@example.com');
    await userEmailChangeStart.find('[data-testid="password"]').setValue('badPassword');

    // Act: click on email change link button.
    await userEmailChangeStart.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify that error message is shown for email.
    expect(userEmailChangeStart.find('#password').classes()).toContain('err');
    const errorMessages = userEmailChangeStart.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0].text()).not.toBe('');

    // Assert: verify API was not called.
    expect(backendApiUser.emailChangeLink).not.toHaveBeenCalled();
    // Assert: verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });
});
