// Runs a single Cypress E2E spec file against the production preview server via
// `start-server-and-test`. This is a thin wrapper needed because a plain npm
// script string cannot substitute a CLI argument into the middle of the test
// command it passes to start-server-and-test.
// Note this script does not rebuild project, do it separately if needed before calling script.
//
// Usage:
//   npm run test:e2e:one -- cypress/e2e/user/activation.cy.ts
//   npm run test:e2e:one -- user/activation.cy.ts
//   node scripts/e2e-one.mjs cypress/e2e/user/activation.cy.ts
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Directory of the repository root, relative to this file (scripts/e2e-one.mjs).
const ROOT_DIR = resolve(import.meta.dirname, '..');

/** Directory (relative to the repository root) that contains the E2E specs. */
const SPECS_DIR = 'cypress/e2e';

/**
 * Resolves a possibly relative CLI spec path against the repository root.
 * A path already prefixed with the specs directory is used as-is, otherwise
 * the directory is prepended automatically (e.g. `user/activation.cy.ts`).
 * @param {string} specPath Spec path given on the command line.
 * @returns {string} Absolute path to the spec file.
 */
function resolveSpecPath(specPath) {
  const normalized = specPath.replace(/\\/g, '/');
  const relative = normalized.startsWith(`${SPECS_DIR}/`) ? normalized : `${SPECS_DIR}/${normalized}`;
  return resolve(ROOT_DIR, relative);
}

/**
 * Entry point: validates the spec argument, then starts the preview server and
 * runs only that spec through start-server-and-test.
 * @returns {Promise<void>}
 */
async function main() {
  // First argv entry is the Node binary, the second is this script itself.
  const specInput = process.argv[2];

  if (!specInput) {
    console.error('Usage: npm run test:e2e:one -- <path> (e.g. user/activation.cy.ts)');
    process.exit(2);
    return;
  }
  if (process.argv[3]) {
    console.error(`Unexpected extra argument: '${process.argv[3]}'`);
    process.exit(2);
    return;
  }

  const specPath = resolveSpecPath(specInput);
  if (!existsSync(specPath)) {
    console.error(`Spec file not found: ${specPath}`);
    process.exit(2);
    return;
  }

  // Mirror `test:e2e` (preview + wait on port + cypress run) but scope Cypress
  // to the single requested spec. The spec is embedded in the test-command
  // string, so start-server-and-test treats it as one command.
  const testCommand = `cypress run --e2e --spec "${specPath}"`;
  // Invoke start-server-and-test's Node entry point directly (instead of the
  // platform-specific `.cmd`/shell shim) so that each argument, including the
  // quoted Cypress command, keeps its boundaries intact.
  const startTestEntry = resolve(ROOT_DIR, 'node_modules/start-server-and-test/src/bin/start.js');
  const child = spawn(process.execPath, [startTestEntry, 'preview', 'http://localhost:4173', testCommand], {
    stdio: 'inherit',
    cwd: ROOT_DIR,
  });

  child.on('exit', (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
  });
  child.on('error', (err) => {
    console.error(`Failed to run start-server-and-test: ${err.message}`);
    process.exitCode = 1;
  });
}

main();
