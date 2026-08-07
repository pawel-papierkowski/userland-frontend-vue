// ////////////////////////////////////////////////////////////////////////////
// Password Reset E2E Tests
// Covers the password reset start page (UserPasswordResetStart.vue) and the
// token-confirmed reset page (UserPasswordReset.vue).

import { locstJwt } from '@/code/data/app/storage.ts';
import LoginPage from '@/../cypress/support/pages/standard/LoginPage.ts';
import PasswordResetStartPage from '@/../cypress/support/pages/standard/PasswordResetStartPage.ts';
import PasswordResetPage from '@/../cypress/support/pages/standard/PasswordResetPage.ts';

/** A token that passes the frontend format check (32 alphanumeric characters). */
const VALID_TOKEN = 'eYPpy5aSWA9Rfvz8563gtCUj0nHkuwWs';

/** Password that meets the strength requirements (digit, case, special char). */
const STRONG_PASSWORD = 'n3wP@s5w0rD';

/** Stub API call for password reset link request to return success. */
function stubPasswordResetLink200() {
  cy.intercept('POST', '**/api/users/password/link', {
    statusCode: 200,
    body: {},
  }).as('passwordResetLinkRequest');
}

/** Stub API call for password reset link request to return 404 user not found. */
function stubPasswordResetLink404() {
  cy.intercept('POST', '**/api/users/password/link', {
    statusCode: 404,
    body: {
      status: 404,
      title: 'User cannot be found.',
      detail: "User with email 'unknown@example.com' does not exist.",
      instance: '/api/users/password/link',
      type: 'https://api.userland.org/errors/user/doesNotExist',
      errCode: 'user_0001',
    },
  }).as('passwordResetLinkRequest');
}

/** Stub API call for password reset confirmation to return success. */
function stubPasswordResetConfirm200() {
  cy.intercept('PATCH', '**/api/users/password/confirm', {
    statusCode: 200,
    body: {},
  }).as('passwordResetConfirmRequest');
}

/** Stub API call for password reset confirmation to reject the token. */
function stubPasswordResetConfirm404() {
  cy.intercept('PATCH', '**/api/users/password/confirm', {
    statusCode: 404,
    body: {
      status: 404,
      title: 'User token is missing.',
      detail: `Token '${VALID_TOKEN}' does not exist.`,
      instance: '/api/users/password/confirm',
      type: 'https://api.userland.org/errors/user/token/missing',
      errCode: 'user_0011',
    },
  }).as('passwordResetConfirmRequest');
}

// ////////////////////////////////////////////////////////////////////////////

describe('Password Reset', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  describe('full user story', () => {
    it('sends reset link from start page and redirects home', () => {
      // Arrange: Stub API call to return success.
      stubPasswordResetLink200();

      const loginPage = new LoginPage();

      // Act: Navigate from login page to password reset start page.
      loginPage.visit(false);
      loginPage.clickPasswordResetLink();

      // Assert: Redirected to password reset start page.
      cy.url().should('include', '/user/passwordResetStart');

      const startPage = new PasswordResetStartPage();
      startPage.fillEmail('test@example.com');

      // Act: Submit the form.
      startPage.submit();

      // Assert: API call happens, success message shown, redirect home.
      cy.wait('@passwordResetLinkRequest');
      cy.getByTestId('msgContainer')
        .find('.message-success')
        .should('contain.text', 'Check your inbox in a few minutes for a email with link to password change.');
      cy.url().should('eq', Cypress.config().baseUrl);
    });

    it('confirms new password from token page and redirects to login', () => {
      // Arrrange: Stub API call to return success.
      stubPasswordResetConfirm200();

      const resetPage = new PasswordResetPage();

      // Act: Visit the token page (simulating link from email) and fill form.
      resetPage.visit(VALID_TOKEN);
      resetPage.fillPassword(STRONG_PASSWORD);
      resetPage.fillConfirmPassword(STRONG_PASSWORD);
      resetPage.submit();

      // Assert: API call happens.
      cy.wait('@passwordResetConfirmRequest');

      // Assert: Success message is shown.
      cy.getByTestId('msgContainer').find('.message-success').should('contain.text', 'New password was set successfully.');

      // Assert: User is redirected to login page.
      cy.url().should('include', '/login');
    });

    it('stays on confirm page when token is rejected', () => {
      // Arrange: Stub API call to reject the token.
      stubPasswordResetConfirm404();

      const resetPage = new PasswordResetPage();

      // Act: Visit page with wrong token and fill form.
      resetPage.visit(VALID_TOKEN);
      resetPage.fillPassword(STRONG_PASSWORD);
      resetPage.fillConfirmPassword(STRONG_PASSWORD);
      resetPage.submit();

      // Assert: API was called.
      cy.wait('@passwordResetConfirmRequest');

      // Assert: User stays on password reset page.
      cy.url().should('include', '/user/passwordReset');

      // Assert: Error message is shown.
      cy.getByTestId('msgContainer').find('.message-error').should('contain.text', 'User token is missing.');
    });

    it('stays on start page when reset link request fails', () => {
      // Arrange: Stub API call to return 404 user not found.
      stubPasswordResetLink404();

      const startPage = new PasswordResetStartPage();

      // Act: Visit page directly, fill form, submit.
      startPage.visit();
      startPage.fillEmail('unknown@example.com');
      startPage.submit();

      // Assert: API was called.
      cy.wait('@passwordResetLinkRequest');

      // Assert: User stays on start page.
      cy.url().should('include', '/user/passwordResetStart');

      // Assert: Error message is shown.
      cy.getByTestId('msgContainer').find('.message-error').should('contain.text', 'User not found.');
    });
  });

  describe('client-side validation', () => {
    it('blocks empty submission on start page', () => {
      // Stub API call to detect if it is called.
      stubPasswordResetLink200();

      const startPage = new PasswordResetStartPage();

      // Act: Submit empty form.
      startPage.visit();
      startPage.submit();

      // Assert: Single error message for email field.
      startPage.getErrorMessages().should('have.length', 1);
      startPage.getErrorMessages().should('contain.text', 'Field cannot be empty.');

      // Assert: API was not called and user stays on page.
      cy.get('@passwordResetLinkRequest.all').should('have.length', 0);
      cy.url().should('include', '/user/passwordResetStart');
    });

    it('shows error when email is invalid on start page', () => {
      // Stub API so detect if it is called.
      stubPasswordResetLink200();

      const startPage = new PasswordResetStartPage();

      // Act: Fill form with invalid email and submit.
      startPage.visit();
      startPage.fillEmail('invalid-email');
      startPage.submit();

      // Assert: Error message for email field.
      startPage.getErrorMessages().should('have.length', 1);
      startPage.getErrorMessages().should('contain.text', 'Need to enter correct email.');

      // Assert: API was not called.
      cy.get('@passwordResetLinkRequest.all').should('have.length', 0);
      cy.url().should('include', '/user/passwordResetStart');
    });

    it('blocks empty submission on confirm page', () => {
      // Stub API to detect if it is called.
      stubPasswordResetConfirm200();

      const resetPage = new PasswordResetPage();

      // Act: Submit empty form.
      resetPage.visit(VALID_TOKEN);
      resetPage.submit();

      // Assert: Two error messages (one per field).
      resetPage.getErrorMessages().should('have.length', 2);
      resetPage.getErrorMessages().each(($el) => {
        cy.wrap($el).should('contain.text', 'Field cannot be empty.');
      });

      // Assert: API was not called.
      cy.get('@passwordResetConfirmRequest.all').should('have.length', 0);
      cy.url().should('include', '/user/passwordReset');
    });

    it('shows error when passwords do not match on confirm page', () => {
      // Stub API to detect if it is called.
      stubPasswordResetConfirm200();

      const resetPage = new PasswordResetPage();

      // Act: Fill form with mismatching passwords and submit.
      resetPage.visit(VALID_TOKEN);
      resetPage.fillPassword('Password123!');
      resetPage.fillConfirmPassword('Different123!');
      resetPage.submit();

      // Assert: Single error message on confirm password field.
      resetPage.getErrorMessages().should('have.length', 1);
      resetPage.getErrorMessages().should('contain.text', 'Passwords do not match.');

      // Assert: API was not called and no redirection.
      cy.get('@passwordResetConfirmRequest.all').should('have.length', 0);
      cy.url().should('include', '/user/passwordReset');
    });

    it('shows error when password is weak (no digit) on confirm page', () => {
      // Stub API to detect if it is called.
      stubPasswordResetConfirm200();

      const resetPage = new PasswordResetPage();

      // Act: Fill form with password missing a digit.
      resetPage.visit(VALID_TOKEN);
      resetPage.fillPassword('Abcdefgh@');
      resetPage.fillConfirmPassword('Abcdefgh@');
      resetPage.submit();

      // Assert: Single error message on password field.
      resetPage.getErrorMessages().should('have.length', 1);
      resetPage
        .getErrorMessages()
        .should('contain.text', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.');

      // Assert: API was not called.
      cy.get('@passwordResetConfirmRequest.all').should('have.length', 0);
      cy.url().should('include', '/user/passwordReset');
    });

    it('shows error when token is invalid on confirm page', () => {
      // Stub API to detect if it is called.
      stubPasswordResetConfirm200();

      // Act: Visit without a token.
      const resetPage = new PasswordResetPage();
      resetPage.visit('');

      // Assert: API was not called.
      cy.get('@passwordResetConfirmRequest.all').should('have.length', 0);

      // Assert: Failure message is shown and user redirected home.
      cy.getByTestId('msgContainer').find('.message-failure').should('contain.text', 'Invalid token');
      cy.url().should('eq', Cypress.config().baseUrl);
    });
  });
});