// ////////////////////////////////////////////////////////////////////////////
// Admin User History E2E Tests
// Tests the user history tab (AdminUserHistory) and its filter (AdminUserHistoryFilter).

import { locstJwt } from '@/code/data/app/storage.ts';
import AdminUserHistoryPage from '@/../cypress/support/pages/admin/AdminUserHistoryPage.ts';

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

/** Shape of a single user history entry in the fixture. */
interface UserHistoryEntry {
  id: number;
  createdAt: string;
  who: string;
  what: string;
  params: string;
}

/** Full users loaded from the fixture. Populated in `before()`. */
let fullUsers: UserFullData[] = [];
/** History entries loaded from the fixture. Populated in `before()`. */
let historyEntries: UserHistoryEntry[] = [];

/** An empty table metadata (used for empty secondary sub-tab tables). */
const emptyTableMeta = { pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: '', sortOrder: '' };

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
  cy.fixture('admin/user-full.json').then((data: { users: UserFullData[] }) => {
    fullUsers = data.users;
  });
  cy.fixture('admin/user-history.json').then((data: { userHistory: UserHistoryEntry[] }) => {
    historyEntries = data.userHistory;
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
 */
function stubUserData(users: UserFullData[]) {
  cy.intercept('GET', '**/api/admin/user/*', (req) => {
    const id = Number(req.url.split('/').pop());
    const found = users.find((u) => u.id === id) ?? users[0];
    req.reply({ statusCode: 200, body: { ...found } });
  }).as('userDataRequest');
}

/**
 * Stub the user history API with a fake backend that filters, sorts and paginates
 * the given entries based on the request body.
 * @param entries History dataset. Defaults to the fixture data.
 * @param pageSize Default page size used when request does not specify one.
 */
function stubUserHistory(entries: UserHistoryEntry[] = historyEntries, pageSize: number = 5) {
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
      const valueA = String(a[sortBy as keyof UserHistoryEntry]);
      const valueB = String(b[sortBy as keyof UserHistoryEntry]);
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

/** Stub all secondary user sub-tab tables (except history) to return empty data. */
function stubEmptySubTables() {
  const endpoints = ['permissions', 'configs', 'tokens', 'jwt'];
  endpoints.forEach((endpoint) => {
    cy.intercept('POST', `**/api/admin/user/${endpoint}`, {
      statusCode: 200,
      body: { entries: [], tableMeta: emptyTableMeta },
    });
  });
}

/**
 * Set up the common stubs needed to select a user and open its editor, then visit
 * the page and select the given user row.
 * @param user User table entry to show.
 * @returns Nothing.
 */
function setupSelectedUser(user: UserTableEntry) {
  stubUserTable([user]);
  const ivyFull = fullUsers.find((u) => u.id === user.id)!;
  stubUserData([ivyFull]);
  stubEmptySubTables();

  const page = new AdminUserHistoryPage();
  page.visit();
  cy.wait('@userTableRequest');
  page.selectUserRow(0);
  cy.wait('@userHistoryRequest');
  return page;
}

// ////////////////////////////////////////////////////////////////////////////

describe('Admin User History', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  // //////////////////////////////////////////////////////////////////////////
  // Initial state

  describe('initial state', () => {
    it('shows empty message and disabled filter when no user is selected', () => {
      // Arrange: Stub the user table API and log in on the page.
      stubUserTable([ivyTableEntry]);
      const page = new AdminUserHistoryPage();
      page.visit();
      cy.wait('@userTableRequest');

      // Act: Switch to the History tab without selecting any user.
      page.openHistoryTab();

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
  });

  // //////////////////////////////////////////////////////////////////////////
  // Table rendering

  describe('table rendering', () => {
    it('shows history data for the selected user', () => {
      // Arrange: Stub all APIs, log in, select a user and stub history data.
      stubUserHistory();
      const page = setupSelectedUser(ivyTableEntry);

      // Act: Open the History tab.
      page.openHistoryTab();

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
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // History filter

  describe('history filter', () => {
    it('filters history table by who', () => {
      // Arrange: Stub history and select a user.
      stubUserHistory();
      const page = setupSelectedUser(ivyTableEntry);
      page.openHistoryTab();

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
      const page = setupSelectedUser(ivyTableEntry);
      page.openHistoryTab();

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
      const page = setupSelectedUser(ivyTableEntry);
      page.openHistoryTab();

      // Act: Select a combination that has no matching entries and submit.
      page.selectWho(1); // USER
      page.selectWhat(7); // PASS_RESET (only SYSTEM)
      page.submitFilter();

      // Assert: Request is sent and empty message is shown.
      cy.wait('@userHistoryRequest');
      page.getEmptyMessage().should('contain.text', 'No history to show');
    });

    it('filters history table by created from date', () => {
      // Arrange
      stubUserHistory();
      const page = setupSelectedUser(ivyTableEntry);
      page.openHistoryTab();

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
  });

  // //////////////////////////////////////////////////////////////////////////
  // Table navigation

  describe('table navigation', () => {
    it('navigates to next page of history table', () => {
      // Arrange
      stubUserHistory();
      const page = setupSelectedUser(ivyTableEntry);
      page.openHistoryTab();

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
      const page = setupSelectedUser(ivyTableEntry);
      page.openHistoryTab();

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