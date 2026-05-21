/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia, getActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserAccountDeletion from '@/components/pages/user/UserAccountDeletion.vue';

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    accountDeleteConfirm: vi.fn<typeof backendApiUser.accountDeleteConfirm>(),
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

  // TODO
});
