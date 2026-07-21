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

let pinia: ReturnType<typeof createPinia>;

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    passwordResetConfirm: vi.fn<typeof backendApiUser.passwordResetConfirm>(),
  },
}));

const mockPush = vi.fn<(to: any) => void>();
const mockRoute = {
  query: {
    token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs',
  },
};

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute,
}));

/** Convenience function to create component. */
function createComponent() {
  return mount(UserPasswordReset, {
    global: {
      plugins: [logger, pinia, i18n],
    },
  });
}

/** Tests of UserPasswordReset component. */
describe('UserPasswordReset', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
    mockRoute.query.token = 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs';
  });

  // //////////////////////////////////////////////////////////////////////////
  // API interaction

  describe('api', () => {
    it('submits successfully and redirects to home', async () => {
      // Ensures that after successful password reset the user gets feedback
      // and is redirected to the home page.

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Arrange: Mock successful API response.
      vi.mocked(backendApiUser.passwordResetConfirm).mockResolvedValue({ data: {} } as any);

      // Arrange: Fill form fields correctly.
      await wrapper.find('[data-testid="password"]').setValue('n3wP@s5w0rD');
      await wrapper.find('[data-testid="confirmPassword"]').setValue('n3wP@s5w0rD');

      // Act: Submit form.
      await wrapper.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: Verify API call with exact payload.
      expect(backendApiUser.passwordResetConfirm).toHaveBeenCalledWith({
        token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs',
        password: 'n3wP@s5w0rD',
      });

      // Assert: Verify success message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Success);
      expect(messageStore.messages[0]?.title).toBe('Success');
      expect(messageStore.messages[0]?.content).toBe('New password was set successfully.');

      // Assert: Verify redirection to home page.
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
    });

    it('shows error, clears form, and does not redirect on API failure', async () => {
      // Ensures that after a failed API call the form is cleared, an error
      // message appears, and the user stays on the page.

      // Arrange: Mock API returning 404 error.
      const errorResponse = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            detail: "Token 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs' does not exist.",
            instance: '/api/users/password/confirm',
            status: 404,
            title: 'User token is missing.',
            type: 'https://api.userland.org/errors/user/token/missing',
            errCode: 'user_0011',
          },
        },
      };
      vi.mocked(backendApiUser.passwordResetConfirm).mockRejectedValue(errorResponse);

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Arrange: Fill form fields correctly.
      await wrapper.find('[data-testid="password"]').setValue('n3wP@s5w0rD');
      await wrapper.find('[data-testid="confirmPassword"]').setValue('n3wP@s5w0rD');

      // Act: Submit form.
      await wrapper.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: Verify API was called.
      expect(backendApiUser.passwordResetConfirm).toHaveBeenCalled();

      // Assert: Verify error message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Error);
      expect(messageStore.messages[0]?.title).toBe('Failure');
      expect(messageStore.messages[0]?.content).toBe('User token is missing.');

      // Assert: Form fields are cleared (clearForm behaviour).
      const passwordInput = wrapper.find('[data-testid="password"]') as any;
      const confirmInput = wrapper.find('[data-testid="confirmPassword"]') as any;
      expect(passwordInput.element.value).toBe('');
      expect(confirmInput.element.value).toBe('');

      // Assert: Verify no redirection occurred.
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Client-side validation

  describe('validation', () => {
    it('blocks submission and shows all errors when form is empty', async () => {
      // Client-side validation: empty form should show two error messages
      // and not call the API.

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Act: Submit empty form.
      await wrapper.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: both fields show errors.
      const errorMessages = wrapper.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(2);
      errorMessages.forEach((msg) => {
        expect(msg.text()).toBe('Field cannot be empty.');
      });

      // Assert: API was not called.
      expect(backendApiUser.passwordResetConfirm).not.toHaveBeenCalled();
      // Assert: No messages in store.
      expect(messageStore.messages).toHaveLength(0);
      // Assert: No redirection.
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('blocks submission when passwords do not match', async () => {
      // Client-side validation: mismatched passwords should show an error
      // only on the confirm-password field.

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Arrange: Fill form with mismatching passwords.
      await wrapper.find('[data-testid="password"]').setValue('Password123!');
      await wrapper.find('[data-testid="confirmPassword"]').setValue('Different123!');

      // Act: Submit.
      await wrapper.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: Error is on confirmPassword only.
      expect(wrapper.find('#confirmPassword').classes()).toContain('err');
      const errorMessages = wrapper.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(1);
      expect(errorMessages[0]?.text()).toBe('Passwords do not match.');

      // Assert: API was not called.
      expect(backendApiUser.passwordResetConfirm).not.toHaveBeenCalled();
      // Assert: No messages in store.
      expect(messageStore.messages).toHaveLength(0);
      // Assert: No redirection.
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('blocks submission when password is weak (no digit)', async () => {
      // Client-side validation: password that meets length requirements but
      // lacks a digit should be rejected.

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Arrange: Fill form with a password missing a digit.
      await wrapper.find('[data-testid="password"]').setValue('Abcdefgh@');
      await wrapper.find('[data-testid="confirmPassword"]').setValue('Abcdefgh@');

      // Act: Submit.
      await wrapper.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: Error is on password field.
      expect(wrapper.find('#password').classes()).toContain('err');
      const errorMessages = wrapper.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(1);
      expect(errorMessages[0]?.text()).toBe(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      );

      // Assert: API was not called.
      expect(backendApiUser.passwordResetConfirm).not.toHaveBeenCalled();
      // Assert: No messages in store.
      expect(messageStore.messages).toHaveLength(0);
      // Assert: No redirection.
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows errors eagerly after first submit attempt', async () => {
      // After the first submission attempt usedButton is set to true, so
      // validation errors appear immediately as the user types.

      const wrapper = createComponent();

      // Act: trigger a submit on an empty form to set usedButton = true.
      await wrapper.find('button[type="submit"]').trigger('submit');
      await flushPromises();

      // Both fields should show errors.
      const errorMessages = wrapper.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(2);

      // Now type a short password — error should appear immediately.
      await wrapper.find('[data-testid="password"]').setValue('Ab1@');

      // Assert: Password error shows eagerly.
      expect(errorMessages[0]?.exists()).toBe(true);
      expect(errorMessages[0]?.text()).toBe('Password is too short. It must have at least 8 characters.');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Token validation on mount

  describe('token-validation', () => {
    it('rejects missing token and redirects home', async () => {
      // When the URL has no token, the component should show a failure
      // message and navigate home without rendering the form.

      // Arrange: Set token to undefined.
      mockRoute.query.token = undefined as any;

      // Act: Create page — will check token on mount.
      createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: API was not called.
      expect(backendApiUser.passwordResetConfirm).not.toHaveBeenCalled();

      // Assert: Failure message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Failure);
      expect(messageStore.messages[0]?.title).toBe('Invalid token');
      expect(messageStore.messages[0]?.content).toBe('No token provided or it is malformed.');

      // Assert: Redirect to home.
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
    });

    it('rejects too-short token and redirects home', async () => {
      // Tokens shorter than 32 characters should be rejected as malformed.

      // Arrange: Set token to a short value.
      mockRoute.query.token = 'shortToken';

      // Act: Create page.
      createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: API was not called.
      expect(backendApiUser.passwordResetConfirm).not.toHaveBeenCalled();

      // Assert: Failure message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Failure);
      expect(messageStore.messages[0]?.title).toBe('Invalid token');

      // Assert: Redirect to home.
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Rendering

  describe('render', () => {
    it('renders the heading', () => {
      // The page should display a title describing the current action.

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Title is present.
      expect(wrapper.find('h2').text()).toBe('Set new password');
    });

    it('renders a form with two password fields', () => {
      // The form should have password and confirm-password inputs.

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Both inputs exist.
      expect(wrapper.find('#password').exists()).toBe(true);
      expect(wrapper.find('#confirmPassword').exists()).toBe(true);
    });

    it('renders submit button with default label', () => {
      // The submit button shows the default text before submission starts.

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Button shows "Set password".
      expect(wrapper.find('button[type="submit"]').text()).toBe('Set password');
    });
  });
});
