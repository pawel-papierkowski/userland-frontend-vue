// ////////////////////////////////////////////////////////////////////////////
// Admin User Config E2E Tests
// Tests the user config tab (AdminUserConfig) and its filter (AdminUserConfigFilter).
// Config entries are edited in-place (inline edit), so there is an additional suite
// that covers adding, editing and deleting config entries.

import type { UserFullDataResp, UserConfigTableEntry } from '@/code/data/features/user/admin-user-type.ts';
import type { EntryMeta } from '@/code/data/features/common/type.ts';
import { locstJwt } from '@/code/data/app/storage.ts';

import { stubUserTable, stubUserData, stubUserSubTables, expectSubTabCalls } from '@/../cypress/support/helpers/user.ts';
import type { UserTableEntry } from '@/../cypress/support/helpers/user.ts';
import AdminUserConfigPage from '@/../cypress/support/pages/admin/AdminUserConfigPage.ts';

/** Full users loaded from the fixture. Populated in `before()`. */
let fullUsers: UserFullDataResp[] = [];
/** Config entries loaded from the fixture. Populated in `before()`. */
let configEntries: UserConfigTableEntry[] = [];

/** User (ivy, id 9) used across all config tests. */
const ivyTableEntry: UserTableEntry = {
  id: 9,
  createdAt: '2024-09-10T12:00:00Z',
  username: 'ivy',
  email: 'ivy@test.com',
  status: 'ACTIVE',
};

/** Metadata that enables edit/delete options for a config entry (as returned by a real backend). */
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
  cy.fixture('admin/user-config.json').then((data: { userConfig: UserConfigTableEntry[] }) => {
    configEntries = data.userConfig;
  });
});

// ////////////////////////////////////////////////////////////////////////////
// Stubs

/**
 * Stub the whole user config backend: page loading (POST /configs), saving (PATCH /config)
 * and deleting (DELETE /config/{id}). All three share a single mutable dataset, so changes
 * made through edit/delete are reflected in subsequent page loads (mirrors backend behavior).
 * @param initialEntries Initial config dataset.
 */
function stubUserConfigs(initialEntries: UserConfigTableEntry[]) {
  const state: UserConfigTableEntry[] = initialEntries.map((entry) => ({ ...entry }));

  cy.intercept('POST', '**/api/admin/user/configs', (req) => {
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
      const valueA = String(a[sortBy as keyof UserConfigTableEntry]);
      const valueB = String(b[sortBy as keyof UserConfigTableEntry]);
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
  }).as('userConfigsRequest');

  cy.intercept('PATCH', '**/api/admin/user/config', (req) => {
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
  }).as('userConfigEditRequest');

  cy.intercept('DELETE', '**/api/admin/user/config/*', (req) => {
    const id = Number(req.url.split('/').pop());
    const index = state.findIndex((e) => e.id === id);
    if (index !== -1) state.splice(index, 1);
    req.reply({ statusCode: 200, body: {} });
  }).as('userConfigDeleteRequest');
}

/** All user sub-tab table endpoints that we do not care about (except configs). */
const subTableEndpoints: string[] = ['history', 'permissions', 'tokens', 'jwt'] as const;

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
function setupSelectedUser(allUsers: UserFullDataResp[], user: UserTableEntry): AdminUserConfigPage {
  stubUserTable([user]);
  const ivyFull = allUsers.find((u) => u.id === user.id)!;
  stubUserData([ivyFull]);
  stubUserSubTables(subTableEndpoints);

  const page = new AdminUserConfigPage();
  page.visit();
  cy.wait('@userTableRequest');
  page.selectUserRow(0);
  return page;
}

// ////////////////////////////////////////////////////////////////////////////

describe('Admin User Config', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  // //////////////////////////////////////////////////////////////////////////
  // Table rendering

  describe('table rendering', () => {
    it('shows empty message and disabled filter when no user is selected', () => {
      // Arrange: Stub the user table API and log in on the page.
      stubUserTable([ivyTableEntry]);
      const page = new AdminUserConfigPage();
      page.visit();
      cy.wait('@userTableRequest');

      // Act: Switch to the Config tab without selecting any user.
      page.openConfigTab();

      // Assert: Empty message for "no user selected" is shown.
      page.getTable().should('be.visible');
      page.getEmptyMessage().should('contain.text', 'No configuration to show.');

      // Assert: The whole filter is disabled (no user selected).
      page.getFilterSubmitButton().should('be.disabled');
      page.getCreatedFromInput().should('be.disabled');
      page.getCreatedToInput().should('be.disabled');
    });

    it('shows empty message and disabled filter when user was deselected', () => {
      // Arrange: Stub all APIs, log in, select a user and stub config data.
      stubUserConfigs(configEntries);
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Act: Open the Config tab.
      page.openConfigTab();
      cy.wait('@userConfigsRequest');

      // Act: Deselect user.
      page.selectUserRow(0);

      // Assert: Empty message for "no user selected" is shown.
      page.getTable().should('be.visible');
      page.getEmptyMessage().should('contain.text', 'No configuration to show.');

      // Assert: The whole filter is disabled (no user selected).
      page.getFilterSubmitButton().should('be.disabled');
      page.getCreatedFromInput().should('be.disabled');
      page.getCreatedToInput().should('be.disabled');
    });

    it('shows config data for the selected user', () => {
      // Arrange: Stub all APIs, log in, select a user and stub config data.
      stubUserConfigs(configEntries);
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Act: Open the Config tab.
      page.openConfigTab();
      cy.wait('@userConfigsRequest');

      // Assert: correct data was loaded only once.
      cy.get('@userConfigsRequest.all').should('have.length', 1);
      expectSubTabCalls(subTableEndpoints, { history: 0, permissions: 0, tokens: 0, jwt: 0 });

      // Assert: Table is visible with all four header columns.
      page.getTable().should('be.visible');
      page.getHeaderCell('Created').should('be.visible');
      page.getHeaderCell('Name').should('be.visible');
      page.getHeaderCell('Value').should('be.visible');
      page.getHeaderCell('Options').should('be.visible');

      // Assert: First page of config is rendered (default sort: createdAt DESC).
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'name').should('contain.text', 'config-10');
      page.getCell(4, 'name').should('contain.text', 'config-06');

      // Act: Go to the Main tab and then return to the Config tab.
      page.openMainTab();
      page.openConfigTab();
      cy.waitIfHappens('@userConfigsRequest', { timeout: 500 });

      // Assert: correct data was loaded only once (no new reload).
      cy.get('@userConfigsRequest.all').should('have.length', 1);
      expectSubTabCalls(subTableEndpoints, { history: 0, permissions: 0, tokens: 0, jwt: 0 });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Config filter

  describe('config filter', () => {
    it('filters config table by created from date', () => {
      // Arrange: Stub config and select a user.
      stubUserConfigs(configEntries);
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Config tab and consume the initial (unfiltered) load.
      page.openConfigTab();
      cy.wait('@userConfigsRequest');

      // Act: Pick July 15th 2024 as the "created from" date and submit.
      page.selectDateFrom(2024, 6, 14);
      page.getCreatedFromInput().should('have.value', '📅 2024-07-15');
      page.submitFilter();

      // Assert: Request carries the converted date range bound and the user ID.
      cy.wait('@userConfigsRequest').then((interception) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = interception.request.body as any;
        cy.wrap(body.userId).should('equal', 9);
        cy.wrap(body.createdFromAt).should('equal', '2024-07-15T00:00:00');
        cy.wrap(body.createdToAt).should('equal', null);
      });

      // Assert: Only entries created on or after that date are rendered (page 1, createdAt DESC).
      page.getCell(0, 'name').should('contain.text', 'config-10');
      page.getCell(1, 'name').should('contain.text', 'config-09');
      page.getCell(3, 'name').should('contain.text', 'config-07');
      page.getRow(4).should('not.exist');
    });

    it('filters config table by created to date', () => {
      // Arrange: Stub config and select a user.
      stubUserConfigs(configEntries);
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Config tab and consume the initial (unfiltered) load.
      page.openConfigTab();
      cy.wait('@userConfigsRequest');

      // Act: Pick July 15th 2024 as the "created to" date and submit.
      page.selectDateTo(2024, 6, 14);
      page.getCreatedToInput().should('have.value', '📅 2024-07-15');
      page.submitFilter();

      // Assert: Request carries the converted end-of-day bound.
      cy.wait('@userConfigsRequest').then((interception) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = interception.request.body as any;
        cy.wrap(body.createdFromAt).should('equal', null);
        cy.wrap(body.createdToAt).should('equal', '2024-07-15T23:59:59.999999');
      });

      // Assert: Only entries created on or before that date are rendered (page 1, createdAt DESC).
      page.getCell(0, 'name').should('contain.text', 'config-07');
      page.getCell(4, 'name').should('contain.text', 'config-03');
      page.getPageNumber().should('contain.text', '2');
    });

    it('shows empty message when filter matches no config entry', () => {
      // Arrange: Stub config and select a user.
      stubUserConfigs(configEntries);
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Config tab and consume the initial (unfiltered) load.
      page.openConfigTab();
      cy.wait('@userConfigsRequest');

      // Act: Pick January 1st 2024 as the "created to" date (before any entry) and submit.
      page.selectDateTo(2024, 0, 0);
      page.getCreatedToInput().should('have.value', '📅 2024-01-01');
      page.submitFilter();

      // Assert: Request is sent and empty message is shown.
      cy.wait('@userConfigsRequest');
      page.getEmptyMessage().should('contain.text', 'Check filter settings');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Table navigation

  describe('table navigation', () => {
    it('navigates to next page of config table', () => {
      // Arrange: Stub config and select a user.
      stubUserConfigs(configEntries);
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Config tab and consume the initial load.
      page.openConfigTab();
      cy.wait('@userConfigsRequest');

      // Assert: First page is shown, there are two pages total.
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'name').should('contain.text', 'config-10');

      // Act: Jump to page two via the paginer input.
      page.setPage(2);

      // Assert: Request asks for the second page.
      cy.wait('@userConfigsRequest').its('request.body.tableMeta.page').should('equal', 1);

      // Assert: Second page of config is rendered, page count is unchanged.
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'name').should('contain.text', 'config-05');
      page.getCell(3, 'name').should('contain.text', 'config-02');
    });

    it('sorts config table by name column', () => {
      // Arrange: Stub config and select a user.
      stubUserConfigs(configEntries);
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Config tab and consume the initial load.
      page.openConfigTab();
      cy.wait('@userConfigsRequest');

      // Act: Click the Name header to sort ascending.
      page.clickSortHeader('Name');

      // Assert: A fresh column sort fires exactly one reload request.
      cy.get('@userConfigsRequest.all').should('have.length', 2); // initial + one reload
      cy.get('@userConfigsRequest.all').then((interceptions) => {
        const meta = interceptions[interceptions.length - 1].request.body.tableMeta;
        cy.wrap(meta.sortBy).should('equal', 'name');
        cy.wrap(meta.sortOrder).should('equal', 'ASC');
      });

      // Assert: Config entries are rendered in ascending name order (config-01...config-05).
      page.getCell(0, 'name').should('contain.text', 'config-01');
      page.getCell(4, 'name').should('contain.text', 'config-05');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Inline editing

  describe('inline editing', () => {
    it('adds a new config entry', () => {
      // Arrange: Stub config and select a user.
      stubUserConfigs(configEntries);
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Config tab and consume the initial load.
      page.openConfigTab();
      cy.wait('@userConfigsRequest');

      // Act: Click the add button (paginer options) and fill the new-entry row.
      page.clickAdd();
      page.fillName(-1, 'config-new');
      page.fillValue(-1, 'value-new');

      // Act: Save the new entry.
      page.clickEntryOption(-1, 'save');

      // Assert: Request carries the new entry data (id null = new entry, correct user).
      cy.wait('@userConfigEditRequest').then((interception) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = interception.request.body as any;
        cy.wrap(body.id).should('equal', null);
        cy.wrap(body.userId).should('equal', 9);
        cy.wrap(body.name).should('equal', 'config-new');
        cy.wrap(body.value).should('equal', 'value-new');
      });

      // Act: Wait for the reload after save.
      cy.wait('@userConfigsRequest');

      // Assert: The new entry is rendered at the top (it has the newest created date).
      page.getCell(0, 'name').should('contain.text', 'config-new');
      page.getCell(0, 'value').should('contain.text', 'value-new');

      // Assert: Success message is shown.
      cy.getByTestId('msgContainer').find('.message-success').should('contain.text', 'User config entry was saved.');
    });

    it('cancels adding a new config entry', () => {
      // Arrange: Stub config and select a user.
      stubUserConfigs(configEntries);
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Config tab and consume the initial load.
      page.openConfigTab();
      cy.wait('@userConfigsRequest');

      // Act: Click add, fill the new-entry row, then cancel.
      page.clickAdd();
      page.fillName(-1, 'config-new');
      page.clickEntryOption(-1, 'cancel');

      // Assert: No save request was sent.
      cy.get('@userConfigEditRequest.all').should('have.length', 0);

      // Assert: The add-new-entry row is gone and table is unchanged.
      page.getRow(-1).should('not.exist');
      page.getCell(0, 'name').should('contain.text', 'config-10');
    });

    it('edits an existing config entry', () => {
      // Arrange: Stub config and select a user.
      stubUserConfigs(configEntries);
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Config tab and consume the initial load.
      page.openConfigTab();
      cy.wait('@userConfigsRequest');

      // Act: Click the edit button of the first row and change name and value.
      page.clickEntryOption(0, 'edit');
      page.fillName(0, 'config-edited');
      page.fillValue(0, 'value-edited');

      // Act: Save the edited entry.
      page.clickEntryOption(0, 'save');

      // Assert: Request carries the edited entry data (id of edited entry, correct user).
      cy.wait('@userConfigEditRequest').then((interception) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = interception.request.body as any;
        cy.wrap(body.id).should('equal', 10);
        cy.wrap(body.userId).should('equal', 9);
        cy.wrap(body.name).should('equal', 'config-edited');
        cy.wrap(body.value).should('equal', 'value-edited');
      });

      // Act: Wait for the reload after save.
      cy.wait('@userConfigsRequest');

      // Assert: The edited entry is rendered with the new values.
      page.getCell(0, 'name').should('contain.text', 'config-edited');
      page.getCell(0, 'value').should('contain.text', 'value-edited');
    });

    it('cancels editing an existing config entry', () => {
      // Arrange: Stub config and select a user.
      stubUserConfigs(configEntries);
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Config tab and consume the initial load.
      page.openConfigTab();
      cy.wait('@userConfigsRequest');

      // Act: Click the edit button of the first row, change the name, then cancel.
      page.clickEntryOption(0, 'edit');
      page.fillName(0, 'config-edited');
      page.clickEntryOption(0, 'cancel');

      // Assert: No save request was sent.
      cy.get('@userConfigEditRequest.all').should('have.length', 0);

      // Assert: The row shows the original (unedited) values again.
      page.getCell(0, 'name').should('contain.text', 'config-10');
      page.getCell(0, 'value').should('contain.text', 'value-10');
    });

    it('deletes an existing config entry', () => {
      // Arrange: Stub config and select a user.
      stubUserConfigs(configEntries);
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Config tab and consume the initial load.
      page.openConfigTab();
      cy.wait('@userConfigsRequest');

      // Act: Click the delete button of the first row.
      page.clickEntryOption(0, 'delete');

      // Assert: Delete request targets the deleted entry id.
      cy.wait('@userConfigDeleteRequest').then((interception) => {
        cy.wrap(interception.request.url).should('contain', '/config/10');
      });

      // Act: Wait for the reload after delete.
      cy.wait('@userConfigsRequest');

      // Assert: The deleted entry is gone (first row is now the previous newest one).
      page.getCell(0, 'name').should('contain.text', 'config-09');

      // Assert: Success message is shown.
      cy.getByTestId('msgContainer').find('.message-success').should('contain.text', 'User config entry was deleted.');
    });

    it('shows failure message when saving new entry with invalid data', () => {
      // Arrange: Stub config and select a user.
      stubUserConfigs(configEntries);
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Config tab and consume the initial load.
      page.openConfigTab();
      cy.wait('@userConfigsRequest');

      // Act: Click add and try to save with an empty name.
      page.clickAdd();
      page.clickEntryOption(-1, 'save');

      // Assert: Failure message about invalid name is shown and no request is sent.
      cy.getByTestId('msgContainer').find('.message-failure').should('contain.text', 'Invalid config name.');
      cy.get('@userConfigEditRequest.all').should('have.length', 0);

      // Act: Fill only the name and try to save again.
      page.fillName(-1, 'config-new');
      page.clickEntryOption(-1, 'save');

      // Assert: Failure message about invalid value is shown and still no request is sent.
      cy.getByTestId('msgContainer').find('.message-failure').should('contain.text', 'Invalid config value.');
      cy.get('@userConfigEditRequest.all').should('have.length', 0);
    });
  });
});
