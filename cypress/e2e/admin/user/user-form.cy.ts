// ////////////////////////////////////////////////////////////////////////////
// Admin User Form E2E Tests
// Tests main user form (AdminUserMain) that shows and edits a single selected user.

import { locstJwt } from '@/code/data/app/storage.ts';
import AdminUserFormPage from '@/../cypress/support/pages/admin/AdminUserFormPage.ts';

/** Shape of a single user table entry. */
interface UserTableEntry {
  id: number;
  createdAt: string;
  username: string;
  email: string;
  status: string;
}

/** Shape of full user data used by the main user form. */
interface UserFullData {
  id: number;
  createdAt: string;
  modifiedAt: string;
  username: string;
  email: string;
  status: string;
  locked: boolean;
  lang: string;
  profile: { name: string; surname: string };
}

/** Full users loaded from the fixture. Populated in `before()`. */
let fullUsers: UserFullData[] = [];

/** An empty table metadata (used for empty sub-tab tables). */
const emptyTableMeta = { pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: '', sortOrder: '' };

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
  cy.fixture('admin/user-full.json').then((data: { users: UserFullData[] }) => {
    fullUsers = data.users;
  });
});

// ////////////////////////////////////////////////////////////////////////////
// Stubs

/**
 * Stub the user table API so a single page holds the given dataset.
 * @param users User table dataset.
 */
function stubUserTable(users: UserTableEntry[]) {
  cy.intercept('POST', '**/api/admin/users', (req) => {
    req.reply({
      statusCode: 200,
      body: {
        entries: users,
        tableMeta: {
          pageCount: Math.max(1, Math.ceil(users.length / 10)),
          entryCount: users.length,
          pageSize: 10,
          page: 0,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        },
      },
    });
  }).as('userTableRequest');
}

/**
 * Stub the load-user-data API so GET /user/{id} returns the matching full user.
 * @param users Full user dataset to match against.
 * @param overrides Extra fields merged over the resolved user (e.g. to simulate own account).
 */
function stubUserData(users: UserFullData[], overrides: Partial<UserFullData> = {}) {
  cy.intercept('GET', '**/api/admin/user/*', (req) => {
    const id = Number(req.url.split('/').pop());
    const found = users.find((u) => u.id === id) ?? users[0];
    req.reply({ statusCode: 200, body: { ...found, ...overrides } });
  }).as('userDataRequest');
}

/**
 * Stub the edit-user-data API. It applies the PATCH payload over the current
 * state and replies with the updated full user (mirrors backend behavior).
 * @param initial Initial full user data.
 */
function stubEditUser(initial: UserFullData) {
  const current: UserFullData = { ...initial };
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

/** Stub the load-user-data API to fail with a 500 error. */
function stubUserDataError() {
  cy.intercept('GET', '**/api/admin/user/*', (req) => {
    req.reply({ statusCode: 500, body: { errCode: 500 } });
  }).as('userDataRequest');
}

/** Stub the edit-user-data API to fail with a 500 error. */
function stubEditUserError() {
  cy.intercept('PATCH', '**/api/admin/user', (req) => {
    req.reply({ statusCode: 500, body: { errCode: 500 } });
  }).as('userEditRequest');
}

/** Stub all secondary user sub-tab tables to return empty data. */
function stubUserSubTables() {
  const endpoints = ['history', 'permissions', 'configs', 'tokens', 'jwt'];
  endpoints.forEach((endpoint) => {
    cy.intercept('POST', `**/api/admin/user/${endpoint}`, {
      statusCode: 200,
      body: { entries: [], tableMeta: emptyTableMeta },
    });
  });
}

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
      stubUserSubTables();
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
      stubUserSubTables();
      const page = new AdminUserFormPage();
      page.visit();
      cy.wait('@userTableRequest');
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
      stubUserSubTables();
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
      stubUserSubTables();
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
      stubUserSubTables();
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
});