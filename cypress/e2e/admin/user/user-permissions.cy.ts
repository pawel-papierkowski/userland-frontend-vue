// ////////////////////////////////////////////////////////////////////////////
// Admin User Permissions E2E Tests
// Tests the user permissions tab (AdminUserPermissions) and its filter
// (AdminUserPermissionsFilter). Permission entries are edited in-place (inline edit),
// so there is an additional suite that covers adding, editing and deleting permission
// entries. Note: the permission 'name' column is a ComboBox (options 'role', 'user'),
// not a plain text input.

import type { UserFullDataResp, UserPermissionTableEntry } from '@/code/data/features/user/admin-user-type.ts';
import type { EntryMeta } from '@/code/data/features/common/type.ts';
import { locstJwt } from '@/code/data/app/storage.ts';

import { stubUserTable, stubUserData, stubUserSubTables, expectSubTabCalls } from '@/../cypress/support/helpers/user.ts';
import type { UserTableEntry } from '@/../cypress/support/helpers/user.ts';
import AdminUserPage from '@/../cypress/support/pages/admin/AdminUserPage.ts';
import AdminUserPermissionsPage from '@/../cypress/support/pages/admin/AdminUserPermissionsPage.ts';

/** Full users loaded from the fixture. Populated in `before()`. */
let fullUsers: UserFullDataResp[] = [];
/** Permission entries loaded from the fixture. Populated in `before()`. */
let permissionEntries: UserPermissionTableEntry[] = [];

/** User (ivy, id 9) used across all permission tests. */
const ivyTableEntry: UserTableEntry = {
  id: 9,
  createdAt: '2024-09-10T12:00:00Z',
  username: 'ivy',
  email: 'ivy@test.com',
  status: 'ACTIVE',
};

/** Metadata that enables edit/delete options for a permission entry (as returned by a real backend). */
const enabledMeta: EntryMeta = {
  options: {
    edit: { access: 'ENABLED', reason: null },
    delete: { access: 'ENABLED', reason: null },
  },
  data: null,
};

/** Load the fixtures once before all tests. */
before(() => {
  cy.fixture('admin/user-full.json').then((data: { users: UserFullDataResp[] }) => {
    fullUsers = data.users;
  });
  cy.fixture('admin/user-permissions.json').then((data: { userPermission: UserPermissionTableEntry[] }) => {
    permissionEntries = data.userPermission;
  });
});

// ////////////////////////////////////////////////////////////////////////////
// Stubs

/**
 * Stub the whole user permission backend: page loading (POST /permissions), saving (PATCH /permission)
 * and deleting (DELETE /permission/{id}). All three share a single mutable dataset, so changes
 * made through edit/delete are reflected in subsequent page loads (mirrors backend behavior).
 * @param initialEntries Initial permission dataset.
 */
function stubUserPermissions(initialEntries: UserPermissionTableEntry[]) {
  const state: UserPermissionTableEntry[] = initialEntries.map((entry) => ({ ...entry }));

  cy.intercept('POST', '**/api/admin/user/permissions', (req) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter = req.body as any;

    // Filtering (mirrors backend behavior for the created date range).
    let result = state;
    if (filter.createdFromAt) {
      result = result.filter((e) => e.createdAt >= filter.createdFromAt);
    }
    if (filter.createdToAt) {
      result = result.filter((e) => e.createdAt <= filter.createdToAt);
    }

    // Sorting. Default sort is echoed back so the page keeps non-null sort state
    // (the page only reloads on a sort change when the previous sort is non-null).
    const sortBy = filter.tableMeta?.sortBy || 'createdAt';
    const sortOrder = filter.tableMeta?.sortOrder || 'DESC';
    const sorted = [...result].sort((a, b) => {
      const valueA = String(a[sortBy as keyof UserPermissionTableEntry]);
      const valueB = String(b[sortBy as keyof UserPermissionTableEntry]);
      const cmp = valueA.localeCompare(valueB);
      return sortOrder === 'DESC' ? -cmp : cmp;
    });

    // Pagination.
    const size = filter.tableMeta?.pageSize || 5;
    const page = filter.tableMeta?.page ?? 0;
    const pageCount = Math.ceil(sorted.length / size);
    const entriesSlice = sorted.slice(page * size, page * size + size);

    req.reply({
      statusCode: 200,
      body: {
        entries: entriesSlice,
        tableMeta: { pageCount, entryCount: sorted.length, pageSize: size, page, sortBy, sortOrder },
      },
    });
  }).as('userPermissionsRequest');

  cy.intercept('PATCH', '**/api/admin/user/permission', (req) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = req.body as any;
    if (body.id === null) {
      // Add a new entry with a fresh id and a created date later than all existing ones.
      const newId = state.reduce((max, e) => Math.max(max, e.id), 0) + 1;
      state.push({
        id: newId,
        createdAt: '2024-10-01T10:00:00Z',
        name: body.name,
        value: body.value,
        meta: enabledMeta,
      });
    } else {
      // Edit existing entry.
      const found = state.find((e) => e.id === body.id);
      if (found) {
        found.name = body.name;
        found.value = body.value;
      }
    }
    req.reply({ statusCode: 200, body: {} });
  }).as('userPermissionEditRequest');

  cy.intercept('DELETE', '**/api/admin/user/permission/*', (req) => {
    const id = Number(req.url.split('/').pop());
    const index = state.findIndex((e) => e.id === id);
    if (index !== -1) state.splice(index, 1);
    req.reply({ statusCode: 200, body: {} });
  }).as('userPermissionDeleteRequest');
}

/** All user sub-tab table endpoints that we do not care about (except permissions). */
const subTableEndpoints: string[] = ['history', 'configs', 'tokens', 'jwt'] as const;

//

/**
 * Set up the common stubs needed to select a user and open its editor, then visit the page and select
 * the given user row.
 * Note: after this returns, the user is selected on the main tab. Sub-tab data loads lazily only when
 * the corresponding tab is activated, so callers open the desired tab themselves.
 * @param allUsers All users in table.
 * @param user User table entry to show.
 * @returns Nothing.
 */
function setupSelectedUser(allUsers: UserFullDataResp[], user: UserTableEntry): AdminUserPermissionsPage {
  stubUserTable([user]);
  const ivyFull = allUsers.find((u) => u.id === user.id)!;
  stubUserData([ivyFull]);
  stubUserSubTables(subTableEndpoints);

  const common = new AdminUserPage();
  const page = new AdminUserPermissionsPage();
  common.visit();
  cy.wait('@userTableRequest');
  page.selectUserRow(0);
  return page;
}

// ////////////////////////////////////////////////////////////////////////////

describe('Admin User Permissions', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  // //////////////////////////////////////////////////////////////////////////
  // Table rendering

  describe('table rendering', () => {
    it('shows empty message and disabled filter when no user is selected', () => {
      // Arrange: Stub the user table API and log in on the page.
      stubUserTable([ivyTableEntry]);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = new AdminUserPermissionsPage();
      common.visit();
      cy.wait('@userTableRequest');

      // Act: Switch to the Permissions tab without selecting any user.
      common.openPermissionsTab();

      // Assert: Empty message for "no user selected" is shown.
      page.getTable().should('be.visible');
      page.getEmptyMessage().should('contain.text', 'No permissions to show.');

      // Assert: The whole filter is disabled (no user selected).
      page.getFilterSubmitButton().should('be.disabled');
      page.getCreatedFromInput().should('be.disabled');
      page.getCreatedToInput().should('be.disabled');
    });

    it('shows empty message and disabled filter when user was deselected', () => {
      // Arrange: Stub all APIs, log in, select a user and stub permission data.
      stubUserPermissions(permissionEntries);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Act: Open the Permissions tab.
      common.openPermissionsTab();
      cy.wait('@userPermissionsRequest');

      // Act: Deselect user.
      page.selectUserRow(0);

      // Assert: Empty message for "no user selected" is shown.
      page.getTable().should('be.visible');
      page.getEmptyMessage().should('contain.text', 'No permissions to show.');

      // Assert: The whole filter is disabled (no user selected).
      page.getFilterSubmitButton().should('be.disabled');
      page.getCreatedFromInput().should('be.disabled');
      page.getCreatedToInput().should('be.disabled');
    });

    it('shows permission data for the selected user', () => {
      // Arrange: Stub all APIs, log in, select a user and stub permission data.
      stubUserPermissions(permissionEntries);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Act: Open the Permissions tab.
      common.openPermissionsTab();
      cy.wait('@userPermissionsRequest');

      // Assert: correct data was loaded only once.
      cy.get('@userPermissionsRequest.all').should('have.length', 1);
      expectSubTabCalls(subTableEndpoints, { history: 0, configs: 0, tokens: 0, jwt: 0 });

      // Assert: Table is visible with all four header columns.
      page.getTable().should('be.visible');
      page.getHeaderCell('Created').should('be.visible');
      page.getHeaderCell('Name').should('be.visible');
      page.getHeaderCell('Value').should('be.visible');
      page.getHeaderCell('Options').should('be.visible');

      // Assert: First page of permissions is rendered (default sort: createdAt DESC).
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'name').should('contain.text', 'perm-10');
      page.getCell(4, 'name').should('contain.text', 'perm-06');

      // Act: Go to the Main tab and then return to the Permissions tab.
      common.openMainTab();
      common.openPermissionsTab();
      cy.waitIfHappens('@userPermissionsRequest', { timeout: 500 });

      // Assert: correct data was loaded only once (no new reload).
      cy.get('@userPermissionsRequest.all').should('have.length', 1);
      expectSubTabCalls(subTableEndpoints, { history: 0, configs: 0, tokens: 0, jwt: 0 });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Permission filter

  describe('permission filter', () => {
    it('filters permission table by created from date', () => {
      // Arrange: Stub permissions and select a user.
      stubUserPermissions(permissionEntries);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Permissions tab and consume the initial (unfiltered) load.
      common.openPermissionsTab();
      cy.wait('@userPermissionsRequest');

      // Act: Pick July 15th 2024 as the "created from" date and submit.
      page.selectDateFrom(2024, 6, 14);
      page.getCreatedFromInput().should('have.value', '📅 2024-07-15');
      page.submitFilter();

      // Assert: Request carries the converted date range bound and the user ID.
      cy.wait('@userPermissionsRequest').then((interception) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = interception.request.body as any;
        cy.wrap(body.userId).should('equal', 9);
        cy.wrap(body.createdFromAt).should('equal', '2024-07-15T00:00:00');
        cy.wrap(body.createdToAt).should('equal', null);
      });

      // Assert: Only entries created on or after that date are rendered (page 1, createdAt DESC).
      page.getCell(0, 'name').should('contain.text', 'perm-10');
      page.getCell(1, 'name').should('contain.text', 'perm-09');
      page.getCell(3, 'name').should('contain.text', 'perm-07');
      page.getRow(4).should('not.exist');
    });

    it('filters permission table by created to date', () => {
      // Arrange: Stub permissions and select a user.
      stubUserPermissions(permissionEntries);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Permissions tab and consume the initial (unfiltered) load.
      common.openPermissionsTab();
      cy.wait('@userPermissionsRequest');

      // Act: Pick July 15th 2024 as the "created to" date and submit.
      page.selectDateTo(2024, 6, 14);
      page.getCreatedToInput().should('have.value', '📅 2024-07-15');
      page.submitFilter();

      // Assert: Request carries the converted end-of-day bound.
      cy.wait('@userPermissionsRequest').then((interception) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = interception.request.body as any;
        cy.wrap(body.createdFromAt).should('equal', null);
        cy.wrap(body.createdToAt).should('equal', '2024-07-15T23:59:59.999999');
      });

      // Assert: Only entries created on or before that date are rendered (page 1, createdAt DESC).
      page.getCell(0, 'name').should('contain.text', 'perm-07');
      page.getCell(4, 'name').should('contain.text', 'perm-03');
      page.getPageNumber().should('contain.text', '2');
    });

    it('shows empty message when filter matches no permission entry', () => {
      // Arrange: Stub permissions and select a user.
      stubUserPermissions(permissionEntries);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Permissions tab and consume the initial (unfiltered) load.
      common.openPermissionsTab();
      cy.wait('@userPermissionsRequest');

      // Act: Pick January 1st 2024 as the "created to" date (before any entry) and submit.
      page.selectDateTo(2024, 0, 0);
      page.getCreatedToInput().should('have.value', '📅 2024-01-01');
      page.submitFilter();

      // Assert: Request is sent and empty message is shown.
      cy.wait('@userPermissionsRequest');
      page.getEmptyMessage().should('contain.text', 'Check filter settings');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Table navigation

  describe('table navigation', () => {
    it('navigates to next page of permission table', () => {
      // Arrange: Stub permissions and select a user.
      stubUserPermissions(permissionEntries);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Permissions tab and consume the initial load.
      common.openPermissionsTab();
      cy.wait('@userPermissionsRequest');

      // Assert: First page is shown, there are two pages total.
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'name').should('contain.text', 'perm-10');

      // Act: Jump to page two via the paginer input.
      page.setPage(2);

      // Assert: Request asks for the second page.
      cy.wait('@userPermissionsRequest').its('request.body.tableMeta.page').should('equal', 1);

      // Assert: Second page of permissions is rendered, page count is unchanged.
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'name').should('contain.text', 'perm-05');
      page.getCell(3, 'name').should('contain.text', 'perm-02');
    });

    it('sorts permission table by name column', () => {
      // Arrange: Stub permissions and select a user.
      stubUserPermissions(permissionEntries);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Permissions tab and consume the initial load.
      common.openPermissionsTab();
      cy.wait('@userPermissionsRequest');

      // Act: Click the Name header to sort ascending.
      page.clickSortHeader('Name');

      // Assert: A fresh column sort fires exactly one reload request.
      cy.get('@userPermissionsRequest.all').should('have.length', 2); // initial + one reload
      cy.get('@userPermissionsRequest.all').then((interceptions) => {
        const meta = interceptions[interceptions.length - 1].request.body.tableMeta;
        cy.wrap(meta.sortBy).should('equal', 'name');
        cy.wrap(meta.sortOrder).should('equal', 'ASC');
      });

      // Assert: Permission entries are rendered in ascending name order (perm-01...perm-05).
      page.getCell(0, 'name').should('contain.text', 'perm-01');
      page.getCell(4, 'name').should('contain.text', 'perm-05');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Inline editing

  describe('inline editing', () => {
    it('adds a new permission entry', () => {
      // Arrange: Stub permissions and select a user.
      stubUserPermissions(permissionEntries);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Permissions tab and consume the initial load.
      common.openPermissionsTab();
      cy.wait('@userPermissionsRequest');

      // Act: Click the add button (paginer options), pick a name from the combobox and fill the value.
      page.clickAdd();
      page.selectPermissionName(-1, 'role');
      page.fillValue(-1, 'value-new');

      // Act: Save the new entry.
      page.clickEntryOption(-1, 'save');

      // Assert: Request carries the new entry data (id null = new entry, correct user).
      cy.wait('@userPermissionEditRequest').then((interception) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = interception.request.body as any;
        cy.wrap(body.id).should('equal', null);
        cy.wrap(body.userId).should('equal', 9);
        cy.wrap(body.name).should('equal', 'role');
        cy.wrap(body.value).should('equal', 'value-new');
      });

      // Act: Wait for the reload after save.
      cy.wait('@userPermissionsRequest');

      // Assert: The new entry is rendered at the top (it has the newest created date).
      page.getCell(0, 'name').should('contain.text', 'role');
      page.getCell(0, 'value').should('contain.text', 'value-new');

      // Assert: Success message is shown.
      cy.getByTestId('msgContainer').find('.message-success').should('contain.text', 'User permission entry was saved.');
    });

    it('cancels adding a new permission entry', () => {
      // Arrange: Stub permissions and select a user.
      stubUserPermissions(permissionEntries);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Permissions tab and consume the initial load.
      common.openPermissionsTab();
      cy.wait('@userPermissionsRequest');

      // Act: Click add, fill the new-entry row, then cancel.
      page.clickAdd();
      page.selectPermissionName(-1, 'user');
      page.fillValue(-1, 'value-new');
      page.clickEntryOption(-1, 'cancel');

      // Assert: No save request was sent.
      cy.get('@userPermissionEditRequest.all').should('have.length', 0);

      // Assert: The add-new-entry row is gone and table is unchanged.
      page.getRow(-1).should('not.exist');
      page.getCell(0, 'name').should('contain.text', 'perm-10');
    });

    it('edits an existing permission entry', () => {
      // Arrange: Stub permissions and select a user.
      stubUserPermissions(permissionEntries);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Permissions tab and consume the initial load.
      common.openPermissionsTab();
      cy.wait('@userPermissionsRequest');

      // Act: Click the edit button of the first row, pick a new name and change the value.
      page.clickEntryOption(0, 'edit');
      page.selectPermissionName(0, 'role');
      page.fillValue(0, 'value-edited');

      // Act: Save the edited entry.
      page.clickEntryOption(0, 'save');

      // Assert: Request carries the edited entry data (id of edited entry, correct user).
      cy.wait('@userPermissionEditRequest').then((interception) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = interception.request.body as any;
        cy.wrap(body.id).should('equal', 10);
        cy.wrap(body.userId).should('equal', 9);
        cy.wrap(body.name).should('equal', 'role');
        cy.wrap(body.value).should('equal', 'value-edited');
      });

      // Act: Wait for the reload after save.
      cy.wait('@userPermissionsRequest');

      // Assert: The edited entry is rendered with the new values.
      page.getCell(0, 'name').should('contain.text', 'role');
      page.getCell(0, 'value').should('contain.text', 'value-edited');
    });

    it('cancels editing an existing permission entry', () => {
      // Arrange: Stub permissions and select a user.
      stubUserPermissions(permissionEntries);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Permissions tab and consume the initial load.
      common.openPermissionsTab();
      cy.wait('@userPermissionsRequest');

      // Act: Click the edit button of the first row, change the value, then cancel.
      page.clickEntryOption(0, 'edit');
      page.fillValue(0, 'value-edited');
      page.clickEntryOption(0, 'cancel');

      // Assert: No save request was sent.
      cy.get('@userPermissionEditRequest.all').should('have.length', 0);

      // Assert: The row shows the original (unedited) values again.
      page.getCell(0, 'name').should('contain.text', 'perm-10');
      page.getCell(0, 'value').should('contain.text', 'value-10');
    });

    it('deletes an existing permission entry', () => {
      // Arrange: Stub permissions and select a user.
      stubUserPermissions(permissionEntries);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Permissions tab and consume the initial load.
      common.openPermissionsTab();
      cy.wait('@userPermissionsRequest');

      // Act: Click the delete button of the first row.
      page.clickEntryOption(0, 'delete');

      // Assert: Delete request targets the deleted entry id.
      cy.wait('@userPermissionDeleteRequest').then((interception) => {
        cy.wrap(interception.request.url).should('contain', '/permission/10');
      });

      // Act: Wait for the reload after delete.
      cy.wait('@userPermissionsRequest');

      // Assert: The deleted entry is gone (first row is now the previous newest one).
      page.getCell(0, 'name').should('contain.text', 'perm-09');

      // Assert: Success message is shown.
      cy.getByTestId('msgContainer').find('.message-success').should('contain.text', 'User permission entry was deleted.');
    });

    it('shows failure message when saving new entry with invalid data', () => {
      // Arrange: Stub permissions and select a user.
      stubUserPermissions(permissionEntries);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Permissions tab and consume the initial load.
      common.openPermissionsTab();
      cy.wait('@userPermissionsRequest');

      // Act: Click add and try to save without picking a name from the combobox.
      page.clickAdd();
      page.clickEntryOption(-1, 'save');

      // Assert: Failure message about invalid name is shown and no request is sent.
      cy.getByTestId('msgContainer').find('.message-failure').should('contain.text', 'Invalid permission name.');
      cy.get('@userPermissionEditRequest.all').should('have.length', 0);

      // Act: Pick a name but leave the value empty, and try to save again.
      page.selectPermissionName(-1, 'user');
      page.clickEntryOption(-1, 'save');

      // Assert: Failure message about invalid value is shown and still no request is sent.
      cy.getByTestId('msgContainer').find('.message-failure').should('contain.text', 'Invalid permission value.');
      cy.get('@userPermissionEditRequest.all').should('have.length', 0);
    });
  });
});
