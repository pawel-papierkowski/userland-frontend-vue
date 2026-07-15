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

  // //////////////////////////////////////////////////////////////////////////
  // API interaction

  describe('api', () => {
    it('changes email successfully, logs out, and redirects home', async () => {
      // Ensures that after a successful email change the user gets feedback,
      // is logged out, and redirected.

      // Arrange: login user.
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      AppLoginer.login(jwt);

      // Arrange: mock successful API response.
      vi.mocked(backendApiUser.emailChangeConfirm).mockResolvedValue({ data: {} } as any);

      // Act: create page — will call API on mount.
      createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: verify API call with exact payload.
      expect(backendApiUser.emailChangeConfirm).toHaveBeenCalledWith({
        token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs',
      });

      // Assert: verify success and logout messages.
      expect(messageStore.messages).toHaveLength(2);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Success);
      expect(messageStore.messages[0]?.title).toBe('Success');
      expect(messageStore.messages[0]?.content).toBe(
        'New email address was set successfully. You need to log in again.',
      );
      expect(messageStore.messages[1]?.level).toBe(EnMessageLevel.Info);
      expect(messageStore.messages[1]?.title).toBe('User logged out successfully');
      expect(messageStore.messages[1]?.content).toBe('');

      // Assert: verify frontend considers user NOT logged in.
      expect(AppLoginer.isLogged()).toBe(false);

      // Assert: verify redirection.
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
    });

    it('shows error and keeps spinner stopped on API failure', async () => {
      // Ensures that after a failed API call the user gets an error message,
      // the spinner pauses, and the user is not redirected.

      // Arrange: login user.
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      AppLoginer.login(jwt);

      // Arrange: mock API returning error.
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

      // Act: create page.
      const wrapper = createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: verify API was called.
      expect(backendApiUser.emailChangeConfirm).toHaveBeenCalled();

      // Assert: verify error message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Error);
      expect(messageStore.messages[0]?.title).toBe('Failure');
      expect(messageStore.messages[0]?.content).toBe('User token is missing.');

      // Assert: spinner is paused on error.
      const spinner = wrapper.find('[data-testid="spinner"]');
      expect(spinner.find('.paused').exists()).toBe(true);

      // Assert: verify no redirection.
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  //
  // //////////////////////////////////////////////////////////////////////////
  // Pre-conditions on mount

  describe('preconditions', () => {
    it('redirects to login when not logged in', async () => {
      // If the user is not logged in, they should be redirected to login.

      // Act: create page — check runs on mount.
      createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: API was not called.
      expect(backendApiUser.emailChangeConfirm).not.toHaveBeenCalled();

      // Assert: failure message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Failure);
      expect(messageStore.messages[0]?.title).toBe('Failure');
      expect(messageStore.messages[0]?.content).toBe(
        'You must be logged in to change email address. Log in, then use link from email again.',
      );

      // Assert: redirect to login.
      expect(mockPush).toHaveBeenCalledWith({ name: 'login' });
    });

    it('redirects to home when no token is provided', async () => {
      // When the URL has no token, the user should be redirected home.

      // Arrange: login user.
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      AppLoginer.login(jwt);

      // Arrange: set token to empty string.
      mockRoute.query.token = '';

      // Act: create page.
      createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: API was not called.
      expect(backendApiUser.emailChangeConfirm).not.toHaveBeenCalled();

      // Assert: failure message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Failure);
      expect(messageStore.messages[0]?.title).toBe('Invalid token');
      expect(messageStore.messages[0]?.content).toBe(
        'No token provided or it is malformed.',
      );

      // Assert: redirect to home.
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
    });

    it('redirects to home when token is too short', async () => {
      // Tokens shorter than 32 characters should be rejected.

      // Arrange: login user.
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      AppLoginer.login(jwt);

      // Arrange: set short token.
      mockRoute.query.token = 'shortToken';

      // Act: create page.
      createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: API was not called.
      expect(backendApiUser.emailChangeConfirm).not.toHaveBeenCalled();

      // Assert: failure message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Failure);
      expect(messageStore.messages[0]?.title).toBe('Invalid token');

      // Assert: redirect to home.
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
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
      expect(wrapper.find('h2').text()).toBe('Setting up new email address...');
    });

    it('renders the spinner', () => {
      // A loading spinner should be visible while processing.

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Spinner exists.
      const spinner = wrapper.find('[data-testid="spinner"]');
      expect(spinner.exists()).toBe(true);
    });

    it('provides accessible label on the spinner', () => {
      // The spinner must have a description for screen readers.

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: aria-label is set.
      const spinner = wrapper.find('[data-testid="spinner"]');
      expect(spinner.attributes('aria-label')).toBe(
        'Setting up new email address...',
      );
    });
  });
});
