/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n';
import { logger } from '@/code/utils/logger';
import { useMessageStore } from '@/stores/messages';
import backendApiUser from '@/services/features/api-users';

import { EnMessageLevel } from '@/code/messages/types';
import UserRegistration from '@/components/pages/user/UserRegistration.vue';

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    register: vi.fn<typeof backendApiUser.register>(),
  },
}));

const mockPush = vi.fn<(to: any) => void>();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

/** Boilerplate code. */
function createWrapper() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(UserRegistration, {
    global: {
      plugins: [logger, pinia, i18n],
    },
  });
}

/** Tests of UserRegistration component. */
describe('UserRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is correctly filled and submits successfully', async () => {
    const userRegistration = createWrapper();
    const messageStore = useMessageStore();

    // Mock successful API response.
    vi.mocked(backendApiUser.register).mockResolvedValue({ data: {} } as any);

    // Fill form fields
    await userRegistration.find('[data-testid="username"]').setValue('testuser');
    await userRegistration.find('[data-testid="email"]').setValue('test@example.com');
    await userRegistration.find('[data-testid="password"]').setValue('Password123!');
    await userRegistration.find('[data-testid="confirmPassword"]').setValue('Password123!');
    // Click on registration button.
    await userRegistration.find('button[type="submit"]').trigger('submit');

    // Wait for all promises (API call) to resolve.
    await flushPromises();

    // Verify API call.
    expect(backendApiUser.register).toHaveBeenCalledWith(expect.objectContaining({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    }));

    // Verify success message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Success);

    // Verify redirection to login page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
  });

  it('shows error message when server returns 500 error', async () => {
    const userRegistration = createWrapper();
    const messageStore = useMessageStore();

    // Mock API returning 500 error.
    const errorResponse = {
      isAxiosError: true,
      response: {
        status: 500,
        data: {}
      }
    };
    vi.mocked(backendApiUser.register).mockRejectedValue(errorResponse);

    // Fill form fields properly.
    await userRegistration.find('[data-testid="username"]').setValue('testuser');
    await userRegistration.find('[data-testid="email"]').setValue('test@example.com');
    await userRegistration.find('[data-testid="password"]').setValue('Password123!');
    await userRegistration.find('[data-testid="confirmPassword"]').setValue('Password123!');

    // Click on registration button.
    await userRegistration.find('button[type="submit"]').trigger('submit');

    // Wait for all promises to resolve.
    await flushPromises();

    // Verify API was called.
    expect(backendApiUser.register).toHaveBeenCalled();

    // Verify error message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Internal server error");
    expect(messageStore.messages[0].content).toBe("The server has encountered a situation it does not know how to handle.");

    // Verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  //

  it('is empty', async () => {
    const userRegistration = createWrapper();
    const messageStore = useMessageStore();

    // Click on registration button while form is completely empty.
    await userRegistration.find('button[type="submit"]').trigger('submit');

    // Wait for all promises to resolve.
    await flushPromises();

    // Verify that error messages properly shown up for all fields.
    const errorMessages = userRegistration.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(4);
    errorMessages.forEach(msg => {
      expect(msg.text()).not.toBe('');
    });

    // Verify API was not called.
    expect(backendApiUser.register).not.toHaveBeenCalled();
    // Verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
  });

  it('shows error when passwords do not match', async () => {
    const userRegistration = createWrapper();
    const messageStore = useMessageStore();

    // Fill form fields with mismatching passwords.
    await userRegistration.find('[data-testid="username"]').setValue('testuser');
    await userRegistration.find('[data-testid="email"]').setValue('test@example.com');
    await userRegistration.find('[data-testid="password"]').setValue('Password123!');
    await userRegistration.find('[data-testid="confirmPassword"]').setValue('Different123!');

    // Click on registration button.
    await userRegistration.find('button[type="submit"]').trigger('submit');

    // Wait for all promises to resolve.
    await flushPromises();

    // Verify that error message is shown for confirmPassword.
    expect(userRegistration.find('#confirmPassword').classes()).toContain('err');
    const errorMessages = userRegistration.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0].text()).not.toBe('');

    // Verify API was not called.
    expect(backendApiUser.register).not.toHaveBeenCalled();
    // Verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
  });

  it('shows error when invalid email is entered', async () => {
    const userRegistration = createWrapper();
    const messageStore = useMessageStore();

    // Fill form fields with invalid email.
    await userRegistration.find('[data-testid="username"]').setValue('testuser');
    await userRegistration.find('[data-testid="email"]').setValue('invalid-email');
    await userRegistration.find('[data-testid="password"]').setValue('Password123!');
    await userRegistration.find('[data-testid="confirmPassword"]').setValue('Password123!');

    // Click on registration button.
    await userRegistration.find('button[type="submit"]').trigger('submit');

    // Wait for all promises to resolve.
    await flushPromises();

    // Verify that error message is shown for email.
    expect(userRegistration.find('#email').classes()).toContain('err');
    const errorMessages = userRegistration.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0].text()).not.toBe('');

    // Verify API was not called.
    expect(backendApiUser.register).not.toHaveBeenCalled();
    // Verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
  });
});
