/**
 * Page Object for the Admin User page (`/admin/user`) — main user form (AdminUserMain).
 * Selection of the user to edit is done via the table (see AdminUserTablePage).
 */
class AdminUserFormPage {
  // //////////////////////////////////////////////////////////////////////////
  // General.

  /**
   * Select a user in the user table by its row index (zero-based) to open its form.
   * Note: the element with `data-testid="users_..."` is the row's inner element that
   * has `display: contents` (so it has a 0x0 box). The actual clickable element holding
   * the click handler is its parent row element.
   */
  selectUserRow(rowIndex: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId(`users_${rowIndex}`).parent('[role="row"]').click();
  }

  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the main user form element. */
  getForm(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-form-main');
  }

  /** Get the created-at text element. */
  getCreatedAt(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-form-createdAt');
  }

  /** Get the modified-at text element. */
  getModifiedAt(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-form-modifiedAt');
  }

  /** Get the username textbox. */
  getUsernameInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-form-username');
  }

  /** Get the email textbox. */
  getEmailInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-form-email');
  }

  /** Get the status text element. */
  getStatus(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-form-status');
  }

  /** Get the locked state text element. */
  getLocked(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-form-locked');
  }

  /** Get the language text element. */
  getLang(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-form-lang');
  }

  /** Get the name textbox. */
  getNameInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-form-name');
  }

  /** Get the surname textbox. */
  getSurnameInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-form-surname');
  }

  /** Get the update button. */
  getUpdateButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-form-btn-update');
  }

  /** Get the lock button (shows 'Lock' or 'Unlock' depending on user state). */
  getLockButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-form-btn-lock');
  }

  /** Get the self-edit warning message (only shown when viewing your own account). */
  getSelfEditWarning(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-form-main').find('.onpage-msg');
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

  /** Click the update button to save the user data. */
  clickUpdate(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getUpdateButton().click();
  }

  /** Click the lock button to lock or unlock the user. */
  clickLock(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getLockButton().click();
  }
}

export default AdminUserFormPage;
