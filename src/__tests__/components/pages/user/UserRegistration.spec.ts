/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserRegistration from '@/components/pages/user/UserRegistration.vue';

let pinia: ReturnType<typeof createPinia>;

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    register: vi.fn<typeof backendApiUser.register>(),
  },
}));

const mockPush = vi.fn<(to: any) => void>();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

/** Boilerplate code. */
function createComponent() {
  return mount(UserRegistration, {
    global: {
      plugins: [logger, pinia, i18n],
    },
  });
}

/** Tests of UserRegistration component. */
describe('UserRegistration', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('is correctly filled and submits successfully', async () => {
    // Ensures that after successful registration user gets feedback and redirection.

    const userRegistration = createComponent();
    const messageStore = useMessageStore();

    // Arrange: mock successful API response.
    vi.mocked(backendApiUser.register).mockResolvedValue({ data: {} } as any);

    // Arrange: fill form fields correctly.
    await userRegistration.find('[data-testid="username"]').setValue('testuser');
    await userRegistration.find('[data-testid="email"]').setValue('test@example.com');
    await userRegistration.find('[data-testid="password"]').setValue('Password123!');
    await userRegistration.find('[data-testid="confirmPassword"]').setValue('Password123!');

    // Act: click on registration button.
    await userRegistration.find('button[type="submit"]').trigger('submit');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: verify API call.
    expect(backendApiUser.register).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        lang: 'en',
        frontend: 'VUE',
      }),
    );

    // Assert: verify success message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Success);
    expect(messageStore.messages[0]?.title).toBe('User registered successfully');
    expect(messageStore.messages[0]?.content).toBe(
      'Please check your mailbox. You will need to confirm registration by clicking on link in email.',
    );

    // Assert: verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
  });

  it('shows error message when server returns 500 error', async () => {
    // Ensures that after failed registration user gets feedback.

    // Arrange: mock API returning 500 error.
    const errorResponse = {
      isAxiosError: true,
      response: {
        status: 500,
        data: {},
      },
    };
    vi.mocked(backendApiUser.register).mockRejectedValue(errorResponse);

    const userRegistration = createComponent();
    const messageStore = useMessageStore();

    // Arrange: fill form fields correctly.
    await userRegistration.find('[data-testid="username"]').setValue('testuser');
    await userRegistration.find('[data-testid="email"]').setValue('test@example.com');
    await userRegistration.find('[data-testid="password"]').setValue('Password123!');
    await userRegistration.find('[data-testid="confirmPassword"]').setValue('Password123!');

    // Act: click on registration button.
    await userRegistration.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify API was called.
    expect(backendApiUser.register).toHaveBeenCalled();

    // Assert: verify error message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0]?.title).toBe('Internal server error');
    expect(messageStore.messages[0]?.content).toBe(
      'The server has encountered a situation it does not know how to handle.',
    );

    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  //

  it('form is empty', async () => {
    // Ensures that after failed registration user gets feedback.

    const userRegistration = createComponent();
    const messageStore = useMessageStore();

    // No arrange here - form is untouched.

    // Act: click on registration button while form is completely empty.
    await userRegistration.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify that error messages properly shown up for all fields.
    const errorMessages = userRegistration.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(4);
    errorMessages.forEach((msg) => {
      expect(msg.text()).not.toBe('');
    });

    // Assert: verify API was not called.
    expect(backendApiUser.register).not.toHaveBeenCalled();
    // Assert: verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    // Ensures that after failed registration user gets feedback.

    const userRegistration = createComponent();
    const messageStore = useMessageStore();

    // Arrange: fill form fields with mismatching passwords.
    await userRegistration.find('[data-testid="username"]').setValue('testuser');
    await userRegistration.find('[data-testid="email"]').setValue('test@example.com');
    await userRegistration.find('[data-testid="password"]').setValue('Password123!');
    await userRegistration.find('[data-testid="confirmPassword"]').setValue('Different123!');

    // Act: click on registration button.
    await userRegistration.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify that error message is shown for confirmPassword.
    expect(userRegistration.find('#confirmPassword').classes()).toContain('err');
    const errorMessages = userRegistration.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0]?.text()).not.toBe('');

    // Assert: verify API was not called.
    expect(backendApiUser.register).not.toHaveBeenCalled();
    // Assert: verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows error when invalid email is entered', async () => {
    // Ensures that after failed registration user gets feedback.

    const userRegistration = createComponent();
    const messageStore = useMessageStore();

    // Arrange: fill form fields with invalid email.
    await userRegistration.find('[data-testid="username"]').setValue('testuser');
    await userRegistration.find('[data-testid="email"]').setValue('invalid-email');
    await userRegistration.find('[data-testid="password"]').setValue('Password123!');
    await userRegistration.find('[data-testid="confirmPassword"]').setValue('Password123!');

    // Act: click on registration button.
    await userRegistration.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: verify that error message is shown for email.
    expect(userRegistration.find('#email').classes()).toContain('err');
    const errorMessages = userRegistration.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0]?.text()).not.toBe('');

    // Assert: verify API was not called.
    expect(backendApiUser.register).not.toHaveBeenCalled();
    // Assert: verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });
});
