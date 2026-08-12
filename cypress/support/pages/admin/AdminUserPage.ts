/**
 * Page Object for the Admin User page (`/admin/user`). Common functions like visiting page.
 */
class AdminUserPage {
  /**
   * Log in as admin and visit the admin user page.
   * @param permissions If present, set custom permissions.
   */
  visit(permissions:{prefix: string, suffix: string}[]=[{ prefix: 'role', suffix: 'admin' }]): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.login('/admin/user', permissions);
  }

  /** Switch to the Main tab of the selected user. */
  openMainTab(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('usertab_main').click();
  }

  /** Switch to the History tab of the selected user. */
  openHistoryTab(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('usertab_history').click();
  }

  /** Switch to the Config tab of the selected user. */
  openConfigTab(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('usertab_config').click();
  }

  /** Switch to the Permissions tab of the selected user. */
  openPermissionsTab(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('usertab_permissions').click();
  }

  /** Switch to the Tokens tab of the selected user. */
  openTokensTab(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('usertab_tokens').click();
  }

  /** Switch to the JWT tab of the selected user. */
  openJwtTab(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('usertab_jwt').click();
  }
}

export default AdminUserPage;
