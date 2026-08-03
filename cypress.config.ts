import path from 'node:path';

import { defineConfig } from 'cypress';
import createBundler from '@bahmutov/cypress-esbuild-preprocessor';

export default defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:4173/userland-frontend-vue/',
    allowCypressEnv: false,
    setupNodeEvents(on, config) {
      // Bundle spec files with esbuild so that '@' imports resolve to the 'src' directory,
      // mirroring the alias defined in vite.config.ts.
      const srcDir = path.join(config.projectRoot, 'src');
      on(
        'file:preprocessor',
        createBundler({
          plugins: [
            {
              name: 'alias',
              setup(build) {
                build.onResolve({ filter: /^@\// }, (args) => ({
                  path: path.join(srcDir, args.path.slice(2)),
                }));
              },
            },
          ],
        }),
      );
    },
  },
});
