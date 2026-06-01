import type { ColumnData } from "@/code/data/features/common.ts";
import type { UserTableResp, UserHistoryTableResp, UserPermissionTableResp, UserConfigTableResp, UserTokenTableResp, UserJwtTableResp } from '@/code/data/features/user/admin-user.ts';

// USER TABLE

/** Empty user table. */
export const emptyUserTable: UserTableResp = { entries: [], tableMeta: {pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: "", sortOrder: ""}};

/** List of user status values. */
export const enUserStatus: (string|null)[] = [ null, 'PENDING', 'ACTIVE', 'DEMO' ];

/** List of user table columns. */
export const userTableColumns: ColumnData[] = [
  {
    name: "id", // unique key
    defSort: "ASC",
    translation: "admin.user.table.col.id",
    visible: false
  },
  {
    name: "createdAt",
    defSort: "DESC",
    translation: "admin.user.table.col.createdAt",
    visible: true
  },
  {
    name: "username",
    defSort: "ASC",
    translation: "admin.user.table.col.username",
    visible: true
  },
  {
    name: "email",
    defSort: "ASC",
    translation: "admin.user.table.col.email",
    visible: true
  }
];

// USER HISTORY TABLE

/** Empty user history table. */
export const emptyUserHistoryTable: UserHistoryTableResp = { entries: [], tableMeta: {pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: "", sortOrder: ""}};

/** List of user history who values. */
export const enUserHistoryWho: (string|null)[] = [ null, 'USER', 'OPERATOR', 'SYSTEM' ];
/** List of user history what values. */
export const enUserHistoryWhat: (string|null)[] = [ null, 'CREATE', 'ACTIVATE', 'EDIT', 'EMAIL_CHANGE_REQ', 'EMAIL_CHANGE', 'PASS_RESET_REQ', 'PASS_RESET', 'DELETE_REQ', 'LOGIN', 'LOGOUT', 'PROLONG' ];

/** List of user history table columns. */
export const userHistoryTableColumns: ColumnData[] = [
  {
    name: "id", // unique key
    defSort: "ASC",
    translation: "admin.user.history.table.col.id",
    visible: false
  },
  {
    name: "createdAt",
    defSort: "DESC",
    translation: "admin.user.history.table.col.createdAt",
    visible: true
  },
  {
    name: "who",
    defSort: "ASC",
    translation: "admin.user.history.table.col.who",
    visible: true
  },
  {
    name: "what",
    defSort: "ASC",
    translation: "admin.user.history.table.col.what",
    visible: true
  },
  {
    name: "params",
    defSort: "ASC",
    translation: "admin.user.history.table.col.params",
    visible: true
  }
];

// USER PERMISSIONS TABLE

/** Empty user permissions table. */
export const emptyUserPermissionTable: UserPermissionTableResp = { entries: [], tableMeta: {pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: "", sortOrder: ""}};

// USER CONFIG TABLE

/** Empty user config table. */
export const emptyUserConfigTable: UserConfigTableResp = { entries: [], tableMeta: {pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: "", sortOrder: ""}};

// USER TOKENS TABLE

/** Empty user tokens table. */
export const emptyUserTokenTable: UserTokenTableResp = { entries: [], tableMeta: {pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: "", sortOrder: ""}};

// USER JWT TABLE

/** Empty user JWT table. */
export const emptyUserJwtTable: UserJwtTableResp = { entries: [], tableMeta: {pageCount: 0, entryCount: 0, pageSize: 0, page: 0, sortBy: "", sortOrder: ""}};
