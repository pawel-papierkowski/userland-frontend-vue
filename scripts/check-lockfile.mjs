// Lints package-lock.json for supply-chain tampering. `npm ci` installs exactly
// what the lockfile says, so the lockfile itself must be trusted. This script
// verifies registry URLs, integrity hashes and install scripts independently of
// the npm registry.
//
// Run via: npm run check:lockfile
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Directory of the repository root, relative to this file (scripts/check-lockfile.mjs).
const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Hosts allowed to serve package tarballs. A 'resolved' URL pointing anywhere
// else means the lockfile was tampered with to redirect installs to an
// attacker-controlled server.
const ALLOWED_REGISTRY_HOSTS = ['registry.npmjs.org'];

// Packages that legitimately run install scripts in this project. Any new
// package with `hasInstallScript` must be explicitly added here.
const ALLOWED_INSTALL_SCRIPTS = ['cypress', 'esbuild', 'fsevents'];

/**
 * Reads and parses package-lock.json.
 * @returns {Promise<Record<string, unknown>>} Parsed lockfile contents.
 */
async function readLockfile() {
  const lockfilePath = resolve(ROOT_DIR, 'package-lock.json');
  return JSON.parse(await readFile(lockfilePath, 'utf8'));
}

/**
 * Extracts the package name from a lockfile packages-path entry (e.g.
 * `node_modules/foo/node_modules/@scope/bar` -> `@scope/bar`).
 * @param {string} path Lockfile package path.
 * @returns {string} Derived package name.
 */
function packageNameFromPath(path) {
  return path.split('node_modules/').pop();
}

/**
 * Verifies that a 'resolved' URL is HTTPS and points to an allowlisted host.
 * @param {string} name Package name (for error reporting).
 * @param {string | undefined} resolved URL to verify.
 * @param {string[]} errors Collected error messages.
 */
function checkResolvedUrl(name, resolved, errors) {
  if (resolved === undefined) {
    return; // Root and synthetic entries have no 'resolved' URL.
  }
  let url;
  try {
    url = new URL(resolved);
  } catch {
    errors.push(`Invalid 'resolved' URL for '${name}': ${resolved}`);
    return;
  }
  if (url.protocol !== 'https:') {
    errors.push(`Non-HTTPS 'resolved' URL for '${name}': ${resolved}`);
  }
  if (!ALLOWED_REGISTRY_HOSTS.includes(url.host)) {
    errors.push(
      `Unexpected registry host for '${name}': ${url.host} (${resolved})`
    );
  }
}

/**
 * Verifies that a package entry carries a sha512 integrity hash.
 * @param {string} name Package name (for error reporting).
 * @param {string | undefined} integrity Integrity field to verify.
 * @param {string[]} errors Collected error messages.
 */
function checkIntegrity(name, integrity, errors) {
  if (integrity === undefined) {
    errors.push(`Missing 'integrity' hash for '${name}'`);
  } else if (!integrity.startsWith('sha512-')) {
    errors.push(`Unexpected integrity type for '${name}': ${integrity}`);
  }
}

/**
 * Collects installed packages with `hasInstallScript` set that are not
 * explicitly allowlisted. Install scripts are a common malware delivery vector,
 * so any new one must be reviewed before it is whitelisted.
 * @param {Record<string, Record<string, unknown>>} packages Lockfile packages map.
 * @returns {string[]} Names of unexpected install-script packages.
 */
function findUnexpectedInstallScripts(packages) {
  return Object.entries(packages)
    .filter(([name, meta]) => name !== '' && meta.hasInstallScript === true)
    .map(([path]) => packageNameFromPath(path))
    .filter((name) => !ALLOWED_INSTALL_SCRIPTS.includes(name));
}

/**
 * Entry point: validates the lockfile and sets a non-zero exit code on any
 * violation.
 * @returns {Promise<void>}
 */
async function main() {
  const lockfile = await readLockfile();
  const packages = lockfile.packages;
  const errors = [];

  for (const [path, meta] of Object.entries(packages)) {
    if (path === '') continue; // Root project entry, nothing to verify.

    const name = packageNameFromPath(path);
    checkResolvedUrl(name, meta.resolved, errors);
    checkIntegrity(name, meta.integrity, errors);
  }

  const unexpectedScripts = findUnexpectedInstallScripts(packages);
  for (const name of unexpectedScripts) {
    errors.push(
      `New dependency with install scripts detected: '${name}'. Review it, ` +
        `then allowlist it in ALLOWED_INSTALL_SCRIPTS in scripts/check-lockfile.mjs.`
    );
  }

  if (errors.length > 0) {
    console.error('Lockfile check failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
  } else {
    console.log('Lockfile check passed.');
  }
}

main();
