// ////////////////////////////////////////////////////////////////////////////
// Admin User Table E2E Tests
// Tests main user table (AdminUser) and user's main filter panel (AdminUserFilter).

import { locstJwt } from '@/code/data/app/storage.ts';

import type { UserTableEntry } from '@/../cypress/support/helpers/user.ts';
import AdminUserPage from '@/../cypress/support/pages/admin/AdminUserPage.ts';
import AdminUserTablePage from '@/../cypress/support/pages/admin/AdminUserTablePage.ts';

/** Users loaded from the fixture. Populated in `before()`. */
let fixtureUsers: UserTableEntry[] = [];

/** Load the fixture data once before all tests. */
before(() => {
  cy.fixture('admin/users.json').then((data: { users: UserTableEntry[] }) => {
    fixtureUsers = data.users;
  });
});

// ////////////////////////////////////////////////////////////////////////////
// Stubs

/**
 * Stub the user table API with a fake backend that filters, sorts and
 * paginates the given users based on the request body.
 * @param users Users dataset. Defaults to the fixture data.
 * @param pageSize Default page size used when request does not specify one.
 */
function stubUserTable(users: UserTableEntry[] = fixtureUsers, pageSize: number = 5) {
  cy.intercept('POST', '**/api/admin/users', (req) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter = req.body as any;

    // Filtering (mirrors backend behavior for username, email and status).
    let result = users;
    if (filter.username) {
      result = result.filter((u) => u.username.toLowerCase().includes(filter.username.toLowerCase()));
    }
    if (filter.email) {
      result = result.filter((u) => u.email.toLowerCase().includes(filter.email.toLowerCase()));
    }
    if (filter.status) {
      result = result.filter((u) => u.status === filter.status);
    }

    // Sorting. Default sort is echoed back so the page keeps non-null sort state
    // (the page only reloads on a sort change when the previous sort is non-null).
    const sortBy = filter.tableMeta?.sortBy || 'createdAt';
    const sortOrder = filter.tableMeta?.sortOrder || 'DESC';
    const sorted = [...result].sort((a, b) => {
      const valueA = String(a[sortBy as keyof UserTableEntry]);
      const valueB = String(b[sortBy as keyof UserTableEntry]);
      const cmp = valueA.localeCompare(valueB);
      return sortOrder === 'DESC' ? -cmp : cmp;
    });

    // Pagination.
    const size = filter.tableMeta?.pageSize || pageSize;
    const page = filter.tableMeta?.page ?? 0;
    const pageCount = Math.ceil(sorted.length / size);
    const entries = sorted.slice(page * size, page * size + size);

    req.reply({
      statusCode: 200,
      body: {
        entries,
        tableMeta: { pageCount, entryCount: sorted.length, pageSize: size, page, sortBy, sortOrder },
      },
    });
  }).as('userTableRequest');
}

// ////////////////////////////////////////////////////////////////////////////

describe('Admin User Page', () => {
  beforeEach(() => {
    cy.clearLocalStorage(locstJwt);
  });

  // //////////////////////////////////////////////////////////////////////////
  // Table rendering

  describe('table rendering', () => {
    it('shows user table with data from fixture', () => {
      // Arrange: Stub the user table API with fixture data.
      stubUserTable();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = new AdminUserTablePage();
      common.visit([{ prefix: 'user', suffix: 'view' }]);

      // Assert: Wait for the initial load to finish.
      cy.wait('@userTableRequest');

      // Assert: Table is visible with all three header columns.
      page.getTable().should('be.visible');
      page.getHeaderCell('Created').should('be.visible');
      page.getHeaderCell('Username').should('be.visible');
      page.getHeaderCell('Email').should('be.visible');

      // Assert: First page of users is rendered (default sort: createdAt DESC).
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'username').should('contain.text', 'ivy');
      page.getCell(0, 'email').should('contain.text', 'ivy@test.com');
      page.getCell(4, 'username').should('contain.text', 'erin');
    });

    it('kicks out from page if no correct permissions', () => {
      // Arrange: Stub the user table API with fixture data.
      stubUserTable();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      common.visit([]); // no permissions

      // Assert: Table was not loaded.
      cy.waitIfHappens('@userTableRequest', { timeout: 500 });
      cy.get('@userTableRequest.all').should('have.length', 0);

      // Assert: User was kicked out to login page.
    });

    it('shows empty message when table has no users', () => {
      // Arrange: Stub the user table API with an empty dataset.
      stubUserTable([]);

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = new AdminUserTablePage();
      common.visit();

      // Assert: Wait for the initial load and verify the empty message.
      cy.wait('@userTableRequest');
      page.getEmptyMessage().should('contain.text', 'No users to show');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // Table navigation

  describe('table navigation', () => {
    it('navigates to next page of user table', () => {
      // Arrange: Stub the user table API with fixture data.
      stubUserTable();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = new AdminUserTablePage();
      common.visit();
      cy.wait('@userTableRequest'); // initial load

      // Assert: First page is shown, there are two pages total.
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'username').should('contain.text', 'ivy');
      page.getCell(4, 'username').should('contain.text', 'erin');

      // Act: Jump to page two via the paginer input.
      page.setPage(2);

      // Assert: Request asks for the second page.
      cy.wait('@userTableRequest').its('request.body.tableMeta.page').should('equal', 1);

      // Assert: Second page of users is rendered, page count is unchanged.
      page.getPageNumber().should('contain.text', '2');
      page.getCell(0, 'username').should('contain.text', 'dana');
      page.getCell(3, 'username').should('contain.text', 'alice');
    });

    it('sorts user table by username column', () => {
      // Arrange: Stub the user table API with fixture data.
      stubUserTable();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = new AdminUserTablePage();
      common.visit();
      cy.wait('@userTableRequest'); // initial load

      // Act: Click the Username header to sort ascending.
      page.clickSortHeader('Username');

      // Assert: A fresh column sort fires exactly one reload request.
      cy.get('@userTableRequest.all').should('have.length', 2); // initial + one reload
      cy.get('@userTableRequest.all').then((interceptions) => {
        const meta = interceptions[interceptions.length - 1].request.body.tableMeta;
        cy.wrap(meta.sortBy).should('equal', 'username');
        cy.wrap(meta.sortOrder).should('equal', 'ASC');
      });

      // Assert: Users are rendered in ascending username order.
      page.getCell(0, 'username').should('contain.text', 'alice');
      page.getCell(4, 'username').should('contain.text', 'erin');

      // Act: Click the Username header again to sort descending.
      page.clickSortHeader('Username');

      // Assert: Toggling the active sort column fires exactly one reload request.
      cy.get('@userTableRequest.all').should('have.length', 3); // initial + two reloads
      cy.get('@userTableRequest.all').then((interceptions) => {
        const meta = interceptions[interceptions.length - 1].request.body.tableMeta;
        cy.wrap(meta.sortBy).should('equal', 'username');
        cy.wrap(meta.sortOrder).should('equal', 'DESC');
      });

      // Assert: Users are rendered in descending username order.
      page.getCell(0, 'username').should('contain.text', 'ivy');
      page.getCell(4, 'username').should('contain.text', 'erin');
    });
  });

  // //////////////////////////////////////////////////////////////////////////
  // User filter

  describe('user filter', () => {
    it('filters user table by username', () => {
      // Arrange: Stub the user table API with fixture data.
      stubUserTable();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = new AdminUserTablePage();
      common.visit();
      cy.wait('@userTableRequest'); // initial load

      // Act: Fill username filter and submit.
      page.fillUsername('ali');
      page.submitFilter();

      // Assert: Request carries the username filter.
      cy.wait('@userTableRequest').its('request.body.username').should('equal', 'ali');

      // Assert: Only the matching user is rendered.
      page.getCell(0, 'username').should('contain.text', 'alice');
      page.getRow(1).should('not.exist');
    });

    it('filters user table by email', () => {
      // Arrange: Stub the user table API with fixture data.
      stubUserTable();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = new AdminUserTablePage();
      common.visit();
      cy.wait('@userTableRequest'); // initial load

      // Act: Fill email filter and submit.
      page.fillEmail('@test.com');
      page.submitFilter();

      // Assert: Request carries the email filter.
      cy.wait('@userTableRequest').its('request.body.email').should('equal', '@test.com');

      // Assert: Only matching users are rendered.
      page.getCell(0, 'username').should('contain.text', 'ivy');
      page.getCell(4, 'username').should('contain.text', 'alice');
      page.getRow(5).should('not.exist');
    });

    it('filters user table by status', () => {
      // Arrange: Stub the user table API with fixture data.
      stubUserTable();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = new AdminUserTablePage();
      common.visit();
      cy.wait('@userTableRequest'); // initial load

      // Act: Select ACTIVE status and submit.
      page.selectStatus(2);
      page.submitFilter();

      // Assert: Request carries the status filter.
      cy.wait('@userTableRequest').its('request.body.status').should('equal', 'ACTIVE');

      // Assert: Only active users are rendered.
      page.getCell(0, 'username').should('contain.text', 'ivy');
      page.getRow(5).should('not.exist');
    });

    it('shows empty message when filter matches no users', () => {
      // Arrange: Stub the user table API with fixture data.
      stubUserTable();

      // Act: Visit admin panel page about users.
      const common = new AdminUserPage();
      const page = new AdminUserTablePage();
      common.visit();
      cy.wait('@userTableRequest'); // initial load

      // Act: Fill username filter that matches nothing and submit.
      page.fillUsername('nonexistent');
      page.submitFilter();

      // Assert: Request is sent and empty message is shown.
      cy.wait('@userTableRequest');
      page.getEmptyMessage().should('contain.text', 'No users to show');
    });
  });
});
