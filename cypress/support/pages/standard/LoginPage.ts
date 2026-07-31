/** Page Object for the Login page (`/login`). */
class LoginPage {
  // //////////////////////////////////////////////////////////////////////////
  // General.

  /**
   * Visit the login page. This project has two version of login page: standard and for admin panel.
   * @param isAdmin If true, we are on login panel belonging to administration panel. False means standard login page.
   */
  visit(isAdmin: boolean): Cypress.Chainable<Cypress.AUTWindow> {
    if (isAdmin) return cy.visit('/admin');
    return cy.visit('/login');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the email input element. */
  getEmailInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('email');
  }

  /** Get the password input element. */
  getPasswordInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('password');
  }

  /** Get the submit button. */
  getSubmitButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('login_btn_submit');
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

  /** Fill the password field. */
  fillPassword(password: string): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getPasswordInput().clear();
    return this.getPasswordInput().type(password);
  }

  /** Click the submit button. */
  submit(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getSubmitButton().click();
  }

  /** Click the "I don't have an account" navigation link. */
  clickRegistrationLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('login_btn_noAccount').click();
  }

  /** Click the "I forgot my password" navigation link. */
  clickPasswordResetLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('login_btn_passwordReset').click();
  }
}

export default LoginPage;
