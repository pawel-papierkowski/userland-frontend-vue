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

/** Convenience function to create component. */
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

  // //////////////////////////////////////////////////////////////////////////
  // Submission

  describe('submission', () => {
    it('submits successfully with correct data', async () => {
      // Ensures that after successful registration user gets feedback and
      // redirection.

      const userRegistration = createComponent();
      const messageStore = useMessageStore();

      // Arrange: Mock successful API response.
      vi.mocked(backendApiUser.register).mockResolvedValue({ data: {} } as any);

      // Arrange: Fill form fields correctly.
      await userRegistration.find('[data-testid="username"]').setValue('testuser');
      await userRegistration.find('[data-testid="email"]').setValue('test@example.com');
      await userRegistration.find('[data-testid="password"]').setValue('Password123!');
      await userRegistration.find('[data-testid="confirmPassword"]').setValue('Password123!');

      // Act: Click on registration button.
      await userRegistration.find('button[type="submit"]').trigger('submit');

      await flushPromises(); // Wait for all promises (API call) to resolve.

      // Assert: Verify API call.
      expect(backendApiUser.register).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        isAdmin: false,
        lang: 'en',
        frontend: 'VUE',
      });

      // Assert: Verify success message is present in store.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Success);
      expect(messageStore.messages[0]?.title).toBe('User registered successfully');
      expect(messageStore.messages[0]?.content).toBe(
        'Please check your mailbox. You will need to confirm registration by clicking on link in email.',
      );

      // Assert: Verify redirection to home page.
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
    });

    it('shows error when server returns 500', async () => {
      // Ensures that after failed registration user gets feedback through the
      // AppMessager.

      // Arrange: Mock API returning 500 error.
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

      // Arrange: Fill form fields correctly.
      await userRegistration.find('[data-testid="username"]').setValue('testuser');
      await userRegistration.find('[data-testid="email"]').setValue('test@example.com');
      await userRegistration.find('[data-testid="password"]').setValue('Password123!');
      await userRegistration.find('[data-testid="confirmPassword"]').setValue('Password123!');

      // Act: Click on registration button.
      await userRegistration.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: Verify API was called.
      expect(backendApiUser.register).toHaveBeenCalled();

      // Assert: Verify error message is present in store.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Error);
      expect(messageStore.messages[0]?.title).toBe('Internal server error');
      expect(messageStore.messages[0]?.content).toBe(
        'The server has encountered a situation it does not know how to handle.',
      );

      // Assert: Verify no redirection occurred.
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Client-side validation

  describe('validation', () => {
    it('blocks submission and shows all errors when form is empty', async () => {
      // Client-side validation: empty form should show four error messages
      // and not call the API.

      const userRegistration = createComponent();
      const messageStore = useMessageStore();

      // No arrange here — form is untouched.

      // Act: Click on registration button while form is completely empty.
      await userRegistration.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: Verify that error messages properly shown up for all fields.
      const errorMessages = userRegistration.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(4);
      errorMessages.forEach((msg) => {
        expect(msg.text()).not.toBe('');
      });

      // Assert: Verify API was not called.
      expect(backendApiUser.register).not.toHaveBeenCalled();
      // Assert: Verify no messages are present in store.
      expect(messageStore.messages).toHaveLength(0);
      // Assert: Verify no redirection occurred.
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('blocks submission when passwords do not match', async () => {
      // Client-side validation: mismatched passwords should show an error
      // only on the confirm-password field.

      const userRegistration = createComponent();
      const messageStore = useMessageStore();

      // Arrange: Fill form fields with mismatching passwords.
      await userRegistration.find('[data-testid="username"]').setValue('testuser');
      await userRegistration.find('[data-testid="email"]').setValue('test@example.com');
      await userRegistration.find('[data-testid="password"]').setValue('Password123!');
      await userRegistration.find('[data-testid="confirmPassword"]').setValue('Different123!');

      // Act: Click on registration button.
      await userRegistration.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: Verify that error message is shown for confirmPassword.
      expect(userRegistration.find('#confirmPassword').classes()).toContain('err');
      const errorMessages = userRegistration.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(1);
      expect(errorMessages[0]?.text()).toBe('Passwords do not match.');

      // Assert: Verify API was not called.
      expect(backendApiUser.register).not.toHaveBeenCalled();
      // Assert: Verify no messages are present in store.
      expect(messageStore.messages).toHaveLength(0);
      // Assert: Verify no redirection occurred.
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('blocks submission when email is invalid', async () => {
      // Client-side validation: malformed email should show an error only
      // on the email field.

      const userRegistration = createComponent();
      const messageStore = useMessageStore();

      // Arrange: Fill form fields with invalid email.
      await userRegistration.find('[data-testid="username"]').setValue('testuser');
      await userRegistration.find('[data-testid="email"]').setValue('invalid-email');
      await userRegistration.find('[data-testid="password"]').setValue('Password123!');
      await userRegistration.find('[data-testid="confirmPassword"]').setValue('Password123!');

      // Act: Click on registration button.
      await userRegistration.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: Verify that error message is shown for email.
      expect(userRegistration.find('#email').classes()).toContain('err');
      const errorMessages = userRegistration.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(1);
      expect(errorMessages[0]?.text()).toBe('Need to enter correct email.');

      // Assert: Verify API was not called.
      expect(backendApiUser.register).not.toHaveBeenCalled();
      // Assert: Verify no messages are present in store.
      expect(messageStore.messages).toHaveLength(0);
      // Assert: Verify no redirection occurred.
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('blocks submission when password is weak (no digit)', async () => {
      // Client-side validation: password that meets length requirements but
      // lacks a digit should be rejected.

      const userRegistration = createComponent();
      const messageStore = useMessageStore();

      // Arrange: Fill form with a password missing a digit.
      await userRegistration.find('[data-testid="username"]').setValue('testuser');
      await userRegistration.find('[data-testid="email"]').setValue('test@example.com');
      await userRegistration.find('[data-testid="password"]').setValue('Abcdefgh@');
      await userRegistration.find('[data-testid="confirmPassword"]').setValue('Abcdefgh@');

      // Act: Click on registration button.
      await userRegistration.find('button[type="submit"]').trigger('submit');

      await flushPromises();

      // Assert: Verify that error message is shown for password.
      expect(userRegistration.find('#password').classes()).toContain('err');
      const errorMessages = userRegistration.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(1);
      expect(errorMessages[0]?.text()).toBe(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      );

      // Assert: Verify API was not called.
      expect(backendApiUser.register).not.toHaveBeenCalled();
      // Assert: Verify no messages are present in store.
      expect(messageStore.messages).toHaveLength(0);
      // Assert: Verify no redirection occurred.
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows errors eagerly after first submit attempt', async () => {
      // After the first submission attempt usedButton is set to true, so
      // validation errors appear immediately as the user types.

      const userRegistration = createComponent();

      // Act: Trigger a submit on an empty form to set usedButton = true.
      await userRegistration.find('button[type="submit"]').trigger('submit');
      await flushPromises();

      // Assert: Standard errors should be showing ("Field is empty.") — form is still empty.
      const errorMessages = userRegistration.findAll('.form-text-error');
      expect(errorMessages).toHaveLength(4);

      // Act: Now type a short password (password error should appear immediately).
      await userRegistration.find('[data-testid="password"]').setValue('Ab1@');

      // Assert: Password error shows eagerly (no second submit needed).
      expect(errorMessages[2]?.exists()).toBe(true);
      expect(errorMessages[2]?.text()).toBe('Password is too short. It must have at least 8 characters.');
    });
  });

  //
  // //////////////////////////////////////////////////////////////////////////
  // Navigation

  describe('navigation', () => {
    it('navigates to login when "has account" link is clicked', async () => {
      // The "Do you already have account?" link should go to the login page.

      // Arrange: Mount component.
      const userRegistration = createComponent();

      // Act: Click the "has account" link.
      await userRegistration.find('.nav-minor').trigger('click');

      // Assert: Router navigated to login.
      expect(mockPush).toHaveBeenCalledWith({ name: 'login' });
    });
  });

  //
  // //////////////////////////////////////////////////////////////////////////
  // Rendering

  describe('render', () => {
    it('renders the registration form title', () => {
      // The form should display the title.

      // Arrange&Act: Mount component.
      const userRegistration = createComponent();

      // Assert: Title is present.
      expect(userRegistration.find('h2').text()).toBe('Create an account');
    });

    it('renders the warning message', () => {
      // The portfolio-mode warning should be visible.

      // Arrange&Act: Mount component.
      const userRegistration = createComponent();

      // Assert: Warning block is present and contains expected text.
      const warning = userRegistration.find('.onpage-msg.warning');
      expect(warning.exists()).toBe(true);
      expect(warning.text()).toContain('Due to nature of portfolio project');
    });

    it('renders the server-connection notify message', () => {
      // The notify message about first connection lag should be visible.

      // Arrange&Act: Mount component.
      const userRegistration = createComponent();

      // Assert: Info block is present and contains expected text.
      const notify = userRegistration.find('.onpage-msg.info');
      expect(notify.exists()).toBe(true);
      expect(notify.text()).toContain('First connection with server');
    });

    it('renders submit button with default label', () => {
      // The submit button shows the default text before submission starts.

      // Arrange&Act: Mount component.
      const userRegistration = createComponent();

      // Assert: Button shows "Create".
      expect(userRegistration.find('button[type="submit"]').text()).toBe('Create');
    });

    it('renders the isAdmin checkbox label', () => {
      // The admin checkbox should have an associated label.

      // Arrange&Act: Mount component.
      const userRegistration = createComponent();

      // Assert: Checkbox label is present.
      const adminLabel = userRegistration.find('label[for="isAdmin"]');
      expect(adminLabel.exists()).toBe(true);
      expect(adminLabel.text()).toBe('I want to be admin:');
    });
  });
});
