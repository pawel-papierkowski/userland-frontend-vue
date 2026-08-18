/** Page Object for the administration panel header. It contains the nav bar and the user menu. */
class AdminHeaderPage {
  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the link to the admin main page. Only present when user is logged in. */
  getMainLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('header_link_main');
  }

  /** Get the link to the admin users page. Only present when user is logged in with proper permissions. */
  getUsersLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('header_link_users');
  }

  /** Get the link to the admin login page. Only present when user is not logged in on a non-login admin page. */
  getLoginLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('header_link_login');
  }

  /** Get the trigger of the user options dropdown. Only present when user is logged in. */
  getOptionsTrigger(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('header_link_options');
  }

  /** Get the link to the admin profile page. Visible only when the options dropdown is open. */
  getProfileLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('header_link_profile');
  }

  /** Get the logout button. Visible only when the options dropdown is open. */
  getLogoutLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('header_link_logout');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Execute actions.

  /** Open the user options dropdown so that profile and logout links are visible. */
  openOptionsDropdown(): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.getOptionsTrigger().trigger('mouseover');
  }
}

export default AdminHeaderPage;