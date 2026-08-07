/** Page Object for the Password Reset page (`/user/passwordReset`). */
class PasswordResetPage {
  // //////////////////////////////////////////////////////////////////////////
  // General.

  /**
   * Visit the password reset page with given token in URL.
   * @param token Token used for password reset confirmation.
   */
  visit(token: string): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.visitUserLand(`/user/passwordReset?token=${token}`);
  }

  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the password input element. */
  getPasswordInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('password');
  }

  /** Get the confirm password input element. */
  getConfirmPasswordInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('confirmPassword');
  }

  /** Get the submit button. */
  getSubmitButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('passwordReset_btn_submit');
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

  /** Fill the confirm password field. */
  fillConfirmPassword(confirmPassword: string): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getConfirmPasswordInput().clear();
    return this.getConfirmPasswordInput().type(confirmPassword);
  }

  /** Click the submit button. */
  submit(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getSubmitButton().click();
  }
}

export default PasswordResetPage;