/**
 * Page Object for the Admin User page (`/admin/user`) — user JWT tab
 * (AdminUserJwt + AdminUserJwtFilter). Selection of the user to show JWTs for
 * is done via the table (see AdminUserTablePage).
 */
class AdminUserJwtPage {
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

  /** Get the whole user JWT table element. */
  getTable(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('userJwt');
  }

  /** Get a single JWT table row by its index (zero-based). */
  getRow(rowIndex: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId(`userJwt_${rowIndex}`);
  }

  /** Get a single JWT cell by row index and column name. */
  getCell(rowIndex: number, columnName: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId(`userJwt_${rowIndex}_${columnName}`);
  }

  /**
   * Get a JWT column header cell by its visible text (e.g. 'Token').
   * Scoped to the JWT table because all sub-tab tables share the DOM (hidden by tabs).
   */
  getHeaderCell(headerText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getTable().find('.table-header-cell').contains(headerText);
  }

  /** Get the empty-state message of the JWT table. */
  getEmptyMessage(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getTable().find('.table-empty');
  }

  /** Get the JWT table paginer element. Note: there are two paginers (top and bottom), we use the first one. */
  getPaginer(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('userJwt_paginer').first();
  }

  /** Get the JWT table paginer page-number input. */
  getPaginerInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getPaginer().find('.input-paginer');
  }

  /** Get the JWT table paginer total page count number. Note: there are two paginers (top and bottom), we use the first one. */
  getPageNumber(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('userJwt_paginer_pageNumber').first();
  }

  /** Get the filter 'created from' date picker input. */
  getCreatedFromInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('datepicker_userjwt-filter-createdFromAt');
  }

  /** Get the filter 'created to' date picker input. */
  getCreatedToInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('datepicker_userjwt-filter-createdToAt');
  }

  /** Get the filter submit (refresh) button. */
  getFilterSubmitButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('userjwt-filter-submit');
  }

  // /////////////////////////////////////////////////////////////////////
  // Execute actions.

  /**
   * Select the given date in the 'created from' calendar picker.
   * Opens the calendar, navigates backward month by month the required amount (computed
   * from today's UTC date so it is deterministic regardless of when tests run) and clicks
   * the requested day cell.
   * @param year Target year.
   * @param month Target month (zero-indexed).
   * @param dayIndex Index of the day cell in the calendar grid (0 = first date cell).
   */
  selectDateFrom(year: number, month: number, dayIndex: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.selectDate('datepicker_userjwt-filter-createdFromAt', year, month, dayIndex);
  }

  /**
   * Select the given date in the 'created to' calendar picker. See `selectDateFrom()`.
   * @param year Target year.
   * @param month Target month (zero-indexed).
   * @param dayIndex Index of the day cell in the calendar grid (0 = first date cell).
   */
  selectDateTo(year: number, month: number, dayIndex: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.selectDate('datepicker_userjwt-filter-createdToAt', year, month, dayIndex);
  }

  /**
   * Select the given date in the calendar picker with given test-id prefix.
   * @param testIdPrefix Prefix of the date picker data-testids (picker itself, month-minus and day cells).
   * @param year Target year.
   * @param month Target month (zero-indexed).
   * @param dayIndex Index of the day cell in the calendar grid (0 = first date cell).
   */
  private selectDate(
    testIdPrefix: string,
    year: number,
    month: number,
    dayIndex: number,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    cy.getByTestId(testIdPrefix).click();
    const now = new Date();
    const totalMonths = (now.getUTCFullYear() - year) * 12 + (now.getUTCMonth() - month);
    for (let i = 0; i < totalMonths; i++) {
      cy.getByTestId(`${testIdPrefix}_monthMinus`).click();
    }
    return cy.getByTestId(`${testIdPrefix}_${dayIndex}`).click();
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

export default AdminUserJwtPage;
