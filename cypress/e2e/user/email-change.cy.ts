// ////////////////////////////////////////////////////////////////////////////
// Email Change E2E Tests
// Covers the email change start page (UserEmailChangeStart.vue) and the
// token-confirmed email change page (UserEmailChange.vue).

import { locstJwt } from '@/code/data/app/storage.ts';
import UserProfilePage from '@/../cypress/support/pages/standard/UserProfilePage.ts';
import EmailChangeStartPage from '@/../cypress/support/pages/standard/EmailChangeStartPage.ts';
import EmailChangePage from '@/../cypress/support/pages/standard/EmailChangePage.ts';

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

/** Stub API call for email change link request to return success. */
function stubEmailChangeLink200() {
  cy.intercept('POST', '**/api/users/email/link', {
    statusCode: 200,
    body: {},
  }).as('emailLinkRequest');
}

/** Stub API call for email change link request to return 409 token already exists. */
function stubEmailChangeLink409() {
  cy.intercept('POST', '**/api/users/email/link', {
    statusCode: 409,
    body: {
      status: 409,
      title: 'Required token already exists.',
      detail: "Token of type 'EMAIL' already exists and is still valid. You cannot do this action twice in row.",
      instance: '/api/users/email/link',
      type: 'https://api.userland.org/errors/user/tokenExists',
      errCode: 'user_0013',
    },
  }).as('emailLinkRequest');
}

/** Stub API call for email change confirmation to return success. */
function stubEmailChangeConfirm200() {
  cy.intercept('PATCH', '**/api/users/email/confirm', {
    statusCode: 200,
    body: {},
  }).as('emailConfirmRequest');
}

/** Stub API call for email change confirmation to reject the token. */
function stubEmailChangeConfirm404() {
  cy.intercept('PATCH', '**/api/users/email/confirm', {
    statusCode: 404,
    body: {
      status: 404,
      title: 'User token is missing.',
      detail: `Token '${VALID_TOKEN}' does not exist.`,
      instance: '/api/users/email/confirm',
      type: 'https://api.userland.org/errors/user/token/missing',
      errCode: 'user_0011',
    },
  }).as('emailConfirmRequest');
}

// ////////////////////////////////////////////////////////////////////////////

describe('Email Change', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  describe('full user story', () => {
    it('sends email change link from profile and redirects home', () => {
      // Arrange: Stub API calls and log in on the profile page.
      stubUserView();
      stubEmailChangeLink200();
      cy.login('/user/profile');

      const profilePage = new UserProfilePage();

      // Act: Navigate from profile to the email change start page.
      profilePage.clickEmailChange();

      // Assert: Redirected to email change start page.
      cy.url().should('include', '/user/emailChangeStart');

      const startPage = new EmailChangeStartPage();
      startPage.fillNewEmail('new@example.com');
      startPage.fillPassword(STRONG_PASSWORD);

      // Act: Submit the form.
      startPage.submit();

      // Assert: API call happens, success message shown, redirect home.
      cy.wait('@emailLinkRequest');
      cy.getByTestId('msgContainer')
        .find('.message-success')
        .should('contain.text', 'Check your inbox in a few minutes for a email with link to confirm email address change.');
      cy.url().should('eq', Cypress.config().baseUrl);
    });

    it('applies email change from token page, logs out, and redirects home', () => {
      // Arrange: Stub API call to return success.
      stubEmailChangeConfirm200();

      const emailChangePage = new EmailChangePage();

      // Act: Visit the token page as logged-in user (simulating email link).
      // Page automatically calls the API on mount.
      emailChangePage.visitAsLogged(VALID_TOKEN);

      // Assert: API call happens.
      cy.wait('@emailConfirmRequest');

      // Assert: Success message is shown.
      cy.getByTestId('msgContainer')
        .find('.message-success')
        .should('contain.text', 'New email address was set successfully. You need to log in again.');

      // Assert: User is logged out (JWT removed) and redirected home.
      cy.window().its('localStorage').invoke('getItem', locstJwt).should('be.null');
      cy.url().should('eq', Cypress.config().baseUrl);
    });

    it('stays on confirm page when email change is rejected', () => {
      // Arrange: Stub API call to reject the token.
      stubEmailChangeConfirm404();

      const emailChangePage = new EmailChangePage();

      // Act: Visit the token page as logged-in user.
      emailChangePage.visitAsLogged(VALID_TOKEN);

      // Assert: API was called.
      cy.wait('@emailConfirmRequest');

      // Assert: User stays on email change page.
      cy.url().should('include', '/user/emailChange');

      // Assert: Spinner is stopped after failure.
      emailChangePage.getSpinner().find('.paused').should('exist');

      // Assert: Error message is shown.
      cy.getByTestId('msgContainer').find('.message-error').should('contain.text', 'User token is missing.');
    });

    it('stays on start page when email change link request fails', () => {
      // Arrange: Stub API call to return 409 token already exists.
      stubEmailChangeLink409();

      const startPage = new EmailChangeStartPage();

      // Act: Visit page directly, fill form, submit.
      startPage.visit();
      startPage.fillNewEmail('new@example.com');
      startPage.fillPassword(STRONG_PASSWORD);
      startPage.submit();

      // Assert: API was called.
      cy.wait('@emailLinkRequest');

      // Assert: User stays on start page.
      cy.url().should('include', '/user/emailChangeStart');

      // Assert: Error message is shown.
      cy.getByTestId('msgContainer').find('.message-error').should('contain.text', 'User token already exists.');
    });
  });

  describe('client-side validation', () => {
    it('blocks empty submission on start page', () => {
      // Stub API call to detect if it is called.
      stubEmailChangeLink200();

      const startPage = new EmailChangeStartPage();

      // Act: Submit empty form.
      startPage.visit();
      startPage.submit();

      // Assert: Two error messages (one per field).
      startPage.getErrorMessages().should('have.length', 2);
      startPage.getErrorMessages().each(($el) => {
        cy.wrap($el).should('contain.text', 'Field cannot be empty.');
      });

      // Assert: API was not called and user stays on page.
      cy.get('@emailLinkRequest.all').should('have.length', 0);
      cy.url().should('include', '/user/emailChangeStart');
    });

    it('shows error when email is invalid on start page', () => {
      // Stub API to detect if it is called.
      stubEmailChangeLink200();

      const startPage = new EmailChangeStartPage();

      // Act: Fill form with invalid email and submit.
      startPage.visit();
      startPage.fillNewEmail('invalid-email');
      startPage.fillPassword(STRONG_PASSWORD);
      startPage.submit();

      // Assert: Error message for email field.
      startPage.getErrorMessages().should('have.length', 1);
      startPage.getErrorMessages().should('contain.text', 'Need to enter correct email.');

      // Assert: API was not called.
      cy.get('@emailLinkRequest.all').should('have.length', 0);
      cy.url().should('include', '/user/emailChangeStart');
    });

    it('shows error when password is weak (no digit) on start page', () => {
      // Stub API to detect if it is called.
      stubEmailChangeLink200();

      const startPage = new EmailChangeStartPage();

      // Act: Fill form with weak password and submit.
      startPage.visit();
      startPage.fillNewEmail('new@example.com');
      startPage.fillPassword('Abcdefgh@');
      startPage.submit();

      // Assert: Error message for password field.
      startPage.getErrorMessages().should('have.length', 1);
      startPage
        .getErrorMessages()
        .should('contain.text', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.');

      // Assert: API was not called.
      cy.get('@emailLinkRequest.all').should('have.length', 0);
      cy.url().should('include', '/user/emailChangeStart');
    });
  });

  describe('preconditions on confirm page', () => {
    it('redirects to login when user is not logged in', () => {
      // Stub API to detect if it is called.
      stubEmailChangeConfirm200();

      const emailChangePage = new EmailChangePage();

      // Act: Visit token page as guest (not logged in).
      emailChangePage.visitAsGuest(VALID_TOKEN);

      // Assert: API was not called.
      cy.get('@emailConfirmRequest.all').should('have.length', 0);

      // Assert: Failure message is shown and user redirected to login.
      cy.getByTestId('msgContainer')
        .find('.message-failure')
        .should('contain.text', 'You must be logged in to change email address. Log in, then use link from email again.');
      cy.url().should('include', '/login');
    });

    it('redirects home when token is invalid', () => {
      // Stub API to detect if it is called.
      stubEmailChangeConfirm200();

      const emailChangePage = new EmailChangePage();

      // Act: Visit token page as logged-in user but with an invalid token.
      emailChangePage.visitAsLogged('shortToken');

      // Assert: API was not called.
      cy.get('@emailConfirmRequest.all').should('have.length', 0);

      // Assert: Failure message is shown and user redirected home.
      cy.getByTestId('msgContainer').find('.message-failure').should('contain.text', 'Invalid token');
      cy.url().should('eq', Cypress.config().baseUrl);
    });
  });
});