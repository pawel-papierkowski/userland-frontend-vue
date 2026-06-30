/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';
import { AppLoginer } from '@/code/stores/login/AppLoginer.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserEmailChange from '@/components/pages/user/UserEmailChange.vue';

let pinia: ReturnType<typeof createPinia>;

const jwt =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXdlbC5wYXBpZXJrb3dza2lAZ21haWwuY29tIiwiaWF0IjoxNzc5MTA4NTkyLCJleHAiOjE3NzkxMzAxOTJ9.DyOcEQBYyYyiiZgrPNB5mq49tfhoUBjUuA8izA6_b7Y';

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    emailChangeConfirm: vi.fn<typeof backendApiUser.emailChangeConfirm>(),
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
  return mount(UserEmailChange, {
    global: {
      plugins: [logger, pinia, i18n],
    },
  });
}

/** Tests of UserEmailChange component. */
describe('UserEmailChange', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
    mockRoute.query.token = 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs';
  });

  it('changes email successfully', async () => {
    // Ensures that successful failed action user gets feedback.

    // Arrange: login user.
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
    AppLoginer.login(jwt);

    // Arrange: mock successful API response.
    vi.mocked(backendApiUser.emailChangeConfirm).mockResolvedValue({ data: {} } as any);

    // Act: create page. Yes, it is enough here, as it will do stuff on mount already.
    // oxlint-disable-next-line no-unused-vars
    const userActivation = createComponent();
    const messageStore = useMessageStore();

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: verify API call.
    expect(backendApiUser.emailChangeConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs',
      }),
    );

    // Assert: verify success message is present in store.
    expect(messageStore.messages).toHaveLength(2);
    expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Success);
    expect(messageStore.messages[0]?.title).toBe('Success');
    expect(messageStore.messages[0]?.content).toBe('New email address was set successfully. You need to log in again.');
    expect(messageStore.messages[1]?.level).toBe(EnMessageLevel.Info);
    expect(messageStore.messages[1]?.title).toBe('User logged out successfully');
    expect(messageStore.messages[1]?.content).toBe('');

    // Assert: verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });

    // Assert: verify that frontend considers you NOT logged in.
    expect(AppLoginer.isLogged()).toBe(false);
  });

  //

  it('fails when not logged in', async () => {
    // Ensures that after failed action user gets feedback.

    // No arrange here.

    // Act: create page. Yes, it is enough here, as it will do stuff on mount already.
    // oxlint-disable-next-line no-unused-vars
    const userActivation = createComponent();
    const messageStore = useMessageStore();

    await flushPromises();

    // Assert: verify API call was NOT made.
    expect(backendApiUser.emailChangeConfirm).not.toHaveBeenCalled();

    // Assert: verify failure message.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Failure);
    expect(messageStore.messages[0]?.title).toBe('Failure');
    expect(messageStore.messages[0]?.content).toBe(
      'You must be logged in to change email address. Log in, then use link from email again.',
    );

    // Assert: verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'login' });
  });

  it('fails when no token is provided', async () => {
    // Ensures that after failed action user gets feedback.

    // Arrange: login user.
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
    AppLoginer.login(jwt);

    // Arrange: set token to invalid value.
    mockRoute.query.token = '';

    // Act: create page. Yes, it is enough here, as it will do stuff on mount already.
    // oxlint-disable-next-line no-unused-vars
    const userActivation = createComponent();
    const messageStore = useMessageStore();

    await flushPromises();

    // Assert: verify API call was NOT made.
    expect(backendApiUser.emailChangeConfirm).not.toHaveBeenCalled();

    // Assert: verify failure message.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Failure);
    expect(messageStore.messages[0]?.title).toBe('Invalid token');
    expect(messageStore.messages[0]?.content).toBe('No token provided or it is malformed.');

    // Assert: verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
  });

  it('fails when endpoint returns error', async () => {
    // Ensures that after failed action user gets feedback.

    // Arrange: login user.
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
    AppLoginer.login(jwt);

    // Arrange: mock API returning error about non-existing token.
    const errorResponse = {
      isAxiosError: true,
      response: {
        status: 404,
        data: {
          detail: "Token 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs' does not exist.",
          instance: '/api/users/activate',
          status: 404,
          title: 'User token is missing.',
          type: 'https://api.userland.org/errors/user/token/missing',
          errCode: 'user_0011',
        },
      },
    };
    vi.mocked(backendApiUser.emailChangeConfirm).mockRejectedValue(errorResponse);

    // Act: create page. Yes, it is enough here, as it will do stuff on mount already.
    // oxlint-disable-next-line no-unused-vars
    const userActivation = createComponent();
    const messageStore = useMessageStore();

    await flushPromises();

    // Assert: verify API call.
    expect(backendApiUser.emailChangeConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs',
      }),
    );

    // Assert: verify failure message.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0]?.title).toBe('Failure');
    expect(messageStore.messages[0]?.content).toBe('User token is missing.');

    // Assert: Verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });
});
