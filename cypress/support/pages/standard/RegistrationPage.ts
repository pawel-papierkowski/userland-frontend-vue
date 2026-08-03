/** Page Object for the Registration page (`/registration`). */
class RegistrationPage {
  // //////////////////////////////////////////////////////////////////////////
  // General.

  /** Visit the registration page. */
  visit(): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.visitUserLand('/registration');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the username input element. */
  getUsernameInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('username');
  }

  /** Get the email input element. */
  getEmailInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('email');
  }

  /** Get the password input element. */
  getPasswordInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('password');
  }

  /** Get the confirm password input element. */
  getConfirmPasswordInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('confirmPassword');
  }

  /** Get the "I want to be admin" checkbox wrapper element. */
  getIsAdminCheckbox(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('checkbox_isAdmin');
  }

  /** Get the submit button. */
  getSubmitButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('registration_btn_submit');
  }

  /** Get all inline validation error messages. */
  getErrorMessages(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('.form-text-error');
  }

  /** Get the "I already have an account" navigation link. */
  getLoginLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('registration_btn_login');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Execute actions.

  /** Fill the username field. */
  fillUsername(username: string): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getUsernameInput().clear();
    return this.getUsernameInput().type(username);
  }

  /** Fill the email field. */
  fillEmail(email: string): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getEmailInput().clear();
    return this.getEmailInput().type(email);
  }

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

  /** Check the "I want to be admin" checkbox. */
  checkIsAdmin(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getIsAdminCheckbox().click();
  }

  /** Click the submit button. */
  submit(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getSubmitButton().click();
  }

  /** Click the "I already have an account" navigation link. */
  clickLoginLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getLoginLink().click();
  }
}

export default RegistrationPage;
