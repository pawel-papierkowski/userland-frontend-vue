/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { EnMessageLevel } from '@/code/messages/types.ts';
import UserLogin from '@/components/pages/user/UserLogin.vue';

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    login: vi.fn<typeof backendApiUser.login>(),
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
  return mount(UserLogin, {
    global: {
      plugins: [logger, pinia, i18n],
    },
  });
}

/** Tests of UserLogin component. */
describe('UserLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is correctly filled and submits successfully', async () => {
    const userLogin = createWrapper();
    const messageStore = useMessageStore();

    // Mock successful API response.
    vi.mocked(backendApiUser.login).mockResolvedValue({ data: {
      "jwtToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYWRlci5sZXZhcEBnbWFpbC5jb20iLCJpYXQiOjE3NzkwMzYwNTIsImV4cCI6MTc3OTA1NzY1Mn0.RV0mYMnyhQGLBDnDybK6CM0gA_AV48tGY21Xoxdj6Hk"
    } } as any);

    // Fill form fields correctly.
    await userLogin.find('[data-testid="email"]').setValue('test@example.com');
    await userLogin.find('[data-testid="password"]').setValue('Password123!');
    // Click on login button.
    await userLogin.find('button[type="submit"]').trigger('submit');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Verify API call.
    expect(backendApiUser.login).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com',
      password: 'Password123!'
    }));

    // Verify success message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Success);

    // Verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });

    // TODO Verify that jwt store is filled correctly (in other words, frontend considers you logged in).
  });

  it('shows error message when server returns 409 error', async () => {
    // Mock API returning 409 error (wrong password or account).
    const errorResponse = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          detail: "Wrong password or account was used. Access denied.",
          instance: "/api/users/login",
          status: 409,
          title: "Wrong password or account.",
          type: "https://api.userland.org/errors/user/wrongPassword",
          errCode: "user_0112"
        }
      }
    };
    vi.mocked(backendApiUser.login).mockRejectedValue(errorResponse);

    const userLogin = createWrapper();
    const messageStore = useMessageStore();

    // Fill form fields correctly.
    await userLogin.find('[data-testid="email"]').setValue('test@example.com');
    await userLogin.find('[data-testid="password"]').setValue('Password123!');

    // Click on login button.
    await userLogin.find('button[type="submit"]').trigger('submit');

    // Wait for all promises to resolve.
    await flushPromises();

    // Verify API was called.
    expect(backendApiUser.login).toHaveBeenCalled();

    // Verify error message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Failure");
    expect(messageStore.messages[0].content).toBe("Invalid password or account.");

    // Verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  //

  it('is empty', async () => {
    const userLogin = createWrapper();
    const messageStore = useMessageStore();

    // Click on login button while form is completely empty.
    await userLogin.find('button[type="submit"]').trigger('submit');

    // Wait for all promises to resolve.
    await flushPromises();

    // Verify that error messages properly shown up for all fields.
    const errorMessages = userLogin.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(2);
    errorMessages.forEach(msg => {
      expect(msg.text()).not.toBe('');
    });

    // Verify API was not called.
    expect(backendApiUser.login).not.toHaveBeenCalled();
    // Verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
  });

  it('shows error when invalid email is entered', async () => {
    const userLogin = createWrapper();
    const messageStore = useMessageStore();

    // Fill form fields with invalid email.
    await userLogin.find('[data-testid="email"]').setValue('invalid-email');
    await userLogin.find('[data-testid="password"]').setValue('Password123!');

    // Click on login button.
    await userLogin.find('button[type="submit"]').trigger('submit');

    // Wait for all promises to resolve.
    await flushPromises();

    // Verify that error message is shown for email.
    expect(userLogin.find('#email').classes()).toContain('err');
    const errorMessages = userLogin.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0].text()).not.toBe('');

    // Verify API was not called.
    expect(backendApiUser.login).not.toHaveBeenCalled();
    // Verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
  });
});
