// ////////////////////////////////////////////////////////////////////////////
// Login Page E2E Tests

import LoginPage from '../../support/pages/standard/LoginPage.ts';

/**
 * Generate a valid JWT token for testing that passes the expiration check.
 * Uses base64url encoding and a far-future expiration timestamp.
 * @param permissions Optional list of permissions to encode in token. Entry prefix and suffix are joined with
 * underscore, e.g. `{ prefix: 'role', suffix: 'admin' }` encodes permission 'role_admin'. Multiple suffixes
 * of the same prefix are comma-separated in a single claim.
 * @returns JWT token as string.
 */
function createTestJwt(permissions: { prefix: string; suffix: string }[] = []): string {
  const encode = (obj: object): string =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const now = Math.floor(Date.now() / 1000);
  const claims: Record<string, string | number> = {
    sub: 'test@example.com',
    name: 'Test User',
    iat: now - 60,
    exp: now + 86_400 * 365, // 1 year from now
  };

  // Encode permissions as custom claims (example: 'role' claim with value 'admin' -> 'role_admin').
  for (const perm of permissions) {
    const existing = claims[perm.prefix];
    claims[perm.prefix] = typeof existing === 'string' ? `${existing},${perm.suffix}` : perm.suffix;
  }

  return [encode({ alg: 'HS256', typ: 'JWT' }), encode(claims), 'fake-signature'].join('.');
}

function stubLoginCall200(jwtToken: string = TEST_JWT) {
  cy.intercept('POST', '**/api/users/login', {
    statusCode: 200,
    body: { jwtToken: jwtToken },
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

  describe('general', () => {
    it('successful login redirects to home page', () => {
      // Arrange: Stub API call to return a valid JWT.
      stubLoginCall200();

      const loginPage = new LoginPage();

      // Act: Fill credentials and submit
      loginPage.visit(false);
      loginPage.fillEmail('test@example.com');
      loginPage.fillPassword('Password123!');
      loginPage.submit();

      // Assert: Wait for API call and verify redirect to home.
      cy.wait('@loginRequest');
      cy.url().should('eq', Cypress.config().baseUrl);
    });

    it('shows error and stays on page when login fails', () => {
      // Arrange: Stub API call to return 409 conflict.
      stubLoginCall409();

      const loginPage = new LoginPage();

      // Act: Fill credentials and submit.
      loginPage.visit(false);
      loginPage.fillEmail('test@example.com');
      loginPage.fillPassword('WrongPassword1!');
      loginPage.submit();

      // Assert: API was called, user stays on login page, form is re-enabled.
      cy.wait('@loginRequest');
      cy.url().should('include', '/login');
      loginPage.getSubmitButton().should('be.enabled');
    });

    it('shows validation errors on empty form submission', () => {
      const loginPage = new LoginPage();

      // Act: Submit without filling any fields.
      loginPage.visit(false);
      loginPage.submit();

      // Assert: Two inline error messages appear (email + password).
      loginPage.getErrorMessages().should('have.length', 2);
      loginPage.getErrorMessages().each(($el) => {
        cy.wrap($el).should('not.be.empty');
      });
      cy.url().should('include', '/login');
    });

    it('navigates to registration page', () => {
      const loginPage = new LoginPage();

      // Act: Click "No account?" link.
      loginPage.visit(false);
      loginPage.clickRegistrationLink();

      // Assert: Redirected to registration page.
      cy.url().should('include', '/registration');
    });

    it('navigates to password reset page', () => {
      const loginPage = new LoginPage();

      // Act: Click "Forgot password?" link.
      loginPage.visit(false);
      loginPage.clickPasswordResetLink();

      // Assert: Redirected to password reset start page.
      cy.url().should('include', '/user/passwordResetStart');
    });

    it('redirects to home when already logged in', () => {
      // Arrange: Inject a valid JWT into localStorage before app initialises.
      cy.visit('/login', {
        onBeforeLoad(win: Cypress.AUTWindow): void {
          win.localStorage.setItem('app-jwt', TEST_JWT);
        },
      });

      // Assert: Route guard redirects to home.
      cy.url().should('eq', Cypress.config().baseUrl);
    });
  });

  describe('admin panel access', () => {
    it('kicks out user without needed permission when accessing admin panel', () => {
      // Arrange: Stub API call to return a valid JWT without any permissions.
      stubLoginCall200(createTestJwt());

      const loginPage = new LoginPage();

      // Act: Log in on standard page, then try to open admin main page.
      loginPage.visit(false);
      loginPage.fillEmail('test@example.com');
      loginPage.fillPassword('Password123!');
      loginPage.submit();

      cy.wait('@loginRequest');
      cy.url().should('eq', Cypress.config().baseUrl); // login redirects to home

      cy.visit('/admin/main');

      // Assert: Route guard kicks user out back to home page.
      cy.url().should('eq', Cypress.config().baseUrl);
    });

    it('allows user with needed permission to access admin panel', () => {
      // Arrange: Stub API call to return a valid JWT with role_admin permission.
      stubLoginCall200(createTestJwt([{ prefix: 'role', suffix: 'admin' }]));

      const loginPage = new LoginPage();

      // Act: Log in on standard page, then open admin main page.
      loginPage.visit(false);
      loginPage.fillEmail('test@example.com');
      loginPage.fillPassword('Password123!');
      loginPage.submit();

      cy.wait('@loginRequest');
      cy.url().should('eq', Cypress.config().baseUrl); // login redirects to home

      cy.visit('/admin/main');

      // Assert: User stays on admin main page.
      cy.url().should('include', '/admin/main');
    });
  });

  describe('admin login page', () => {
    it('redirects to admin main page when logging in with needed permission', () => {
      // Arrange: Stub API call to return a valid JWT with role_admin permission.
      stubLoginCall200(createTestJwt([{ prefix: 'role', suffix: 'admin' }]));

      const loginPage = new LoginPage();

      // Act: Fill credentials and submit on admin login page.
      loginPage.visit(true);
      loginPage.fillEmail('test@example.com');
      loginPage.fillPassword('Password123!');
      loginPage.submit();

      // Assert: Wait for API call and verify redirect to admin main page.
      cy.wait('@loginRequest');
      cy.url().should('include', '/admin/main');
    });

    it('redirects to home page when logging in without needed permission', () => {
      // Arrange: Stub API call to return a valid JWT without any permissions.
      stubLoginCall200(createTestJwt());

      const loginPage = new LoginPage();

      // Act: Fill credentials and submit on admin login page.
      loginPage.visit(true);
      loginPage.fillEmail('test@example.com');
      loginPage.fillPassword('Password123!');
      loginPage.submit();

      // Assert: Wait for API call and verify redirect to home page.
      cy.wait('@loginRequest');
      cy.url().should('eq', Cypress.config().baseUrl);
    });
  });
});
