/** Page Object for the Account Deletion Start page (`/user/accountDelStart`). */
class AccountDeletionStartPage {
  // //////////////////////////////////////////////////////////////////////////
  // General.

  /** Visit the account deletion start page. */
  visit(): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.visitUserLand('/user/accountDelStart');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the password input element. */
  getPasswordInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('password');
  }

  /** Get the submit button. */
  getSubmitButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('accountDeleteStart_btn_submit');
  }

  /** Get all inline validation error messages. */
  getErrorMessages(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('.form-text-error');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Execute actions.

  /** Fill the password field. */
  fillPassword(password: string): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getPasswordInput().clear();
    return this.getPasswordInput().type(password);
  }

  /** Click the submit button. */
  submit(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getSubmitButton().click();
  }
}

export default AccountDeletionStartPage;