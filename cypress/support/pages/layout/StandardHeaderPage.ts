/** Page Object for the standard webpage header. It contains the nav bar and the user menu. */
class StandardHeaderPage {
  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the link to the homepage. */
  getHomeLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('header_link_home');
  }

  /** Get the link to the member zone. Only present when user is logged in. */
  getMemberLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('header_link_member');
  }

  /** Get the link to the test zone. */
  getTestLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('header_link_test');
  }

  /** Get the link to the debug zone. */
  getDebugLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('header_link_debug');
  }

  /** Get the link to the login page. Only present when user is not logged in. */
  getLoginLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('header_link_login');
  }

  /** Get the link to the registration page. Only present when user is not logged in. */
  getRegistrationLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('header_link_registration');
  }

  /** Get the trigger of the user options dropdown. Only present when user is logged in. */
  getOptionsTrigger(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('header_link_options');
  }

  /** Get the link to the user profile. Visible only when the options dropdown is open. */
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

export default StandardHeaderPage;