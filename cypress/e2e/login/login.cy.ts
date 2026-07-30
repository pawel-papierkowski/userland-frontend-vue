// ////////////////////////////////////////////////////////////////////////////
// Login Page E2E Tests

import LoginPage from '../../support/pages/LoginPage';

/**
 * Generate a valid JWT token for testing that passes the expiration check.
 * Uses base64url encoding and a far-future expiration timestamp.
 */
function createTestJwt(): string {
  const encode = (obj: object): string =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const now = Math.floor(Date.now() / 1000);
  return [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({
      sub: 'test@example.com',
      name: 'Test User',
      iat: now - 60,
      exp: now + 86_400 * 365, // 1 year from now
    }),
    'fake-signature',
  ].join('.');
}

function stubLoginCall200() {
  cy.intercept('POST', '**/api/users/login', {
    statusCode: 200,
    body: { jwtToken: TEST_JWT },
  }).as('loginRequest');
}

function stubLoginCall409() {
  cy.intercept('POST', '**/api/users/login', {
    statusCode: 409,
    body: {
      detail: 'Wrong password or account was used. Access denied.',
      status: 409,
      title: 'Wrong password or account.',
    },
  }).as('loginRequest');
}

const TEST_JWT = createTestJwt();

// ////////////////////////////////////////////////////////////////////////////

describe('Login Page', () => {
  beforeEach(() => {
    cy.clearLocalStorage('app-jwt');
  });

  it('successful login redirects to home page', () => {
    // Arrange: stub API call to return a valid JWT
    stubLoginCall200();

    const loginPage = new LoginPage();

    // Act: fill credentials and submit
    loginPage.visit();
    loginPage.fillEmail('test@example.com');
    loginPage.fillPassword('Password123!');
    loginPage.submit();

    // Assert: wait for API call and verify redirect to home
    cy.wait('@loginRequest');
    cy.url().should('eq', Cypress.config().baseUrl);
  });

  it('shows error and stays on page when login fails', () => {
    // Arrange: stub API call to return 409 conflict
    stubLoginCall409();

    const loginPage = new LoginPage();

    // Act: fill credentials and submit
    loginPage.visit();
    loginPage.fillEmail('test@example.com');
    loginPage.fillPassword('WrongPassword1!');
    loginPage.submit();

    // Assert: API was called, user stays on login page, form is re-enabled
    cy.wait('@loginRequest');
    cy.url().should('include', '/login');
    loginPage.getSubmitButton().should('be.enabled');
  });

  it('shows validation errors on empty form submission', () => {
    const loginPage = new LoginPage();

    // Act: submit without filling any fields
    loginPage.visit();
    loginPage.submit();

    // Assert: two inline error messages appear (email + password)
    loginPage.getErrorMessages().should('have.length', 2);
    loginPage.getErrorMessages().each(($el) => {
      cy.wrap($el).should('not.be.empty');
    });
    cy.url().should('include', '/login');
  });

  it('navigates to registration page', () => {
    const loginPage = new LoginPage();

    // Act: click "No account?" link
    loginPage.visit();
    loginPage.clickRegistrationLink();

    // Assert: redirected to registration page
    cy.url().should('include', '/registration');
  });

  it('navigates to password reset page', () => {
    const loginPage = new LoginPage();

    // Act: click "Forgot password?" link
    loginPage.visit();
    loginPage.clickPasswordResetLink();

    // Assert: redirected to password reset start page
    cy.url().should('include', '/user/passwordResetStart');
  });

  it('redirects to home when already logged in', () => {
    // Arrange: inject a valid JWT into localStorage before app initialises
    cy.visit('/login', {
      onBeforeLoad(win: Cypress.AUTWindow): void {
        win.localStorage.setItem('app-jwt', TEST_JWT);
      },
    });

    // Assert: route guard redirects to home
    cy.url().should('eq', Cypress.config().baseUrl);
  });
});
