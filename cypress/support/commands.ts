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

import { createTestJwt, type LoginPerm } from './helpers.ts';

// ////////////////////////////////////////////////////////////////////////////
// Commands

Cypress.Commands.add('getByTestId', (id: string) => {
  return cy.get(`[data-testid="${id}"]`);
});

/**
 * Log in programmatically without going through the login form. Injects a simulated JWT into local storage
 * (key 'app-jwt', same one the app reads on startup) before the page loads, so the app considers the user logged in.
 * Usage:
 * - cy.login() — logged-in standard user (no permissions).
 * - cy.login('/user/profile') — visit given page as standard user.
 * - cy.login('/admin/main', [{ prefix: 'role', suffix: 'admin' }]) — visit an admin page as user with additional permissions.
 * @param path Path to visit after logging in. Defaults to home page ('/').
 * @param permissions Optional permissions the logged in user should have in the simulated JWT.
 * Example: [{ prefix: 'role', suffix: 'operator' }] makes user an admin panel operator.
 */
Cypress.Commands.add('login', (path: string = '/', permissions: LoginPerm[] = []) => {
  cy.visit(path, {
    onBeforeLoad(win: Cypress.AUTWindow): void {
      win.localStorage.setItem('app-jwt', createTestJwt(permissions));
    },
  });
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable<Subject> {
      getByTestId(id: string): Chainable<JQuery<HTMLElement>>;
      login(path?: string, permissions?: LoginPerm[]): Chainable<AUTWindow>;
    }
  }
}
