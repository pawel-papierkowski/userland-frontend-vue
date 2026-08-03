/** Page Object for the User Profile page (`/user/profile`). */
class UserProfilePage {
  // //////////////////////////////////////////////////////////////////////////
  // General.

  /** Visit the user profile page. Note: user must be already logged in. */
  visit(): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.visitUserLand('/user/profile');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the username input element. */
  getUsernameInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('username');
  }

  /** Get the email input element. Note it is read-only. */
  getEmailInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('email');
  }

  /** Get the name input element. */
  getNameInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('name');
  }

  /** Get the surname input element. */
  getSurnameInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('surname');
  }

  /** Get the profile form element. */
  getForm(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('form');
  }

  /** Get the loading spinner element. */
  getSpinner(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('spinner');
  }

  /** Get the submit (update profile) button. */
  getSubmitButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('btn-submit');
  }

  /** Get the "change email address" button. */
  getEmailChangeButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('btn-emailChange');
  }

  /** Get the "delete account" button. */
  getDeleteAccountButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('btn-deleteAccount');
  }

  /** Get all inline validation error messages. */
  getErrorMessages(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('.form-text-error');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Execute actions.

  /** Fill the username field. */
  fillUsername(username: string): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getUsernameInput().clear();
    return this.getUsernameInput().type(username);
  }

  /** Fill the name field. */
  fillName(name: string): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getNameInput().clear();
    return this.getNameInput().type(name);
  }

  /** Fill the surname field. */
  fillSurname(surname: string): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getSurnameInput().clear();
    return this.getSurnameInput().type(surname);
  }

  /** Click the submit (update profile) button. */
  submit(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getSubmitButton().click();
  }

  /** Click the "change email address" button. */
  clickEmailChange(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getEmailChangeButton().click();
  }

  /** Click the "delete account" button. */
  clickDeleteAccount(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getDeleteAccountButton().click();
  }
}

export default UserProfilePage;
