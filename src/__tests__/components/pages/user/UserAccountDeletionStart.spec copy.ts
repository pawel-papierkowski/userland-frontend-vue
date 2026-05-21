/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia, getActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n.ts';
import { logger } from '@/code/utils/logger.ts';
import { useMessageStore } from '@/stores/messages.ts';
import backendApiUser from '@/services/features/api-users.ts';

import { EnMessageLevel } from '@/code/stores/messages/types.ts';
import UserAccountDeletionStart from '@/components/pages/user/UserAccountDeletionStart.vue';

// Mocking dependencies.
vi.mock('@/services/features/api-users', () => ({
  default: {
    emailChangeLink: vi.fn<typeof backendApiUser.emailChangeLink>(),
  },
}));

const mockPush = vi.fn<(to: any) => void>();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, }),
}));

/** Boilerplate code. */
function createWrapper() {
  return mount(UserAccountDeletionStart, {
    global: {
      plugins: [logger, getActivePinia(), i18n],
    },
  });
}

/** Tests of UserAccountDeletionStart component. */
describe('UserAccountDeletionStart', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });


});
