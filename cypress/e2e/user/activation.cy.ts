// ////////////////////////////////////////////////////////////////////////////
// User Activation Page E2E Tests

import { locstJwt } from '@/code/data/app/storage.ts';
import UserActivationPage from '@/../cypress/support/pages/standard/UserActivationPage.ts';

/** A token that passes the frontend format check (32 alphanumeric characters). */
const VALID_TOKEN = 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs';

/** Stub API call to return successful activation. */
function stubActivateCall200() {
  cy.intercept('POST', '**/api/users/activate', {
    statusCode: 200,
    body: {},
  }).as('activateRequest');
}

/** Stub API call to reject activation because token does not exist. */
function stubActivateCall404() {
  cy.intercept('POST', '**/api/users/activate', {
    statusCode: 404,
    body: {
      status: 404,
      title: 'User token is missing.',
      detail: `Token '${VALID_TOKEN}' does not exist.`,
      instance: '/api/users/activate',
      type: 'https://api.userland.org/errors/user/token/missing',
      errCode: 'user_0011',
    },
  }).as('activateRequest');
}

// ////////////////////////////////////////////////////////////////////////////

describe('User Activation Page', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  describe('general', () => {
    it('successful activation redirects to login page and shows success message', () => {
      // Arrange: Stub API call to return success.
      stubActivateCall200();

      const userActivationPage = new UserActivationPage();

      // Act: Visit activation page with valid token. API is called on mount.
      userActivationPage.visit(VALID_TOKEN);

      // Assert: Wait for API call and verify it sent correct payload.
      cy.wait('@activateRequest').then((interception) => {
        const body = interception.request.body;
        expect(body.token).equal(VALID_TOKEN);
        expect(body.frontend).equal('VUE');
      });

      // Assert: User is redirected to login page.
      cy.url().should('include', '/login');

      // Assert: Success message is shown.
      cy.getByTestId('msgContainer').find('.message-success').should('contain.text', 'User activated successfully');
    });

    it('shows error and stays on page when token is rejected', () => {
      // Arrange: Stub API call to reject the token.
      stubActivateCall404();

      const userActivationPage = new UserActivationPage();

      // Act: Visit activation page with wrong (non-existing) token.
      userActivationPage.visit(VALID_TOKEN);

      // Assert: API was called.
      cy.wait('@activateRequest');

      // Assert: User stays on activation page.
      cy.url().should('include', '/user/activate');

      // Assert: Spinner is stopped after failure.
      userActivationPage.getSpinner().find('.paused').should('exist');

      // Assert: Error message is shown.
      cy.getByTestId('msgContainer').find('.message-error').should('contain.text', 'User token is missing.');
    });
  });
});
