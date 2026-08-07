/** Page Object for the Email Change page (`/user/emailChange`). */
class EmailChangePage {
  // //////////////////////////////////////////////////////////////////////////
  // General.

  /**
   * Visit the email change page as a logged-in user (simulating a link from
   * email). The page automatically calls the confirm API on mount.
   * @param token Token used for email change confirmation.
   */
  visitAsLogged(token: string): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.login(`/user/emailChange?token=${token}`);
  }

  /**
   * Visit the email change page without being logged in. Used to verify that
   * not-logged-in users are sent to the login page.
   * @param token Token used for email change confirmation.
   */
  visitAsGuest(token: string): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.visitUserLand(`/user/emailChange?token=${token}`);
  }

  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the processing spinner element. */
  getSpinner(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('spinner');
  }
}

export default EmailChangePage;