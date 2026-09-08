/// <reference types="cypress" />
// ***********************************************
// In this file you create various custom commands and overwrite existing commands.
// Read more here: https://on.cypress.io/custom-commands
// ***********************************************

import type { Interception } from 'cypress/types/net-stubbing';

import { locstLang, locstJwt } from '@/code/data/app/storage.ts';
import { genJwt, type JwtPerm } from '@/__tests__/_helpers/jwt.ts';

// ////////////////////////////////////////////////////////////////////////////
// Commands

// Main

/**
 * Visit UserLand page using default setup.
 * Setup:
 * - Forcibly sets language to English so tests are deterministic.
 * @param path Path to visit.
 */
Cypress.Commands.add('visitUserLand', (path: string = '/') => {
  return cy.visit(path, {
    onBeforeLoad(win: Cypress.AUTWindow): void {
      win.localStorage.setItem(locstLang, 'en');
    },
  });
});

/**
 * Log in programmatically without going through the login form and then visit the desired page. Setup is the same as in
 * `visitUserLand()`.
 * Login is done by injecting a simulated JWT into local storage (key 'app-jwt', the same one the app reads on startup)
 * before the page loads.
 * Usage:
 * - cy.login() — logged-in standard user (no permissions) on home page.
 * - cy.login('/user/profile') — visit given page as standard user.
 * - cy.login('/admin/main', [{ prefix: 'role', suffix: 'admin' }]) — visit an admin page as user with additional permissions.
 * @param path Path to visit after logging in. Defaults to home page ('/').
 * @param permissions Optional permissions the logged in user should have in the simulated JWT.
 * Example: [{ prefix: 'role', suffix: 'operator' }] makes user an admin panel operator.
 */
Cypress.Commands.add('login', (path: string = '/', permissions: JwtPerm[] = []) => {
  return cy.visit(path, {
    onBeforeLoad(win: Cypress.AUTWindow): void {
      win.localStorage.setItem(locstLang, 'en');
      win.localStorage.setItem(locstJwt, genJwt(permissions));
    },
  });
});

// General helpers

/**
 * Version of `wait()` that does not fail the test when a request times out.
 */
Cypress.Commands.add('waitIfHappens', (alias: string, options?: { timeout?: number }) => {
  const timeout = options?.timeout ?? 5000;
  const start = Date.now();

  const poll = (): Cypress.Chainable<Interception | null> => {
    if (Date.now() - start >= timeout) return cy.wrap<Interception | null>(null);
    // cy.get() types a generic string as a DOM query; the alias is actually a
    // route interception, so cast the yielded value to that shape.
    return cy.get(alias, { log: false }).then((interception) => {
      const req = interception as unknown as Interception | undefined;
      if (req?.response) return cy.wrap<Interception | null>(req);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      return cy.wait(50).then(poll); // yes, we wait an arbitrary amount of time
    });
  };

  return poll();
});

/**
 * Find element with given `data-testid`.
 * @param id Value of `data-testid` attribute.
 */
Cypress.Commands.add('getByTestId', (id: string) => {
  return cy.get(`[data-testid="${id}"]`);
});

// ////////////////////////////////////////////////////////////////////////////

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable<Subject> {
      waitIfHappens(alias: string, options?: { timeout?: number }): Chainable<Interception | null>;
      visitUserLand(path: string): Chainable<AUTWindow>;
      login(path?: string, permissions?: JwtPerm[]): Chainable<AUTWindow>;
      getByTestId(id: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}
