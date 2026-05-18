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
    token: 'EXAMPLE_TOKEN'
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
  });

  it('activates user successfully', async () => {
    // oxlint-disable-next-line no-unused-vars
    const userActivation = createWrapper();
    const messageStore = useMessageStore();

    // Mock successful API response.
    vi.mocked(backendApiUser.activate).mockResolvedValue({ data: {} } as any);

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Verify API call.
    expect(backendApiUser.activate).toHaveBeenCalledWith(expect.objectContaining({
      token: 'EXAMPLE_TOKEN',
      frontend: 'VUE'
    }));

    // Verify success message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Success);

    // Verify redirection to login page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'login' });
  });

  it('fails when no token is provided', async () => {
    // Set token to undefined for this test.
    mockRoute.query.token = undefined as any;

    // oxlint-disable-next-line no-unused-vars
    const userActivation = createWrapper();
    const messageStore = useMessageStore();

    await flushPromises();

    // Verify API call was NOT made.
    expect(backendApiUser.activate).not.toHaveBeenCalled();

    // Verify failure message.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Failure);
    expect(messageStore.messages[0].title).toBe("No token");
    expect(messageStore.messages[0].content).toBe("No token provided.");

    // Verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });

    // Restore token for other tests.
    mockRoute.query.token = 'EXAMPLE_TOKEN';
  });

  it('fails when endpoint returns error', async () => {
    // Mock API returning error about non-existing token.
    const errorResponse = {
      isAxiosError: true,
      response: {
        status: 404,
        data: {
          detail: "Token '639KfBbNGSXyfeYQ99T6gO3EMbtOsuNR' does not exist.",
          instance: "/api/users/activate",
          status: 404,
          title: "User token is missing.",
          type: "https://api.userland.org/errors/user/token/missing",
          errCode: "user_0012"
        }
      }
    };
    vi.mocked(backendApiUser.activate).mockRejectedValue(errorResponse);

    // oxlint-disable-next-line no-unused-vars
    const userActivation = createWrapper();
    const messageStore = useMessageStore();

    await flushPromises();

    // Verify API call.
    expect(backendApiUser.activate).toHaveBeenCalledWith(expect.objectContaining({
      token: 'EXAMPLE_TOKEN',
      frontend: 'VUE'
    }));

    // Verify failure message.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Error);
    expect(messageStore.messages[0].title).toBe("Failure");
    expect(messageStore.messages[0].content).toBe("Token is missing.");

    // Verify redirection to home page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
  });
});
