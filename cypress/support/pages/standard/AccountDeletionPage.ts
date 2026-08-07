/** Page Object for the Account Deletion page (`/user/accountDel`). */
class AccountDeletionPage {
  // //////////////////////////////////////////////////////////////////////////
  // General.

  /**
   * Visit the account deletion page as a logged-in user (simulating a link
   * from email). Deletion must be confirmed by clicking the delete button.
   * @param token Token used for account deletion confirmation.
   */
  visitAsLogged(token: string): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.login(`/user/accountDel?token=${token}`);
  }

  /**
   * Visit the account deletion page without being logged in. Used to verify
   * that not-logged-in users are sent to the login page.
   * @param token Token used for account deletion confirmation.
   */
  visitAsGuest(token: string): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.visitUserLand(`/user/accountDel?token=${token}`);
  }

  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the confirm delete button. */
  getConfirmButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('accountDelete_btn_submit');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Execute actions.

  /** Click the confirm delete button. */
  clickDelete(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getConfirmButton().click();
  }
}

export default AccountDeletionPage;