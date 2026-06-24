import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';

import i18n from '@/code/lang/i18n';
import { logger } from '@/code/utils/logger';
import realRouter from '@/router';

import App from '@/App.vue';

/** Boilerplate code. */
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

describe('App', () => {
  it('mounts renders properly', async () => {
    const wrapperApp = await createWrapper();
    expect(wrapperApp.text()).toContain('© 2026 Paweł Papierkowski');
  });
});
