/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserLandProfile from '@/components/pages/common/user/UserLandProfile.vue';

let pinia: ReturnType<typeof createPinia>;

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    view: vi.fn<typeof backendApiUser.view>(),
    edit: vi.fn<typeof backendApiUser.edit>(),
  },
}));

const mockPush = vi.fn<(to: any) => void>();
const mockRoute = { name: 'user-profile' };
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute,
}));

/** Convenience function to create component. */
function createComponent() {
  return mount(UserLandProfile, {
    global: {
      plugins: [logger, pinia, i18n],
    },
  });
}

/** Tests of UserLandProfile component. */
describe('UserLandProfile', () => {
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('is correctly filled and submits successfully', async () => {
    // Ensures form is correctly filled when you enter page and successful submit results in correct feedback.

    // Arrange: Mock successful API response.
    vi.mocked(backendApiUser.view).mockResolvedValue({
      data: {
        username: 'SomeNick',
        email: 'some.email@test.com',
        lang: 'en',
        profile: {
          name: null,
          surname: null,
        },
      },
    } as any);
    vi.mocked(backendApiUser.edit).mockResolvedValue({ data: {} } as any);

    const userProfile = createComponent();
    const messageStore = useMessageStore();

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: Form fields are filled correctly.
    expect((userProfile.find('[data-testid="username"]').element as HTMLInputElement).value).toBe('SomeNick');
    expect((userProfile.find('[data-testid="email"]').element as HTMLInputElement).value).toBe('some.email@test.com');
    expect((userProfile.find('[data-testid="name"]').element as HTMLInputElement).value).toBe('');
    expect((userProfile.find('[data-testid="surname"]').element as HTMLInputElement).value).toBe('');

    // Arrange: Change some fields.
    await userProfile.find('[data-testid="name"]').setValue('John');
    await userProfile.find('[data-testid="surname"]').setValue('Smith');

    // Act: Click on profile update button.
    await userProfile.find('button[type="submit"]').trigger('submit');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: Verify API calls.
    expect(backendApiUser.view).toHaveBeenCalled();
    expect(backendApiUser.edit).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'SomeNick',
        lang: 'en',
        name: 'John',
        surname: 'Smith',
      }),
    );

    // Assert: Verify success message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Success);
    expect(messageStore.messages[0]?.title).toBe('Success');
    expect(messageStore.messages[0]?.content).toBe('User data updated successfully.');

    // Assert: Verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('clicks on email change button', async () => {
    // Ensure correct action (redirection) happens when you click on email change button.

    // Arrange: Mock successful API response.
    vi.mocked(backendApiUser.view).mockResolvedValue({
      data: {
        username: 'SomeNick',
        email: 'some.email@test.com',
        lang: 'en',
        profile: {
          name: null,
          surname: null,
        },
      },
    } as any);

    const userProfile = createComponent();

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Act: Click on email change button.
    await userProfile.find('[data-testid="emailChange_btn_submit"]').trigger('click');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: Verify API calls.
    expect(backendApiUser.view).toHaveBeenCalled();
    expect(backendApiUser.edit).not.toHaveBeenCalled();

    // Assert: Verify redirection to email change page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'user-emailChange-start' });
  });

  it('clicks on account delete button', async () => {
    // Ensure correct action (redirection) happens when you click on account delete button.

    // Arrange: Mock successful API response.
    vi.mocked(backendApiUser.view).mockResolvedValue({
      data: {
        username: 'SomeNick',
        email: 'some.email@test.com',
        lang: 'en',
        profile: {
          name: null,
          surname: null,
        },
      },
    } as any);

    const userProfile = createComponent();

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Act: Click on account delete button.
    await userProfile.find('[data-testid="accountDelete_btn_submit"]').trigger('click');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: Verify API calls.
    expect(backendApiUser.view).toHaveBeenCalled();
    expect(backendApiUser.edit).not.toHaveBeenCalled();

    // Assert: Verify redirection to account delete page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'user-accountDel-start' });
  });

  //

  it('user data loading failed', async () => {
    // Ensure correct form state when loading user data failed.

    // Arrange: Mock API returning 500 error.
    const errorResponse = {
      isAxiosError: true,
      response: {
        status: 500,
        data: {},
      },
    };
    vi.mocked(backendApiUser.view).mockRejectedValue(errorResponse);

    const userProfile = createComponent();

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: Form is not shown, only stopped spinner.
    expect(userProfile.find('[data-testid="spinner"]').exists()).toBe(true);
    expect(userProfile.find('[data-testid="form"]').exists()).toBe(false);
    const spinner = userProfile.getComponent({ name: 'SpinnerTorus' });
    expect(spinner.props('canSpin')).toBe(false);

    // Assert: Verify API calls.
    expect(backendApiUser.view).toHaveBeenCalled();
    expect(backendApiUser.edit).not.toHaveBeenCalled();

    // Assert: Verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('sends invalid field', async () => {
    // Ensure correct form state when sending user data failed.

    // Arrange: Mock successful API response.
    vi.mocked(backendApiUser.view).mockResolvedValue({
      data: {
        username: 'SomeNick',
        email: 'some.email@test.com',
        lang: 'en',
        profile: {
          name: null,
          surname: null,
        },
      },
    } as any);
    vi.mocked(backendApiUser.edit).mockResolvedValue({ data: {} } as any);

    const userProfile = createComponent();

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: Form fields are filled correctly.
    expect((userProfile.find('[data-testid="username"]').element as HTMLInputElement).value).toBe('SomeNick');
    expect((userProfile.find('[data-testid="email"]').element as HTMLInputElement).value).toBe('some.email@test.com');
    expect((userProfile.find('[data-testid="name"]').element as HTMLInputElement).value).toBe('');
    expect((userProfile.find('[data-testid="surname"]').element as HTMLInputElement).value).toBe('');

    // Arrange: Change field username to invalid value.
    await userProfile.find('[data-testid="username"]').setValue('');

    // Act: Click on profile update button.
    await userProfile.find('button[type="submit"]').trigger('submit');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: Verify API calls.
    expect(backendApiUser.view).toHaveBeenCalled();
    expect(backendApiUser.edit).not.toHaveBeenCalled();

    // Assert: Verify that error message is shown for username.
    expect(userProfile.find('#username').classes()).toContain('err');
    const errorMessages = userProfile.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0]?.text()).not.toBe('');

    // Assert: Verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });
});
