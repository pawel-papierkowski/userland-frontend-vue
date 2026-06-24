/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia, getActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserAccountDeletion from '@/components/pages/user/UserAccountDeletion.vue';

/** Mock JWT. */
const jwt =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXdlbC5wYXBpZXJrb3dza2lAZ21haWwuY29tIiwiaWF0IjoxNzc5MTA4NTkyLCJleHAiOjE3NzkxMzAxOTJ9.DyOcEQBYyYyiiZgrPNB5mq49tfhoUBjUuA8izA6_b7Y';

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    accountDeleteConfirm: vi.fn<typeof backendApiUser.accountDeleteConfirm>(),
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

/** Boilerplate code. */
function createComponent() {
  return mount(UserAccountDeletion, {
    global: {
      plugins: [logger, getActivePinia(), i18n],
    },
  });
}

/** Tests of UserAccountDeletion component. */
describe('UserAccountDeletion', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockRoute.query.token = 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs';
  });

  it('submits successfully', async () => {
    // Ensures that after successful action user gets feedback and redirection.

    // Arrange: login user.
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
    AppLoginer.login(jwt);

    const userAccountDelete = createComponent();
    const messageStore = useMessageStore();

    // Arrange: mock successful API response.
    vi.mocked(backendApiUser.accountDeleteConfirm).mockResolvedValue({ data: {} } as any);

    // Act: click on account delete confirmation button.
    await userAccountDelete.find('[data-testid="btn-deleteAccount"]').trigger('click');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: verify API call.
    expect(backendApiUser.accountDeleteConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs',
      }),
    );

    // Assert: we were logged out.
    expect(AppLoginer.isLogged()).toBe(false);

    // Assert: verify success message is present in store.
    expect(messageStore.messages).toHaveLength(2);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Success);
    expect(messageStore.messages[0].title).toBe('Success');
    expect(messageStore.messages[0].content).toBe('User account was deleted.');
    expect(messageStore.messages[1].level).toBe(EnMessageLevel.Info);
    expect(messageStore.messages[1].title).toBe('User logged out successfully');
    expect(messageStore.messages[1].content).toBe('');

    // Assert: verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
  });

  it('shows error message when server returns 404 error', async () => {
    // Ensures that after failed action user gets feedback.

    // Arrange: login user.
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
    AppLoginer.login(jwt);
    // Arrange: mock API returning 404 error.
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
    vi.mocked(backendApiUser.accountDeleteConfirm).mockRejectedValue(errorResponse);

    const userAccountDelete = createComponent();
    const messageStore = useMessageStore();

    // Act: click on account delete confirmation button.
    await userAccountDelete.find('[data-testid="btn-deleteAccount"]').trigger('click');

    await flushPromises();

    // Assert: verify API was called.
    expect(backendApiUser.accountDeleteConfirm).toHaveBeenCalled();

    // Assert: verify error message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe('Failure');
    expect(messageStore.messages[0].content).toBe('User token is missing.');

    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  //

  it('fails when not logged in', async () => {
    // Ensures that after failed action user gets feedback.

    // No arrange here.

    // Act: create page. Yes, it is enough here, as it will do stuff on mount already.
    // oxlint-disable-next-line no-unused-vars
    const userAccountDelete = createComponent();
    const messageStore = useMessageStore();

    await flushPromises();

    // Assert: verify API call was NOT made.
    expect(backendApiUser.accountDeleteConfirm).not.toHaveBeenCalled();

    // Assert: verify failure message.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Failure);
    expect(messageStore.messages[0].title).toBe('Failure');
    expect(messageStore.messages[0].content).toBe(
      'You must be logged in to delete user account. Log in, then use link from email again.',
    );

    // Assert: verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'login' });
  });

  it('fails when no token is provided', async () => {
    // Ensures that after failed action user gets feedback.

    // Arrange: login user.
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
    AppLoginer.login(jwt);
    // Arrange: set token to undefined for this test.
    mockRoute.query.token = undefined as any;

    // Act: create page. Yes, it is enough here, as it will do stuff on mount already.
    // oxlint-disable-next-line no-unused-vars
    const userAccountDelete = createComponent();
    const messageStore = useMessageStore();

    await flushPromises();

    // Assert: verify API call was NOT made.
    expect(backendApiUser.accountDeleteConfirm).not.toHaveBeenCalled();

    // Assert: verify failure message.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Failure);
    expect(messageStore.messages[0].title).toBe('Invalid token');
    expect(messageStore.messages[0].content).toBe('No token provided or it is malformed.');

    // Assert: verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
  });
});
