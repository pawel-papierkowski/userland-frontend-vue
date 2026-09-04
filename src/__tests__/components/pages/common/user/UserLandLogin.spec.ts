/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { useMessageStore } from '@/stores/messages/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserLandLogin from '@/components/pages/common/user/UserLandLogin.vue';

import { genJwt } from '@/__tests__/_helpers/jwt.ts';

let pinia: ReturnType<typeof createPinia>;

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    login: vi.fn<typeof backendApiUser.login>(),
  },
}));

const mockPush = vi.fn<(to: string) => void>();
const mockRoute = { name: 'login' };
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute,
}));

/** Convenience function to create component. */
function createComponent() {
  return mount(UserLandLogin, {
    global: {
      plugins: [pinia, i18n],
    },
  });
}

/** Tests of UserLandLogin component. */
describe('UserLandLogin', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockRoute.name = 'login'; // Reset to default
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  //

  it('logged in successfully', async () => {
    // Checks state after successful login.

    vi.setSystemTime(new Date('2026-05-21T16:00:00Z'));
    const userLogin = createComponent();
    const messageStore = useMessageStore();

    // Arrange: Mock successful API response.
    vi.mocked(backendApiUser.login).mockResolvedValue({
      data: {
        jwtToken: genJwt()
      },
    } as any);

    // Arrange: Fill form fields correctly.
    await userLogin.find('[data-testid="email"]').setValue('test@example.com');
    await userLogin.find('[data-testid="password"]').setValue('Password123!');

    // Act: Click on login button.
    await userLogin.find('button[type="submit"]').trigger('submit');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: Verify API call.
    expect(backendApiUser.login).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        password: 'Password123!',
      }),
    );

    // Assert: Verify success message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Info);
    expect(messageStore.messages[0]?.title).toBe('User logged in successfully');
    expect(messageStore.messages[0]?.content).toBe('');

    // Assert: Verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });

    // Assert: Verify that frontend considers you logged in.
    expect(AppLoginer.isLogged()).toBe(true);
  });

  it('logged in successfully for admin panel', async () => {
    // Checks state after successful login for admin panel.

    vi.setSystemTime(new Date('2026-05-21T16:00:00Z'));
    mockRoute.name = 'admin-login';
    const userLogin = createComponent();
    const messageStore = useMessageStore();

    // Arrange: Mock successful API response.
    vi.mocked(backendApiUser.login).mockResolvedValue({
      data: {
        jwtToken: genJwt([{ prefix: 'role', suffix: 'admin' }])
      },
    } as any);

    // Arrange: Fill form fields correctly.
    await userLogin.find('[data-testid="email"]').setValue('pawel.papierkowski@gmail.com');
    await userLogin.find('[data-testid="password"]').setValue('abcABC123!');

    // Act: Click on login button.
    await userLogin.find('button[type="submit"]').trigger('submit');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: Verify API call.
    expect(backendApiUser.login).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'pawel.papierkowski@gmail.com',
        password: 'abcABC123!',
      }),
    );

    // Assert: Verify success message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Info);
    expect(messageStore.messages[0]?.title).toBe('Admin panel user logged in successfully');
    expect(messageStore.messages[0]?.content).toBe('');

    // Assert: Verify redirection to main admin page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'admin-main' });

    // Assert: Verify that frontend considers you logged in.
    expect(AppLoginer.isLogged()).toBe(true);
  });

  it('logged in successfully on admin panel but no permissions', async () => {
    // Checks state after successful login for admin panel. Due to lack of permissions will redirect to standard page.

    vi.setSystemTime(new Date('2026-05-21T16:00:00Z'));
    mockRoute.name = 'admin-login';
    const userLogin = createComponent();
    const messageStore = useMessageStore();

    // Arrange: Mock successful API response.
    vi.mocked(backendApiUser.login).mockResolvedValue({
      data: {
        jwtToken: genJwt()
      },
    } as any);

    // Arrange: Fill form fields correctly.
    await userLogin.find('[data-testid="email"]').setValue('test@example.com');
    await userLogin.find('[data-testid="password"]').setValue('Password123!');

    // Act: Click on login button.
    await userLogin.find('button[type="submit"]').trigger('submit');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Note that even though user was logging to admin panel without needed permissions, they still logged in successfully as normal user.
    // We simply kick them out of admin panel, as if login was on standard page.

    // Assert: Verify API call.
    expect(backendApiUser.login).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        password: 'Password123!',
      }),
    );

    // Assert: Verify success message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Info);
    expect(messageStore.messages[0]?.title).toBe('User logged in successfully');
    expect(messageStore.messages[0]?.content).toBe('');

    // Assert: Verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });

    // Assert: Verify that frontend considers you logged in.
    expect(AppLoginer.isLogged()).toBe(true);
  });

  //

  it('failed to login despite getting token from backend', async () => {
    // We somehow got expired token from backend. Maybe user's computer has wrong date&time set?
    // Either way we need to handle it gracefully.

    vi.setSystemTime(new Date('2026-05-19T16:00:00Z'));
    const jwtTokenExpired = genJwt();

    vi.setSystemTime(new Date('2026-05-21T16:00:00Z'));
    const userLogin = createComponent();
    const messageStore = useMessageStore();

    // Arrange: Mock successful API response, but with expired token.
    vi.mocked(backendApiUser.login).mockResolvedValue({
      data: {
        jwtToken: jwtTokenExpired
      },
    } as any);

    // Arrange: Fill form fields correctly.
    await userLogin.find('[data-testid="email"]').setValue('test@example.com');
    await userLogin.find('[data-testid="password"]').setValue('Password123!');

    // Act: Click on login button.
    await userLogin.find('button[type="submit"]').trigger('submit');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: Verify API call.
    expect(backendApiUser.login).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        password: 'Password123!',
      }),
    );

    // Assert: Verify failure message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Failure);
    expect(messageStore.messages[0]?.title).toBe('Login failure');
    expect(messageStore.messages[0]?.content).toBe('User login failed.');

    // Assert: Verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();

    // Assert: Verify that frontend considers you NOT logged in.
    expect(AppLoginer.isLogged()).toBe(false);
  });

  it('shows error message when server returns 409 error', async () => {
    // Ensures error message is shown after failed login.

    // Arrange: Mock API returning 409 error (wrong password or account).
    const errorResponse = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          detail: 'Wrong password or account was used. Access denied.',
          instance: '/api/users/login',
          status: 409,
          title: 'Wrong password or account.',
          type: 'https://api.userland.org/errors/user/wrongPassword',
          errCode: 'user_0112',
        },
      },
    };
    vi.mocked(backendApiUser.login).mockRejectedValue(errorResponse);

    const userLogin = createComponent();
    const messageStore = useMessageStore();

    // Arrange: Fill form fields correctly.
    await userLogin.find('[data-testid="email"]').setValue('test@example.com');
    await userLogin.find('[data-testid="password"]').setValue('Password123!');

    // Act: Click on login button.
    await userLogin.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: Verify API was called.
    expect(backendApiUser.login).toHaveBeenCalled();

    // Assert: Verify error message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0]?.title).toBe('Failure');
    expect(messageStore.messages[0]?.content).toBe('Invalid password or account.');

    // Assert: Verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();

    // Assert: Verify that frontend considers you logged out.
    expect(AppLoginer.isLogged()).toBe(false);
  });

  //

  it('form is empty', async () => {
    // Ensures nothing happens (except feedback on page) when you try to login without filling form.

    const userLogin = createComponent();
    const messageStore = useMessageStore();

    // No arrange here - form is untouched.

    // Act: Click on login button while form is completely empty.
    await userLogin.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: Verify that error messages properly shown up for all fields.
    const errorMessages = userLogin.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(2);
    errorMessages.forEach((msg) => {
      expect(msg.text()).not.toBe('');
    });

    // Assert: Verify API was not called.
    expect(backendApiUser.login).not.toHaveBeenCalled();
    // Assert: Verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
    // Assert: Verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();

    // Assert: Verify that frontend considers you logged out.
    expect(AppLoginer.isLogged()).toBe(false);
  });

  it('shows error when invalid email is entered', async () => {
    // Ensures nothing happens (except feedback on page) when you try to login with invalid email.

    const userLogin = createComponent();
    const messageStore = useMessageStore();

    // Arrange: Fill form fields with invalid email.
    await userLogin.find('[data-testid="email"]').setValue('invalid-email');
    await userLogin.find('[data-testid="password"]').setValue('Password123!');

    // Act: Click on login button.
    await userLogin.find('button[type="submit"]').trigger('submit');

    await flushPromises();

    // Assert: Verify that error message is shown for email.
    expect(userLogin.find('#email').classes()).toContain('err');
    const errorMessages = userLogin.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0]?.text()).not.toBe('');

    // Assert: Verify API was not called.
    expect(backendApiUser.login).not.toHaveBeenCalled();
    // Assert: Verify no messages are present in store.
    expect(messageStore.messages).toHaveLength(0);
    // Assert: Verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();

    // Assert: Verify that frontend considers you logged out.
    expect(AppLoginer.isLogged()).toBe(false);
  });
});
