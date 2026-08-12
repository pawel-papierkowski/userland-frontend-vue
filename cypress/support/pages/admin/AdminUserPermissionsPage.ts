/**
 * Page Object for the Admin User page (`/admin/user`) — user permission tab
 * (AdminUserPermissions + AdminUserPermissionsFilter). Selection of the user to
 * show permissions for is done via the table (see AdminUserTablePage).
 *
 * Note: permission entries are edited in-place (inline edit). Entry option buttons
 * (add/save/cancel/edit/delete) are rendered by EntryOptions with data-testids
 * in the form `userPermissions_<row>_opt_<option>`. Row options are scoped to the
 * 'options' cell of a given row; the add button is scoped to the first paginer.
 * The permission 'name' column uses a ComboBox (options: 'role', 'user'), so it is
 * set through `selectPermissionName()` instead of a plain text input.
 */
class AdminUserPermissionsPage {
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

  /** Get the whole user permission table element. */
  getTable(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('userPermissions');
  }

  /** Get a single permission table row by its index (zero-based). Index -1 is the add-new-entry row. */
  getRow(rowIndex: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId(`userPermissions_${rowIndex}`);
  }

  /** Get a single permission cell by row index and column name. */
  getCell(rowIndex: number, columnName: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId(`userPermissions_${rowIndex}_${columnName}`);
  }

  /**
   * Get a permission column header cell by its visible text (e.g. 'Name').
   * Scoped to the permission table because all sub-tab tables share the DOM (hidden by tabs).
   */
  getHeaderCell(headerText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getTable().find('.table-header-cell').contains(headerText);
  }

  /** Get the empty-state message of the permission table. */
  getEmptyMessage(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getTable().find('.table-empty');
  }

  /** Get the permission table paginer element. Note: there are two paginers (top and bottom), we use the first one. */
  getPaginer(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('userPermissions_paginer').first();
  }

  /** Get the permission table paginer page-number input. */
  getPaginerInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getPaginer().find('.input-paginer');
  }

  /** Get the permission table paginer total page count number. Note: there are two paginers (top and bottom), we use the first one. */
  getPageNumber(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('userPermissions_paginer_pageNumber').first();
  }

  /** Get the filter 'created from' date picker input. */
  getCreatedFromInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('datepicker_userperm-filter-createdFromAt');
  }

  /** Get the filter 'created to' date picker input. */
  getCreatedToInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('datepicker_userperm-filter-createdToAt');
  }

  /** Get the filter submit (refresh) button. */
  getFilterSubmitButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('userperm-filter-submit');
  }

  /**
   * Get a single entry-option button (add/save/cancel/edit/delete) inside the given row's
   * 'options' cell by its option name.
   * @param rowIndex Row index. Use -1 for the add-new-entry row.
   * @param optionName Name of the option (e.g. 'edit', 'delete').
   */
  getEntryOption(rowIndex: number, optionName: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getCell(rowIndex, 'options').find(`[data-testid="userPermissions_${rowIndex}_opt_${optionName}"]`);
  }

  /**
   * Get the 'add' entry-option button located in the paginer (top one).
   * The paginer renders the same options in both top and bottom paginers, so we scope to the first one.
   */
  getAddButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('userPermissions_-2_opt_add').first();
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
    return this.selectDate('datepicker_userperm-filter-createdFromAt', year, month, dayIndex);
  }

  /**
   * Select the given date in the 'created to' calendar picker. See `selectDateFrom()`.
   * @param year Target year.
   * @param month Target month (zero-indexed).
   * @param dayIndex Index of the day cell in the calendar grid (0 = first date cell).
   */
  selectDateTo(year: number, month: number, dayIndex: number): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.selectDate('datepicker_userperm-filter-createdToAt', year, month, dayIndex);
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

  /** Start adding a new permission entry by clicking the 'add' button in the paginer. */
  clickAdd(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getAddButton().click();
  }

  /**
   * Click an entry-option button (edit/delete/save/cancel) in the given row by its option name.
   * @param rowIndex Row index. Use -1 for the add-new-entry row.
   * @param optionName Name of the option (e.g. 'edit', 'save').
   */
  clickEntryOption(rowIndex: number, optionName: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getEntryOption(rowIndex, optionName).click();
  }

  /**
   * Fill the 'value' input of the row that is currently in inline-edit mode.
   * @param rowIndex Row index. Use -1 for the add-new-entry row.
   * @param value Value to type.
   */
  fillValue(rowIndex: number, value: string): Cypress.Chainable<JQuery<HTMLInputElement>> {
    this.getCell(rowIndex, 'value').find('input').clear();
    return this.getCell(rowIndex, 'value').find('input').type(value);
  }

  /**
   * Pick a permission 'name' from the ComboBox of the row that is currently in inline-edit mode.
   * The name column uses a ComboBox (options 'role', 'user') instead of a text input, so the value
   * can only be one of those options. Only the row being edited has this ComboBox.
   * @param rowIndex Row index. Use -1 for the add-new-entry row.
   * @param optionName Name of the option to pick ('role' or 'user').
   */
  selectPermissionName(rowIndex: number, optionName: 'role' | 'user'): Cypress.Chainable<JQuery<HTMLElement>> {
    const optionIndex = optionName === 'role' ? 0 : 1;
    const combobox = this.getCell(rowIndex, 'name').find('[data-testid="permission-name"]');
    combobox.click();
    return combobox.find(`[data-testid="permission-name_${optionIndex}"]`).click();
  }
}

export default AdminUserPermissionsPage;
