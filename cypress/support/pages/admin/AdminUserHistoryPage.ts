/**
 * Page Object for the Admin User page (`/admin/user`) — user history tab
 * (AdminUserHistory + AdminUserHistoryFilter). Selection of the user to show
 * history for is done via the table (see AdminUserTablePage).
 */
class AdminUserHistoryPage {
  // //////////////////////////////////////////////////////////////////////////
  // General.

  /**
   * Select a user in the user table by its row index (zero-based) to open its editor.
   * Note: the element with `data-testid="users_..."` is the row's inner element that
   * has `display: contents` (so it has a 0x0 box). The actual clickable element holding
   * the click handler is its parent row element.
   */
  selectUserRow(rowIndex: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId(`users_${rowIndex}`).parent('[role="row"]').click();
  }

  // /////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the whole user history table element. */
  getTable(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('userHistory');
  }

  /** Get a single history table row by its index (zero-based). */
  getRow(rowIndex: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId(`userHistory_${rowIndex}`);
  }

  /** Get a single history cell by row index and column name. */
  getCell(rowIndex: number, columnName: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId(`userHistory_${rowIndex}_${columnName}`);
  }

  /**
   * Get a history column header cell by its visible text (e.g. 'Who').
   * Scoped to the history table because all sub-tab tables share the DOM (hidden by tabs).
   */
  getHeaderCell(headerText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getTable().find('.table-header-cell').contains(headerText);
  }

  /** Get the empty-state message of the history table. */
  getEmptyMessage(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getTable().find('.table-empty');
  }

  /** Get the history table paginer element. Note: there are two paginers (top and bottom), we use the first one. */
  getPaginer(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('userHistory_paginer').first();
  }

  /** Get the history table paginer page-number input. */
  getPaginerInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getPaginer().find('.input-paginer');
  }

  /** Get the history table paginer total page count number. Note: there are two paginers (top and bottom), we use the first one. */
  getPageNumber(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('userHistory_paginer_pageNumber').first();
  }

  /** Get the filter 'who' combobox element. */
  getWhoComboBox(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('who');
  }

  /** Get the filter 'what' combobox element. */
  getWhatComboBox(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('what');
  }

  /** Get the filter 'created from' date picker input. */
  getCreatedFromInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('datepicker_userhistory-filter-createdFromAt');
  }

  /** Get the filter 'created to' date picker input. */
  getCreatedToInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('datepicker_userhistory-filter-createdToAt');
  }

  /** Get the filter submit (refresh) button. */
  getFilterSubmitButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('userhistory-filter-submit');
  }

  // /////////////////////////////////////////////////////////////////////
  // Execute actions.

  /**
   * Select an option from the filter 'who' combobox by its index (zero-based).
   * Options order: 0 = not set, 1 = USER, 2 = OPERATOR, 3 = SYSTEM.
   */
  selectWho(optionIndex: number): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getWhoComboBox().click();
    return cy.getByTestId(`userhistory-filter-who_${optionIndex}`).click();
  }

  /**
   * Select an option from the filter 'what' combobox by its index (zero-based).
   * Options order: 0 = not set, 1 = CREATE, ..., 9 = LOGIN, 10 = LOGOUT, 11 = PROLONG.
   */
  selectWhat(optionIndex: number): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getWhatComboBox().click();
    return cy.getByTestId(`userhistory-filter-what_${optionIndex}`).click();
  }

  /**
   * Select the given date in the 'created from' calendar picker.
   * Opens the calendar, navigates backward month by month the required amount (computed
   * from today's UTC date so it is deterministic regardless of when tests run) and clicks
   * the requested day cell.
   * @param year Target year.
   * @param month Target month (zero-indexed).
   * @param dayIndex Index of the day cell in the calendar grid (0 = first date cell).
   */
  selectDate(year: number, month: number, dayIndex: number): Cypress.Chainable<JQuery<HTMLElement>> {
    this.getCreatedFromInput().click();
    const now = new Date();
    const totalMonths = (now.getUTCFullYear() - year) * 12 + (now.getUTCMonth() - month);
    for (let i = 0; i < totalMonths; i++) {
      cy.getByTestId('datepicker_userhistory-filter-createdFromAt_monthMinus').click();
    }
    return cy.getByTestId(`datepicker_userhistory-filter-createdFromAt_${dayIndex}`).click();
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

export default AdminUserHistoryPage;
