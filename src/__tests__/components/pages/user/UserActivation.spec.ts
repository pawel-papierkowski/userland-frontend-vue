/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserActivation from '@/components/pages/user/UserActivation.vue';

let pinia: ReturnType<typeof createPinia>;

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    activate: vi.fn<typeof backendApiUser.activate>(),
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
  return mount(UserActivation, {
    global: {
      plugins: [logger, pinia, i18n],
    },
  });
}

/** Tests of UserActivation component. */
describe('UserActivation', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
    mockRoute.query.token = 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs';
  });

  // //////////////////////////////////////////////////////////////////////////
  // API interaction

  describe('api', () => {
    it('calls activate API and redirects to login on success', async () => {
      // Ensures that after successful activation user gets feedback and
      // redirection to login page.

      // Arrange: Mock successful API response.
      vi.mocked(backendApiUser.activate).mockResolvedValue({ data: {} } as any);

      // Act: Create page — it will call API on mount.
      createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: Verify API call with exact payload.
      expect(backendApiUser.activate).toHaveBeenCalledWith({
        token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs',
        frontend: 'VUE',
      });

      // Assert: Verify success message is present in store.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Success);
      expect(messageStore.messages[0]?.title).toBe('User activated successfully');
      expect(messageStore.messages[0]?.content).toBe('You can now log in.');

      // Assert: Verify redirection to login page.
      expect(mockPush).toHaveBeenCalledWith({ name: 'login' });
    });

    it('shows error and keeps spinner stopped on API failure', async () => {
      // Ensures that after failed activation user gets error feedback, the
      // spinner pauses, and the user is not redirected.

      // Arrange: Mock API returning error about non-existing token.
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
      vi.mocked(backendApiUser.activate).mockRejectedValue(errorResponse);

      // Act: Create page.
      const wrapper = createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: Verify API call.
      expect(backendApiUser.activate).toHaveBeenCalledWith({
        token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs',
        frontend: 'VUE',
      });

      // Assert: Verify failure message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Error);
      expect(messageStore.messages[0]?.title).toBe('Failure');
      expect(messageStore.messages[0]?.content).toBe('User token is missing.');

      // Assert: Spinner is paused on error.
      const spinner = wrapper.find('[data-testid="spinner"]');
      expect(spinner.find('.paused').exists()).toBe(true);

      // Assert: Verify no redirection occurred.
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Token validation

  describe('token-validation', () => {
    it('rejects empty token and redirects home', async () => {
      // When no token is present in the URL, the component should show a
      // failure message and navigate home without calling the API.

      // Arrange: Set token to empty string.
      mockRoute.query.token = '';

      // Act: Create page.
      createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: Verify API call was NOT made.
      expect(backendApiUser.activate).not.toHaveBeenCalled();

      // Assert: Verify failure message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Failure);
      expect(messageStore.messages[0]?.title).toBe('Invalid token');
      expect(messageStore.messages[0]?.content).toBe('No token provided or it is malformed.');

      // Assert: Verify redirection to home page.
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
    });

    it('rejects too-short token and redirects home', async () => {
      // Tokens shorter than 32 characters should be rejected as malformed.

      // Arrange: Set token to a value that is too short.
      mockRoute.query.token = 'abc123';

      // Act: Create page.
      createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: Verify API call was NOT made.
      expect(backendApiUser.activate).not.toHaveBeenCalled();

      // Assert: Verify failure message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Failure);
      expect(messageStore.messages[0]?.title).toBe('Invalid token');

      // Assert: Verify redirection to home page.
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Rendering

  describe('render', () => {
    it('renders the activation heading', () => {
      // The page should display a title describing the current action.

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Title is present.
      expect(wrapper.find('h2').text()).toBe('Activating account...');
    });

    it('renders the spinner', () => {
      // A loading spinner should be visible while activation is in progress.
      // The spinner must have a description for screen readers.

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Spinner element exists and is spinning initially.
      const spinner = wrapper.find('[data-testid="spinner"]');
      expect(spinner.exists()).toBe(true);
      expect(spinner.find('.paused').exists()).toBe(false);
      expect(spinner.attributes('aria-label')).toBe('Activating account...');
    });
  });
});
