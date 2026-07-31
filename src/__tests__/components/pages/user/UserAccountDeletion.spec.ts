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
import UserAccountDeletion from '@/components/pages/user/UserAccountDeletion.vue';

let pinia: ReturnType<typeof createPinia>;

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

/** Convenience function to create component. */
function createComponent() {
  return mount(UserAccountDeletion, {
    global: {
      plugins: [logger, pinia, i18n],
    },
  });
}

/** Tests of UserAccountDeletion component. */
describe('UserAccountDeletion', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
    mockRoute.query.token = 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs';
  });

  // //////////////////////////////////////////////////////////////////////////
  // API interaction

  describe('api', () => {
    it('submits successfully, logs out, and redirects home', async () => {
      // Ensures that after successful account deletion the user gets
      // feedback, is logged out, and redirected.

      // Arrange: Login user.
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      AppLoginer.login(jwt);

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Arrange: Mock successful API response.
      vi.mocked(backendApiUser.accountDeleteConfirm).mockResolvedValue({ data: {} } as any);

      // Act: Click on delete button.
      await wrapper.find('[data-testid="btn-deleteAccount"]').trigger('click');

      await flushPromises();

      // Assert: Verify API call with exact payload.
      expect(backendApiUser.accountDeleteConfirm).toHaveBeenCalledWith({
        token: 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs',
      });

      // Assert: We were logged out.
      expect(AppLoginer.isLogged()).toBe(false);

      // Assert: Verify success and logout messages.
      expect(messageStore.messages).toHaveLength(2);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Success);
      expect(messageStore.messages[0]?.title).toBe('Success');
      expect(messageStore.messages[0]?.content).toBe('User account was deleted.');
      expect(messageStore.messages[1]?.level).toBe(EnMessageLevel.Info);
      expect(messageStore.messages[1]?.title).toBe('User logged out successfully');
      expect(messageStore.messages[1]?.content).toBe('');

      // Assert: Verify redirection.
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
    });

    it('shows error and does not redirect on API failure', async () => {
      // Ensures that after a failed API call the user gets an error message
      // and stays on the page.

      // Arrange: Login user.
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      AppLoginer.login(jwt);

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
      vi.mocked(backendApiUser.accountDeleteConfirm).mockRejectedValue(errorResponse);

      const wrapper = createComponent();
      const messageStore = useMessageStore();

      // Act: Click on delete button.
      await wrapper.find('[data-testid="btn-deleteAccount"]').trigger('click');

      await flushPromises();

      // Assert: Verify API was called.
      expect(backendApiUser.accountDeleteConfirm).toHaveBeenCalled();

      // Assert: Verify error message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Error);
      expect(messageStore.messages[0]?.title).toBe('Failure');
      expect(messageStore.messages[0]?.content).toBe('User token is missing.');

      // Assert: Verify no redirection.
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Pre-conditions on mount

  describe('preconditions', () => {
    it('redirects to login when not logged in', async () => {
      // If the user is not logged in, they should be redirected to the login
      // page with an appropriate message.

      // Act: Create page — check runs on mount.
      createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: API was not called.
      expect(backendApiUser.accountDeleteConfirm).not.toHaveBeenCalled();

      // Assert: Failure message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Failure);
      expect(messageStore.messages[0]?.title).toBe('Failure');
      expect(messageStore.messages[0]?.content).toBe(
        'You must be logged in to delete user account. Log in, then use link from email again.',
      );

      // Assert: Redirect to login.
      expect(mockPush).toHaveBeenCalledWith({ name: 'login' });
    });

    it('redirects to home when no token is provided', async () => {
      // When the URL has no token, the user should be redirected home.

      // Arrange: Login user.
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      AppLoginer.login(jwt);

      // Arrange: Set token to undefined.
      mockRoute.query.token = undefined as any;

      // Act: Create page.
      createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: API was not called.
      expect(backendApiUser.accountDeleteConfirm).not.toHaveBeenCalled();

      // Assert: Failure message.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Failure);
      expect(messageStore.messages[0]?.title).toBe('Invalid token');
      expect(messageStore.messages[0]?.content).toBe('No token provided or it is malformed.');

      // Assert: Redirect to home.
      expect(mockPush).toHaveBeenCalledWith({ name: 'home' });
    });

    it('redirects to home when token is too short', async () => {
      // Tokens shorter than 32 characters should be rejected.

      // Arrange: Login user.
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      AppLoginer.login(jwt);

      // Arrange: Set short token.
      mockRoute.query.token = 'shortToken';

      // Act: Create page.
      createComponent();
      const messageStore = useMessageStore();

      await flushPromises();

      // Assert: API was not called.
      expect(backendApiUser.accountDeleteConfirm).not.toHaveBeenCalled();

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
      // The page should display a title.

      // Arrange: Login user so verifyAll passes.
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      AppLoginer.login(jwt);

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Title is present.
      expect(wrapper.find('h2').text()).toBe('Delete account');
    });

    it('renders the delete button with default label', () => {
      // The delete button shows the default text.

      // Arrange: Login user so verifyAll passes.
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      AppLoginer.login(jwt);

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Button shows "Delete".
      expect(wrapper.find('[data-testid="btn-deleteAccount"]').text()).toBe('Delete');
    });

    it('renders the warning message', () => {
      // The irreversible-action warning should be visible.

      // Arrange: Login user so verifyAll passes.
      vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
      AppLoginer.login(jwt);

      // Arrange&Act: Mount component.
      const wrapper = createComponent();

      // Assert: Warning block exists.
      const warning = wrapper.find('.onpage-msg.warning');
      expect(warning.exists()).toBe(true);
      expect(warning.text()).toContain('Confirm that you want to delete your account.');
    });
  });
});
