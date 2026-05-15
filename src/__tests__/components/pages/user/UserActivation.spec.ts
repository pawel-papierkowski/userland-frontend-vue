/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import i18n from '@/code/lang/i18n';
import { logger } from '@/code/utils/logger';
import { useMessageStore } from '@/stores/messages';
import backendApiUser from '@/services/features/api-users';

import UserActivation from '@/components/pages/user/UserActivation.vue';

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    register: vi.fn<typeof backendApiUser.register>(),
  },
}));

const mockPush = vi.fn<(to: any) => void>();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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
    const userActivation = createWrapper();
    // TODO finish it
  });
});
