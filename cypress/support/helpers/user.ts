// Helper stuff for Cypress tests of admin panel, user.

import type { TableMetaResp } from '@/code/data/features/common/type.ts';
import type { UserFullDataResp } from '@/code/data/features/user/admin-user-type.ts';

// ////////////////////////////////////////////////////////////////////////////
// Types, interfaces etc.

/** Shape of a single user table entry. */
export interface UserTableEntry {
  id: number;
  createdAt: string;
  username: string;
  email: string;
  status: string;
}

/** An empty table metadata (used for empty secondary sub-tab tables). */
const emptyTableMeta: TableMetaResp = { pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: '', sortOrder: '' };

// ////////////////////////////////////////////////////////////////////////////
// Stubs

/**
 * Stub the user table API so a single page holds the given dataset.
 * This is simple version where fake backend is not needed.
 * @param users User table dataset.
 */
export function stubUserTable(users: UserTableEntry[]) {
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
export function stubUserData(users: UserFullDataResp[]) {
  cy.intercept('GET', '**/api/admin/user/*', (req) => {
    const id = Number(req.url.split('/').pop());
    const found = users.find((u) => u.id === id) ?? users[0];
    req.reply({ statusCode: 200, body: { ...found } });
  }).as('userDataRequest');
}

/** Stub given secondary user sub-tab tables to return empty data.
 * Each endpoint is also aliased (as `subtab_<endpoint>`) so tests can assert how
 * many times (if any) those APIs are called.
 * @param subTableEndpoints Endpoints to stub.
 */
export function stubUserSubTables(subTableEndpoints: string[]) {
  subTableEndpoints.forEach((endpoint) => {
    cy.intercept('POST', `**/api/admin/user/${endpoint}`, {
      statusCode: 200,
      body: { entries: [], tableMeta: emptyTableMeta },
    }).as(`subtab_${endpoint}`);
  });
}

// ////////////////////////////////////////////////////////////////////////////
// Asserts

/**
 * Assert how many times each user sub-tab API was called.
 * @param counts Map of sub-tab endpoint to expected number of calls.
 */
export function expectSubTabCalls(subTableEndpoints: string[], counts: Record<(typeof subTableEndpoints)[number], number>) {
  subTableEndpoints.forEach((endpoint) => {
    cy.get(`@subtab_${endpoint}.all`).should('have.length', counts[endpoint]);
  });
}
