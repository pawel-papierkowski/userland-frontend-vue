/** Page Object for the Admin User page (`/admin/user`) — main user table. */
class AdminUserTablePage {
  // //////////////////////////////////////////////////////////////////////////
  // General.

  /** Log in as admin and visit the admin user page. */
  visit(): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.login('/admin/user', [{ prefix: 'role', suffix: 'admin' }]);
  }

  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the whole user table element. */
  getTable(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('table_users');
  }

  /** Get a single table row by its index (zero-based). */
  getRow(rowIndex: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId(`row_users_${rowIndex}`);
  }

  /** Get a single table cell by row index and column name. */
  getCell(rowIndex: number, columnName: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId(`cell_users_${rowIndex}_${columnName}`);
  }

  /** Get a column header cell by its visible text (e.g. 'Username'). */
  getHeaderCell(headerText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getTable().find('.table-header-cell').contains(headerText);
  }

  /** Get the paginer element of the user table. Note: there are two paginers (top and bottom), we use the first one. */
  getPaginer(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('paginer_users').first();
  }

  /** Get the paginer page-number input. */
  getPaginerInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getPaginer().find('.input-paginer');
  }

  /** Get the paginer total page count number. Note: there are two paginers (top and bottom), we use the first one. */
  getPageNumber(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('paginer_users_pageNumber').first();
  }

  /** Get the empty-state message of the user table. */
  getEmptyMessage(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getTable().find('.table-empty');
  }

  /** Get the filter username input element. */
  getUsernameInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-filter-username');
  }

  /** Get the filter email input element. */
  getEmailInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-filter-email');
  }

  /** Get the filter status combobox element. */
  getStatusComboBox(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-filter-status');
  }

  /** Get the filter locked checkbox element. */
  getLockedCheckbox(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-filter-locked');
  }

  /** Get the filter submit (refresh) button. Distinguished by test id because
   *  other filter inputs render bare <button> elements that default to the
   *  submit type inside the form. */
  getFilterSubmitButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('user-filter-submit');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Execute actions.

  /** Fill the filter username field. */
  fillUsername(username: string): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getUsernameInput().clear();
    return this.getUsernameInput().type(username);
  }

  /** Fill the filter email field. */
  fillEmail(email: string): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getEmailInput().clear();
    return this.getEmailInput().type(email);
  }

  /**
   * Select an option from the filter status combobox by its index (zero-based).
   * Options order: 0 = not set, 1 = PENDING, 2 = ACTIVE, 3 = DEMO.
   */
  selectStatus(optionIndex: number): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getStatusComboBox().click();
    return cy.getByTestId(`user-filter-status_${optionIndex}`).click();
  }

  /** Submit the filter form by clicking the refresh button. */
  submitFilter(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getFilterSubmitButton().click();
  }

  /** Jump to given page (one-indexed) using the paginer input. */
  setPage(page: number): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getPaginerInput().clear();
    this.getPaginerInput().type(String(page));
    return this.getPaginerInput().type('{enter}');
  }

  /** Click a column header to toggle sorting by that column. */
  clickSortHeader(headerText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getHeaderCell(headerText).click();
  }
}

export default AdminUserTablePage;
