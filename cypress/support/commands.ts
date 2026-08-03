/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

import { locstLang, locstJwt } from '@/code/data/app/storage.ts';
import { createTestJwt, type LoginPerm } from '@/../cypress/support/helpers.ts';

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
 * Log in programmatically without going through the login form and then visit desired page. Setup is same as in
 * `visitUserLand()`.
 * Login is done by injecting a simulated JWT into local storage (key 'app-jwt', same one the app reads on startup)
 * before the page loads.
 * Usage:
 * - cy.login() — logged-in standard user (no permissions) on home page.
 * - cy.login('/user/profile') — visit given page as standard user.
 * - cy.login('/admin/main', [{ prefix: 'role', suffix: 'admin' }]) — visit an admin page as user with additional permissions.
 * @param path Path to visit after logging in. Defaults to home page ('/').
 * @param permissions Optional permissions the logged in user should have in the simulated JWT.
 * Example: [{ prefix: 'role', suffix: 'operator' }] makes user an admin panel operator.
 */
Cypress.Commands.add('login', (path: string = '/', permissions: LoginPerm[] = []) => {
  return cy.visit(path, {
    onBeforeLoad(win: Cypress.AUTWindow): void {
      win.localStorage.setItem(locstLang, 'en');
      win.localStorage.setItem(locstJwt, createTestJwt(permissions));
    },
  });
});

// Helpers

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
      visitUserLand(path: string): Chainable<AUTWindow>;
      login(path?: string, permissions?: LoginPerm[]): Chainable<AUTWindow>;
      getByTestId(id: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}
