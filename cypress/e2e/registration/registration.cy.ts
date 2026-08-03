// ////////////////////////////////////////////////////////////////////////////
// Registration Page E2E Tests

import { locstJwt } from '@/code/data/app/storage.ts';
import RegistrationPage from '@/../cypress/support/pages/standard/RegistrationPage.ts';

/** Stub API call to return successful registration. */
function stubRegisterCall200(delayMs: number = 0) {
  cy.intercept('POST', '**/api/users/register', (req) => {
    req.on('response', (res) => {
      if (delayMs > 0) res.setDelay(delayMs);
    });
    req.reply({ statusCode: 200, body: {} });
  }).as('registerRequest');
}

/** Stub API call to return 500 internal server error. */
function stubRegisterCall500() {
  cy.intercept('POST', '**/api/users/register', {
    statusCode: 500,
    body: {
      status: 500,
      title: 'Internal server error',
      detail: 'The server has encountered a situation it does not know how to handle.',
    },
  }).as('registerRequest');
}

// ////////////////////////////////////////////////////////////////////////////

describe('Registration Page', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  describe('general', () => {
    it('successful registration redirects to home page and shows success message', () => {
      // Arrange: Stub API call to return success.
      stubRegisterCall200();

      const registrationPage = new RegistrationPage();

      // Act: Fill form with correct data and submit.
      registrationPage.visit();
      registrationPage.fillUsername('testuser');
      registrationPage.fillEmail('test@example.com');
      registrationPage.fillPassword('Password123!');
      registrationPage.fillConfirmPassword('Password123!');
      registrationPage.submit();

      // Assert: Wait for API call and verify redirect to home.
      cy.wait('@registerRequest');
      cy.url().should('eq', Cypress.config().baseUrl);

      // Assert: Success message is shown.
      cy.getByTestId('msgContainer').find('.message-success').should('contain.text', 'User registered successfully');
    });

    it('sends isAdmin true when admin checkbox is checked', () => {
      // Arrange: Stub API call to return success.
      stubRegisterCall200();

      const registrationPage = new RegistrationPage();

      // Act: Visit and check admin checkbox.
      registrationPage.visit();
      registrationPage.checkIsAdmin();

      // Assert: Checkbox is checked.
      registrationPage.getIsAdminCheckbox().find('[role="checkbox"]').should('have.attr', 'aria-checked', 'true');

      // Act: Fill form and submit.
      registrationPage.fillUsername('testuser');
      registrationPage.fillEmail('test@example.com');
      registrationPage.fillPassword('Password123!');
      registrationPage.fillConfirmPassword('Password123!');
      registrationPage.submit();

      // Assert: Registration succeeds.
      cy.wait('@registerRequest');
      cy.url().should('eq', Cypress.config().baseUrl);
    });

    it('shows busy state on submit button while request is in progress', () => {
      // Arrange: Stub API call with delay so the busy state can be observed.
      stubRegisterCall200(1500);

      const registrationPage = new RegistrationPage();

      // Act: Fill form with correct data and submit.
      registrationPage.visit();
      registrationPage.fillUsername('testuser');
      registrationPage.fillEmail('test@example.com');
      registrationPage.fillPassword('Password123!');
      registrationPage.fillConfirmPassword('Password123!');
      registrationPage.submit();

      // Assert: Button is disabled and shows busy label while request is in flight.
      registrationPage.getSubmitButton().should('be.disabled');
      registrationPage.getSubmitButton().should('contain.text', 'Creating account...');

      // Assert: After completion user is redirected to home.
      cy.wait('@registerRequest');
      cy.url().should('eq', Cypress.config().baseUrl);
    });

    it('shows error and stays on page when server returns 500', () => {
      // Arrange: Stub API call to return 500 error.
      stubRegisterCall500();

      const registrationPage = new RegistrationPage();

      // Act: Fill form with correct data and submit.
      registrationPage.visit();
      registrationPage.fillUsername('testuser');
      registrationPage.fillEmail('test@example.com');
      registrationPage.fillPassword('Password123!');
      registrationPage.fillConfirmPassword('Password123!');
      registrationPage.submit();

      // Assert: API was called, user stays on registration page, form is re-enabled.
      cy.wait('@registerRequest');
      cy.url().should('include', '/registration');
      registrationPage.getSubmitButton().should('be.enabled');

      // Assert: Error message is shown.
      cy.getByTestId('msgContainer').find('.message-error').should('contain.text', 'Internal server error');
    });
  });

  describe('client-side validation', () => {
    it('shows validation errors on empty form submission', () => {
      // Arrange: Stub API call to detect if it is called.
      stubRegisterCall200();

      const registrationPage = new RegistrationPage();

      // Act: Submit without filling any fields.
      registrationPage.visit();
      registrationPage.submit();

      // Assert: Four inline error messages appear (one per required field).
      registrationPage.getErrorMessages().should('have.length', 4);
      registrationPage.getErrorMessages().each(($el) => {
        cy.wrap($el).should('not.be.empty');
      });

      // Assert: API was not called and user stays on page.
      cy.get('@registerRequest.all').should('have.length', 0);
      cy.url().should('include', '/registration');
    });

    it('shows error when email is invalid', () => {
      // Arrange: Stub API call to detect if it is called.
      stubRegisterCall200();

      const registrationPage = new RegistrationPage();

      // Act: Fill form with invalid email and submit.
      registrationPage.visit();
      registrationPage.fillUsername('testuser');
      registrationPage.fillEmail('invalid-email');
      registrationPage.fillPassword('Password123!');
      registrationPage.fillConfirmPassword('Password123!');
      registrationPage.submit();

      // Assert: Single error message for email field.
      registrationPage.getErrorMessages().should('have.length', 1);
      registrationPage.getErrorMessages().first().should('contain.text', 'Need to enter correct email.');

      // Assert: API was not called.
      cy.get('@registerRequest.all').should('have.length', 0);
      cy.url().should('include', '/registration');
    });

    it('shows error when password is weak (no digit)', () => {
      // Arrange: Stub API call to detect if it is called.
      stubRegisterCall200();

      const registrationPage = new RegistrationPage();

      // Act: Fill form with password missing a digit and submit.
      registrationPage.visit();
      registrationPage.fillUsername('testuser');
      registrationPage.fillEmail('test@example.com');
      registrationPage.fillPassword('Abcdefgh@');
      registrationPage.fillConfirmPassword('Abcdefgh@');
      registrationPage.submit();

      // Assert: Single error message for password field.
      registrationPage.getErrorMessages().should('have.length', 1);
      registrationPage
        .getErrorMessages()
        .first()
        .should('contain.text', 'Password must contain at least one uppercase letter');

      // Assert: API was not called.
      cy.get('@registerRequest.all').should('have.length', 0);
      cy.url().should('include', '/registration');
    });

    it('shows error when passwords do not match', () => {
      // Arrange: Stub API call to detect if it is called.
      stubRegisterCall200();

      const registrationPage = new RegistrationPage();

      // Act: Fill form with mismatching passwords and submit.
      registrationPage.visit();
      registrationPage.fillUsername('testuser');
      registrationPage.fillEmail('test@example.com');
      registrationPage.fillPassword('Password123!');
      registrationPage.fillConfirmPassword('Different123!');
      registrationPage.submit();

      // Assert: Single error message for confirm password field.
      registrationPage.getErrorMessages().should('have.length', 1);
      registrationPage.getErrorMessages().first().should('contain.text', 'Passwords do not match.');

      // Assert: API was not called.
      cy.get('@registerRequest.all').should('have.length', 0);
      cy.url().should('include', '/registration');
    });
  });

  describe('navigation', () => {
    it('navigates to login page when "already have account" link is clicked', () => {
      const registrationPage = new RegistrationPage();

      // Act: Click the "I already have an account" link.
      registrationPage.visit();
      registrationPage.clickLoginLink();

      // Assert: Redirected to login page.
      cy.url().should('include', '/login');
    });
  });

  describe('render', () => {
    it('renders the registration form', () => {
      const registrationPage = new RegistrationPage();

      // Act: Visit the registration page.
      registrationPage.visit();

      // Assert: Title is visible.
      cy.contains('h2', 'Create an account');

      // Assert: All form inputs are visible.
      registrationPage.getUsernameInput().should('be.visible');
      registrationPage.getEmailInput().should('be.visible');
      registrationPage.getPasswordInput().should('be.visible');
      registrationPage.getConfirmPasswordInput().should('be.visible');

      // Assert: Warning and notify messages are visible.
      cy.contains('.onpage-msg.warning', 'Important note:');
      cy.contains('.onpage-msg.info', 'First connection with server');
    });
  });
});
