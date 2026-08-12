// ////////////////////////////////////////////////////////////////////////////
// Admin User History E2E Tests
// Tests the user history tab (AdminUserHistory) and its filter (AdminUserHistoryFilter).

import type { UserFullDataResp, UserHistoryTableEntry } from '@/code/data/features/user/admin-user-type.ts';
import { locstJwt } from '@/code/data/app/storage.ts';

import { stubUserTable, stubUserData, stubUserSubTables, expectSubTabCalls } from '@/../cypress/support/helpers/user.ts';
import type { UserTableEntry } from '@/../cypress/support/helpers/user.ts';
import AdminUserPage from '@/../cypress/support/pages/admin/AdminUserPage.ts';
import AdminUserHistoryPage from '@/../cypress/support/pages/admin/AdminUserHistoryPage.ts';

/** Full users loaded from the fixture. Populated in `before()`. */
let fullUsers: UserFullDataResp[] = [];
/** History entries loaded from the fixture. Populated in `before()`. */
let historyEntries: UserHistoryTableEntry[] = [];

/** Editable user (ivy, id 9) used across all history tests. */
const ivyTableEntry: UserTableEntry = {
  id: 9,
  createdAt: '2024-09-10T12:00:00Z',
  username: 'ivy',
  email: 'ivy@test.com',
  status: 'ACTIVE',
};

/** Load the fixtures once before all tests. */
before(() => {
  cy.fixture('admin/user-full.json').then((data: { users: UserFullDataResp[] }) => {
    fullUsers = data.users;
  });
  cy.fixture('admin/user-history.json').then((data: { userHistory: UserHistoryTableEntry[] }) => {
    historyEntries = data.userHistory;
  });
});

// ////////////////////////////////////////////////////////////////////////////
// Stubs

/**
 * Stub the user history API with a fake backend that filters, sorts and paginates
 * the given entries based on the request body.
 * @param entries History dataset. Defaults to the fixture data.
 * @param pageSize Default page size used when request does not specify one.
 */
function stubUserHistory(entries: UserHistoryTableEntry[] = historyEntries, pageSize: number = 5) {
  cy.intercept('POST', '**/api/admin/user/history', (req) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter = req.body as any;

    // Filtering (mirrors backend behavior for who, what and created date range).
    let result = entries;
    if (filter.who) {
      result = result.filter((e) => e.who === filter.who);
    }
    if (filter.what) {
      result = result.filter((e) => e.what === filter.what);
    }
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
      const valueA = String(a[sortBy as keyof UserHistoryTableEntry]);
      const valueB = String(b[sortBy as keyof UserHistoryTableEntry]);
      const cmp = valueA.localeCompare(valueB);
      return sortOrder === 'DESC' ? -cmp : cmp;
    });

    // Pagination.
    const size = filter.tableMeta?.pageSize || pageSize;
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
  }).as('userHistoryRequest');
}

/** All user sub-tab table endpoints that we do not care about (except history). */
const subTableEndpoints: string[] = ['permissions', 'configs', 'tokens', 'jwt'] as const;

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
function setupSelectedUser(allUsers: UserFullDataResp[], user: UserTableEntry): AdminUserHistoryPage {
  stubUserTable([user]);
  const ivyFull = allUsers.find((u) => u.id === user.id)!;
  stubUserData([ivyFull]);
  stubUserSubTables(subTableEndpoints);

  const common = new AdminUserPage();
  const page = new AdminUserHistoryPage();
  common.visit();
  cy.wait('@userTableRequest');
  page.selectUserRow(0);
  return page;
}

// ////////////////////////////////////////////////////////////////////////////

describe('Admin User History', () => {
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
      const page = new AdminUserHistoryPage();
      common.visit();
      cy.wait('@userTableRequest');

      // Act: Switch to the History tab without selecting any user.
      common.openHistoryTab();

      // Assert: Empty message for "no user selected" is shown.
      page.getTable().should('be.visible');
      page.getEmptyMessage().should('contain.text', 'No history to show.');

      // Assert: The whole filter is disabled (no user selected).
      page.getFilterSubmitButton().should('be.disabled');
      page.getWhoComboBox().should('have.class', 'disabled');
      page.getWhatComboBox().should('have.class', 'disabled');
      page.getCreatedFromInput().should('be.disabled');
      page.getCreatedToInput().should('be.disabled');
    });

    it('shows empty message and disabled filter when user was deselected', () => {
      // Arrange: Stub all APIs, log in, select a user and stub history data.
      stubUserHistory();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Act: Open the History tab.
      common.openHistoryTab();
      cy.wait('@userHistoryRequest');

      // Act: Deselect user.
      page.selectUserRow(0);

      // Assert: Empty message for "no user selected" is shown.
      page.getTable().should('be.visible');
      page.getEmptyMessage().should('contain.text', 'No history to show.');

      // Assert: The whole filter is disabled (no user selected).
      page.getFilterSubmitButton().should('be.disabled');
      page.getWhoComboBox().should('have.class', 'disabled');
      page.getWhatComboBox().should('have.class', 'disabled');
      page.getCreatedFromInput().should('be.disabled');
      page.getCreatedToInput().should('be.disabled');
    });

    it('shows history data for the selected user', () => {
      // Arrange: Stub all APIs, log in, select a user and stub history data.
      stubUserHistory();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Act: Open the History tab.
      common.openHistoryTab();
      cy.wait('@userHistoryRequest');

      // Assert: correct data was loaded only once.
      cy.get(`@userHistoryRequest.all`).should('have.length', 1);
      expectSubTabCalls(subTableEndpoints, { permissions: 0, configs: 0, tokens: 0, jwt: 0 });

      // Assert: Table is visible with all four header columns.
      page.getTable().should('be.visible');
      page.getHeaderCell('Created').should('be.visible');
      page.getHeaderCell('Who').should('be.visible');
      page.getHeaderCell('What').should('be.visible');
      page.getHeaderCell('Parameters').should('be.visible');

      // Assert: First page of history is rendered (default sort: createdAt DESC).
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'who').should('contain.text', 'SYSTEM');
      page.getCell(0, 'what').should('contain.text', 'PASS_RESET');
      page.getCell(4, 'who').should('contain.text', 'SYSTEM');
      page.getCell(4, 'what').should('contain.text', 'PROLONG');

      // Act: Go to the Main tab and then return to the History tab.
      common.openMainTab();
      common.openHistoryTab();
      cy.waitIfHappens('@userHistoryRequest', { timeout: 500 });

      // Assert: correct data was loaded only once (no new reload).
      cy.get(`@userHistoryRequest.all`).should('have.length', 1);
      expectSubTabCalls(subTableEndpoints, { permissions: 0, configs: 0, tokens: 0, jwt: 0 });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // History filter

  describe('history filter', () => {
    it('filters history table by created from date', () => {
      // Arrange
      stubUserHistory();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the History tab and consume the initial load.
      common.openHistoryTab();
      cy.wait('@userHistoryRequest');

      // Act: Pick July 15th 2024 as the "created from" date and submit.
      page.selectDate(2024, 6, 14);
      page.getCreatedFromInput().should('have.value', '📅 2024-07-15');
      page.submitFilter();

      // Assert: Request carries the converted date range bound.
      cy.wait('@userHistoryRequest').then((interception) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = interception.request.body as any;
        cy.wrap(body.createdFromAt).should('equal', '2024-07-15T00:00:00');
        cy.wrap(body.createdToAt).should('equal', null);
      });

      // Assert: Only entries created on or after that date are rendered (page 1, createdAt DESC).
      page.getCell(0, 'what').should('contain.text', 'PASS_RESET');
      page.getCell(2, 'what').should('contain.text', 'LOGIN');
      page.getRow(3).should('not.exist');
    });

    it('filters history table by who', () => {
      // Arrange: Stub history and select a user.
      stubUserHistory();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the History tab and consume the initial (unfiltered) load.
      common.openHistoryTab();
      cy.wait('@userHistoryRequest');

      // Act: Select USER as 'who' and submit.
      page.selectWho(1);
      page.submitFilter();

      // Assert: Request carries the who filter.
      cy.wait('@userHistoryRequest').its('request.body.who').should('equal', 'USER');

      // Assert: Only history entries done by the user are rendered (sorted by createdAt DESC).
      page.getCell(0, 'what').should('contain.text', 'LOGIN');
      page.getCell(1, 'what').should('contain.text', 'LOGOUT');
      page.getCell(3, 'what').should('contain.text', 'CREATE');
      page.getRow(4).should('not.exist');
    });

    it('filters history table by what', () => {
      // Arrange
      stubUserHistory();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the History tab and consume the initial load.
      common.openHistoryTab();
      cy.wait('@userHistoryRequest');

      // Act: Select 'LOGIN' as 'what' and submit.
      page.selectWhat(9);
      page.submitFilter();

      // Assert: Request carries the what filter.
      cy.wait('@userHistoryRequest').its('request.body.what').should('equal', 'LOGIN');

      // Assert: Only LOGIN records are rendered.
      page.getCell(0, 'who').should('contain.text', 'USER');
      page.getRow(2).should('not.exist');
    });

    it('shows empty message when filter matches no history', () => {
      // Arrange
      stubUserHistory();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the History tab and consume the initial load.
      common.openHistoryTab();
      cy.wait('@userHistoryRequest');

      // Act: Select a combination that has no matching entries and submit.
      page.selectWho(1); // USER
      page.selectWhat(7); // PASS_RESET (only SYSTEM)
      page.submitFilter();

      // Assert: Request is sent and empty message is shown.
      cy.wait('@userHistoryRequest');
      page.getEmptyMessage().should('contain.text', 'No history to show');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Table navigation

  describe('table navigation', () => {
    it('navigates to next page of history table', () => {
      // Arrange
      stubUserHistory();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the History tab and consume the initial load.
      common.openHistoryTab();
      cy.wait('@userHistoryRequest');

      // Assert: First page is shown, there are two pages total.
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'what').should('contain.text', 'PASS_RESET');

      // Act: Jump to page two via the paginer input.
      page.setPage(2);

      // Assert: Request asks for the second page.
      cy.wait('@userHistoryRequest').its('request.body.tableMeta.page').should('equal', 1);

      // Assert: Second page of history is rendered, page count is unchanged.
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'what').should('contain.text', 'LOGOUT');
      page.getCell(3, 'what').should('contain.text', 'CREATE');
    });

    it('sorts history table by who column', () => {
      // Arrange
      stubUserHistory();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the History tab and consume the initial load.
      common.openHistoryTab();
      cy.wait('@userHistoryRequest');

      // Act: Click the Who header to sort ascending.
      page.clickSortHeader('Who');

      // Assert: A fresh column sort fires exactly one reload request.
      cy.get('@userHistoryRequest.all').should('have.length', 2); // initial + one reload
      cy.get('@userHistoryRequest.all').then((interceptions) => {
        const meta = interceptions[interceptions.length - 1].request.body.tableMeta;
        cy.wrap(meta.sortBy).should('equal', 'who');
        cy.wrap(meta.sortOrder).should('equal', 'ASC');
      });

      // Assert: Entries are rendered in ascending who order (OPERATOR < SYSTEM < USER).
      page.getCell(0, 'who').should('contain.text', 'OPERATOR');
      page.getCell(4, 'who').should('contain.text', 'SYSTEM');
    });
  });
});
