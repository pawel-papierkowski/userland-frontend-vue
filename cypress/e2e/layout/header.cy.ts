// ////////////////////////////////////////////////////////////////////////////
// Header Menu Options E2E Tests
// Tests which options are present in the header navigation (bar + user menu)
// depending on whether user is logged in. Covers both the standard webpage
// header and the administration panel header.

import { locstJwt } from '@/code/data/app/storage.ts';

import StandardHeaderPage from '@/../cypress/support/pages/layout/StandardHeaderPage.ts';
import AdminHeaderPage from '@/../cypress/support/pages/layout/AdminHeaderPage.ts';

// ////////////////////////////////////////////////////////////////////////////

describe('Standard Header', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  describe('not logged', () => {
    it('shows only options available to unlogged users', () => {
      // Arrange: Visit the home page without logging in.
      cy.visitUserLand('/');

      const header = new StandardHeaderPage();

      // Assert: Links always shown for everyone are visible.
      header.getHomeLink().should('be.visible');
      header.getTestLink().should('be.visible');
      header.getDebugLink().should('be.visible');

      // Assert: Login and registration links are visible.
      header.getLoginLink().should('be.visible');
      header.getRegistrationLink().should('be.visible');

      // Assert: Options reserved for logged users are not present.
      header.getMemberLink().should('not.exist');
      header.getOptionsTrigger().should('not.exist');
      header.getProfileLink().should('not.exist');
      header.getLogoutLink().should('not.exist');
    });
  });

  describe('logged', () => {
    it('shows only options available to logged users', () => {
      // Arrange: Log in and visit the home page.
      cy.login('/');

      const header = new StandardHeaderPage();

      // Assert: Links always shown for everyone are visible.
      header.getHomeLink().should('be.visible');
      header.getTestLink().should('be.visible');
      header.getDebugLink().should('be.visible');

      // Assert: Member zone link and options dropdown trigger are visible.
      header.getMemberLink().should('be.visible');
      header.getOptionsTrigger().should('be.visible');

      // Assert: Login and registration links are not present.
      header.getLoginLink().should('not.exist');
      header.getRegistrationLink().should('not.exist');

      // Act: Open the options dropdown.
      header.openOptionsDropdown();

      // Assert: Profile and logout are shown in the dropdown.
      header.getProfileLink().should('be.visible');
      header.getLogoutLink().should('be.visible');
    });
  });
});

describe('Admin Header', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  describe('not logged', () => {
    it('shows no options on the admin login page', () => {
      // Arrange: Visit the admin login page without logging in.
      cy.visitUserLand('/admin');

      const header = new AdminHeaderPage();

      // Assert: No admin panel navigation options are present.
      header.getMainLink().should('not.exist');
      header.getUsersLink().should('not.exist');
      header.getLoginLink().should('not.exist');
      header.getOptionsTrigger().should('not.exist');
      header.getProfileLink().should('not.exist');
      header.getLogoutLink().should('not.exist');
    });
  });

  describe('logged', () => {
    it('shows options available to admin', () => {
      // Arrange: Log in as admin and visit the admin main page.
      cy.login('/admin/main', [{ prefix: 'role', suffix: 'admin' }]);

      const header = new AdminHeaderPage();

      // Assert: Main and users links and options dropdown trigger are visible.
      header.getMainLink().should('be.visible');
      header.getUsersLink().should('be.visible');
      header.getOptionsTrigger().should('be.visible');

      // Assert: Login link is not present.
      header.getLoginLink().should('not.exist');

      // Act: Open the options dropdown.
      header.openOptionsDropdown();

      // Assert: Profile and logout are shown in the dropdown.
      header.getProfileLink().should('be.visible');
      header.getLogoutLink().should('be.visible');
    });

    it('shows options available to operator without any additional permissions', () => {
      // Arrange: Log in as admin and visit the admin main page.
      cy.login('/admin/main', [{ prefix: 'role', suffix: 'operator' }]);

      const header = new AdminHeaderPage();

      // Assert: Main and users links and options dropdown trigger are visible.
      header.getMainLink().should('be.visible');
      header.getUsersLink().should('not.exist');
      header.getOptionsTrigger().should('be.visible');

      // Assert: Login link is not present.
      header.getLoginLink().should('not.exist');

      // Act: Open the options dropdown.
      header.openOptionsDropdown();

      // Assert: Profile and logout are shown in the dropdown.
      header.getProfileLink().should('be.visible');
      header.getLogoutLink().should('be.visible');
    });

    it('shows options available to operator with user permissions', () => {
      // Arrange: Log in as admin and visit the admin main page.
      cy.login('/admin/main', [{ prefix: 'role', suffix: 'operator' }, { prefix: 'user', suffix: 'view' }]);

      const header = new AdminHeaderPage();

      // Assert: Main and users links and options dropdown trigger are visible.
      header.getMainLink().should('be.visible');
      header.getUsersLink().should('be.visible');
      header.getOptionsTrigger().should('be.visible');

      // Assert: Login link is not present.
      header.getLoginLink().should('not.exist');

      // Act: Open the options dropdown.
      header.openOptionsDropdown();

      // Assert: Profile and logout are shown in the dropdown.
      header.getProfileLink().should('be.visible');
      header.getLogoutLink().should('be.visible');
    });
  });
});
