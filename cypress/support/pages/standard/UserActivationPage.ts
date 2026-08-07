/** Page Object for the User Activation page (`/user/activate`). */
class UserActivationPage {
  // //////////////////////////////////////////////////////////////////////////
  // General.

  /**
   * Visit the user activation page with given token in URL.
   * @param token Token used for activation.
   */
  visit(token: string): Cypress.Chainable<Cypress.AUTWindow> {
    return cy.visitUserLand(`/user/activate?token=${token}`);
  }

  // //////////////////////////////////////////////////////////////////////////
  // Get elements.

  /** Get the activation spinner element. */
  getSpinner(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.getByTestId('spinner');
  }
}

export default UserActivationPage;
