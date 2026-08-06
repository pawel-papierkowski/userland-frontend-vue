// ////////////////////////////////////////////////////////////////////////////
// Admin User JWT E2E Tests
// Tests the user JWT tab (AdminUserJwt) and its filter (AdminUserJwtFilter).

import type { UserFullDataResp, UserJwtTableEntry } from '@/code/data/features/user/admin-user-type.ts';
import { locstJwt } from '@/code/data/app/storage.ts';

import { stubUserTable, stubUserData, stubUserSubTables, expectSubTabCalls } from '@/../cypress/support/helpers/user.ts';
import type { UserTableEntry } from '@/../cypress/support/helpers/user.ts';
import AdminUserJwtPage from '@/../cypress/support/pages/admin/AdminUserJwtPage.ts';

/** Full users loaded from the fixture. Populated in `before()`. */
let fullUsers: UserFullDataResp[] = [];
/** JWT entries loaded from the fixture. Populated in `before()`. */
let jwtEntries: UserJwtTableEntry[] = [];

/** User (ivy, id 9) used across all JWT tests. */
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
  cy.fixture('admin/user-jwt.json').then((data: { userJwt: UserJwtTableEntry[] }) => {
    jwtEntries = data.userJwt;
  });
});

// ////////////////////////////////////////////////////////////////////////////
// Stubs

/**
 * Stub the user JWT API with a fake backend that filters, sorts and paginates
 * the given entries based on the request body.
 * @param entries JWT dataset. Defaults to the fixture data.
 * @param pageSize Default page size used when request does not specify one.
 */
function stubUserJwt(entries: UserJwtTableEntry[] = jwtEntries, pageSize: number = 5) {
  cy.intercept('POST', '**/api/admin/user/jwt', (req) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter = req.body as any;

    // Filtering (mirrors backend behavior for the created date range).
    let result = entries;
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
      const valueA = String(a[sortBy as keyof UserJwtTableEntry]);
      const valueB = String(b[sortBy as keyof UserJwtTableEntry]);
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
  }).as('userJwtRequest');
}

/** All user sub-tab table endpoints that we do not care about (except JWT). */
const subTableEndpoints: string[] = ['history', 'permissions', 'configs', 'tokens'] as const;

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
function setupSelectedUser(allUsers: UserFullDataResp[], user: UserTableEntry): AdminUserJwtPage {
  stubUserTable([user]);
  const ivyFull = allUsers.find((u) => u.id === user.id)!;
  stubUserData([ivyFull]);
  stubUserSubTables(subTableEndpoints);

  const page = new AdminUserJwtPage();
  page.visit();
  cy.wait('@userTableRequest');
  page.selectUserRow(0);
  return page;
}

// ////////////////////////////////////////////////////////////////////////////

describe('Admin User JWT', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  // //////////////////////////////////////////////////////////////////////////
  // Table rendering

  describe('table rendering', () => {
    it('shows empty message and disabled filter when no user is selected', () => {
      // Arrange: Stub the user table API and log in on the page.
      stubUserTable([ivyTableEntry]);
      const page = new AdminUserJwtPage();
      page.visit();
      cy.wait('@userTableRequest');

      // Act: Switch to the JWT tab without selecting any user.
      page.openJwtTab();

      // Assert: Empty message for "no user selected" is shown.
      page.getTable().should('be.visible');
      page.getEmptyMessage().should('contain.text', 'No JWTs to show.');

      // Assert: The whole filter is disabled (no user selected).
      page.getFilterSubmitButton().should('be.disabled');
      page.getCreatedFromInput().should('be.disabled');
      page.getCreatedToInput().should('be.disabled');
    });

    it('shows empty message and disabled filter when user was deselected', () => {
      // Arrange: Stub all APIs, log in, select a user and stub JWT data.
      stubUserJwt();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Act: Open the JWT tab.
      page.openJwtTab();
      cy.wait('@userJwtRequest');

      // Act: Deselect user.
      page.selectUserRow(0);

      // Assert: Empty message for "no user selected" is shown.
      page.getTable().should('be.visible');
      page.getEmptyMessage().should('contain.text', 'No JWTs to show.');

      // Assert: The whole filter is disabled (no user selected).
      page.getFilterSubmitButton().should('be.disabled');
      page.getCreatedFromInput().should('be.disabled');
      page.getCreatedToInput().should('be.disabled');
    });

    it('shows JWT data for the selected user', () => {
      // Arrange: Stub all APIs, log in, select a user and stub JWT data.
      stubUserJwt();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Act: Open the JWT tab.
      page.openJwtTab();
      cy.wait('@userJwtRequest');

      // Assert: correct data was loaded only once.
      cy.get('@userJwtRequest.all').should('have.length', 1);
      expectSubTabCalls(subTableEndpoints, { history: 0, permissions: 0, configs: 0, tokens: 0 });

      // Assert: Table is visible with all three header columns.
      page.getTable().should('be.visible');
      page.getHeaderCell('Created').should('be.visible');
      page.getHeaderCell('Expires').should('be.visible');
      page.getHeaderCell('Token').should('be.visible');

      // Assert: First page of JWTs is rendered (default sort: createdAt DESC).
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'token').should('contain.text', 'sig10');
      page.getCell(4, 'token').should('contain.text', 'sig06');

      // Act: Go to the Main tab and then return to the JWT tab.
      page.openMainTab();
      page.openJwtTab();
      cy.waitIfHappens('@userJwtRequest', { timeout: 500 });

      // Assert: correct data was loaded only once (no new reload).
      cy.get('@userJwtRequest.all').should('have.length', 1);
      expectSubTabCalls(subTableEndpoints, { history: 0, permissions: 0, configs: 0, tokens: 0 });
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // JWT filter

  describe('jwt filter', () => {
    it('filters JWT table by created from date', () => {
      // Arrange: Stub JWT and select a user.
      stubUserJwt();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the JWT tab and consume the initial (unfiltered) load.
      page.openJwtTab();
      cy.wait('@userJwtRequest');

      // Act: Pick July 15th 2024 as the "created from" date and submit.
      page.selectDateFrom(2024, 6, 14);
      page.getCreatedFromInput().should('have.value', '📅 2024-07-15');
      page.submitFilter();

      // Assert: Request carries the converted date range bound and the user ID.
      cy.wait('@userJwtRequest').then((interception) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = interception.request.body as any;
        cy.wrap(body.userId).should('equal', 9);
        cy.wrap(body.createdFromAt).should('equal', '2024-07-15T00:00:00');
        cy.wrap(body.createdToAt).should('equal', null);
      });

      // Assert: Only entries created on or after that date are rendered (page 1, createdAt DESC).
      page.getCell(0, 'token').should('contain.text', 'sig10');
      page.getCell(1, 'token').should('contain.text', 'sig09');
      page.getCell(3, 'token').should('contain.text', 'sig07');
      page.getRow(4).should('not.exist');
    });

    it('filters JWT table by created to date', () => {
      // Arrange: Stub JWT and select a user.
      stubUserJwt();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the JWT tab and consume the initial (unfiltered) load.
      page.openJwtTab();
      cy.wait('@userJwtRequest');

      // Act: Pick July 15th 2024 as the "created to" date and submit.
      page.selectDateTo(2024, 6, 14);
      page.getCreatedToInput().should('have.value', '📅 2024-07-15');
      page.submitFilter();

      // Assert: Request carries the converted end-of-day bound.
      cy.wait('@userJwtRequest').then((interception) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = interception.request.body as any;
        cy.wrap(body.createdFromAt).should('equal', null);
        cy.wrap(body.createdToAt).should('equal', '2024-07-15T23:59:59.999999');
      });

      // Assert: Only entries created on or before that date are rendered (page 1, createdAt DESC).
      page.getCell(0, 'token').should('contain.text', 'sig07');
      page.getCell(4, 'token').should('contain.text', 'sig03');
      page.getPageNumber().should('contain.text', '2');
    });

    it('shows empty message when filter matches no JWT', () => {
      // Arrange: Stub JWT and select a user.
      stubUserJwt();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the JWT tab and consume the initial (unfiltered) load.
      page.openJwtTab();
      cy.wait('@userJwtRequest');

      // Act: Pick January 1st 2024 as the "created to" date (before any entry) and submit.
      page.selectDateTo(2024, 0, 0);
      page.getCreatedToInput().should('have.value', '📅 2024-01-01');
      page.submitFilter();

      // Assert: Request is sent and empty message is shown.
      cy.wait('@userJwtRequest');
      page.getEmptyMessage().should('contain.text', 'Check filter settings');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Table navigation

  describe('table navigation', () => {
    it('navigates to next page of JWT table', () => {
      // Arrange: Stub JWT and select a user.
      stubUserJwt();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the JWT tab and consume the initial load.
      page.openJwtTab();
      cy.wait('@userJwtRequest');

      // Assert: First page is shown, there are two pages total.
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'token').should('contain.text', 'sig10');

      // Act: Jump to page two via the paginer input.
      page.setPage(2);

      // Assert: Request asks for the second page.
      cy.wait('@userJwtRequest').its('request.body.tableMeta.page').should('equal', 1);

      // Assert: Second page of JWTs is rendered, page count is unchanged.
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'token').should('contain.text', 'sig05');
      page.getCell(3, 'token').should('contain.text', 'sig02');
    });

    it('sorts JWT table by token column', () => {
      // Arrange: Stub JWT and select a user.
      stubUserJwt();
      const page = setupSelectedUser(fullUsers, ivyTableEntry);

      // Open the JWT tab and consume the initial load.
      page.openJwtTab();
      cy.wait('@userJwtRequest');

      // Act: Click the Token header to sort ascending.
      page.clickSortHeader('Token');

      // Assert: A fresh column sort fires exactly one reload request.
      cy.get('@userJwtRequest.all').should('have.length', 2); // initial + one reload
      cy.get('@userJwtRequest.all').then((interceptions) => {
        const meta = interceptions[interceptions.length - 1].request.body.tableMeta;
        cy.wrap(meta.sortBy).should('equal', 'token');
        cy.wrap(meta.sortOrder).should('equal', 'ASC');
      });

      // Assert: JWTs are rendered in ascending token order (sig01...sig05).
      page.getCell(0, 'token').should('contain.text', 'sig01');
      page.getCell(4, 'token').should('contain.text', 'sig05');
    });
  });
});
