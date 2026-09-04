// ////////////////////////////////////////////////////////////////////////////
// Admin User Tokens E2E Tests
// Tests the user tokens tab (AdminUserTokens) and its filter (AdminUserTokensFilter).

import type { UserFullDataResp, UserTokenTableReq, UserTokenTableEntry } from '@/code/data/features/user/admin-user-type.ts';
import { locstJwt } from '@/code/data/app/storage.ts';

import { stubUserTable, stubUserData, stubUserSubTables, expectSubTabCalls } from '@/../cypress/support/helpers/user.ts';
import type { UserTableEntry } from '@/../cypress/support/helpers/user.ts';
import AdminUserPage from '@/../cypress/support/pages/admin/AdminUserPage.ts';
import AdminUserTokensPage from '@/../cypress/support/pages/admin/AdminUserTokensPage.ts';

/** Full users loaded from the fixture. Populated in `before()`. */
let fullUsers: UserFullDataResp[] = [];
/** Token entries loaded from the fixture. Populated in `before()`. */
let tokenEntries: UserTokenTableEntry[] = [];

/** User (ivy, id 9) used across all tokens tests. */
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
  cy.fixture('admin/user-token.json').then((data: { userTokens: UserTokenTableEntry[] }) => {
    tokenEntries = data.userTokens;
  });
});

// ////////////////////////////////////////////////////////////////////////////
// Stubs

/**
 * Stub the user tokens API with a fake backend that filters, sorts and paginates
 * the given entries based on the request body.
 * @param entries Tokens dataset. Defaults to the fixture data.
 * @param pageSize Default page size used when request does not specify one.
 */
function stubUserTokens(entries: UserTokenTableEntry[] = tokenEntries, pageSize: number = 5) {
  cy.intercept('POST', '**/api/admin/user/tokens', (req) => {
    const filter = req.body as UserTokenTableReq;

    // Filtering (mirrors backend behavior for the created date range).
    let result = entries;
    if (filter.createdFromAt) {
      const createdFromAt = filter.createdFromAt;
      result = result.filter((e) => e.createdAt >= createdFromAt);
    }
    if (filter.createdToAt) {
      const createdToAt = filter.createdToAt;
      result = result.filter((e) => e.createdAt <= createdToAt);
    }

    // Sorting. Default sort is echoed back so the page keeps non-null sort state
    // (the page only reloads on a sort change when the previous sort is non-null).
    const sortBy = filter.tableMeta?.sortBy || 'createdAt';
    const sortOrder = filter.tableMeta?.sortOrder || 'DESC';
    const sorted = [...result].sort((a, b) => {
      const valueA = String(a[sortBy as keyof UserTokenTableEntry]);
      const valueB = String(b[sortBy as keyof UserTokenTableEntry]);
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
  }).as('userTokensRequest');
}

/** All user sub-tab table endpoints that we do not care about (except tokens). */
const subTableEndpoints: string[] = ['history', 'permissions', 'configs', 'jwt'] as const;

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
function setupSelectedUser(allUsers: UserFullDataResp[], user: UserTableEntry): AdminUserTokensPage {
  stubUserTable([user]);
  const userFull = allUsers.find((u) => u.id === user.id)!;
  stubUserData([userFull]);
  stubUserSubTables(subTableEndpoints);

  const common = new AdminUserPage();
  const page = new AdminUserTokensPage();
  common.visitAsAdmin();
  cy.wait('@userTableRequest');
  page.selectUserRow(0);
  return page;
}

// ////////////////////////////////////////////////////////////////////////////

describe('Admin User Tokens', () => {
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
      const page = new AdminUserTokensPage();
      common.visitAsAdmin();
      cy.wait('@userTableRequest');

      // Act: Switch to the Tokens tab without selecting any user.
      common.openTokensTab();

      // Assert: Empty message for "no user selected" is shown.
      page.getTable().should('be.visible');
      page.getEmptyMessage().should('contain.text', 'No tokens to show.');

      // Assert: The whole filter is disabled (no user selected).
      page.getFilterSubmitButton().should('be.disabled');
      page.getCreatedFromInput().should('be.disabled');
      page.getCreatedToInput().should('be.disabled');
    });

    it('shows empty message and disabled filter when user was deselected', () => {
      // Arrange: Stub all APIs, log in, select a user and stub tokens data.
      stubUserTokens();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Act: Open the Tokens tab.
      common.openTokensTab();
      cy.wait('@userTokensRequest');

      // Act: Deselect user.
      page.selectUserRow(0);

      // Assert: Empty message for "no user selected" is shown.
      page.getTable().should('be.visible');
      page.getEmptyMessage().should('contain.text', 'No tokens to show.');

      // Assert: The whole filter is disabled (no user selected).
      page.getFilterSubmitButton().should('be.disabled');
      page.getCreatedFromInput().should('be.disabled');
      page.getCreatedToInput().should('be.disabled');
    });

    it('shows tokens data for the selected user', () => {
      // Arrange: Stub all APIs, log in, select a user and stub tokens data.
      stubUserTokens();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Act: Open the Tokens tab.
      common.openTokensTab();
      cy.wait('@userTokensRequest');

      // Assert: correct data was loaded only once.
      cy.get('@userTokensRequest.all').should('have.length', 1);
      expectSubTabCalls(subTableEndpoints, { history: 0, permissions: 0, configs: 0, jwt: 0 });

      // Assert: Table is visible with all four header columns.
      page.getTable().should('be.visible');
      page.getHeaderCell('Created').should('be.visible');
      page.getHeaderCell('Expires').should('be.visible');
      page.getHeaderCell('Token').should('be.visible');
      page.getHeaderCell('Payload').should('be.visible');

      // Assert: First page of tokens is rendered (default sort: createdAt DESC).
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'token').should('contain.text', 'tok-10');
      page.getCell(4, 'token').should('contain.text', 'tok-06');

      // Act: Go to the Main tab and then return to the Tokens tab.
      common.openMainTab();
      common.openTokensTab();
      cy.waitIfHappens('@userTokensRequest', { timeout: 500 });

      // Assert: correct data was loaded only once (no new reload).
      cy.get('@userTokensRequest.all').should('have.length', 1);
      expectSubTabCalls(subTableEndpoints, { history: 0, permissions: 0, configs: 0, jwt: 0 });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Tokens filter

  describe('tokens filter', () => {
    it('filters tokens table by created from date', () => {
      // Arrange: Stub tokens and select a user.
      stubUserTokens();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Tokens tab and consume the initial (unfiltered) load.
      common.openTokensTab();
      cy.wait('@userTokensRequest');

      // Act: Pick July 15th 2024 as the "created from" date and submit.
      page.selectDateFrom(2024, 6, 14);
      page.getCreatedFromInput().should('have.value', '📅 2024-07-15');
      page.submitFilter();

      // Assert: Request carries the converted date range bound and the user ID.
      cy.wait('@userTokensRequest').then((interception) => {
        const body = interception.request.body as UserTokenTableReq;
        cy.wrap(body.userId).should('equal', 9);
        cy.wrap(body.createdFromAt).should('equal', '2024-07-15T00:00:00');
        cy.wrap(body.createdToAt).should('equal', null);
      });

      // Assert: Only entries created on or after that date are rendered (page 1, createdAt DESC).
      page.getCell(0, 'token').should('contain.text', 'tok-10');
      page.getCell(1, 'token').should('contain.text', 'tok-09');
      page.getCell(3, 'token').should('contain.text', 'tok-07');
      page.getRow(4).should('not.exist');
    });

    it('filters tokens table by created to date', () => {
      // Arrange: Stub tokens and select a user.
      stubUserTokens();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Tokens tab and consume the initial (unfiltered) load.
      common.openTokensTab();
      cy.wait('@userTokensRequest');

      // Act: Pick July 15th 2024 as the "created to" date and submit.
      page.selectDateTo(2024, 6, 14);
      page.getCreatedToInput().should('have.value', '📅 2024-07-15');
      page.submitFilter();

      // Assert: Request carries the converted end-of-day bound.
      cy.wait('@userTokensRequest').then((interception) => {
        const body = interception.request.body as UserTokenTableReq;
        cy.wrap(body.createdFromAt).should('equal', null);
        cy.wrap(body.createdToAt).should('equal', '2024-07-15T23:59:59.999999');
      });

      // Assert: Only entries created on or before that date are rendered (page 1, createdAt DESC).
      page.getCell(0, 'token').should('contain.text', 'tok-07');
      page.getCell(4, 'token').should('contain.text', 'tok-03');
      page.getPageNumber().should('contain.text', '2');
    });

    it('shows empty message when filter matches no token', () => {
      // Arrange: Stub tokens and select a user.
      stubUserTokens();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Tokens tab and consume the initial (unfiltered) load.
      common.openTokensTab();
      cy.wait('@userTokensRequest');

      // Act: Pick January 1st 2024 as the "created to" date (before any entry) and submit.
      page.selectDateTo(2024, 0, 0);
      page.getCreatedToInput().should('have.value', '📅 2024-01-01');
      page.submitFilter();

      // Assert: Request is sent and empty message is shown.
      cy.wait('@userTokensRequest');
      page.getEmptyMessage().should('contain.text', 'Check filter settings');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Table navigation

  describe('table navigation', () => {
    it('navigates to next page of tokens table', () => {
      // Arrange: Stub tokens and select a user.
      stubUserTokens();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Tokens tab and consume the initial load.
      common.openTokensTab();
      cy.wait('@userTokensRequest');

      // Assert: First page is shown, there are two pages total.
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'token').should('contain.text', 'tok-10');

      // Act: Jump to page two via the paginer input.
      page.setPage(2);

      // Assert: Request asks for the second page.
      cy.wait('@userTokensRequest').its('request.body.tableMeta.page').should('equal', 1);

      // Assert: Second page of tokens is rendered, page count is unchanged.
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'token').should('contain.text', 'tok-05');
      page.getCell(3, 'token').should('contain.text', 'tok-02');
    });

    it('sorts tokens table by token column', () => {
      // Arrange: Stub tokens and select a user.
      stubUserTokens();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the Tokens tab and consume the initial load.
      common.openTokensTab();
      cy.wait('@userTokensRequest');

      // Act: Click the Token header to sort ascending.
      page.clickSortHeader('Token');

      // Assert: A fresh column sort fires exactly one reload request.
      cy.get('@userTokensRequest.all').should('have.length', 2); // initial + one reload
      cy.get('@userTokensRequest.all').then((interceptions) => {
        const meta = interceptions[interceptions.length - 1].request.body.tableMeta;
        cy.wrap(meta.sortBy).should('equal', 'token');
        cy.wrap(meta.sortOrder).should('equal', 'ASC');
      });

      // Assert: Tokens are rendered in ascending token order (tok-01...tok-05).
      page.getCell(0, 'token').should('contain.text', 'tok-01');
      page.getCell(4, 'token').should('contain.text', 'tok-05');
    });
  });
});
