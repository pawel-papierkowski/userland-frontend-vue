/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserActivation from '@/components/pages/user/UserActivation.vue';

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    activate: vi.fn<typeof backendApiUser.activate>(),
  },
}));

const mockPush = vi.fn<(to: any) => void>();
const mockRoute = {
  query: {
    token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs'
  },
};

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute,
}));

/** Boilerplate code. */
function createWrapper() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(UserActivation, {
    global: {
      plugins: [logger, pinia, i18n],
    },
  });
}

/** Tests of UserActivation component. */
describe('UserActivation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.query.token = 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs';
  });

  it('activates user successfully', async () => {
    // Arrange: mock successful API response.
    vi.mocked(backendApiUser.activate).mockResolvedValue({ data: {} } as any);

    // Act: create page. Yes, it is enough here, as it will do stuff on mount already.
    // oxlint-disable-next-line no-unused-vars
    const userActivation = createWrapper();
    const messageStore = useMessageStore();

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: verify API call.
    expect(backendApiUser.activate).toHaveBeenCalledWith(expect.objectContaining({
      token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs',
      frontend: 'VUE'
    }));

    // Assert: verify success message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Success);

    // Assert: verify redirection to login page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'login' });
  });

  //

  it('fails when no token is provided', async () => {
    // Arrange: set token to invalid value.
    mockRoute.query.token = '';

    // Act: create page. Yes, it is enough here, as it will do stuff on mount already.
    // oxlint-disable-next-line no-unused-vars
    const userActivation = createWrapper();
    const messageStore = useMessageStore();

    await flushPromises();

    // Assert: verify API call was NOT made.
    expect(backendApiUser.activate).not.toHaveBeenCalled();

    // Assert: verify failure message.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Failure);
    expect(messageStore.messages[0].title).toBe("Invalid token");
    expect(messageStore.messages[0].content).toBe("No token provided or it is malformed.");

    // Assert: verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
  });

  it('fails when endpoint returns error', async () => {
    // Arrange: mock API returning error about non-existing token.
    const errorResponse = {
      isAxiosError: true,
      response: {
        status: 404,
        data: {
          detail: "Token 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs' does not exist.",
          instance: "/api/users/activate",
          status: 404,
          title: "User token is missing.",
          type: "https://api.userland.org/errors/user/token/missing",
          errCode: "user_0012"
        }
      }
    };
    vi.mocked(backendApiUser.activate).mockRejectedValue(errorResponse);

    // Act: create page. Yes, it is enough here, as it will do stuff on mount already.
    // oxlint-disable-next-line no-unused-vars
    const userActivation = createWrapper();
    const messageStore = useMessageStore();

    await flushPromises();

    // Assert: verify API call.
    expect(backendApiUser.activate).toHaveBeenCalledWith(expect.objectContaining({
      token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs',
      frontend: 'VUE'
    }));

    // Assert: verify failure message.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Failure");
    expect(messageStore.messages[0].content).toBe("Token is missing.");

    // Assert: Verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });
});
