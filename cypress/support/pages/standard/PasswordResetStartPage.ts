/** Page Object for the Password Reset Start page (`/user/passwordResetStart`). */
class PasswordResetStartPage {
  // //////////////////////////////////////////////////////////////////////////
  // General.

  /** Visit the password reset start page. */
  visit(): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.visitUserLand('/user/passwordResetStart');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the email input element. */
  getEmailInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('email');
  }

  /** Get the submit button. */
  getSubmitButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('passwordResetStart_btn_submit');
  }

  /** Get all inline validation error messages. */
  getErrorMessages(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('.form-text-error');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Execute actions.

  /** Fill the email field. */
  fillEmail(email: string): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getEmailInput().clear();
    return this.getEmailInput().type(email);
  }

  /** Click the submit button. */
  submit(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getSubmitButton().click();
  }
}

export default PasswordResetStartPage;