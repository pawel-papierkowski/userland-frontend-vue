import type { ProjectProp } from '@/code/data/app/types.ts';

/** Project properties. */
export const projectProp: ProjectProp = {
  title: "UserLand",
  author: "Paweł Papierkowski",
  dateRange: "2026",
  version: import.meta.env.VITE_APP_VERSION, // from package.json, defined in vite.config.ts
  build: import.meta.env.DEV ? 'DEV' : 'PROD',
};

/** Fallback language. */
export const fallbackLang = 'en';

/** List of known languages. */
export const languages: string[] = [ 'en', 'pl' ];
