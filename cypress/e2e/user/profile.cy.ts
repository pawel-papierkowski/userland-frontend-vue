// ////////////////////////////////////////////////////////////////////////////
// Profile Page E2E Tests

import { locstJwt } from '@/code/data/app/storage.ts';
import UserProfilePage from '@/../cypress/support/pages/standard/UserProfilePage.ts';

/** Default user data returned by the view endpoint. Username matches the simulated JWT name. */
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
function stubUserView(userData: object = DEFAULT_USER_DATA) {
  cy.intercept('GET', '**/api/users/view', {
    statusCode: 200,
    body: userData,
  }).as('userViewRequest');
}

/** Stub API call to return 500 internal server error on profile load. */
function stubUserView500() {
  cy.intercept('GET', '**/api/users/view', {
    statusCode: 500,
    body: {
      status: 500,
      title: 'Internal server error',
    },
  }).as('userViewRequest');
}

/** Stub API call to return success on profile update. */
function stubUserEdit(delayMs: number = 0) {
  cy.intercept('PATCH', '**/api/users/edit', (req) => {
    req.on('response', (res) => {
      if (delayMs > 0) res.setDelay(delayMs);
    });
    req.reply({ statusCode: 200, body: {} });
  }).as('userEditRequest');
}

/** Stub API call to return 500 internal server error on profile update. */
function stubUserEdit500() {
  cy.intercept('PATCH', '**/api/users/edit', {
    statusCode: 500,
    body: {
      status: 500,
      title: 'Internal server error',
    },
  }).as('userEditRequest');
}

// ////////////////////////////////////////////////////////////////////////////

describe('Profile Page', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  describe('general', () => {
    it('loads and shows user data', () => {
      // Arrange: Stub API call to return user data and log in on the profile page.
      stubUserView();
      cy.login('/user/profile');

      const profilePage = new UserProfilePage();

      // Assert: Spinner is gone and form is shown.
      profilePage.getSpinner().should('not.exist');
      profilePage.getForm().should('be.visible');

      // Assert: Title is shown.
      cy.contains('h2', 'User profile');

      // Assert: Form fields are filled with user data and email is read-only.
      profilePage.getUsernameInput().should('have.value', 'Test User');
      profilePage.getEmailInput().should('have.value', 'test@example.com');
      profilePage.getEmailInput().should('be.disabled');
      profilePage.getNameInput().should('have.value', '');
      profilePage.getSurnameInput().should('have.value', '');
    });

    it('successfully updates profile and shows success message', () => {
      // Arrange: Stub API calls to return user data and successful update.
      stubUserView();
      stubUserEdit();
      cy.login('/user/profile');

      const profilePage = new UserProfilePage();

      // Act: Fill profile fields and submit.
      profilePage.fillName('John');
      profilePage.fillSurname('Smith');
      profilePage.submit();

      // Assert: API call with correct data was made.
      cy.wait('@userEditRequest');
      cy.get('@userEditRequest')
        .its('request.body')
        .should('deep.equal', {
          username: 'Test User',
          email: 'test@example.com',
          name: 'John',
          surname: 'Smith',
          lang: 'en',
          profile: {
            name: 'John',
            surname: 'Smith',
          },
        });

      // Assert: Success message is shown and user stays on profile page.
      cy.getByTestId('msgContainer').find('.message-success').should('contain.text', 'User data updated successfully.');
      cy.url().should('include', '/user/profile');
    });

    it('shows busy state on update button while request is in progress', () => {
      // Arrange: Stub API calls, with delayed update so the busy state can be observed.
      stubUserView();
      stubUserEdit(1500);
      cy.login('/user/profile');

      const profilePage = new UserProfilePage();

      // Act: Fill a profile field and submit.
      profilePage.fillName('John');
      profilePage.submit();

      // Assert: Button is disabled and shows busy label while request is in flight.
      profilePage.getSubmitButton().should('be.disabled');
      profilePage.getSubmitButton().should('contain.text', 'Updating profile...');

      // Assert: After completion button is re-enabled.
      cy.wait('@userEditRequest');
      profilePage.getSubmitButton().should('be.enabled');
    });

    it('shows error and stays on page when profile update fails', () => {
      // Arrange: Stub API calls, with update returning 500 error.
      stubUserView();
      stubUserEdit500();
      cy.login('/user/profile');

      const profilePage = new UserProfilePage();

      // Act: Fill a profile field and submit.
      profilePage.fillName('John');
      profilePage.submit();

      // Assert: API was called, user stays on profile page and button is re-enabled.
      cy.wait('@userEditRequest');
      cy.url().should('include', '/user/profile');
      profilePage.getSubmitButton().should('be.enabled');

      // Assert: Error message is shown.
      cy.getByTestId('msgContainer').find('.message-error').should('contain.text', 'Internal server error');
    });

    it('shows error and stops loading when user data load fails', () => {
      // Arrange: Stub API call to return 500 error and log in on the profile page.
      stubUserView500();
      cy.login('/user/profile');

      const profilePage = new UserProfilePage();

      // Assert: API was called, form is not shown and error message is shown.
      cy.wait('@userViewRequest');
      profilePage.getForm().should('not.exist');
      cy.getByTestId('msgContainer').find('.message-error').should('contain.text', 'Internal server error');
    });
  });

  describe('client-side validation', () => {
    it('blocks update when username is cleared', () => {
      // Arrange: Stub API calls to detect if update is called.
      stubUserView();
      stubUserEdit();
      cy.login('/user/profile');

      const profilePage = new UserProfilePage();

      // Act: Clear username and submit.
      profilePage.getUsernameInput().clear();
      profilePage.submit();

      // Assert: Single error message for username field.
      profilePage.getErrorMessages().should('have.length', 1);
      profilePage.getErrorMessages().first().should('not.be.empty');

      // Assert: API was not called and user stays on page.
      cy.get('@userEditRequest.all').should('have.length', 0);
      cy.url().should('include', '/user/profile');
    });
  });

  describe('navigation', () => {
    it('navigates to email change page', () => {
      // Arrange: Stub API call to return user data and log in on the profile page.
      stubUserView();
      cy.login('/user/profile');

      const profilePage = new UserProfilePage();

      // Act: Click the "change email address" button.
      profilePage.clickEmailChange();

      // Assert: Redirected to email change page.
      cy.url().should('include', '/user/emailChangeStart');
    });

    it('navigates to account deletion page', () => {
      // Arrange: Stub API call to return user data and log in on the profile page.
      stubUserView();
      cy.login('/user/profile');

      const profilePage = new UserProfilePage();

      // Act: Click the "delete account" button.
      profilePage.clickDeleteAccount();

      // Assert: Redirected to account deletion page.
      cy.url().should('include', '/user/accountDelStart');
    });
  });

  describe('render', () => {
    it('renders the profile form', () => {
      // Arrange: Stub API call to return user data and log in on the profile page.
      stubUserView();
      cy.login('/user/profile');

      const profilePage = new UserProfilePage();

      // Assert: All form inputs and buttons are visible.
      profilePage.getUsernameInput().should('be.visible');
      profilePage.getEmailInput().should('be.visible');
      profilePage.getNameInput().should('be.visible');
      profilePage.getSurnameInput().should('be.visible');
      profilePage.getSubmitButton().should('be.visible');
      profilePage.getEmailChangeButton().should('be.visible');
      profilePage.getDeleteAccountButton().should('be.visible');
    });
  });

  describe('admin panel variant', () => {
    it('renders admin profile title when accessed via admin panel', () => {
      // Arrange: Stub API call to return user data and log in on the admin profile page.
      stubUserView();
      cy.login('/admin/profile', [{ prefix: 'role', suffix: 'admin' }]);

      // Assert: Admin panel title is shown.
      cy.contains('h2', 'User profile for administration panel');
    });
  });

  describe('access control', () => {
    it('redirects to login page when not logged in', () => {
      // Arrange: Stub API call to detect if it is called.
      stubUserView();

      // Act: Visit the profile page without logging in.
      cy.visitUserLand('/user/profile');

      // Assert: Redirected to login page and no API call was made.
      cy.url().should('include', '/login');
      cy.get('@userViewRequest.all').should('have.length', 0);
    });
  });
});
