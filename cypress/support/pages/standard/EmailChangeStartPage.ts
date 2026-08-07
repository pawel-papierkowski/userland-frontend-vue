/** Page Object for the Email Change Start page (`/user/emailChangeStart`). */
class EmailChangeStartPage {
  // //////////////////////////////////////////////////////////////////////////
  // General.

  /** Visit the email change start page. */
  visit(): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.visitUserLand('/user/emailChangeStart');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

/** Get the new email input element. */
  getNewEmailInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('newEmail');
  }

  /** Get the password input element. */
  getPasswordInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('password');
  }

  /** Get the submit button. */
  getSubmitButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('emailChangeStart_btn_submit');
  }

  /** Get all inline validation error messages. */
  getErrorMessages(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('.form-text-error');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Execute actions.

  /** Fill the new email field. */
  fillNewEmail(newEmail: string): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getNewEmailInput().clear();
    return this.getNewEmailInput().type(newEmail);
  }

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

export default EmailChangeStartPage;