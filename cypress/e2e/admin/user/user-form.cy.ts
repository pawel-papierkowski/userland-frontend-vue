// ////////////////////////////////////////////////////////////////////////////
// Admin User Form E2E Tests
// Tests main user form (AdminUserMain) that shows and edits a single selected user.

import type { UserFullDataResp } from '@/code/data/features/user/admin-user-type.ts';
import { locstJwt } from '@/code/data/app/storage.ts';

import { stubUserTable, stubUserData, stubUserSubTables, expectSubTabCalls } from '@/../cypress/support/helpers/user.ts';
import type { UserTableEntry } from '@/../cypress/support/helpers/user.ts';
import AdminUserFormPage from '@/../cypress/support/pages/admin/AdminUserFormPage.ts';

/** Full users loaded from the fixture. Populated in `before()`. */
let fullUsers: UserFullDataResp[] = [];

/** Editable user (ivy, id 9) used in the editable-form tests. */
const ivyTableEntry: UserTableEntry = {
  id: 9,
  createdAt: '2024-09-10T12:00:00Z',
  username: 'ivy',
  email: 'ivy@test.com',
  status: 'ACTIVE',
};

/** Own-account user (testuser, id 10) whose email matches the logged-in admin. */
const selfTableEntry: UserTableEntry = {
  id: 10,
  createdAt: '2024-09-11T12:00:00Z',
  username: 'testuser',
  email: 'test@example.com',
  status: 'ACTIVE',
};

/** Load the fixture data once before all tests. */
before(() => {
  cy.fixture('admin/user-full.json').then((data: { users: UserFullDataResp[] }) => {
    fullUsers = data.users;
  });
});

// ////////////////////////////////////////////////////////////////////////////
// Stubs

/** Stub the load-user-data API to fail with a 500 error. */
function stubUserDataError() {
  cy.intercept('GET', '**/api/admin/user/*', (req) => {
    req.reply({ statusCode: 500, body: { errCode: 500 } });
  }).as('userDataRequest');
}

/**
 * Stub the edit-user-data API. It applies the PATCH payload over the current
 * state and replies with the updated full user (mirrors backend behavior).
 * @param initial Initial full user data.
 */
function stubEditUser(initial: UserFullDataResp) {
  const current: UserFullDataResp = { ...initial };
  cy.intercept('PATCH', '**/api/admin/user', (req) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = req.body as any;
    current.username = body.username ?? current.username;
    current.email = body.email ?? current.email;
    current.locked = body.locked ?? current.locked;
    current.profile = body.profile ?? current.profile;
    current.modifiedAt = '2024-10-05T12:00:00Z';
    req.reply({ statusCode: 200, body: { ...current } });
  }).as('userEditRequest');
}

/** Stub the edit-user-data API to fail with a 500 error. */
function stubEditUserError() {
  cy.intercept('PATCH', '**/api/admin/user', (req) => {
    req.reply({ statusCode: 500, body: { errCode: 500 } });
  }).as('userEditRequest');
}

/** All user sub-tab table endpoints that we do not care about. */
const subTableEndpoints: string[] = ['history', 'permissions', 'configs', 'tokens', 'jwt'] as const;

// ////////////////////////////////////////////////////////////////////////////

describe('Admin User Form', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  // //////////////////////////////////////////////////////////////////////////
  // Initial state

  describe('initial state', () => {
    it('shows form with disabled inputs when no user is selected', () => {
      // Arrange: Stub the table API and log in on the page.
      stubUserTable([ivyTableEntry]);
      const page = new AdminUserFormPage();
      page.visit();
      cy.wait('@userTableRequest');

      // Assert: Form is rendered (no user selected yet) but all inputs are disabled.
      page.getForm().should('be.visible');
      page.getUsernameInput().should('be.disabled');
      page.getEmailInput().should('be.disabled');
      page.getNameInput().should('be.disabled');
      page.getSurnameInput().should('be.disabled');
      page.getUpdateButton().should('be.disabled');
      page.getLockButton().should('be.disabled');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Loading user data

  describe('loading user data', () => {
    it('loads and shows selected user data in the form', () => {
      // Arrange: Stub table and full-data APIs, log in on the page.
      stubUserTable([ivyTableEntry]);
      const ivyFull = fullUsers.find((u) => u.id === 9)!;
      stubUserData([ivyFull]);
      const page = new AdminUserFormPage();
      page.visit();
      cy.wait('@userTableRequest');

      // Act: Select the user row to trigger loading of user data.
      page.selectUserRow(0);

      // Assert: Wait for the load and verify the form is populated with user data.
      cy.wait('@userDataRequest');
      page.getCreatedAt().should('contain.text', '2024-09-10');
      page.getModifiedAt().should('contain.text', '2024-10-01');
      page.getUsernameInput().should('have.value', 'ivy');
      page.getEmailInput().should('have.value', 'ivy@test.com');
      page.getStatus().should('contain.text', 'Active');
      page.getLocked().should('contain.text', 'false');
      page.getLang().should('contain.text', 'English');
      page.getNameInput().should('have.value', 'Ivy');
      page.getSurnameInput().should('have.value', 'Taylor');
    });

    it('shows error message and no form when loading fails', () => {
      // Arrange: Stub the table API and a failing full-data API, log in.
      stubUserTable([ivyTableEntry]);
      stubUserDataError();
      stubUserSubTables(subTableEndpoints);
      const page = new AdminUserFormPage();
      page.visit();
      cy.wait('@userTableRequest');

      // Act: Select the user row to trigger a failing load.
      page.selectUserRow(0);

      // Assert: Wait for the failed load and verify an error message is shown.
      cy.wait('@userDataRequest');
      cy.getByTestId('msgContainer').find('.message-error').should('contain.text', 'Internal server error');

      // Assert: Form stays hidden (loading never completed).
      page.getForm().should('not.exist');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Update

  describe('update', () => {
    it('updates user data and refreshes the form', () => {
      // Arrange: Stub table and edit APIs, log in and select the user.
      stubUserTable([ivyTableEntry]);
      const ivyFull = fullUsers.find((u) => u.id === 9)!;
      stubUserData([ivyFull]);
      stubEditUser(ivyFull);
      stubUserSubTables(subTableEndpoints);

      // Act: Visit admin panel page about users.
      const page = new AdminUserFormPage();
      page.visit();
      cy.wait('@userTableRequest');

      // Act: Select the user row.
      page.selectUserRow(0);
      cy.wait('@userDataRequest');

      // Act: Change username, email and name, then submit the update.
      page.fillUsername('ivy_new');
      page.fillEmail('ivy_new@test.com');
      page.fillName('Ivy New');
      page.clickUpdate();

      // Assert: Request carries the edited fields (locked and lang are untouched).
      cy.wait('@userEditRequest').then((interception) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = interception.request.body as any;
        cy.wrap(body.id).should('equal', 9);
        cy.wrap(body.username).should('equal', 'ivy_new');
        cy.wrap(body.email).should('equal', 'ivy_new@test.com');
        cy.wrap(body.locked).should('equal', null);
        cy.wrap(body.lang).should('equal', null);
        cy.wrap(body.profile).should('deep.equal', { name: 'Ivy New', surname: 'Taylor' });
      });

      // Assert: Form reflects the updated values.
      page.getUsernameInput().should('have.value', 'ivy_new');
      page.getEmailInput().should('have.value', 'ivy_new@test.com');
      page.getNameInput().should('have.value', 'Ivy New');
    });

    it('shows error message when update fails', () => {
      // Arrange: Stub table, full-data and a failing edit API, log in and select.
      stubUserTable([ivyTableEntry]);
      const ivyFull = fullUsers.find((u) => u.id === 9)!;
      stubUserData([ivyFull]);
      stubEditUserError();
      stubUserSubTables(subTableEndpoints);
      const page = new AdminUserFormPage();
      page.visit();
      cy.wait('@userTableRequest');
      page.selectUserRow(0);
      cy.wait('@userDataRequest');

      // Act: Change username and submit the failing update.
      page.fillUsername('ivy_new');
      page.clickUpdate();

      // Assert: Wait for the failed edit and verify an error message is shown.
      cy.wait('@userEditRequest');
      cy.getByTestId('msgContainer').find('.message-error').should('contain.text', 'Internal server error');

      // Assert: Form keeps the edited values (failed update does not refill the form).
      page.getUsernameInput().should('have.value', 'ivy_new');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Lock toggle

  describe('lock toggle', () => {
    it('locks and unlocks user and updates the button label', () => {
      // Arrange: Stub table, full-data and edit APIs, log in and select.
      stubUserTable([ivyTableEntry]);
      const ivyFull = fullUsers.find((u) => u.id === 9)!;
      stubUserData([ivyFull]);
      stubEditUser(ivyFull);
      stubUserSubTables(subTableEndpoints);
      const page = new AdminUserFormPage();
      page.visit();
      cy.wait('@userTableRequest');
      page.selectUserRow(0);
      cy.wait('@userDataRequest');

      // Assert: Button starts in the 'Lock' state (user is not locked).
      page.getLockButton().should('contain.text', 'Lock');

      // Act: Lock the user.
      page.clickLock();

      // Assert: Request carries locked: true.
      cy.wait('@userEditRequest').its('request.body.locked').should('equal', true);

      // Assert: Button label switches to "Unlock".
      page.getLockButton().should('contain.text', 'Unlock');

      // Act: Unlock the user again.
      page.clickLock();

      // Assert: Request carries locked: false.
      cy.wait('@userEditRequest').its('request.body.locked').should('equal', false);

      // Assert: Button label switches back to "Lock".
      page.getLockButton().should('contain.text', 'Lock');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Self-edit protection

  describe('self-edit protection', () => {
    it('shows warning and disables form when viewing your own account', () => {
      // Arrange: Stub table and full-data APIs for the own-account user, log in.
      stubUserTable([selfTableEntry]);
      const selfFull = fullUsers.find((u) => u.id === 10)!;
      stubUserData([selfFull]);
      stubEditUser(selfFull);
      stubUserSubTables(subTableEndpoints);
      const page = new AdminUserFormPage();
      page.visit();
      cy.wait('@userTableRequest');

      // Act: Select the own-account user row.
      page.selectUserRow(0);

      // Assert: Wait for the load and verify the self-edit warning is shown.
      cy.wait('@userDataRequest');
      page.getSelfEditWarning().should('contain.text', 'You cannot edit your own account.');

      // Assert: All inputs and buttons are disabled.
      page.getUsernameInput().should('be.disabled');
      page.getEmailInput().should('be.disabled');
      page.getNameInput().should('be.disabled');
      page.getSurnameInput().should('be.disabled');
      page.getUpdateButton().should('be.disabled');
      page.getLockButton().should('be.disabled');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Sub-tab lazy loading

  describe('sub-tab lazy loading', () => {
    it('does not load any sub-tab data when a user is selected while on the main tab', () => {
      // Arrange: Stub the table, full-data and sub-tab APIs, log in on the page.
      stubUserTable([ivyTableEntry]);
      const ivyFull = fullUsers.find((u) => u.id === 9)!;
      stubUserData([ivyFull]);
      stubUserSubTables(subTableEndpoints);
      const page = new AdminUserFormPage();
      page.visit();
      cy.wait('@userTableRequest');

      // Act: Select the user row, staying on the main tab.
      page.selectUserRow(0);
      cy.wait('@userDataRequest');

      // Assert: No sub-tab API was called.
      expectSubTabCalls(subTableEndpoints, { history: 0, permissions: 0, configs: 0, tokens: 0, jwt: 0 });
    });

    it('loads only the history sub-tab when a user is selected while on the history tab', () => {
      // Arrange: Stub the table, full-data and sub-tab APIs, log in on the page.
      stubUserTable([ivyTableEntry]);
      const ivyFull = fullUsers.find((u) => u.id === 9)!;
      stubUserData([ivyFull]);
      stubUserSubTables(subTableEndpoints);
      const page = new AdminUserFormPage();
      page.visit();
      cy.wait('@userTableRequest');

      // Act: Switch to the history tab first, then select the user.
      cy.getByTestId('usertab_history').click();
      page.selectUserRow(0);
      cy.wait('@userDataRequest');

      // Assert: Only the active (history) sub-tab is loaded, the rest is untouched.
      expectSubTabCalls(subTableEndpoints, { history: 1, permissions: 0, configs: 0, tokens: 0, jwt: 0 });
    });

    it('switching tabs loads data for given tab if not yet loaded', () => {
      // Arrange: Stub the table, full-data and sub-tab APIs, log in on the page.
      stubUserTable([ivyTableEntry]);
      const ivyFull = fullUsers.find((u) => u.id === 9)!;
      stubUserData([ivyFull]);
      stubUserSubTables(subTableEndpoints);
      const page = new AdminUserFormPage();
      page.visit();
      cy.wait('@userTableRequest');

      // Act: Select the user row.
      page.selectUserRow(0);
      cy.wait('@userDataRequest');

      // Act: Switch to the history tab.
      cy.getByTestId('usertab_history').click();
      cy.wait('@subtab_history');
      // Assert: Only the active (history) sub-tab is loaded, the rest is untouched.
      expectSubTabCalls(subTableEndpoints, { history: 1, permissions: 0, configs: 0, tokens: 0, jwt: 0 });

      // Act: Switch to the permissions tab.
      cy.getByTestId('usertab_permissions').click();
      cy.wait('@subtab_permissions');
      // Assert: Only the active (permissions) sub-tab is loaded, the rest is unchanged.
      expectSubTabCalls(subTableEndpoints, { history: 1, permissions: 1, configs: 0, tokens: 0, jwt: 0 });

      // Act: Switch to the configs tab.
      cy.getByTestId('usertab_config').click();
      cy.wait('@subtab_configs');
      // Assert: Only the active (configs) sub-tab is loaded, the rest is unchanged.
      expectSubTabCalls(subTableEndpoints, { history: 1, permissions: 1, configs: 1, tokens: 0, jwt: 0 });

      // Act: Switch to the tokens tab.
      cy.getByTestId('usertab_tokens').click();
      cy.wait('@subtab_tokens');
      // Assert: Only the active (tokens) sub-tab is loaded, the rest is unchanged.
      expectSubTabCalls(subTableEndpoints, { history: 1, permissions: 1, configs: 1, tokens: 1, jwt: 0 });

      // Act: Switch to the jwt tab.
      cy.getByTestId('usertab_jwt').click();
      cy.wait('@subtab_jwt');
      // Assert: Only the active (jwt) sub-tab is loaded, the rest is unchanged.
      expectSubTabCalls(subTableEndpoints, { history: 1, permissions: 1, configs: 1, tokens: 1, jwt: 1 });

      // Act: Switch back to the history tab. Will do nothing because it is still same user and its data is unchanged.
      cy.getByTestId('usertab_history').click();
      cy.waitIfHappens('@subtab_history', { timeout: 250 });
      // Assert: All sub-tabs are unchanged.
      expectSubTabCalls(subTableEndpoints, { history: 1, permissions: 1, configs: 1, tokens: 1, jwt: 1 });
    });

    it('history tab will be reloaded if user data was updated', () => {
      // Arrange: Stub the table, full-data and sub-tab APIs, log in on the page.
      stubUserTable([ivyTableEntry]);
      const ivyFull = fullUsers.find((u) => u.id === 9)!;
      stubUserData([ivyFull]);
      stubEditUser(ivyFull);
      stubUserSubTables(subTableEndpoints);

      // Act: Visit admin panel page about users.
      const page = new AdminUserFormPage();
      page.visit();
      cy.wait('@userTableRequest');

      // Act: Select the user row.
      page.selectUserRow(0);
      cy.wait('@userDataRequest');

      // Act: Switch to the history tab.
      cy.getByTestId('usertab_history').click();
      cy.wait('@subtab_history');
      // Assert: Only the active (history) sub-tab is loaded, the rest is untouched.
      expectSubTabCalls(subTableEndpoints, { history: 1, permissions: 0, configs: 0, tokens: 0, jwt: 0 });

      // Act: Switch back to main tab and edit user data.
      cy.getByTestId('usertab_main').click();
      page.fillUsername('ivy_new');
      page.clickUpdate();
      cy.wait('@userEditRequest');

      // Act: Switch back to the history tab.
      cy.getByTestId('usertab_history').click();
      cy.wait('@subtab_history');
      // Assert: History tab will be reloaded due to update of user data.
      expectSubTabCalls(subTableEndpoints, { history: 2, permissions: 0, configs: 0, tokens: 0, jwt: 0 });
    });
  });
});
