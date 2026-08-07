// ////////////////////////////////////////////////////////////////////////////
// Account Deletion E2E Tests
// Covers the account deletion start page (UserAccountDeletionStart.vue) and
// the token-confirmed deletion page (UserAccountDeletion.vue).

import { locstJwt } from '@/code/data/app/storage.ts';
import UserProfilePage from '@/../cypress/support/pages/standard/UserProfilePage.ts';
import AccountDeletionStartPage from '@/../cypress/support/pages/standard/AccountDeletionStartPage.ts';
import AccountDeletionPage from '@/../cypress/support/pages/standard/AccountDeletionPage.ts';

/** A token that passes the frontend format check (32 alphanumeric characters). */
const VALID_TOKEN = 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs';

/** Password that meets the strength requirements (digit, case, special char). */
const STRONG_PASSWORD = '5trOnGP@ssw0rd';

/** User data returned by the view endpoint when loading the profile page. */
const DEFAULT_USER_DATA = {
  username: 'Test User',
  email: 'test@example.com',
  lang: 'en',
  profile: {
    name: null,
    surname: null,
  },
};

/** Stub API call to return user data on profile load. */
function stubUserView() {
  cy.intercept('GET', '**/api/users/view', {
    statusCode: 200,
    body: DEFAULT_USER_DATA,
  }).as('userViewRequest');
}

/** Stub API call for account deletion link request to return success. */
function stubAccountDeleteLink200() {
  cy.intercept('POST', '**/api/users/delete/link', {
    statusCode: 200,
    body: {},
  }).as('accountDeleteLinkRequest');
}

/** Stub API call for account deletion link request to return 409 token already exists. */
function stubAccountDeleteLink409() {
  cy.intercept('POST', '**/api/users/delete/link', {
    statusCode: 409,
    body: {
      status: 409,
      title: 'Required token already exists.',
      detail: "Token of type 'DELETE' already exists and is still valid. You cannot do this action twice in row.",
      instance: '/api/users/delete/link',
      type: 'https://api.userland.org/errors/user/tokenExists',
      errCode: 'user_0013',
    },
  }).as('accountDeleteLinkRequest');
}

/** Stub API call for account deletion confirmation to return success. */
function stubAccountDeleteConfirm200() {
  cy.intercept('DELETE', '**/api/users/delete/confirm', {
    statusCode: 200,
    body: {},
  }).as('accountDeleteConfirmRequest');
}

/** Stub API call for account deletion confirmation to reject the token. */
function stubAccountDeleteConfirm404() {
  cy.intercept('DELETE', '**/api/users/delete/confirm', {
    statusCode: 404,
    body: {
      status: 404,
      title: 'User token is missing.',
      detail: `Token '${VALID_TOKEN}' does not exist.`,
      instance: '/api/users/delete/confirm',
      type: 'https://api.userland.org/errors/user/token/missing',
      errCode: 'user_0011',
    },
  }).as('accountDeleteConfirmRequest');
}

// ////////////////////////////////////////////////////////////////////////////

describe('Account Deletion', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  describe('full user story', () => {
    it('sends deletion link from profile and redirects home', () => {
      // Arrange: Stub API calls and log in on the profile page.
      stubUserView();
      stubAccountDeleteLink200();
      cy.login('/user/profile');

      const profilePage = new UserProfilePage();

      // Act: Navigate from profile to the account deletion start page.
      profilePage.clickDeleteAccount();

      // Assert: Redirected to account deletion start page.
      cy.url().should('include', '/user/accountDelStart');

      const startPage = new AccountDeletionStartPage();
      startPage.fillPassword(STRONG_PASSWORD);

      // Act: Submit the form.
      startPage.submit();

      // Assert: API call happens, success message shown, redirect home.
      cy.wait('@accountDeleteLinkRequest');
      cy.getByTestId('msgContainer')
        .find('.message-success')
        .should('contain.text', 'Check your inbox in a few minutes for a email with link to confirm your account deletion.');
      cy.url().should('eq', Cypress.config().baseUrl);
    });

    it('deletes account from token page, logs out, and redirects home', () => {
      // Arrange: Stub API call to return success.
      stubAccountDeleteConfirm200();

      const accountDeletionPage = new AccountDeletionPage();

      // Act: Visit the token page as logged-in user (simulating email link)
      // and confirm deletion via button click.
      accountDeletionPage.visitAsLogged(VALID_TOKEN);
      accountDeletionPage.clickDelete();

      // Assert: API call happens.
      cy.wait('@accountDeleteConfirmRequest');

      // Assert: Success message is shown.
      cy.getByTestId('msgContainer').find('.message-success').should('contain.text', 'User account was deleted.');

      // Assert: User is logged out (JWT removed) and redirected home.
      cy.window().its('localStorage').invoke('getItem', locstJwt).should('be.null');
      cy.url().should('eq', Cypress.config().baseUrl);
    });

    it('stays on confirm page when account deletion is rejected', () => {
      // Arrange: Stub API call to reject the token.
      stubAccountDeleteConfirm404();

      const accountDeletionPage = new AccountDeletionPage();

      // Act: Visit the token page as logged-in user and confirm deletion.
      accountDeletionPage.visitAsLogged(VALID_TOKEN);
      accountDeletionPage.clickDelete();

      // Assert: API was called.
      cy.wait('@accountDeleteConfirmRequest');

      // Assert: User stays on account deletion page.
      cy.url().should('include', '/user/accountDel');

      // Assert: Error message is shown.
      cy.getByTestId('msgContainer').find('.message-error').should('contain.text', 'User token is missing.');
    });

    it('stays on start page when account deletion link request fails', () => {
      // Arrange: Stub API call to return 409 token already exists.
      stubAccountDeleteLink409();

      const startPage = new AccountDeletionStartPage();

      // Act: Visit page directly, fill form, submit.
      startPage.visit();
      startPage.fillPassword(STRONG_PASSWORD);
      startPage.submit();

      // Assert: API was called.
      cy.wait('@accountDeleteLinkRequest');

      // Assert: User stays on start page.
      cy.url().should('include', '/user/accountDelStart');

      // Assert: Error message is shown.
      cy.getByTestId('msgContainer').find('.message-error').should('contain.text', 'User token already exists.');
    });
  });

  describe('client-side validation', () => {
    it('blocks empty submission on start page', () => {
      // Stub API call to detect if it is called.
      stubAccountDeleteLink200();

      const startPage = new AccountDeletionStartPage();

      // Act: Submit empty form.
      startPage.visit();
      startPage.submit();

      // Assert: Single error message for password field.
      startPage.getErrorMessages().should('have.length', 1);
      startPage.getErrorMessages().should('contain.text', 'Field cannot be empty.');

      // Assert: API was not called and user stays on page.
      cy.get('@accountDeleteLinkRequest.all').should('have.length', 0);
      cy.url().should('include', '/user/accountDelStart');
    });

    it('shows error when password is weak (no digit) on start page', () => {
      // Stub API to detect if it is called.
      stubAccountDeleteLink200();

      const startPage = new AccountDeletionStartPage();

      // Act: Fill form with weak password and submit.
      startPage.visit();
      startPage.fillPassword('Abcdefgh@');
      startPage.submit();

      // Assert: Error message for password field.
      startPage.getErrorMessages().should('have.length', 1);
      startPage
        .getErrorMessages()
        .should('contain.text', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.');

      // Assert: API was not called.
      cy.get('@accountDeleteLinkRequest.all').should('have.length', 0);
      cy.url().should('include', '/user/accountDelStart');
    });
  });

  describe('preconditions on confirm page', () => {
    it('redirects to login when user is not logged in', () => {
      // Stub API to detect if it is called.
      stubAccountDeleteConfirm200();

      const accountDeletionPage = new AccountDeletionPage();

      // Act: Visit token page as guest (not logged in).
      accountDeletionPage.visitAsGuest(VALID_TOKEN);

      // Assert: API was not called.
      cy.get('@accountDeleteConfirmRequest.all').should('have.length', 0);

      // Assert: Failure message is shown and user redirected to login.
      cy.getByTestId('msgContainer')
        .find('.message-failure')
        .should('contain.text', 'You must be logged in to delete user account. Log in, then use link from email again.');
      cy.url().should('include', '/login');
    });

    it('redirects home when token is invalid', () => {
      // Stub API to detect if it is called.
      stubAccountDeleteConfirm200();

      const accountDeletionPage = new AccountDeletionPage();

      // Act: Visit token page as logged-in user but with an invalid token.
      accountDeletionPage.visitAsLogged('shortToken');

      // Assert: API was not called.
      cy.get('@accountDeleteConfirmRequest.all').should('have.length', 0);

      // Assert: Failure message is shown and user redirected home.
      cy.getByTestId('msgContainer').find('.message-failure').should('contain.text', 'Invalid token');
      cy.url().should('eq', Cypress.config().baseUrl);
    });
  });
});