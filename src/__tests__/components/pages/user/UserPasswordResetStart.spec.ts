import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import type { AxiosResponse } from 'axios';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { EnMessageLevel } from '@/code/wrappers/messages/types.ts';
import UserPasswordResetStart from '@/components/pages/user/UserPasswordResetStart.vue';

let pinia: ReturnType<typeof createPinia>;

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    passwordResetLink: vi.fn<typeof backendApiUser.register>(),
  },
}));

const mockPush = vi.fn<(to: string) => void>();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

/** Convenience function to create component. */
function createComponent() {
  return mount(UserPasswordResetStart, {
    global: {
      plugins: [logger, pinia, i18n],
    },
  });
}

/** Tests of UserPasswordResetStart component. */
describe('UserPasswordResetStart', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  // //////////////////////////////////////////////////////////////////////////
  // API interaction

  describe('api', () => {
    it('submits successfully and redirects home', async () => {
      // Ensures that after a successful password-reset-link request the user
      // gets feedback and is redirected.

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Arrange: Mock successful API response.
      vi.mocked(backendApiUser.passwordResetLink).mockResolvedValue({ data: {} } as AxiosResponse);

      // Arrange: Fill form.
      await wrapper.find('[data-testid="email"]').setValue('test@example.com');

      // Act: Submit.
      await wrapper.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: Verify API call with exact payload.
      expect(backendApiUser.passwordResetLink).toHaveBeenCalledWith({
        email: 'test@example.com',
        frontend: 'VUE',
      });

      // Assert: Verify success message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Success);
      expect(messageStore.messages[0]?.title).toBe('Success');
      expect(messageStore.messages[0]?.content).toBe(
        'Check your inbox in a few minutes for a email with link to password change.',
      );

      // Assert: Verify redirection.
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
    });

    it('shows error and does not redirect on API failure', async () => {
      // Ensures that after a failed API call the user gets an error message
      // and stays on the page.

      // Arrange: Mock API returning 404 error.
      const errorResponse = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            detail: "User with email 'test@example.com' does not exist.",
            instance: '/api/users/password/link',
            status: 404,
            title: 'User cannot be found.',
            type: 'https://api.userland.org/errors/user/doesNotExist',
            errCode: 'user_0001',
          },
        },
      };
      vi.mocked(backendApiUser.passwordResetLink).mockRejectedValue(errorResponse);

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Arrange: Fill form.
      await wrapper.find('[data-testid="email"]').setValue('test@example.com');

      // Act: Submit.
      await wrapper.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: Verify API was called.
      expect(backendApiUser.passwordResetLink).toHaveBeenCalled();

      // Assert: Verify error message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Error);
      expect(messageStore.messages[0]?.title).toBe('Failure');
      expect(messageStore.messages[0]?.content).toBe('User not found.');

      // Assert: Verify no redirection.
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Client-side validation

  describe('validation', () => {
    it('blocks submission and shows error when form is empty', async () => {
      // Client-side validation: empty email field should show an error and
      // prevent API call.

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Act: Submit empty form.
      await wrapper.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: Error is shown.
      const errorMessages = wrapper.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(1);
      expect(errorMessages[0]?.text()).toBe('Field cannot be empty.');

      // Assert: API was not called.
      expect(backendApiUser.passwordResetLink).not.toHaveBeenCalled();
      // Assert: No messages in store.
      expect(messageStore.messages).toHaveLength(0);
      // Assert: No redirection.
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('blocks submission when email is invalid', async () => {
      // Client-side validation: malformed email should show an error.

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Arrange: Fill with invalid email.
      await wrapper.find('[data-testid="email"]').setValue('invalid-email');

      // Act: Submit.
      await wrapper.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: Error is shown on email field.
      expect(wrapper.find('#email').classes()).toContain('err');
      const errorMessages = wrapper.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(1);
      expect(errorMessages[0]?.text()).toBe('Need to enter correct email.');

      // Assert: API was not called.
      expect(backendApiUser.passwordResetLink).not.toHaveBeenCalled();
      // Assert: No messages in store.
      expect(messageStore.messages).toHaveLength(0);
      // Assert: No redirection.
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows errors eagerly after first submit attempt', async () => {
      // After the first submission attempt usedButton is set to true, so
      // validation errors appear immediately as the user types.

      const wrapper = createComponent();

      // Act: Submit empty form to set usedButton = true.
      await wrapper.find('button[type="submit"]').trigger('submit');
      await flushPromises();

      // The email field should show an error.
      const errorMessages = wrapper.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(1);

      // Now type an invalid email — error should appear immediately.
      await wrapper.find('[data-testid="email"]').setValue('bad');

      // Assert: Error shows eagerly.
      expect(errorMessages[0]?.exists()).toBe(true);
      expect(errorMessages[0]?.text()).toBe('Need to enter correct email.');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Rendering

  describe('render', () => {
    it('renders the heading', () => {
      // The page should display a title.

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Title is present.
      expect(wrapper.find('h2').text()).toBe('I forgot my password');
    });

    it('renders a form with an email field', () => {
      // The form should have an email input.

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Email input exists.
      expect(wrapper.find('#email').exists()).toBe(true);
    });

    it('renders submit button with default label', () => {
      // The submit button shows the default text before submission starts.

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Button shows the correct text.
      expect(wrapper.find('button[type="submit"]').text()).toBe('Send email');
    });
  });
});
