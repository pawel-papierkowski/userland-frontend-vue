/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia, getActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserProfile from '@/components/pages/user/UserProfile.vue';

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    view: vi.fn<typeof backendApiUser.view>(),
    edit: vi.fn<typeof backendApiUser.edit>(),
  },
}));

const mockPush = vi.fn<(to: any) => void>();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, }),
}));

/** Boilerplate code. */
function createWrapper() {
  return mount(UserProfile, {
    global: {
      plugins: [logger, getActivePinia(), i18n],
    },
  });
}

/** Tests of UserProfile component. */
describe('UserProfile', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('is correctly filled and submits successfully', async () => {
    // Arrange: mock successful API response.
    vi.mocked(backendApiUser.view).mockResolvedValue({ data: {
      username: 'SomeNick',
      email: 'some.email@test.com',
      lang: 'en',
      profile: {
        name: null,
        surname: null
      }
    } } as any);
    vi.mocked(backendApiUser.edit).mockResolvedValue({ data: {} } as any);

    const userProfile = createWrapper();
    const messageStore = useMessageStore();

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: form fields are filled correctly.
    expect((userProfile.find('[data-testid="username"]').element as HTMLInputElement).value).toBe('SomeNick');
    expect((userProfile.find('[data-testid="email"]').element as HTMLInputElement).value).toBe('some.email@test.com');
    expect((userProfile.find('[data-testid="name"]').element as HTMLInputElement).value).toBe('');
    expect((userProfile.find('[data-testid="surname"]').element as HTMLInputElement).value).toBe('');

    // Arrange: change some fields.
    await userProfile.find('[data-testid="name"]').setValue('John');
    await userProfile.find('[data-testid="surname"]').setValue('Smith');

    // Act: click on profile update button.
    await userProfile.find('button[type="submit"]').trigger('submit');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: verify API calls.
    expect(backendApiUser.view).toHaveBeenCalled();
    expect(backendApiUser.edit).toHaveBeenCalledWith(expect.objectContaining({
      username: 'SomeNick',
      lang: 'en',
      name: 'John',
      surname: 'Smith'
    }));

    // Assert: verify success message is present in store.
    expect(messageStore.messages).toHaveLength(1);
    expect(messageStore.messages[0].level).toBe(EnMessageLevel.Success);
    expect(messageStore.messages[0].title).toBe("Success");
    expect(messageStore.messages[0].content).toBe("User data updated successfully.");

    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('clicks on email change button', async () => {
    // Arrange: mock successful API response.
    vi.mocked(backendApiUser.view).mockResolvedValue({ data: {
      username: 'SomeNick',
      email: 'some.email@test.com',
      lang: 'en',
      profile: {
        name: null,
        surname: null
      }
    } } as any);

    const userProfile = createWrapper();

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Act: click on email change button.
    await userProfile.find('[data-testid="btn-emailChange"]').trigger('click');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: verify API calls.
    expect(backendApiUser.view).toHaveBeenCalled();
    expect(backendApiUser.edit).not.toHaveBeenCalled();

    // Assert: verify redirection to email change page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'user-emailChange-start' });
  });

  it('clicks on account delete button', async () => {
    // Arrange: mock successful API response.
    vi.mocked(backendApiUser.view).mockResolvedValue({ data: {
      username: 'SomeNick',
      email: 'some.email@test.com',
      lang: 'en',
      profile: {
        name: null,
        surname: null
      }
    } } as any);

    const userProfile = createWrapper();

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Act: click on account delete button.
    await userProfile.find('[data-testid="btn-deleteAccount"]').trigger('click');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: verify API calls.
    expect(backendApiUser.view).toHaveBeenCalled();
    expect(backendApiUser.edit).not.toHaveBeenCalled();

    // Assert: verify redirection to account delete page.
    expect(mockPush).toHaveBeenCalledWith({ name: 'user-accountDel-start' });
  });

  //

  it('user data loading failed', async () => {
    // Arrange: mock API returning 500 error.
    const errorResponse = {
      isAxiosError: true,
      response: {
        status: 500,
        data: {}
      }
    };
    vi.mocked(backendApiUser.view).mockRejectedValue(errorResponse);

    const userProfile = createWrapper();

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: form is not shown, only stopped spinner.
    expect(userProfile.find('[data-testid="spinner"]').exists()).toBe(true);
    expect(userProfile.find('[data-testid="form"]').exists()).toBe(false);
    const spinner = userProfile.getComponent({ name: 'SpinnerTorus' });
    expect(spinner.props('canSpin')).toBe(false);

    // Assert: verify API calls.
    expect(backendApiUser.view).toHaveBeenCalled();
    expect(backendApiUser.edit).not.toHaveBeenCalled();

    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('sends invalid field', async () => {
    // Arrange: mock successful API response.
    vi.mocked(backendApiUser.view).mockResolvedValue({ data: {
      username: 'SomeNick',
      email: 'some.email@test.com',
      lang: 'en',
      profile: {
        name: null,
        surname: null
      }
    } } as any);
    vi.mocked(backendApiUser.edit).mockResolvedValue({ data: {} } as any);

    const userProfile = createWrapper();

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: form fields are filled correctly.
    expect((userProfile.find('[data-testid="username"]').element as HTMLInputElement).value).toBe('SomeNick');
    expect((userProfile.find('[data-testid="email"]').element as HTMLInputElement).value).toBe('some.email@test.com');
    expect((userProfile.find('[data-testid="name"]').element as HTMLInputElement).value).toBe('');
    expect((userProfile.find('[data-testid="surname"]').element as HTMLInputElement).value).toBe('');

    // Arrange: change field username to invalid value.
    await userProfile.find('[data-testid="username"]').setValue('');

    // Act: click on profile update button.
    await userProfile.find('button[type="submit"]').trigger('submit');

    await flushPromises(); // Wait for all promises (API call) to resolve.

    // Assert: verify API calls.
    expect(backendApiUser.view).toHaveBeenCalled();
    expect(backendApiUser.edit).not.toHaveBeenCalled();

    // Assert: verify that error message is shown for username.
    expect(userProfile.find('#username').classes()).toContain('err');
    const errorMessages = userProfile.findAll('.form-text-error');
    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0].text()).not.toBe('');

    // Assert: verify no redirection occurred.
    expect(mockPush).not.toHaveBeenCalled();
  });
});
