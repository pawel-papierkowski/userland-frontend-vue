/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserAccountDeletionStart from '@/components/pages/user/UserAccountDeletionStart.vue';

let pinia: ReturnType<typeof createPinia>;

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    accountDeleteLink: vi.fn<typeof backendApiUser.accountDeleteLink>(),
  },
}));

const mockPush = vi.fn<(to: any) => void>();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

/** Convenience function to create component. */
function createComponent() {
  return mount(UserAccountDeletionStart, {
    global: {
      plugins: [logger, pinia, i18n],
    },
  });
}

/** Tests of UserAccountDeletionStart component. */
describe('UserAccountDeletionStart', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  // //////////////////////////////////////////////////////////////////////////
  // API interaction

  describe('api', () => {
    it('submits successfully and redirects home', async () => {
      // Ensures that after a successful account-deletion-link request the
      // user gets feedback and is redirected.

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Arrange: mock successful API response.
      vi.mocked(backendApiUser.accountDeleteLink).mockResolvedValue({ data: {} } as any);

      // Arrange: fill form.
      await wrapper.find('[data-testid="password"]').setValue('5trOnGP@ssw0rd');

      // Act: submit.
      await wrapper.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: verify API call with exact payload.
      expect(backendApiUser.accountDeleteLink).toHaveBeenCalledWith({
        password: '5trOnGP@ssw0rd',
        frontend: 'VUE',
      });

      // Assert: verify success message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Success);
      expect(messageStore.messages[0]?.title).toBe('Success');
      expect(messageStore.messages[0]?.content).toBe(
        'Check your inbox in a few minutes for a email with link to confirm your account deletion.',
      );

      // Assert: verify redirection.
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
    });

    it('shows error, clears form, and does not redirect on API failure', async () => {
      // Ensures that after a failed API call the form is cleared, an error
      // message appears, and the user stays on the page.

      // Arrange: mock API returning 409 error.
      const errorResponse = {
        isAxiosError: true,
        response: {
          status: 409,
          data: {
            detail: "Token of type 'DELETE' already exists and is still valid. You cannot do this action twice in row.",
            instance: '/api/users/delete/link',
            status: 409,
            title: 'Required token already exists.',
            type: 'https://api.userland.org/errors/user/doesNotExist',
            errCode: 'user_0013',
          },
        },
      };
      vi.mocked(backendApiUser.accountDeleteLink).mockRejectedValue(errorResponse);

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Arrange: fill form.
      await wrapper.find('[data-testid="password"]').setValue('5trOnGP@ssw0rd');

      // Act: submit.
      await wrapper.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: verify API was called.
      expect(backendApiUser.accountDeleteLink).toHaveBeenCalled();

      // Assert: verify error message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Error);
      expect(messageStore.messages[0]?.title).toBe('Failure');
      expect(messageStore.messages[0]?.content).toBe('User token already exists.');

      // Assert: form field is cleared (clearForm behaviour).
      const passwordInput = wrapper.find('[data-testid="password"]') as any;
      expect(passwordInput.element.value).toBe('');

      // Assert: verify no redirection.
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Client-side validation

  describe('validation', () => {
    it('blocks submission and shows error when form is empty', async () => {
      // Client-side validation: empty password field should show an error
      // and prevent API call.

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Act: submit empty form.
      await wrapper.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: error is shown.
      const errorMessages = wrapper.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(1);
      expect(errorMessages[0]?.text()).toBe('Field cannot be empty.');

      // Assert: API was not called.
      expect(backendApiUser.accountDeleteLink).not.toHaveBeenCalled();
      // Assert: no messages in store.
      expect(messageStore.messages).toHaveLength(0);
      // Assert: no redirection.
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('blocks submission when password is weak (no digit)', async () => {
      // Client-side validation: weak password should be rejected.

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Arrange: fill with a password missing a digit.
      await wrapper.find('[data-testid="password"]').setValue('Abcdefgh@');

      // Act: submit.
      await wrapper.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: error is shown on password field.
      expect(wrapper.find('#password').classes()).toContain('err');
      const errorMessages = wrapper.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(1);
      expect(errorMessages[0]?.text()).toBe(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      );

      // Assert: API was not called.
      expect(backendApiUser.accountDeleteLink).not.toHaveBeenCalled();
      // Assert: no messages in store.
      expect(messageStore.messages).toHaveLength(0);
      // Assert: no redirection.
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows errors eagerly after first submit attempt', async () => {
      // After the first submission attempt usedButton is set to true, so
      // validation errors appear immediately as the user types.

      const wrapper = createComponent();

      // Act: submit empty form to set usedButton = true.
      await wrapper.find('button[type="submit"]').trigger('submit');
      await flushPromises();

      // The password field should show an error.
      expect(wrapper.findAll('.form-text-error')).toHaveLength(1);

      // Now type a short password — error should appear immediately.
      await wrapper.find('[data-testid="password"]').setValue('Ab1@');

      // Assert: error shows eagerly.
      const passwordErrorSpan = wrapper.find('#password + span.form-text-error');
      expect(passwordErrorSpan.exists()).toBe(true);
      expect(passwordErrorSpan.text()).toBe('Password is too short. It must have at least 8 characters.');
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
      expect(wrapper.find('h2').text()).toBe('Delete account');
    });

    it('renders a form with a password field', () => {
      // The form should have a password input.

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Password input exists.
      expect(wrapper.find('#password').exists()).toBe(true);
    });

    it('renders submit button with default label', () => {
      // The submit button shows the default text before submission starts.

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Button shows "Send email".
      expect(wrapper.find('button[type="submit"]').text()).toBe('Send email');
    });
  });
});
