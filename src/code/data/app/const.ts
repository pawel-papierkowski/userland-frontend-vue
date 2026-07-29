import type { ProjectProp } from '@/code/data/app/types.ts';

/** Project properties. */
export const projectProp: ProjectProp = {
  title: 'UserLand',
  author: 'Paweł Papierkowski',
  dateRange: '2026',
  version: import.meta.env.VITE_APP_VERSION, // from package.json, defined in vite.config.ts
  build: import.meta.env.DEV ? 'DEV' : 'PROD',
};

const apiAddressDev = 'http://localhost:8080/api';
const apiAddressProd = 'https://userland-backend-java-299988087135.europe-central2.run.app/api';

/* Determines appropriate API base address depending on the current build environment. */
export const apiAddress = projectProp.build === 'PROD' ? apiAddressProd : apiAddressDev;

// ////////////////////////////////////////////////////////////////////////////

/** Cookie consent value. */
export const cookieConsent = 'ok';

/** Fallback language. */
export const fallbackLang = 'en';

/** List of known languages. */
export const languages: string[] = ['en', 'pl'];

/** List of permission prefixes. */
export const permissions: string[] = ['role', 'user'];

// ////////////////////////////////////////////////////////////////////////////
// Prolong.

/** How close to expiration we should be before automatic prolongation in minutes. */
export const prolongExpiration = 15;

/** For JWT with long validity, if last api call happened in past more than this value, prolong silently. In minutes. */
export const prolongAfterLongTime = 12 * 60; // 12h

