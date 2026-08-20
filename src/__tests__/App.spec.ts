import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n';
import { logger } from '@/code/utils/logger';
import realRouter from '@/router';
import { locstJwt } from '@/code/data/app/storage.ts';
import { useLoginStore } from '@/stores/login.ts';
import { useMessageStore } from '@/stores/messages/messages.ts';
import { EnMessageLevel } from '@/code/stores/messages/types.ts';

import App from '@/App.vue';

/** Convenience function to create application wrapper. */
async function createWrapper() {
  const pinia = createPinia();
  setActivePinia(pinia);

  const router = createRouter({
    history: createMemoryHistory(),
    routes: realRouter.options.routes,
  });

  router.push('/');
  await router.isReady();

  const wrapper = mount(App, {
    global: {
      plugins: [logger, pinia, router, i18n],
    },
  });

  await flushPromises();
  return wrapper;
}

//

/**
 * Create a fake JWT with a given expiration offset from now.
 * @param expiresInSeconds Positive = valid, negative = expired.
 */
function createFakeJwt(expiresInSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = btoa(
    JSON.stringify({
      sub: 'test@example.com',
      name: 'testuser',
      iat: nowSec,
      exp: nowSec + expiresInSeconds,
      perms: { role: 'user' },
    }),
  );
  return `${header}.${payload}.fakesignature`;
}

// ////////////////////////////////////////////////////////////////////////////

describe('App', () => {
  describe('general', () => {
    it('mounts renders properly', async () => {
      const wrapperApp = await createWrapper();
      expect(wrapperApp.text()).toContain('© 2026 Paweł Papierkowski');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // relog user

  describe('session expiration on page reload', () => {
    beforeEach(() => {
      localStorage.clear();
      setActivePinia(createPinia());
    });

    it('shows session expired warning when stored JWT has expired', async () => {
      // Arrange: Seed localStorage with an expired JWT.
      localStorage.setItem(locstJwt, createFakeJwt(-3600));

      // Act: Mount triggers relogUser in <script setup>.
      await createWrapper();
      const messageStore = useMessageStore();
      const loginStore = useLoginStore();

      // Assert: Warning message should be in the store.
      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]?.level).toBe(EnMessageLevel.Warning);
      expect(messageStore.messages[0]?.title).toBe(i18n.global.t('user.session.msg.warning.title'));
      // User should NOT be logged in.
      expect(loginStore.loginState.isLogged).toBe(false);
      // Expired JWT must be removed from localStorage.
      expect(localStorage.getItem(locstJwt)).toBeNull();
    });

    it('logs in successfully when stored JWT is valid', async () => {
      // Arrange: Seed localStorage with a valid JWT.
      localStorage.setItem(locstJwt, createFakeJwt(3600));

      // Act: Mount triggers relogUser in <script setup>.
      await createWrapper();
      const messageStore = useMessageStore();
      const loginStore = useLoginStore();

      // Assert: No messages, user is logged in with correct data.
      expect(messageStore.messages).toHaveLength(0);
      expect(loginStore.loginState.isLogged).toBe(true);
      expect(loginStore.loginState.email).toBe('test@example.com');
      expect(loginStore.loginState.username).toBe('testuser');
    });

    it('does nothing when no JWT is stored', async () => {
      // Arrange: LocalStorage cleared in beforeEach.

      // Act: Mount triggers relogUser in <script setup>.
      await createWrapper();
      const messageStore = useMessageStore();
      const loginStore = useLoginStore();

      // Assert: No messages, not logged in.
      expect(messageStore.messages).toHaveLength(0);
      expect(loginStore.loginState.isLogged).toBe(false);
    });
  });
});
